import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// In-memory rate limiting map (AGENTS.md Directive: 10 requests / 1 min)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

// Quick probe to check if Ollama is listening
async function isOllamaRunning(endpoint = 'http://localhost:11434'): Promise<{ running: boolean; modelsCount: number }> {
  try {
    const res = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return { running: true, modelsCount: Array.isArray(data?.models) ? data.models.length : 0 };
    }
    return { running: false, modelsCount: 0 };
  } catch {
    return { running: false, modelsCount: 0 };
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const isCloud = Boolean(process.env.VERCEL || process.env.AWS_REGION || process.env.RENDER);
  const status = await isOllamaRunning();

  return NextResponse.json({
    status: 'ok',
    running: status.running,
    modelsCount: status.modelsCount,
    isCloud,
    canAutoLaunch: !isCloud,
    platform: process.platform,
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before trying to start Ollama again.' },
        { status: 429 }
      );
    }

    // 1. If Ollama is already running, return immediately
    const initialCheck = await isOllamaRunning();
    if (initialCheck.running) {
      return NextResponse.json({
        success: true,
        running: true,
        modelsCount: initialCheck.modelsCount,
        message: `Ollama daemon is active with ${initialCheck.modelsCount} models loaded.`,
      });
    }

    // 2. If running on cloud platform (Vercel, etc.), local child_process won't launch on the visitor's laptop
    const isCloud = Boolean(process.env.VERCEL || process.env.AWS_REGION || process.env.RENDER);
    if (isCloud) {
      return NextResponse.json(
        {
          success: false,
          running: false,
          isCloud: true,
          message:
            'Resursee is hosted in the cloud. To connect, please launch Ollama on your local machine (e.g. open Ollama app or run "ollama serve").',
        },
        { status: 200 }
      );
    }

    // 3. Attempt 1-Click Launch on local environment
    const platform = process.platform;
    let launched = false;

    if (platform === 'darwin') {
      // macOS: Try opening official Ollama.app first
      try {
        await execPromise('open -a Ollama');
        launched = true;
      } catch (appErr) {
        // Fallback to spawning 'ollama serve' binary with OLLAMA_ORIGINS="*"
        try {
          const child = spawn('/usr/local/bin/ollama', ['serve'], {
            detached: true,
            stdio: 'ignore',
            env: { ...process.env, OLLAMA_ORIGINS: '*' },
          });
          child.unref();
          launched = true;
        } catch {
          // If path is in Homebrew or custom path
          const child = spawn('ollama', ['serve'], {
            detached: true,
            stdio: 'ignore',
            env: { ...process.env, OLLAMA_ORIGINS: '*' },
          });
          child.unref();
          launched = true;
        }
      }
    } else if (platform === 'win32') {
      // Windows
      try {
        const child = spawn('cmd.exe', ['/c', 'start', '', 'ollama', 'app'], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
        launched = true;
      } catch {
        const child = spawn('ollama', ['serve'], {
          detached: true,
          stdio: 'ignore',
          env: { ...process.env, OLLAMA_ORIGINS: '*' },
        });
        child.unref();
        launched = true;
      }
    } else {
      // Linux
      try {
        await execPromise('systemctl --user start ollama || systemctl start ollama');
        launched = true;
      } catch {
        const child = spawn('ollama', ['serve'], {
          detached: true,
          stdio: 'ignore',
          env: { ...process.env, OLLAMA_ORIGINS: '*' },
        });
        child.unref();
        launched = true;
      }
    }

    // 4. Poll for up to 4.5 seconds to confirm Ollama has booted
    let finalCheck = { running: false, modelsCount: 0 };
    for (let i = 0; i < 9; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      finalCheck = await isOllamaRunning();
      if (finalCheck.running) break;
    }

    if (finalCheck.running) {
      return NextResponse.json({
        success: true,
        running: true,
        modelsCount: finalCheck.modelsCount,
        message: `Ollama engine started successfully (${finalCheck.modelsCount} models ready).`,
      });
    }

    return NextResponse.json({
      success: true,
      running: false,
      starting: true,
      message:
        'Launch command initiated. Ollama is starting up in the background and should be available in a few moments.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, running: false, error: `Failed to auto-launch Ollama: ${msg}` },
      { status: 500 }
    );
  }
}
