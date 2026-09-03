import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySignedSession } from '@/lib/sessionCrypto';
import { checkUserQuota } from '@/lib/quotaManager';

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

  const session = verifySignedSession(token);

  if (!session) {
    const guestQuota = checkUserQuota(null, clientIp, guestCookie);
    return NextResponse.json({
      authenticated: false,
      user: null,
      quota: guestQuota,
    });
  }

  const userQuota = checkUserQuota(session, clientIp);

  return NextResponse.json({
    authenticated: true,
    user: session,
    quota: userQuota,
  });
}
