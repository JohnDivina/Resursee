import { NextResponse } from 'next/server';
import { mockSubmissions, mockCategories, mockDepartments } from '@/lib/mockData';
import { ResourceSubmission } from '@/types/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let results = [...mockSubmissions];

  if (status && status !== 'all') {
    results = results.filter((s) => s.status === status);
  }

  return NextResponse.json({
    count: results.length,
    submissions: results,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.submitter_name || !body.submitter_email) {
      return NextResponse.json(
        { error: 'Title, Submitter Name, and Submitter Email are required.' },
        { status: 400 }
      );
    }

    const newSubmission: ResourceSubmission = {
      id: `sub-${Date.now()}`,
      title: body.title,
      description: body.description || null,
      category_id: body.category_id || mockCategories[0].id,
      department_id: body.department_id || mockDepartments[0].id,
      document_type: body.document_type || 'form',
      file_name: body.file_name || `${body.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      file_format: body.file_format || 'PDF',
      file_size: body.file_size || 350000,
      file_path: body.file_path || null,
      version_label: body.version_label || '2026.1',
      source_name: body.source_name || null,
      source_url: body.source_url || null,
      submission_type: body.submission_type || 'new_resource',
      existing_resource_id: body.existing_resource_id || null,
      submitter_name: body.submitter_name,
      submitter_email: body.submitter_email,
      submitter_role: body.submitter_role || 'student',
      submission_notes: body.submission_notes || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Resource submission successfully queued for administrative review.',
      submissionId: newSubmission.id,
      submission: newSubmission,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process submission' },
      { status: 500 }
    );
  }
}
