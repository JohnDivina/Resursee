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
import {
  Navbar,
  NavBody,
  NavItems,
  NavbarLogo,
  MobileNav,
  MobileNavToggle,
  MobileNavMenu,
} from '@/components/ui/resizable-navbar';
import { UserSession } from '@/lib/sessionCrypto';
import { QuotaStatus } from '@/lib/quotaManager';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export default function Header({ onOpenSearch }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSession(data.user);
          }
          if (data.quota) {
            setQuota(data.quota);
          }
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    loadSession();
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
    await fetch('/api/auth/logout', { method: 'POST' });
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

        {/* Center Desktop Navigation with Floating Hover Pill */}
        <NavItems items={navItems} pathname={pathname} />

        {/* Right Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="group flex h-9 items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-surface)] px-2.5 sm:px-3 text-xs font-semibold text-[var(--color-ink-muted)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-ink)] active:scale-98 cursor-pointer"
            aria-label="Search resources"
          >
            <MagnifyingGlass
              size={15}
              className="text-[var(--color-primary)] transition-transform group-hover:scale-110"
            />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-full border border-black/[0.1] dark:border-white/[0.15] bg-black/[0.03] dark:bg-white/[0.06] px-2 py-0.5 font-mono text-[9.5px] text-[var(--color-ink-secondary)]">
              <Command size={10} />K
            </kbd>
          </button>

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
                <span className="hidden md:inline max-w-[100px] truncate">{session.name}</span>
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
          ) : (
            <a
              href={`/api/auth/google?returnTo=${returnToParam}`}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 sm:px-4 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all"
            >
              <GoogleLogo size={14} weight="bold" />
              <span className="hidden sm:inline">Sign In</span>
            </a>
          )}

          {/* Sound Effect Toggle */}
          <SoundToggle />

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
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            onOpenSearch?.();
          }}
          className="flex w-full items-center justify-between rounded-[20px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3.5 text-xs font-semibold text-[var(--color-ink-muted)] shadow-xs transition-all active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <MagnifyingGlass size={16} className="text-[var(--color-primary)]" />
            <span className="text-[var(--color-ink)] font-bold">Search tools & apps...</span>
          </div>
          <kbd className="rounded-full bg-[var(--color-paper-muted)] px-2 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

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

        <div className="pt-3 border-t border-[var(--color-rule-subtle)] flex flex-col gap-2">
          {!session ? (
            <a
              href={`/api/auth/google?returnTo=${returnToParam}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-xs"
            >
              <GoogleLogo size={16} weight="bold" />
              <span>Sign in with Google</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-bold text-rose-600"
            >
              <SignOut size={16} weight="bold" />
              <span>Sign Out ({session.name})</span>
            </button>
          )}
        </div>
      </MobileNavMenu>
    </Navbar>
  );
}
