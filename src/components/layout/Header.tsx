'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkle,
  UserCircle,
  SignOut,
  Plant,
  Cpu,
  ShieldCheck,
  GoogleLogo,
  CaretDown,
  List,
  X,
  Wrench,
  HouseLine,
  Globe,
} from '@phosphor-icons/react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import SoundToggle from '@/components/sound/SoundToggle';
import VisitorPresenceWidget from '@/components/analytics/VisitorPresenceWidget';
import { UserSession } from '@/lib/sessionCrypto';
import { QuotaStatus } from '@/lib/quotaManager';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenSearch?: () => void;
}

function getValidCachedSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const lastActiveStr = localStorage.getItem('resursee_last_active_time');
    const cachedStr = localStorage.getItem('resursee_user_session_cache');
    if (!cachedStr || !lastActiveStr) return null;

    const lastActive = parseInt(lastActiveStr, 10);
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

    // If last activity is missing or older than 15 minutes, cache is expired
    if (isNaN(lastActive) || Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem('resursee_user_session_cache');
      localStorage.removeItem('resursee_last_active_time');
      return null;
    }

    const parsed = JSON.parse(cachedStr);
    return parsed && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

export default function Header({ onOpenSearch }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'apps' | null>(null);
  const [session, setSession] = useState<UserSession | null>(getValidCachedSession);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const appsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on route change
  useEffect(() => {
    setOpenDropdown(null);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Synchronize with global auth events and cross-tab broadcasts
  useEffect(() => {
    const handleAuthEvent = (e: any) => {
      const updatedSession = e.detail?.session ?? null;
      setSession(updatedSession);
      if (!updatedSession) {
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('resursee-auth-change', handleAuthEvent);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('resursee_auth_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            setSession(null);
            setProfileDropdownOpen(false);
          }
        };
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('resursee-auth-change', handleAuthEvent);
      if (channel) channel.close();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.authenticated && data.user) {
              setSession(data.user);
              try {
                localStorage.setItem('resursee_user_session_cache', JSON.stringify(data.user));
              } catch {
                // ignore
              }
            } else {
              setSession(null);
              try {
                localStorage.removeItem('resursee_user_session_cache');
                localStorage.removeItem('resursee_last_active_time');
              } catch {
                // ignore
              }
            }
            if (data.quota) {
              setQuota(data.quota);
            }
          }
        } else {
          if (isMounted) {
            setSession(null);
            try {
              localStorage.removeItem('resursee_user_session_cache');
              localStorage.removeItem('resursee_last_active_time');
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error('Session load error:', err);
        if (isMounted) {
          setSession(null);
          try {
            localStorage.removeItem('resursee_user_session_cache');
            localStorage.removeItem('resursee_last_active_time');
          } catch {
            // ignore
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    }
    loadSession();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (
        appsDropdownRef.current &&
        !appsDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('resursee_user_session_cache');
        localStorage.removeItem('resursee_last_active_time');
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setSession(null);
    setProfileDropdownOpen(false);
    window.location.reload();
  };

  const returnToParam = encodeURIComponent(pathname || '/');

  return (
    <header className="bg-[var(--color-paper-card)]/90 dark:bg-black/90 border-b border-[var(--color-rule-strong)] dark:border-white/10 sticky top-0 z-50 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand Logo (DomoDomo style) */}
        <Link
          href="/"
          className="hover:opacity-90 transition-opacity shrink-0 flex items-center gap-2.5"
          aria-label="Resursee Home"
        >
          <img
            src="/favicon.svg"
            alt="Resursee Logo"
            className="h-8 w-8 rounded-lg shadow-xs shrink-0 object-contain"
          />
          <span className="text-base font-extrabold tracking-tight text-[var(--color-ink)]">
            Resursee
          </span>
        </Link>

        {/* Center Desktop Navigation (DomoDomo style) */}
        <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold">
          {/* Tools */}
          <Link
            href="/tools"
            className={cn(
              'px-3 py-1.5 rounded-lg tracking-wide transition-all',
              pathname === '/tools' || pathname.startsWith('/tools/')
                ? 'text-[var(--color-ink)] bg-[var(--color-paper-muted)] font-bold shadow-2xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
            )}
          >
            Tools
          </Link>

          {/* Ecosystem / Apps Dropdown */}
          <div className="relative" ref={appsDropdownRef}>
            <button
              type="button"
              onClick={() => setOpenDropdown((prev) => (prev === 'apps' ? null : 'apps'))}
              className={cn(
                'px-3 py-1.5 rounded-lg tracking-wide transition-all flex items-center gap-1.5 cursor-pointer select-none',
                openDropdown === 'apps' || pathname.startsWith('/apps')
                  ? 'text-[var(--color-ink)] bg-[var(--color-paper-muted)] font-bold shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
              )}
              aria-expanded={openDropdown === 'apps'}
            >
              <span>Apps</span>
              <CaretDown
                size={12}
                className={cn(
                  'transition-transform duration-200',
                  openDropdown === 'apps' ? 'rotate-180 text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'
                )}
              />
            </button>

            {openDropdown === 'apps' && (
              <div className="absolute left-0 mt-2 w-80 bg-[var(--color-paper-card)] dark:bg-[#0a0a0a] border border-[var(--color-rule-strong)] dark:border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-in zoom-in-95 duration-150 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)] font-bold">
                  Resursee Ecosystem
                </div>

                <Link
                  href="/apps/plant-doctor"
                  onClick={() => setOpenDropdown(null)}
                  className={cn(
                    'flex items-start gap-3 p-2.5 rounded-xl transition-all',
                    pathname === '/apps/plant-doctor'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-ink)]'
                      : 'hover:bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  )}
                >
                  <div className="p-2 rounded-lg bg-[var(--color-paper-surface)] dark:bg-[#141414] border border-neutral-200 dark:border-neutral-700 text-[var(--color-ink)] shrink-0 mt-0.5">
                    <Plant size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[var(--color-ink)]">Plant Doctor AI</span>
                      <span className="text-[9px] font-mono font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5 leading-snug">
                      AI crop pathology, leaf scanner & organic treatment
                    </p>
                  </div>
                </Link>

                <Link
                  href="/apps/iot-cloud"
                  onClick={() => setOpenDropdown(null)}
                  className={cn(
                    'flex items-start gap-3 p-2.5 rounded-xl transition-all',
                    pathname === '/apps/iot-cloud'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-ink)]'
                      : 'hover:bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  )}
                >
                  <div className="p-2 rounded-lg bg-[var(--color-paper-surface)] dark:bg-[#141414] border border-neutral-200 dark:border-neutral-700 text-[var(--color-ink)] shrink-0 mt-0.5">
                    <Cpu size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-[var(--color-ink)]">ESP32 IoT Cloud</span>
                    <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5 leading-snug">
                      Real-time telemetry chart streams & GPIO controls
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Resources */}
          <Link
            href="/resources"
            className={cn(
              'px-3 py-1.5 rounded-lg tracking-wide transition-all',
              pathname === '/resources' || pathname.startsWith('/resources/')
                ? 'text-[var(--color-ink)] bg-[var(--color-paper-muted)] font-bold shadow-2xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
            )}
          >
            Resources
          </Link>

          {/* About */}
          <Link
            href="/about"
            className={cn(
              'px-3 py-1.5 rounded-lg tracking-wide transition-all',
              pathname === '/about'
                ? 'text-[var(--color-ink)] bg-[var(--color-paper-muted)] font-bold shadow-2xs'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
            )}
          >
            About
          </Link>
        </nav>

        {/* Right Action Toolbar (DomoDomo style) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live Visitor Presence / Codenotch Online Widget */}
          <VisitorPresenceWidget />

          {/* Divider */}
          <div className="hidden sm:block h-5 w-px bg-[var(--color-rule-strong)] dark:bg-white/10 mx-0.5" />

          {/* 3D Spatial Sound Toggle */}
          <SoundToggle />

          {/* Theme Mode Toggle */}
          <ThemeToggle />

          {/* User Profile / Google Sign-In */}
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex h-8 items-center gap-2 rounded-lg border border-[var(--color-rule-strong)] dark:border-white/10 bg-[var(--color-paper-surface)] pl-1.5 pr-2.5 text-xs font-bold text-[var(--color-ink)] shadow-2xs hover:border-[var(--color-primary)] transition-transform duration-160 active:scale-[0.92] cursor-pointer"
              >
                {session.picture ? (
                  <img
                    src={session.picture}
                    alt={session.name}
                    className="h-5 w-5 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[9px]">
                    {session.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline max-w-[90px] truncate">{session.name}</span>
                <CaretDown size={11} weight="bold" className="text-[var(--color-ink-muted)]" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-[var(--color-rule-strong)] dark:border-white/10 bg-[var(--color-paper-card)] dark:bg-[#0a0a0a] p-3 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="border-b border-[var(--color-rule-subtle)] pb-2.5 px-2">
                    <p className="text-xs font-extrabold text-[var(--color-ink)] truncate">
                      {session.name}
                    </p>
                    <p className="text-[10.5px] font-mono text-[var(--color-ink-muted)] truncate">
                      {session.email}
                    </p>

                    {/* Quota Badge */}
                    {quota && (
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-[var(--color-paper-muted)] px-2 py-1 text-[10px] font-mono font-bold">
                        <span className="text-[var(--color-ink-muted)]">Daily AI Scans:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {quota.maxQuota > 100 ? 'Unlimited' : `${quota.remaining} / ${quota.maxQuota} left`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="py-1.5 space-y-0.5 text-xs font-semibold">
                    <Link
                      href="/apps/plant-doctor"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition-colors"
                    >
                      <Plant size={15} className="text-emerald-500" />
                      <span>Plant Doctor AI</span>
                    </Link>

                    <Link
                      href="/apps/iot-cloud"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition-colors"
                    >
                      <Cpu size={15} className="text-blue-500" />
                      <span>ESP32 IoT Cloud</span>
                    </Link>

                    {(session.role === 'master_admin' || session.role === 'moderator') && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition-colors"
                      >
                        <ShieldCheck size={15} className="text-purple-500" />
                        <span>Admin Portal</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-[var(--color-rule-subtle)] pt-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-[12px] px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <SignOut size={15} weight="bold" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isLoadingAuth ? (
            <div className="h-8 w-16 rounded-lg bg-[var(--color-paper-muted)] border border-black/[0.04] dark:border-white/[0.06] animate-pulse" />
          ) : (
            <a
              href={`/api/auth/google?returnTo=${returnToParam}`}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] dark:bg-white dark:text-black dark:hover:bg-neutral-200 px-3 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-[0.92] transition-all"
            >
              <GoogleLogo size={13} weight="bold" />
              <span className="hidden sm:inline">Sign In</span>
            </a>
          )}

          {/* Mobile Hamburger Navigation Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--color-rule-strong)] dark:border-white/10 hover:border-emerald-600/50 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-transform duration-160 active:scale-[0.92] hover:bg-[var(--color-paper-muted)]"
          >
            {mobileMenuOpen ? <X size={17} weight="bold" /> : <List size={17} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer (DomoDomo style) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--color-rule-strong)] dark:border-white/10 bg-[var(--color-paper-card)] dark:bg-black px-4 pb-4 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1 py-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center gap-2.5',
                pathname === '/'
                  ? 'text-[var(--color-ink)] bg-[var(--color-paper-muted)] font-bold'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
              )}
            >
              <HouseLine size={16} weight="bold" />
              <span>Home</span>
            </Link>

            <Link
              href="/tools"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center gap-2.5',
                pathname.startsWith('/tools')
                  ? 'text-[var(--color-ink)] bg-[var(--color-paper-muted)] font-bold'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
              )}
            >
              <Wrench size={16} weight="bold" />
              <span>Tools</span>
            </Link>

            <Link
              href="/apps/plant-doctor"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-between',
                pathname === '/apps/plant-doctor'
                  ? 'text-[var(--color-ink)] bg-neutral-100 dark:bg-neutral-800 font-bold border border-neutral-200 dark:border-neutral-700'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Plant size={16} weight="bold" />
                <span>Plant Doctor AI</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-1.5 py-0.5 rounded-full">
                NEW
              </span>
            </Link>

            <Link
              href="/apps/iot-cloud"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center gap-2.5',
                pathname === '/apps/iot-cloud'
                  ? 'text-[var(--color-ink)] bg-neutral-100 dark:bg-neutral-800 font-bold border border-neutral-200 dark:border-neutral-700'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
              )}
            >
              <Cpu size={16} weight="bold" />
              <span>ESP32 IoT Cloud</span>
            </Link>

            <Link
              href="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center gap-2.5',
                pathname === '/resources' || pathname.startsWith('/resources/')
                  ? 'text-[var(--color-ink)] bg-[var(--color-paper-muted)] font-bold'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
              )}
            >
              <Globe size={16} weight="bold" />
              <span>Resources</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center gap-2.5',
                pathname === '/about'
                  ? 'text-[var(--color-ink)] bg-[var(--color-paper-muted)] font-bold'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]/60'
              )}
            >
              <Sparkle size={16} weight="bold" />
              <span>About</span>
            </Link>
          </nav>

          {/* Preferences Strip on Mobile */}
          <div className="pt-3 border-t border-[var(--color-rule-subtle)] flex items-center justify-between px-2 py-2 rounded-xl bg-[var(--color-paper-muted)]/60">
            <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Preferences</span>
            <div className="flex items-center gap-2">
              <SoundToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
