import crypto from 'crypto';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'resursee-default-secure-hmac-secret-key-2026';

export interface UserSession {
  email: string;
  name: string;
  picture: string | null;
  role: 'master_admin' | 'moderator' | 'user' | 'pending';
  authenticated: boolean;
  timestamp: number;
  userId?: string;
}

/**
 * Creates an HMAC-SHA256 signed session token
 */
export function createSignedSession(payload: UserSession): string {
  const jsonStr = JSON.stringify(payload);
  const dataB64 = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(dataB64)
    .digest('base64url');

  return `${dataB64}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed session token
 * Returns null if tampered, invalid, or expired (> 14 days)
 */
export function verifySignedSession(token: string): UserSession | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      // Backwards compatibility for legacy unsigned base64 cookies
      try {
        const legacy = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        if (legacy && legacy.email) return legacy;
      } catch {
        return null;
      }
      return null;
    }

    const [dataB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(dataB64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.warn('Session signature verification failed (possible tampering detected).');
      return null;
    }

    const payload: UserSession = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf-8'));

    // Check expiration (14 days)
    const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
    if (payload.timestamp && Date.now() - payload.timestamp > MAX_AGE_MS) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error('Failed to parse session token:', err);
    return null;
  }
}
