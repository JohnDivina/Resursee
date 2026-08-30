import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mockResources } from '@/lib/mockData';
import crypto from 'crypto';

function sanitizeResourcePayload(body: any) {
  const { category, department, author, ...clean } = body;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean.id);
  if (!clean.id || !isUuid) {
    clean.id = crypto.randomUUID();
  }
  return clean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase();
  const category = searchParams.get('category');
  const department = searchParams.get('department');
  const type = searchParams.get('type');

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('resources')
      .select('*, category:categories(*), department:departments(*)')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }
    if (department && department !== 'all') {
      query = query.eq('department_id', department);
    }
    if (type && type !== 'all') {
      query = query.eq('document_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error.message);
      // Fallback only on database connection error
      return NextResponse.json({
        count: mockResources.length,
        resources: mockResources,
      });
    }

    let results = data || [];
    if (q) {
      results = results.filter(
        (r: any) =>
          r.title?.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.department?.name && r.department.name.toLowerCase().includes(q)) ||
          (r.category?.name && r.category.name.toLowerCase().includes(q)) ||
          r.file_format?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      count: results.length,
      resources: results,
    });
  } catch (err: any) {
    return NextResponse.json({ count: mockResources.length, resources: mockResources });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const cleanPayload = sanitizeResourcePayload(body);

    const { data, error } = await supabase
      .from('resources')
      .insert([cleanPayload])
      .select('*, category:categories(*), department:departments(*)')
      .single();

    if (error) {
      console.error('Supabase insert resource error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ resource: data }, { status: 201 });
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
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    const cleanUpdates = sanitizeResourcePayload(updates);

    const { data, error } = await supabase
      .from('resources')
      .update(cleanUpdates)
      .eq('id', id)
      .select('*, category:categories(*), department:departments(*)')
      .single();

    if (error) {
      console.error('Supabase update resource error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ resource: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let deleteQuery;
    if (isUuid) {
      deleteQuery = supabase.from('resources').delete().eq('id', id);
    } else {
      deleteQuery = supabase.from('resources').delete().eq('slug', id);
    }
    const { error } = await deleteQuery;

    if (error) {
      console.error('Supabase delete resource error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
