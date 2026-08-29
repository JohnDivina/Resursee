import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApprovedModerators } from '@/app/api/admin/staff/route';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('resursee_admin_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    const session = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const userEmail = (session.email || '').toLowerCase().trim();

    const masterAdminEmails = (process.env.ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const approvedList = getApprovedModerators();
    const isApproved = approvedList.some((m) => m.email.toLowerCase() === userEmail);
    const isMasterAdmin = masterAdminEmails.length > 0 && masterAdminEmails.includes(userEmail);

    if (isMasterAdmin) {
      session.role = 'master_admin';
      session.authenticated = true;
    } else if (isApproved) {
      session.role = 'moderator';
      session.authenticated = true;
    }

    const response = NextResponse.json({ authenticated: session.authenticated, user: session });

    // Update cookie with upgraded permissions
    response.cookies.set('resursee_admin_token', Buffer.from(JSON.stringify(session)).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
