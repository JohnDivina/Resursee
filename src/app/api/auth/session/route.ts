import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('resursee_admin_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const session = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return NextResponse.json({ authenticated: true, user: session });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
