import { NextResponse } from 'next/server';

function getEffectiveOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
  if (host) {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(new URL('/admin?error=missing_google_client_id', request.url));
  }

  // Derive exact redirect URI dynamically with proxy support
  const origin = getEffectiveOrigin(request);
  const redirectUri = `${origin}/api/auth/callback/google`;

  const state = Math.random().toString(36).substring(2, 15);

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}
