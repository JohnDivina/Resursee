import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mockCategories } from '@/lib/mockData';
import crypto from 'crypto';

function sanitizeCategoryPayload(body: any) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id);
  if (!body.id || !isUuid) {
    body.id = crypto.randomUUID();
  }
  return body;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Supabase get categories error:', error.message);
      return NextResponse.json({ categories: mockCategories });
    }
    return NextResponse.json({ categories: data || [] });
  } catch (err: any) {
    return NextResponse.json({ categories: mockCategories });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const cleanPayload = sanitizeCategoryPayload(body);

    const { data, error } = await supabase.from('categories').insert([cleanPayload]).select().single();
    if (error) {
      console.error('Supabase insert category error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ category: data }, { status: 201 });
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
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
    if (error) {
      console.error('Supabase update category error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ category: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let deleteQuery;
    if (isUuid) {
      deleteQuery = supabase.from('categories').delete().eq('id', id);
    } else {
      deleteQuery = supabase.from('categories').delete().eq('slug', id);
    }
    const { error } = await deleteQuery;
    if (error) {
      console.error('Supabase delete category error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
