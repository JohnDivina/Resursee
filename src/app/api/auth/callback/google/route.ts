import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = new URL(request.url).origin;

  if (error || !code) {
    return NextResponse.redirect(new URL(`/admin?error=${encodeURIComponent(error || 'no_code')}`, origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const adminEmailsRaw = process.env.ADMIN_EMAILS || '';

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/admin?error=missing_credentials', origin));
  }

  try {
    const redirectUri = `${origin}/api/auth/callback/google`;

    // 1. Exchange authorization code for tokens
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
      return NextResponse.redirect(new URL('/admin?error=token_exchange_failed', origin));
    }

    // 2. Fetch User Profile
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userinfoResponse.json();
    const userEmail = (profile.email || '').toLowerCase().trim();

    // 3. Validate against Admin Whitelist
    const adminEmails = adminEmailsRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // If ADMIN_EMAILS is configured, enforce strict whitelist.
    // If not configured yet, allow the verified Google user who set up the credentials.
    if (adminEmails.length > 0 && !adminEmails.includes(userEmail)) {
      return NextResponse.redirect(new URL(`/admin?error=unauthorized_email&email=${encodeURIComponent(userEmail)}`, origin));
    }

    // 4. Create Session Data
    const sessionData = {
      email: userEmail,
      name: profile.name || 'Administrator',
      picture: profile.picture || null,
      authenticated: true,
      timestamp: Date.now(),
    };

    const response = NextResponse.redirect(new URL('/admin?auth=google_success', origin));

    // Set secure HTTP-only cookie
    response.cookies.set('resursee_admin_token', Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    return NextResponse.redirect(new URL('/admin?error=internal_auth_error', origin));
  }
}
