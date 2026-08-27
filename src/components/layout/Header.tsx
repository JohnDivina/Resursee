'use client';

import React from 'react';
import Link from 'next/link';
import {
  MagnifyingGlass,
  FileText,
  ShieldCheck,
  Command,
  UploadSimple,
  Wrench,
} from '@phosphor-icons/react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import SoundToggle from '@/components/sound/SoundToggle';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export default function Header({ onOpenSearch }: HeaderProps) {
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

        {/* Minimal Navigation: Browse · Tools · Contribute */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/resources"
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[var(--color-ink-secondary)] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:text-[var(--color-ink)]"
          >
            <FileText size={15} />
            <span>Browse</span>
          </Link>
          <Link
            href="/tools"
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[var(--color-ink-secondary)] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:text-[var(--color-ink)]"
          >
            <Wrench size={15} />
            <span>Tools</span>
          </Link>
          <Link
            href="/contribute"
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[var(--color-ink-secondary)] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:text-[var(--color-ink)]"
          >
            <UploadSimple size={15} />
            <span>Contribute</span>
          </Link>
        </nav>

        {/* Action Toolbar: Search ⌘K Pill + Sound Toggle + Dark Mode Rain Toggle + Admin Portal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Instant ⌘K Search Pill */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="group flex h-9 items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-surface)] px-3 text-xs font-semibold text-[var(--color-ink-muted)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-ink)] active:scale-98"
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

          {/* Dark Mode Rain Drops Transition Toggle */}
          <ThemeToggle />

          {/* Admin Login Gateway */}
          <Link
            href="/admin"
            className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-ink)] dark:bg-white px-4 text-xs font-bold text-white dark:text-black shadow-2xs transition-all hover:bg-[var(--color-primary)] dark:hover:bg-blue-400 active:scale-95"
          >
            <ShieldCheck size={15} weight="bold" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
