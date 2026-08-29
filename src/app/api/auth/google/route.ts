import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(new URL('/admin?error=missing_google_client_id', request.url));
  }

  // Derive redirect URI dynamically
  const origin = new URL(request.url).origin;
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
