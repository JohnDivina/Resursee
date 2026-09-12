import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Rate Limiting (AGENTS.md Directive: 30 requests / 1 min for search)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= MAX_REQUESTS) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many search requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': '30',
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const sort = searchParams.get('sort') || 'downloads';
  const limitParam = parseInt(searchParams.get('limit') || '24', 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 24 : limitParam, 1), 50);

  // Construct Hugging Face Hub API URL
  const hfUrl = new URL('https://huggingface.co/api/models');
  hfUrl.searchParams.set('filter', 'gguf');
  if (q) {
    hfUrl.searchParams.set('search', q);
  }

  // Sort mapping
  if (sort === 'trending') {
    hfUrl.searchParams.set('sort', 'trendingScore');
  } else if (sort === 'likes') {
    hfUrl.searchParams.set('sort', 'likes');
  } else {
    hfUrl.searchParams.set('sort', 'downloads');
  }
  hfUrl.searchParams.set('direction', '-1');
  hfUrl.searchParams.set('limit', limit.toString());

  try {
    const res = await fetch(hfUrl.toString(), {
      headers: {
        'User-Agent': 'Resursee-AI-Hub/1.0',
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Hugging Face API responded with status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ models: [], total: 0 });
    }

    const models = data.map((item: any) => {
      const parts = (item.id || '').split('/');
      const author = parts[0] || 'Community';
      const repoName = parts[1] || item.id;

      // Clean display name
      const cleanName = repoName
        .replace(/-GGUF$/i, '')
        .replace(/\.gguf$/i, '')
        .replace(/[-_]/g, ' ');

      return {
        id: item.id,
        ollamaTag: `hf.co/${item.id}`,
        name: cleanName,
        author,
        downloads: typeof item.downloads === 'number' ? item.downloads : 0,
        likes: typeof item.likes === 'number' ? item.likes : 0,
        pipelineTag: item.pipeline_tag || 'text-generation',
        tags: Array.isArray(item.tags) ? item.tags.slice(0, 8) : [],
        updatedAt: item.createdAt || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      models,
      total: models.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to communicate with Hugging Face Hub' },
      { status: 502 }
    );
  }
}
