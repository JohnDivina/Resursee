import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { registerVisitorStream, unregisterVisitorStream, incrementTotalVisitors } from '@/lib/visitorTracker';

// Sliding-Window Connection Rate Limiter (AGENTS.md Directive)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_CONNECTS_PER_WINDOW = 60; // Up to 60 connections per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number; resetTime: number; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_CONNECTS_PER_WINDOW - 1, resetTime };
  }

  if (record.count >= MAX_CONNECTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, retryAfterSeconds, resetTime: record.resetTime, remaining: 0 };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: MAX_CONNECTS_PER_WINDOW - record.count,
    resetTime: record.resetTime,
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many stream connection attempts' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSeconds || 1),
          'X-RateLimit-Limit': String(MAX_CONNECTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rate.resetTime / 1000)),
        },
      }
    );
  }

  // Check visitor cookie
  const existingCookie = request.cookies.get('resursee_vid')?.value;
  const isUuid = existingCookie && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingCookie);
  let newVisitorCookie: string | null = null;

  if (!isUuid) {
    newVisitorCookie = crypto.randomUUID();
    // Increment total visitors for brand new visitor
    incrementTotalVisitors();
  }

  let clientId: string | null = null;
  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Register client to receive immediate and subsequent broadcasts
      clientId = registerVisitorStream((chunk: Uint8Array) => {
        try {
          controller.enqueue(chunk);
        } catch {
          if (clientId) unregisterVisitorStream(clientId);
        }
      });

      // Keepalive comment every 15s to keep proxies / browsers alive
      const keepAlivePing = new TextEncoder().encode(': keepalive\n\n');
      keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(keepAlivePing);
        } catch {
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          if (clientId) unregisterVisitorStream(clientId);
        }
      }, 15000);

      // Clean up when connection closes
      request.signal.addEventListener('abort', () => {
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        if (clientId) {
          unregisterVisitorStream(clientId);
          clientId = null;
        }
        try {
          controller.close();
        } catch {
          // stream already closed
        }
      });
    },
    cancel() {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (clientId) {
        unregisterVisitorStream(clientId);
        clientId = null;
      }
    },
  });

  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  };

  if (newVisitorCookie) {
    headers['Set-Cookie'] = `resursee_vid=${newVisitorCookie}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`;
  }

  return new Response(stream, { headers });
}
