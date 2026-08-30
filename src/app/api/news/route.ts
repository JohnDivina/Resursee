import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mockNewsArticles } from '@/lib/mockData';
import crypto from 'crypto';

function sanitizeNewsPayload(body: any) {
  const { department, ...clean } = body;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean.id);
  if (!clean.id || !isUuid) {
    clean.id = crypto.randomUUID();
  }
  return clean;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('news_articles')
      .select('*, department:departments(*)')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Supabase get news error:', error.message);
      return NextResponse.json({ news: mockNewsArticles });
    }
    return NextResponse.json({ news: data || [] });
  } catch (err: any) {
    return NextResponse.json({ news: mockNewsArticles });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const cleanPayload = sanitizeNewsPayload(body);

    const { data, error } = await supabase.from('news_articles').insert([cleanPayload]).select('*, department:departments(*)').single();
    if (error) {
      console.error('Supabase insert news error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ article: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    const cleanUpdates = sanitizeNewsPayload(updates);

    const { data, error } = await supabase
      .from('news_articles')
      .update(cleanUpdates)
      .eq('id', id)
      .select('*, department:departments(*)')
      .single();

    if (error) {
      console.error('Supabase update news error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ article: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('news_articles').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete news error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
