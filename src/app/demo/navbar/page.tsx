'use client';

import React from 'react';
import { NavbarDemo } from '@/components/ui/navbar-menu-demo';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';

export default function NavbarDemoPage() {
  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-black text-[var(--color-ink)] flex flex-col items-center justify-start pt-12 pb-24 px-4 overflow-hidden">
      {/* Back button */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Back to Resursee Home</span>
        </Link>
        <div className="text-xs font-mono text-[var(--color-ink-muted)]">
          Aceternity UI / Navbar Menu Demo
        </div>
      </div>

      {/* Demo Description */}
      <div className="text-center max-w-xl mb-12 z-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          Aceternity Navbar Menu
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Smooth spring transitions, layout-aware mega-menu dropdowns, and card previews powered by Aceternity UI and Framer Motion.
        </p>
      </div>

      {/* Interactive Navbar Demo */}
      <div className="w-full max-w-4xl relative z-20 rounded-[32px] border border-black/10 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl p-8 shadow-2xl min-h-[480px] flex items-center justify-center">
        <NavbarDemo />
      </div>
    </div>
  );
}
