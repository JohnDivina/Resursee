'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldWarning, Clock, SignOut, CheckCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

// Default Timeout Config: 15 minutes total, 60s warning countdown
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_COUNTDOWN_SEC = 60; // 60 seconds warning modal
const THROTTLE_INTERVAL_MS = 10 * 1000; // Throttle activity updates to once per 10s

const STORAGE_KEY = 'resursee_last_active_time';
const LOGOUT_CHANNEL = 'resursee_auth_sync';

interface SessionTimeoutContextType {
  resetTimer: () => void;
  isAuthenticated: boolean;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType>({
  resetTimer: () => {},
  isAuthenticated: false,
});

export const useSessionTimeout = () => useContext(SessionTimeoutContext);

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_SEC);
  const [loggedOutToast, setLoggedOutToast] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOutRef = useRef(false);

  const router = useRouter();
  const pathname = usePathname();

  // Check initial session status
  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(Boolean(data.authenticated));
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [pathname, checkAuthStatus]);

  // Execute Logout
  const handleLogout = useCallback(async (reason: 'inactivity' | 'user') => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    setShowWarningModal(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }

    // Broadcast logout to all other open tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(LOGOUT_CHANNEL);
        channel.postMessage({ type: 'LOGOUT', reason });
        channel.close();
      }
    } catch {
      // ignore
    }

    setIsAuthenticated(false);
    isLoggingOutRef.current = false;

    if (reason === 'inactivity') {
      setLoggedOutToast(true);
      setTimeout(() => setLoggedOutToast(false), 60000);
    }

    router.refresh();
  }, [router]);

  // Reset user activity timestamp
  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(now));
    }
    if (showWarningModal) {
      setShowWarningModal(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  }, [showWarningModal]);

  // Throttled User Activity Listener
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastThrottledTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > THROTTLE_INTERVAL_MS) {
        lastThrottledTime = now;
        lastActivityRef.current = now;
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {
          // ignore
        }
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));

    // Listen to activity or logout events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime) && remoteTime > lastActivityRef.current) {
          lastActivityRef.current = remoteTime;
          if (showWarningModal) {
            setShowWarningModal(false);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(LOGOUT_CHANNEL);
        channel.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            setIsAuthenticated(false);
            setShowWarningModal(false);
            if (event.data.reason === 'inactivity') {
              setLoggedOutToast(true);
            }
          }
        };
      }
    } catch {
      // ignore
    }

    // Set initial activity time
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsedStored = stored ? parseInt(stored, 10) : NaN;
    lastActivityRef.current = !isNaN(parsedStored) ? parsedStored : Date.now();

    // Check inactivity periodically
    timerCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      const warningThreshold = INACTIVITY_TIMEOUT_MS - WARNING_COUNTDOWN_SEC * 1000;

      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        handleLogout('inactivity');
      } else if (idleTime >= warningThreshold && !showWarningModal) {
        setShowWarningModal(true);
        const remainingSec = Math.max(1, Math.ceil((INACTIVITY_TIMEOUT_MS - idleTime) / 1000));
        setCountdown(remainingSec);
      }
    }, 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
      window.removeEventListener('storage', handleStorageChange);
      if (timerCheckIntervalRef.current) clearInterval(timerCheckIntervalRef.current);
      if (channel) channel.close();
    };
  }, [isAuthenticated, showWarningModal, handleLogout]);

  // Countdown timer for warning modal
  useEffect(() => {
    if (showWarningModal) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            handleLogout('inactivity');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setCountdown(WARNING_COUNTDOWN_SEC);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarningModal, handleLogout]);

  return (
    <SessionTimeoutContext.Provider value={{ resetTimer, isAuthenticated }}>
      {children}

      {/* Inactivity Warning Modal */}
      <AnimatePresence>
        {showWarningModal && isAuthenticated && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={resetTimer}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xl"
            >
              {/* Top Warning Icon */}
              <div className="flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
                  <ShieldWarning size={32} weight="bold" />
                </div>
              </div>

              {/* Title & Body */}
              <div className="mt-5 text-center space-y-2">
                <h3 className="text-lg font-extrabold text-[var(--color-ink)] tracking-tight">
                  Session Inactivity Warning
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  You have been inactive for a while. For your account security, you will be automatically logged out in:
                </p>

                {/* Animated Countdown Ring / Pill */}
                <div className="py-3 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                    <Clock size={16} weight="bold" className="animate-spin" />
                    <span>{countdown} seconds remaining</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => handleLogout('user')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] py-2.5 text-xs font-bold text-[var(--color-ink-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <SignOut size={15} />
                  <span>Log Out Now</span>
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-primary)] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle size={15} weight="bold" />
                  <span>Stay Logged In</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logged Out Toast Notification */}
      <AnimatePresence>
        {loggedOutToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-4 shadow-2xl text-xs font-bold text-[var(--color-ink)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldWarning size={18} weight="bold" />
            </div>
            <div>
              <p className="font-extrabold">Logged Out Due to Inactivity</p>
              <p className="text-[10.5px] font-normal text-[var(--color-ink-muted)]">
                Your session was securely timed out after 15 minutes of inactivity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLoggedOutToast(false)}
              className="ml-2 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </SessionTimeoutContext.Provider>
  );
}
