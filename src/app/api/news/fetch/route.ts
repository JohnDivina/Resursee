import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Resursee-Central-University-Hub/1.0',
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const feedUrl = body.feedUrl || 'https://news.google.com/rss/search?q=university+announcements&hl=en-US&gl=US&ceid=US:en';

    const feed = await parser.parseURL(feedUrl);

    const fetchedArticles = (feed.items || []).slice(0, 5).map((item, idx) => ({
      id: `rss-${Date.now()}-${idx}`,
      title: item.title || 'Untitled University Circular',
      summary: item.contentSnippet || item.content || item.summary || 'Official notification from university feed.',
      content_url: item.link || '#',
      image_url: null,
      department_id: null,
      status: 'pending' as const,
      is_featured: false,
      external_id: item.guid || item.link,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      source_name: feed.title || 'Official University Feed',
    }));

    return NextResponse.json({
      success: true,
      feedTitle: feed.title,
      fetchedCount: fetchedArticles.length,
      articles: fetchedArticles,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch RSS feed',
      },
      { status: 500 }
    );
  }
}
