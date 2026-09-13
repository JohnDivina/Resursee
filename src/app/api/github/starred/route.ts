import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { StarredRepo } from '@/types/starredRepo';

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

const CACHE_FILE = path.join(process.cwd(), 'src', 'data', 'github_starred_repos.json');
const GITHUB_USERNAME = 'JohnDivina';
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes cache freshness

let inMemoryCache: {
  data: StarredRepo[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

function formatStarredRepos(rawData: any[]): StarredRepo[] {
  const list: StarredRepo[] = rawData.map((item: any) => {
    const r = item.repo || item;
    return {
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: {
        login: r.owner?.login || '',
        avatarUrl: r.owner?.avatar_url || '',
        htmlUrl: r.owner?.html_url || '',
      },
      htmlUrl: r.html_url,
      description: r.description || '',
      language: r.language || 'Other',
      stargazersCount: r.stargazers_count || 0,
      forksCount: r.forks_count || 0,
      openIssuesCount: r.open_issues_count || 0,
      topics: Array.isArray(r.topics) ? r.topics : [],
      updatedAt: r.updated_at || '',
      pushedAt: r.pushed_at || '',
      starredAt: item.starred_at || '',
    };
  });

  // Sort descending by recently starred by default
  list.sort((a, b) => {
    const timeA = a.starredAt ? new Date(a.starredAt).getTime() : 0;
    const timeB = b.starredAt ? new Date(b.starredAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return b.stargazersCount - a.stargazersCount;
  });

  return list;
}

export async function GET(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests to starred repositories API' },
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

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const now = Date.now();

  // 1. Serve from in-memory cache if fresh and not forced
  if (!forceRefresh && inMemoryCache.data && now - inMemoryCache.timestamp < CACHE_DURATION_MS) {
    return NextResponse.json(
      {
        source: 'cache',
        count: inMemoryCache.data.length,
        repos: inMemoryCache.data,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
          'X-Cache': 'HIT',
        },
      }
    );
  }

  // 2. Fetch fresh from GitHub REST API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'User-Agent': 'Resursee-Starred-Sync',
      'Accept': 'application/vnd.github.v3.star+json',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const upstreamRes = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/starred?per_page=100`,
      {
        headers,
        signal: controller.signal,
        next: { revalidate: 600 },
      }
    );
    clearTimeout(timeout);

    if (upstreamRes.ok) {
      const rawData = await upstreamRes.json();
      if (Array.isArray(rawData)) {
        const formatted = formatStarredRepos(rawData);
        inMemoryCache = { data: formatted, timestamp: now };

        // Asynchronously persist to local file if writable
        fs.writeFile(CACHE_FILE, JSON.stringify(formatted, null, 2), 'utf-8').catch(() => {});

        return NextResponse.json(
          {
            source: 'upstream',
            count: formatted.length,
            repos: formatted,
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
              'X-Cache': 'MISS',
            },
          }
        );
      }
    } else {
      console.warn(`GitHub API returned status ${upstreamRes.status} for starred repos`);
    }
  } catch (err: any) {
    console.warn('Failed to fetch starred repos upstream from GitHub:', err.message);
  }

  // 3. Fallback to cached JSON file
  try {
    const fileContent = await fs.readFile(CACHE_FILE, 'utf-8');
    const parsed: StarredRepo[] = JSON.parse(fileContent);
    inMemoryCache = { data: parsed, timestamp: now };

    return NextResponse.json(
      {
        source: 'fallback',
        count: parsed.length,
        repos: parsed,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
          'X-Cache': 'FALLBACK',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve starred repositories' },
      { status: 500 }
    );
  }
}
