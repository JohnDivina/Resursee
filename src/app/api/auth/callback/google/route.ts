import { NextResponse } from 'next/server';
import { getApprovedModerators, addPendingRequest } from '@/app/api/admin/staff/route';

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
  const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAILS || '';

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

    // 2. Fetch Google User Profile
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userinfoResponse.json();
    const userEmail = (profile.email || '').toLowerCase().trim();

    // 3. Determine Role
    const masterAdminEmails = adminEmailsRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let role: 'master_admin' | 'moderator' | 'pending' = 'pending';

    const isMasterAdmin = masterAdminEmails.length > 0 && masterAdminEmails.includes(userEmail);
    const approvedList = getApprovedModerators();
    const isApprovedModerator = approvedList.some((m) => m.email.toLowerCase() === userEmail);

    if (isMasterAdmin) {
      role = 'master_admin';
    } else if (isApprovedModerator) {
      role = 'moderator';
    } else {
      role = 'pending';
      // Record access request in pending queue
      addPendingRequest({
        email: userEmail,
        name: profile.name || userEmail,
        picture: profile.picture || null,
      });
    }

    // 4. Create Session Object
    const sessionData = {
      email: userEmail,
      name: profile.name || 'Administrator',
      picture: profile.picture || null,
      role,
      authenticated: role !== 'pending',
      timestamp: Date.now(),
    };

    const redirectTarget =
      role === 'pending'
        ? `/admin?auth=pending_approval&email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(profile.name || '')}`
        : '/admin?auth=google_success';

    const response = NextResponse.redirect(new URL(redirectTarget, origin));

    // Set secure HTTP-only session cookie
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
