import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Sliding-Window Rate Limiting (AGENTS.md Directive)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number; resetTime: number; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, retryAfterSeconds, resetTime: record.resetTime, remaining: 0 };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetTime: record.resetTime,
  };
}

// In-Memory Active Visitors Tracking (Sliding Window of 90 seconds)
const activeVisitorsMap = new Map<string, number>();
const ACTIVE_THRESHOLD_MS = 90 * 1000; // 90 seconds

function pruneActiveVisitors(): void {
  const cutoff = Date.now() - ACTIVE_THRESHOLD_MS;
  for (const [id, lastSeen] of activeVisitorsMap.entries()) {
    if (lastSeen < cutoff) {
      activeVisitorsMap.delete(id);
    }
  }
}

// Persistent Total Visitors Counter
let cachedTotalVisitors = 1482;
let isTotalLoaded = false;
const METRICS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'visitor_metrics.json');

async function loadTotalVisitors(): Promise<number> {
  if (isTotalLoaded) return cachedTotalVisitors;
  try {
    const data = await fs.readFile(METRICS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (typeof parsed.totalVisitors === 'number' && parsed.totalVisitors > 0) {
      cachedTotalVisitors = parsed.totalVisitors;
      isTotalLoaded = true;
      return cachedTotalVisitors;
    }
  } catch {
    // If file cannot be read, continue with baseline
  }
  isTotalLoaded = true;
  return cachedTotalVisitors;
}

async function persistTotalVisitors(count: number): Promise<void> {
  try {
    const payload = {
      totalVisitors: count,
      lastUpdated: new Date().toISOString(),
    };
    await fs.writeFile(METRICS_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist visitor metrics:', err);
  }
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
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSeconds || 1),
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rate.resetTime / 1000)),
        },
      }
    );
  }

  pruneActiveVisitors();
  const total = await loadTotalVisitors();
  const activeCount = Math.max(activeVisitorsMap.size, 1);

  return NextResponse.json(
    {
      activeVisitors: activeCount,
      totalVisitors: total,
    },
    {
      headers: {
        'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSeconds || 1),
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rate.resetTime / 1000)),
        },
      }
    );
  }

  pruneActiveVisitors();
  await loadTotalVisitors();

  // Read or create unique visitor ID (UUIDv4)
  const existingCookie = request.cookies.get('resursee_vid')?.value;
  let visitorId = existingCookie;
  let isNewVisitor = false;

  // Validate UUIDv4 format if cookie exists
  const isUuid = visitorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitorId);

  if (!isUuid) {
    visitorId = crypto.randomUUID();
    isNewVisitor = true;
    cachedTotalVisitors += 1;
    // Persist non-blocking
    persistTotalVisitors(cachedTotalVisitors);
  }

  // Record presence timestamp
  activeVisitorsMap.set(visitorId!, Date.now());
  const activeCount = Math.max(activeVisitorsMap.size, 1);

  const response = NextResponse.json(
    {
      activeVisitors: activeCount,
      totalVisitors: cachedTotalVisitors,
      isNewVisitor,
    },
    {
      headers: {
        'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    }
  );

  // Set long-lived unique visitor cookie if newly assigned
  if (isNewVisitor && visitorId) {
    response.cookies.set('resursee_vid', visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  }

  return response;
}

export async function DELETE(request: NextRequest) {
  const visitorId = request.cookies.get('resursee_vid')?.value;
  if (visitorId) {
    activeVisitorsMap.delete(visitorId);
  }
  return NextResponse.json({ success: true });
}
