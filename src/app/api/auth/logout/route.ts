import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.json({ success: true });

  response.cookies.set('resursee_admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
