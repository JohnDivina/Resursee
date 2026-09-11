import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
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

// Quick probe to check if Ollama is still listening
async function isOllamaRunning(endpoint = 'http://localhost:11434'): Promise<boolean> {
  try {
    const res = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(1000),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before trying to stop Ollama again.' },
        { status: 429 }
      );
    }

    // 1. If running on cloud platform (Vercel, etc.), local process termination is not applicable
    const isCloud = Boolean(process.env.VERCEL || process.env.AWS_REGION || process.env.RENDER);
    if (isCloud) {
      return NextResponse.json(
        {
          success: false,
          stopped: false,
          isCloud: true,
          message:
            'Resursee is hosted in the cloud. To stop Ollama, please close the Ollama app on your local machine.',
        },
        { status: 200 }
      );
    }

    // 2. Check if Ollama is currently active
    const currentlyRunning = await isOllamaRunning();
    if (!currentlyRunning) {
      return NextResponse.json({
        success: true,
        stopped: true,
        message: 'Ollama daemon is already stopped.',
      });
    }

    // 3. Attempt process termination based on platform
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS: Stop Ollama GUI app and CLI serve daemon
      try {
        await execPromise('pkill -f "Ollama" || pkill -f "ollama serve"');
      } catch {
        // pkill returns exit code 1 if processes already exited
      }
    } else if (platform === 'win32') {
      // Windows: Stop background processes
      try {
        await execPromise('taskkill /F /IM ollama.exe /T || taskkill /F /IM "ollama app.exe" /T');
      } catch {
        // Ignored if not found
      }
    } else {
      // Linux: Stop systemd service or kill process
      try {
        await execPromise(
          'systemctl --user stop ollama || systemctl stop ollama || pkill -f "ollama serve" || pkill -x ollama'
        );
      } catch {
        // Ignored if not found
      }
    }

    // 4. Poll for up to 3 seconds to confirm Ollama has stopped listening
    let stopped = false;
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const stillRunning = await isOllamaRunning();
      if (!stillRunning) {
        stopped = true;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      stopped,
      message: stopped
        ? 'Ollama daemon stopped successfully.'
        : 'Stop signal sent to Ollama daemon.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, stopped: false, error: `Failed to stop Ollama: ${msg}` },
      { status: 500 }
    );
  }
}
