import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySignedSession, createSignedSession } from '@/lib/sessionCrypto';
import { checkUserQuota } from '@/lib/quotaManager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('resursee_admin_token')?.value;
  const guestCookie = cookieStore.get('resursee_guest_quota')?.value;

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!token) {
    const guestQuota = checkUserQuota(null, clientIp, guestCookie);
    return NextResponse.json({
      authenticated: false,
      user: null,
      quota: guestQuota,
    });
  }

  // verifySignedSession strictly verifies signature AND 15-minute inactivity limit
  const session = verifySignedSession(token);

  if (!session) {
    const guestQuota = checkUserQuota(null, clientIp, guestCookie);
    const response = NextResponse.json({
      authenticated: false,
      user: null,
      quota: guestQuota,
      reason: 'inactivity_timeout',
    });

    // Clear expired session cookie
    response.cookies.set('resursee_admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  }

  const now = Date.now();
  const userQuota = checkUserQuota(session, clientIp);

  // Roll session forward: re-sign token with updated lastActive timestamp
  const refreshedSession = {
    ...session,
    lastActive: now,
  };
  const refreshedToken = createSignedSession(refreshedSession);

  const response = NextResponse.json({
    authenticated: true,
    user: refreshedSession,
    quota: userQuota,
  });

  // Set 15-minute rolling window cookie
  response.cookies.set('resursee_admin_token', refreshedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes rolling window
  });

  return response;
}
