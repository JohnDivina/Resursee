import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mockSubmissions } from '@/lib/mockData';
import crypto from 'crypto';

function sanitizeSubmissionPayload(body: any) {
  const { category, department, ...clean } = body;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean.id);
  if (!clean.id || !isUuid) {
    clean.id = crypto.randomUUID();
  }
  const isReviewedByUuid = clean.reviewed_by && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean.reviewed_by);
  if (!isReviewedByUuid) {
    if (typeof clean.reviewed_by === 'string' && clean.reviewed_by && !clean.admin_notes) {
      clean.admin_notes = `Reviewed by ${clean.reviewed_by}`;
    }
    clean.reviewed_by = null;
  }
  return clean;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('resource_submissions')
      .select('*, category:categories(*), department:departments(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase get submissions error:', error.message);
      return NextResponse.json({ submissions: mockSubmissions });
    }
    return NextResponse.json({ submissions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ submissions: mockSubmissions });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const cleanPayload = sanitizeSubmissionPayload(body);

    const { data, error } = await supabase
      .from('resource_submissions')
      .insert([cleanPayload])
      .select('*, category:categories(*), department:departments(*)')
      .single();

    if (error) {
      console.error('Supabase insert submission error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ submission: data }, { status: 201 });
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
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    const cleanUpdates = sanitizeSubmissionPayload(updates);

    const { data, error } = await supabase
      .from('resource_submissions')
      .update(cleanUpdates)
      .eq('id', id)
      .select('*, category:categories(*), department:departments(*)')
      .single();

    if (error) {
      console.error('Supabase update submission error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ submission: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('resource_submissions').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete submission error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
