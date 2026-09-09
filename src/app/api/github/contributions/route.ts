import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Sliding-Window Connection Rate Limiter (AGENTS.md Directive)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

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

export const dynamic = 'force-dynamic';

const CACHE_FILE = path.join(process.cwd(), 'src', 'data', 'github_contributions.json');

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface GitHubApiResponse {
  total: {
    lastYear: number;
    [key: string]: number;
  };
  contributions: ContributionDay[];
}

let inMemoryCache: {
  data: GitHubApiResponse | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes fresh cache

export async function GET(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many contribution requests' },
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

  const now = Date.now();

  // 1. Serve from in-memory cache if fresh
  if (inMemoryCache.data && now - inMemoryCache.timestamp < CACHE_DURATION_MS) {
    return NextResponse.json(inMemoryCache.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400',
        'X-Cache': 'HIT',
      },
    });
  }

  // 2. Attempt upstream fetch with timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const upstreamRes = await fetch('https://github-contributions-api.jogruber.de/v4/JohnDivina?y=last', {
      signal: controller.signal,
      next: { revalidate: 900 },
    });
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const data: GitHubApiResponse = await upstreamRes.json();
      if (data && data.total && Array.isArray(data.contributions)) {
        inMemoryCache = { data, timestamp: now };
        // Persist to local JSON asynchronously
        fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8').catch(() => {});

        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400',
            'X-Cache': 'MISS',
          },
        });
      }
    }
  } catch (err) {
    // Upstream network error or timeout, fallback to file cache
  }

  // 3. Fallback to cached JSON file
  try {
    const fileContent = await fs.readFile(CACHE_FILE, 'utf-8');
    const parsed: GitHubApiResponse = JSON.parse(fileContent);
    inMemoryCache = { data: parsed, timestamp: now };
    return NextResponse.json(parsed, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        'X-Cache': 'FALLBACK',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to retrieve GitHub contributions' },
      { status: 500 }
    );
  }
}
