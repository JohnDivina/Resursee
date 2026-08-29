'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlass,
  FileText,
  ShieldCheck,
  Command,
  UploadSimple,
  Wrench,
  Megaphone,
  HouseLine,
  List,
  X,
  Sparkle,
} from '@phosphor-icons/react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import SoundToggle from '@/components/sound/SoundToggle';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export default function Header({ onOpenSearch }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '/resources', label: 'Browse Documents', icon: FileText },
    { href: '/tools', label: 'Paperwork Tools', icon: Wrench },
    { href: '/news', label: 'Campus News', icon: Megaphone },
    { href: '/contribute', label: 'Contribute', icon: UploadSimple },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/[0.05] dark:border-white/[0.08] bg-[var(--color-paper)]/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Minimal Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform active:scale-95"
            aria-label="Resursee Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--color-primary)] text-white shadow-xs transition-all group-hover:bg-[var(--color-primary-hover)] group-hover:shadow-[0_0_12px_var(--color-primary-glow)]">
              <span className="text-lg font-bold select-none">🦦</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--color-ink)]">
              Resursee
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                    : 'text-[var(--color-ink-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:text-[var(--color-ink)]'
                }`}
              >
                <Icon size={15} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Toolbar: Search + Sound + Theme + Admin + Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Instant ⌘K Search Pill */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="group flex h-9 items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-surface)] px-2.5 sm:px-3 text-xs font-semibold text-[var(--color-ink-muted)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-ink)] active:scale-98 cursor-pointer"
            aria-label="Search resources"
          >
            <MagnifyingGlass size={15} className="text-[var(--color-primary)] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-full border border-black/[0.1] dark:border-white/[0.15] bg-black/[0.03] dark:bg-white/[0.06] px-2 py-0.5 font-mono text-[9.5px] text-[var(--color-ink-secondary)]">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Tactile Mechanical Thock Sound Toggle */}
          <SoundToggle />

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {/* Desktop Admin Login Button */}
          <Link
            href="/admin"
            className="hidden sm:flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-ink)] dark:bg-white px-3.5 sm:px-4 text-xs font-bold text-white dark:text-black shadow-2xs transition-all hover:bg-[var(--color-primary)] dark:hover:bg-blue-400 active:scale-95"
          >
            <ShieldCheck size={15} weight="bold" />
            <span>Admin</span>
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink)] shadow-2xs transition-all hover:bg-[var(--color-paper-muted)] active:scale-95 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 flex flex-col bg-[var(--color-paper)]/95 backdrop-blur-xl md:hidden animate-in fade-in duration-200">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Quick Search Tap */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch?.();
              }}
              className="flex w-full items-center justify-between rounded-[20px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-4 text-xs font-semibold text-[var(--color-ink-muted)] shadow-xs transition-all active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <MagnifyingGlass size={18} className="text-[var(--color-primary)]" />
                <span className="text-[var(--color-ink)] font-bold">Search documents & forms...</span>
              </div>
              <kbd className="rounded-full bg-[var(--color-paper-muted)] px-2 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>

            {/* Main Navigation Links */}
            <div className="space-y-2">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] px-2">
                Navigation
              </span>
              <nav className="space-y-1.5 pt-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 rounded-[18px] p-3.5 text-sm font-bold transition-all ${
                    pathname === '/'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                  }`}
                >
                  <HouseLine size={20} weight="bold" />
                  <span>Home</span>
                </Link>

                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3.5 rounded-[18px] p-3.5 text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-[var(--color-primary)] text-white shadow-xs'
                          : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                      }`}
                    >
                      <Icon size={20} weight="bold" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Admin Portal Link for Mobile */}
            <div className="pt-2 border-t border-[var(--color-rule-subtle)]">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-[18px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-4 text-sm font-bold text-[var(--color-ink)] shadow-2xs hover:border-[var(--color-primary)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--color-ink)] dark:bg-white text-white dark:text-black">
                    <ShieldCheck size={18} weight="bold" />
                  </div>
                  <div>
                    <span className="block">Admin Portal</span>
                    <span className="text-[11px] font-normal text-[var(--color-ink-muted)]">
                      Review contributions & governance
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs text-[var(--color-primary)]">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
