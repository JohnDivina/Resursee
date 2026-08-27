'use client';

import React from 'react';
import Link from 'next/link';
import {
  MagnifyingGlass,
  FileText,
  ShieldCheck,
  Command,
  UploadSimple,
} from '@phosphor-icons/react';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export default function Header({ onOpenSearch }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-rule)] bg-[var(--color-paper)]/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Minimal Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform active:scale-95"
            aria-label="Resursee Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white shadow-xs transition-all group-hover:bg-[var(--color-primary-hover)] group-hover:shadow-[0_0_12px_var(--color-primary-glow)]">
              <span className="text-base font-bold select-none">🦦</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-[var(--color-ink)]">
              Resursee
            </span>
          </Link>
        </div>

        {/* Minimal Navigation: Browse · Contribute */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/resources"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
          >
            <FileText size={15} />
            <span>Browse</span>
          </Link>
          <Link
            href="/contribute"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
          >
            <UploadSimple size={15} />
            <span>Contribute</span>
          </Link>
        </nav>

        {/* Action Toolbar: Search ⌘K Pill + Dark Mode Rain Toggle + Admin Portal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Instant ⌘K Search Pill */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="group flex h-8.5 items-center gap-2 rounded-md border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-2.5 sm:px-3 text-xs text-[var(--color-ink-muted)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-card)] hover:text-[var(--color-ink)] active:scale-98"
            aria-label="Search resources"
          >
            <MagnifyingGlass size={14} className="text-[var(--color-primary)] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-[var(--color-rule-strong)] bg-[var(--color-paper-muted)] px-1.5 py-0.2 font-mono text-[10px] text-[var(--color-ink-secondary)]">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Dark Mode Rain Drops Transition Toggle */}
          <ThemeToggle />

          {/* Admin Login Gateway */}
          <Link
            href="/admin"
            className="flex h-8.5 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 sm:px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-[0_2px_8px_var(--color-primary-glow)] active:scale-95"
          >
            <ShieldCheck size={15} weight="bold" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
