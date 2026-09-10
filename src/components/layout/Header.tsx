'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlass,
  Command,
  UploadSimple,
  Wrench,
  Sparkle,
  HouseLine,
  UserCircle,
  SignOut,
  Plant,
  Cpu,
  ShieldCheck,
  GoogleLogo,
  CaretDown,
} from '@phosphor-icons/react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import SoundToggle from '@/components/sound/SoundToggle';
import VisitorPresenceWidget from '@/components/analytics/VisitorPresenceWidget';
import {
  Navbar,
  NavBody,
  NavItems,
  NavbarLogo,
  MobileNav,
  MobileNavToggle,
  MobileNavMenu,
} from '@/components/ui/resizable-navbar';
import { Menu, MenuItem, ProductItem, HoveredLink } from '@/components/ui/navbar-menu';
import { UserSession } from '@/lib/sessionCrypto';
import { QuotaStatus } from '@/lib/quotaManager';

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
  const [session, setSession] = useState<UserSession | null>(getValidCachedSession);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeNav, setActiveNav] = useState<string | null>(null);

  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveNav(null);
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
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

  const navItems = [
    { name: 'Plant Doctor', link: '/apps/plant-doctor', icon: Plant },
    { name: 'IoT Cloud', link: '/apps/iot-cloud', icon: Cpu },
    { name: 'Tools', link: '/tools', icon: Wrench },
    { name: 'About', link: '/about', icon: Sparkle },
  ];

  const returnToParam = encodeURIComponent(pathname || '/');

  return (
    <Navbar>
      <NavBody>
        {/* Brand Logo */}
        <NavbarLogo href="/" label="Resursee" emoji="🦦" />

        {/* Center Desktop Navigation with Aceternity Hover Mega-Menu */}
        <div className="hidden md:flex items-center">
          <Menu
            setActive={setActiveNav}
            className="border-0 bg-transparent dark:bg-transparent shadow-none px-1 py-0 space-x-2 lg:space-x-5"
          >
            {/* Apps Mega Menu */}
            <MenuItem setActive={setActiveNav} active={activeNav} item="Apps">
              <div className="grid grid-cols-2 gap-4 p-2 text-sm w-[460px]">
                <ProductItem
                  title="Plant Doctor AI"
                  href="/apps/plant-doctor"
                  src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=300&auto=format&fit=crop&q=80"
                  description="AI crop pathology, leaf diagnostics, and smart treatment recommendations."
                />
                <ProductItem
                  title="ESP32 IoT Cloud"
                  href="/apps/iot-cloud"
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80"
                  description="Real-time telemetry chart streams, sensor metrics, and relay GPIO controls."
                />
              </div>
            </MenuItem>

            {/* Tools Dropdown */}
            <MenuItem setActive={setActiveNav} active={activeNav} item="Tools">
              <div className="flex flex-col space-y-2.5 text-sm min-w-[210px] p-2">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-0.5">
                  PDF Documents
                </div>
                <HoveredLink href="/tools/merge-pdf">Merge PDF Documents</HoveredLink>
                <HoveredLink href="/tools/split-pdf">Split PDF Pages</HoveredLink>

                <div className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] pt-2 mb-0.5 border-t border-[var(--color-rule-subtle)]">
                  Media & Tools
                </div>
                <HoveredLink href="/tools/convert-image">Convert Images</HoveredLink>
                <HoveredLink href="/tools/compress-image">Compress Images</HoveredLink>
                <HoveredLink href="/tools/qr-generator">QR Code Generator</HoveredLink>

                <div className="border-t border-[var(--color-rule-subtle)] pt-2 mt-1">
                  <HoveredLink href="/tools" className="font-bold text-[var(--color-primary)]">
                    Explore All Tools →
                  </HoveredLink>
                </div>
              </div>
            </MenuItem>

            {/* Resources Dropdown */}
            <MenuItem setActive={setActiveNav} active={activeNav} item="Resources">
              <div className="flex flex-col space-y-2.5 text-sm min-w-[190px] p-2">
                <HoveredLink href="/resources">Academic Resources</HoveredLink>
                <HoveredLink href="/news">Tech & Research News</HoveredLink>
                <HoveredLink href="/contribute">Contribute Material</HoveredLink>
                <HoveredLink href="/about">About Resursee</HoveredLink>
              </div>
            </MenuItem>

            {/* Direct About Link */}
            <MenuItem setActive={setActiveNav} active={activeNav} item="About" href="/about" />
          </Menu>
        </div>

        {/* Right Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Visitor Presence / Codenotch Online Widget */}
          <VisitorPresenceWidget />

          {/* User Profile / 1-Click Google Sign-In */}
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex h-9 items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-surface)] pl-1.5 pr-3 text-xs font-bold text-[var(--color-ink)] shadow-2xs hover:border-[var(--color-primary)] transition-all cursor-pointer"
              >
                {session.picture ? (
                  <img
                    src={session.picture}
                    alt={session.name}
                    className="h-6 w-6 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[10px]">
                    {session.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:inline max-w-[100px] truncate">{session.name}</span>
                <CaretDown size={12} weight="bold" className="text-[var(--color-ink-muted)]" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-11 z-50 w-64 rounded-[22px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-3 shadow-2xl animate-in zoom-in-95 duration-150">
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
                      className="flex w-full items-center gap-2 rounded-[12px] px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <SignOut size={15} weight="bold" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isLoadingAuth ? (
            <div className="h-9 w-20 rounded-full bg-[var(--color-paper-muted)] border border-black/[0.04] dark:border-white/[0.06] animate-pulse" />
          ) : (
            <a
              href={`/api/auth/google?returnTo=${returnToParam}`}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 sm:px-4 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all"
            >
              <GoogleLogo size={14} weight="bold" />
              <span className="hidden sm:inline">Sign In</span>
            </a>
          )}

          {/* Sound Effect Toggle (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center">
            <SoundToggle />
          </div>

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {/* Mobile Navigation Toggle */}
          <MobileNav>
            <MobileNavToggle
              isOpen={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </MobileNav>
        </div>
      </NavBody>

      {/* Mobile Navigation Drawer */}
      <MobileNavMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <div className="space-y-1 pt-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-[16px] p-3 text-xs font-bold transition-all ${
              pathname === '/'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
            }`}
          >
            <HouseLine size={18} weight="bold" />
            <span>Home</span>
          </Link>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.link || (pathname && pathname.startsWith(`${item.link}/`));

            return (
              <Link
                key={item.link}
                href={item.link}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-[16px] p-3 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                }`}
              >
                {Icon && <Icon size={18} weight="bold" />}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Quick Preferences Strip */}
        <div className="pt-2 border-t border-[var(--color-rule-subtle)] flex items-center justify-between px-2 py-1.5 rounded-[14px] bg-[var(--color-paper-muted)]/70">
          <span className="text-[11px] font-semibold text-[var(--color-ink-muted)]">Preferences</span>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--color-rule-subtle)] flex flex-col gap-2">
          {session ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-bold text-rose-600"
            >
              <SignOut size={16} weight="bold" />
              <span>Sign Out ({session.name})</span>
            </button>
          ) : isLoadingAuth ? (
            <div className="h-11 w-full rounded-full bg-[var(--color-paper-muted)] animate-pulse" />
          ) : (
            <a
              href={`/api/auth/google?returnTo=${returnToParam}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-xs"
            >
              <GoogleLogo size={16} weight="bold" />
              <span>Sign in with Google</span>
            </a>
          )}
        </div>
      </MobileNavMenu>
    </Navbar>
  );
}
