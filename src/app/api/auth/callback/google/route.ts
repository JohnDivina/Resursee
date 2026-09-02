import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApprovedModerators } from '@/app/api/admin/staff/route';
import { createSignedSession, UserSession } from '@/lib/sessionCrypto';

function getEffectiveOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
  if (host) {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const origin = getEffectiveOrigin(request);
  const cookieStore = await cookies();

  // 1. Read & Validate OAuth State Cookie
  const stateCookie = cookieStore.get('resursee_oauth_state')?.value;
  let returnTo = '/';
  let expectedState = '';

  if (stateCookie) {
    try {
      const parsed = JSON.parse(Buffer.from(stateCookie, 'base64').toString('utf-8'));
      expectedState = parsed.state || '';
      returnTo = parsed.returnTo || '/';
    } catch {
      // ignore
    }
  }

  if (error || !code) {
    return NextResponse.redirect(new URL(`${returnTo}?error=${encodeURIComponent(error || 'no_code')}`, origin));
  }

  // Verify state if expectedState is set (CSRF Protection)
  if (expectedState && state !== expectedState) {
    console.warn('OAuth state mismatch detected (possible CSRF attack).');
    return NextResponse.redirect(new URL(`${returnTo}?error=oauth_state_mismatch`, origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAILS || '';

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`${returnTo}?error=missing_credentials`, origin));
  }

  try {
    const redirectUri = `${origin}/api/auth/callback/google`;

    // 2. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      return NextResponse.redirect(new URL(`${returnTo}?error=token_exchange_failed`, origin));
    }

    // 3. Fetch Google User Profile
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userinfoResponse.json();
    const userEmail = (profile.email || '').toLowerCase().trim();

    // 4. Determine Universal User / Admin Role
    const masterAdminEmails = adminEmailsRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let role: 'master_admin' | 'moderator' | 'user' = 'user';

    const isMasterAdmin = masterAdminEmails.length > 0 && masterAdminEmails.includes(userEmail);
    const approvedList = getApprovedModerators();
    const isApprovedModerator = approvedList.some((m) => m.email.toLowerCase() === userEmail);

    if (isMasterAdmin) {
      role = 'master_admin';
    } else if (isApprovedModerator) {
      role = 'moderator';
    } else {
      role = 'user'; // Standard verified Google user account
    }

    // 5. Build Cryptographically Signed Session
    const sessionData: UserSession = {
      email: userEmail,
      name: profile.name || userEmail.split('@')[0],
      picture: profile.picture || null,
      role,
      authenticated: true,
      timestamp: Date.now(),
      userId: `usr_${userEmail.replace(/[^a-z0-9]/g, '_')}`,
    };

    const signedToken = createSignedSession(sessionData);

    // Build Redirect URL
    const targetUrl = new URL(returnTo, origin);
    targetUrl.searchParams.set('auth', 'success');

    const response = NextResponse.redirect(targetUrl);

    // Set secure HTTP-only signed session cookie
    response.cookies.set('resursee_admin_token', signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });

    // Clear one-time oauth state cookie
    response.cookies.delete('resursee_oauth_state');

    return response;
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL(`${returnTo}?error=internal_auth_error`, origin));
  }
}
