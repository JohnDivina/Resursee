import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySignedSession } from '@/lib/sessionCrypto';
import { checkUserQuota } from '@/lib/quotaManager';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('resursee_admin_token')?.value;
  const lastActiveStr = cookieStore.get('resursee_last_active')?.value;
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

  // Verify inactivity timeout (15 minutes)
  const now = Date.now();
  if (lastActiveStr) {
    const lastActive = parseInt(lastActiveStr, 10);
    if (!isNaN(lastActive) && now - lastActive > INACTIVITY_TIMEOUT_MS) {
      const guestQuota = checkUserQuota(null, clientIp, guestCookie);
      const response = NextResponse.json({
        authenticated: false,
        user: null,
        quota: guestQuota,
        reason: 'inactivity_timeout',
      });

      // Clear session cookies due to inactivity timeout
      response.cookies.set('resursee_admin_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      response.cookies.set('resursee_last_active', '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      return response;
    }
  }

  const session = verifySignedSession(token);

  if (!session) {
    const guestQuota = checkUserQuota(null, clientIp, guestCookie);
    const response = NextResponse.json({
      authenticated: false,
      user: null,
      quota: guestQuota,
    });
    response.cookies.set('resursee_admin_token', '', { path: '/', maxAge: 0 });
    return response;
  }

  const userQuota = checkUserQuota(session, clientIp);

  const response = NextResponse.json({
    authenticated: true,
    user: session,
    quota: userQuota,
  });

  // Slide inactivity window: update last active timestamp
  response.cookies.set('resursee_last_active', now.toString(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}
