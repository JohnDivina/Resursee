import crypto from 'crypto';
import { UserSession } from '@/lib/sessionCrypto';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'resursee-default-secure-hmac-secret-key-2026';

export interface QuotaStatus {
  allowed: boolean;
  usedToday: number;
  maxQuota: number;
  remaining: number;
  resetTimeUtc: string;
  isGuest: boolean;
  tierName: string;
}

// In-Memory Quota Maps (Keyed by User Email or Client IP)
const userQuotaMap = new Map<string, { count: number; dateStr: string }>();
const guestQuotaMap = new Map<string, { count: number; dateStr: string }>();

export const GUEST_DAILY_LIMIT = 2; // 2 free scans for guests before Google Sign-In
export const USER_DAILY_LIMIT = 10; // 10 free scans daily for verified Google accounts
export const ADMIN_DAILY_LIMIT = 9999;

function getUtcDateString(): string {
  return new Date().toISOString().split('T')[0]; // e.g. "2026-09-03"
}

function getNextMidnightUtc(): string {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Creates a signed guest quota cookie string
 */
export function createGuestQuotaCookie(count: number, dateStr: string): string {
  const data = `${count}:${dateStr}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('hex').substring(0, 16);
  return `${data}:${sig}`;
}

/**
 * Parses and verifies a signed guest quota cookie
 */
export function parseGuestQuotaCookie(cookieValue?: string | null): { count: number; dateStr: string } | null {
  if (!cookieValue || typeof cookieValue !== 'string') return null;
  try {
    const parts = cookieValue.split(':');
    if (parts.length !== 3) return null;
    const [countStr, dateStr, sig] = parts;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(`${countStr}:${dateStr}`).digest('hex').substring(0, 16);
    if (sig === expected) {
      return { count: parseInt(countStr, 10) || 0, dateStr };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Checks the quota for a user session, client IP, and guest cookie
 */
export function checkUserQuota(
  session: UserSession | null,
  clientIp: string,
  guestCookieValue?: string | null
): QuotaStatus {
  const today = getUtcDateString();
  const resetTimeUtc = getNextMidnightUtc();

  // 1. Master Admin & Staff: Unlimited
  if (session && (session.role === 'master_admin' || session.role === 'moderator')) {
    return {
      allowed: true,
      usedToday: 0,
      maxQuota: ADMIN_DAILY_LIMIT,
      remaining: ADMIN_DAILY_LIMIT,
      resetTimeUtc,
      isGuest: false,
      tierName: 'Admin / Staff (Unlimited)',
    };
  }

  // 2. Logged-In Google Account User
  if (session && session.email) {
    const key = session.email.toLowerCase().trim();
    const record = userQuotaMap.get(key);

    let used = 0;
    if (record && record.dateStr === today) {
      used = record.count;
    }

    const remaining = Math.max(0, USER_DAILY_LIMIT - used);
    return {
      allowed: used < USER_DAILY_LIMIT,
      usedToday: used,
      maxQuota: USER_DAILY_LIMIT,
      remaining,
      resetTimeUtc,
      isGuest: false,
      tierName: 'Verified Google Account',
    };
  }

  // 3. Guest User: Combine Signed Cookie + In-Memory IP Tracking
  const guestKey = clientIp.trim();
  const ipRecord = guestQuotaMap.get(guestKey);
  const cookieRecord = parseGuestQuotaCookie(guestCookieValue);

  let guestUsed = 0;
  if (ipRecord && ipRecord.dateStr === today) {
    guestUsed = Math.max(guestUsed, ipRecord.count);
  }
  if (cookieRecord && cookieRecord.dateStr === today) {
    guestUsed = Math.max(guestUsed, cookieRecord.count);
  }

  const guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - guestUsed);
  return {
    allowed: guestUsed < GUEST_DAILY_LIMIT,
    usedToday: guestUsed,
    maxQuota: GUEST_DAILY_LIMIT,
    remaining: guestRemaining,
    resetTimeUtc,
    isGuest: true,
    tierName: 'Guest Preview',
  };
}

/**
 * Atomically increments the quota counter upon successful scan
 */
export function incrementUserQuota(
  session: UserSession | null,
  clientIp: string,
  guestCookieValue?: string | null
): { quota: QuotaStatus; newGuestCookie?: string } {
  const today = getUtcDateString();
  const resetTimeUtc = getNextMidnightUtc();

  // Admin
  if (session && (session.role === 'master_admin' || session.role === 'moderator')) {
    return {
      quota: {
        allowed: true,
        usedToday: 0,
        maxQuota: ADMIN_DAILY_LIMIT,
        remaining: ADMIN_DAILY_LIMIT,
        resetTimeUtc,
        isGuest: false,
        tierName: 'Admin / Staff',
      },
    };
  }

  // Logged-in Google User
  if (session && session.email) {
    const key = session.email.toLowerCase().trim();
    const record = userQuotaMap.get(key);

    let nextCount = 1;
    if (record && record.dateStr === today) {
      nextCount = record.count + 1;
    }

    userQuotaMap.set(key, { count: nextCount, dateStr: today });
    return {
      quota: {
        allowed: nextCount < USER_DAILY_LIMIT,
        usedToday: nextCount,
        maxQuota: USER_DAILY_LIMIT,
        remaining: Math.max(0, USER_DAILY_LIMIT - nextCount),
        resetTimeUtc,
        isGuest: false,
        tierName: 'Verified Google Account',
      },
    };
  }

  // Guest: Increment both IP map and create new signed cookie
  const guestKey = clientIp.trim();
  const ipRecord = guestQuotaMap.get(guestKey);
  const cookieRecord = parseGuestQuotaCookie(guestCookieValue);

  let currentUsed = 0;
  if (ipRecord && ipRecord.dateStr === today) {
    currentUsed = Math.max(currentUsed, ipRecord.count);
  }
  if (cookieRecord && cookieRecord.dateStr === today) {
    currentUsed = Math.max(currentUsed, cookieRecord.count);
  }

  const nextGuestCount = currentUsed + 1;
  guestQuotaMap.set(guestKey, { count: nextGuestCount, dateStr: today });

  const newGuestCookie = createGuestQuotaCookie(nextGuestCount, today);
  const remaining = Math.max(0, GUEST_DAILY_LIMIT - nextGuestCount);

  return {
    quota: {
      allowed: nextGuestCount < GUEST_DAILY_LIMIT,
      usedToday: nextGuestCount,
      maxQuota: GUEST_DAILY_LIMIT,
      remaining,
      resetTimeUtc,
      isGuest: true,
      tierName: 'Guest Preview',
    },
    newGuestCookie,
  };
}
