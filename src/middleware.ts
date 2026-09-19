import { NextRequest, NextResponse } from 'next/server';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'resursee-default-secure-hmac-secret-key-2026';

// Toggle bot protection via environment variable (enabled by default)
const BOT_SHIELD_ENABLED = process.env.BOT_SHIELD_ENABLED !== 'false';

// Known automated scraper and bot user-agent signatures
const KNOWN_BOT_PATTERNS = [
  'curl',
  'python-requests',
  'python-urllib',
  'aiohttp',
  'scrapy',
  'headlesschrome',
  'phantomjs',
  'selenium',
  'puppeteer',
  'playwright',
  'postmanruntime',
  'httpclient',
  'go-http-client',
  'wget',
  'libwww-perl',
  'node-fetch',
  'axios',
];

/**
 * Validates HMAC-SHA256 clearance token using Edge-compatible Web Crypto API
 */
async function verifyClearanceToken(token: string, secret: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [b64Payload, signature] = parts;
    if (!b64Payload || !signature) return false;

    // Decode JSON payload
    const jsonStr = atob(b64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(jsonStr);

    // Check expiration timestamp
    if (typeof payload.expiresAt !== 'number' || Date.now() > payload.expiresAt) {
      return false;
    }

    // Verify HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBinary = atob(signature.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    return await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(b64Payload)
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

  // 1. Immediately block known automated bot scrapers
  const isKnownBot = KNOWN_BOT_PATTERNS.some((pattern) => userAgent.includes(pattern));
  if (isKnownBot && !request.cookies.get('cf_clearance')) {
    return new NextResponse(
      JSON.stringify({
        error: 'Access denied: Malicious automated bot activity detected.',
        service: 'Cloudflare Bot Shield',
        timestamp: Date.now(),
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2. Allow requests if bot shield is explicitly turned off via env
  if (!BOT_SHIELD_ENABLED) {
    return NextResponse.next();
  }

  // 3. Localhost & Native Tauri desktop app bypass
  const host = request.headers.get('host') || '';
  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');
  if (isLocalHost || userAgent.includes('com.resursee.desktop') || userAgent.includes('tauri')) {
    return NextResponse.next();
  }

  // 4. Dedicated AI transcription route enforces its own sliding-window rate limiter (AGENTS.md)
  if (pathname === '/api/ai/transcribe') {
    return NextResponse.next();
  }

  // 4. Verify existing clearance cookie
  const clearanceToken = request.cookies.get('cf_clearance')?.value;
  if (clearanceToken) {
    const isValid = await verifyClearanceToken(clearanceToken, SESSION_SECRET);
    if (isValid) {
      return NextResponse.next();
    }
  }

  // 5. For API routes, return 403 challenge_required instead of HTML redirect
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: 'Bot verification required. Please complete security challenge at /verify',
        status: 'challenge_required',
        verifyUrl: '/verify',
      },
      { status: 403 }
    );
  }

  // 6. For page routes, redirect to /verify challenge interstitial
  const verifyUrl = new URL('/verify', request.url);
  const destination = pathname + search;
  if (destination && destination !== '/') {
    verifyUrl.searchParams.set('redirect', destination);
  }

  return NextResponse.redirect(verifyUrl);
}

// Intercept all routes except static assets, favicon, /verify, and /api/verify
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - verify (the verification challenge page itself)
     * - api/verify (the verification API endpoint)
     * - Static asset extensions (.png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon|verify|api/verify|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)).*)',
  ],
};
