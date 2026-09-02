import { NextResponse } from 'next/server';
import crypto from 'crypto';

function getEffectiveOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
  if (host) {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

function sanitizeReturnTo(urlStr: string | null): string {
  if (!urlStr) return '/';
  // Prevent Open Redirect: must start with / and not //
  if (urlStr.startsWith('/') && !urlStr.startsWith('//') && !urlStr.includes('://')) {
    return urlStr;
  }
  return '/';
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = getEffectiveOrigin(request);
  const { searchParams } = new URL(request.url);

  const rawReturnTo = searchParams.get('returnTo') || searchParams.get('redirect');
  const safeReturnTo = sanitizeReturnTo(rawReturnTo);

  if (!clientId) {
    return NextResponse.redirect(new URL(`${safeReturnTo}?error=missing_google_client_id`, origin));
  }

  const redirectUri = `${origin}/api/auth/callback/google`;
  const state = crypto.randomBytes(24).toString('hex');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(googleAuthUrl.toString());

  // Store state and returnTo in a secure short-lived cookie for verification
  const oauthStateData = JSON.stringify({ state, returnTo: safeReturnTo });
  response.cookies.set('resursee_oauth_state', Buffer.from(oauthStateData).toString('base64'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
