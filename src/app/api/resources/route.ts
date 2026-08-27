import { NextResponse } from 'next/server';
import { mockResources } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase();
  const category = searchParams.get('category');
  const department = searchParams.get('department');
  const type = searchParams.get('type');

  let results = [...mockResources];

  if (q) {
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.department && r.department.name.toLowerCase().includes(q)) ||
        (r.category && r.category.name.toLowerCase().includes(q)) ||
        r.file_format.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    results = results.filter((r) => r.category_id === category || r.category?.slug === category);
  }

  if (department && department !== 'all') {
    results = results.filter((r) => r.department_id === department || r.department?.slug === department);
  }

  if (type && type !== 'all') {
    results = results.filter((r) => r.document_type === type);
  }

  return NextResponse.json({
    count: results.length,
    resources: results,
  });
}
