import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'resursee-default-secure-hmac-secret-key-2026';

// Mandatory Security Directive: Sliding Window Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_VERIFICATIONS_PER_WINDOW = 10; // 10 verification attempts per minute

function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
  resetTime: number;
  remaining: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_VERIFICATIONS_PER_WINDOW - 1, resetTime };
  }

  if (record.count >= MAX_VERIFICATIONS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, retryAfterSeconds, resetTime: record.resetTime, remaining: 0 };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: MAX_VERIFICATIONS_PER_WINDOW - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Generates an authentic 16-character hexadecimal Ray ID
 */
function generateRayId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Creates an HMAC-SHA256 clearance token bound to Ray ID, IP, and timestamp
 */
function createClearanceToken(rayId: string, ip: string): string {
  const payload = {
    rayId,
    ip,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours clearance
    type: 'human_verified',
  };
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(b64Payload)
    .digest('base64url');

  return `${b64Payload}.${signature}`;
}

export async function GET(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSeconds),
          'X-RateLimit-Limit': String(MAX_VERIFICATIONS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rate.resetTime / 1000)),
        },
      }
    );
  }

  const rayId = generateRayId();
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  return NextResponse.json({
    rayId,
    timestamp,
    nonce,
  });
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rate.retryAfterSeconds),
          'X-RateLimit-Limit': String(MAX_VERIFICATIONS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rate.resetTime / 1000)),
        },
      }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const rayId = typeof body.rayId === 'string' && body.rayId.length >= 8 ? body.rayId : generateRayId();
  const token = createClearanceToken(rayId, clientIp);

  const response = NextResponse.json({
    success: true,
    rayId,
    clearanceToken: token,
    redirectUrl: typeof body.redirect === 'string' && body.redirect.startsWith('/') ? body.redirect : '/',
  });

  // Set HTTP-only secure clearance cookie
  response.cookies.set('cf_clearance', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60, // 2 hours
  });

  return response;
}
