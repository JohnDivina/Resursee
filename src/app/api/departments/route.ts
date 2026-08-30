import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mockDepartments } from '@/lib/mockData';
import crypto from 'crypto';

function sanitizeDepartmentPayload(body: any) {
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
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase get departments error:', error.message);
      return NextResponse.json({ departments: mockDepartments });
    }
    return NextResponse.json({ departments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ departments: mockDepartments });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const cleanPayload = sanitizeDepartmentPayload(body);

    const { data, error } = await supabase.from('departments').insert([cleanPayload]).select().single();
    if (error) {
      console.error('Supabase insert department error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ department: data }, { status: 201 });
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
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('departments').update(updates).eq('id', id).select().single();
    if (error) {
      console.error('Supabase update department error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ department: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let deleteQuery;
    if (isUuid) {
      deleteQuery = supabase.from('departments').delete().eq('id', id);
    } else {
      deleteQuery = supabase.from('departments').delete().eq('slug', id);
    }
    const { error } = await deleteQuery;
    if (error) {
      console.error('Supabase delete department error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
