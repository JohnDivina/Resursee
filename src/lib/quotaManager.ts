import { UserSession } from '@/lib/sessionCrypto';

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

const GUEST_DAILY_LIMIT = 1;
const USER_DAILY_LIMIT = 10;
const ADMIN_DAILY_LIMIT = 9999;

function getUtcDateString(): string {
  return new Date().toISOString().split('T')[0]; // e.g. "2026-09-02"
}

function getNextMidnightUtc(): string {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Checks the quota for a user session or guest IP
 */
export function checkUserQuota(session: UserSession | null, clientIp: string): QuotaStatus {
  const today = getUtcDateString();
  const resetTimeUtc = getNextMidnightUtc();

  // 1. Master Admin & Moderators: Unlimited
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

  // 2. Logged-In Standard User (Google Account)
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

  // 3. Guest User (Tracked by IP Address)
  const guestKey = clientIp.trim();
  const guestRecord = guestQuotaMap.get(guestKey);

  let guestUsed = 0;
  if (guestRecord && guestRecord.dateStr === today) {
    guestUsed = guestRecord.count;
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
export function incrementUserQuota(session: UserSession | null, clientIp: string): QuotaStatus {
  const today = getUtcDateString();
  const resetTimeUtc = getNextMidnightUtc();

  if (session && (session.role === 'master_admin' || session.role === 'moderator')) {
    return {
      allowed: true,
      usedToday: 0,
      maxQuota: ADMIN_DAILY_LIMIT,
      remaining: ADMIN_DAILY_LIMIT,
      resetTimeUtc,
      isGuest: false,
      tierName: 'Admin / Staff',
    };
  }

  if (session && session.email) {
    const key = session.email.toLowerCase().trim();
    const record = userQuotaMap.get(key);

    let nextCount = 1;
    if (record && record.dateStr === today) {
      nextCount = record.count + 1;
    }

    userQuotaMap.set(key, { count: nextCount, dateStr: today });
    return {
      allowed: nextCount <= USER_DAILY_LIMIT,
      usedToday: nextCount,
      maxQuota: USER_DAILY_LIMIT,
      remaining: Math.max(0, USER_DAILY_LIMIT - nextCount),
      resetTimeUtc,
      isGuest: false,
      tierName: 'Verified Google Account',
    };
  }

  const guestKey = clientIp.trim();
  const guestRecord = guestQuotaMap.get(guestKey);

  let nextGuestCount = 1;
  if (guestRecord && guestRecord.dateStr === today) {
    nextGuestCount = guestRecord.count + 1;
  }

  guestQuotaMap.set(guestKey, { count: nextGuestCount, dateStr: today });
  return {
    allowed: nextGuestCount <= GUEST_DAILY_LIMIT,
    usedToday: nextGuestCount,
    maxQuota: GUEST_DAILY_LIMIT,
    remaining: Math.max(0, GUEST_DAILY_LIMIT - nextGuestCount),
    resetTimeUtc,
    isGuest: true,
    tierName: 'Guest Preview',
  };
}
