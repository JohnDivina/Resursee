'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Wrench,
  Sparkle,
} from '@phosphor-icons/react';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';

export default function HeroSection() {
  const flipWords = ['Build', 'Connect', 'Diagnose', 'Create'];

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-rule-subtle)] bg-transparent py-16 sm:py-24">
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* 1. Revised Clear Platform Headline with Flip Words */}
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-5xl sm:leading-[1.18] lg:text-6xl">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span>One Platform to</span>
            <ContainerTextFlip
              words={flipWords}
              className="min-w-[130px] sm:min-w-[195px] md:min-w-[240px]"
            />
          </span>
        </h1>

        {/* 2. Clear Supporting Subtitle */}
        <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-base font-normal text-[var(--color-ink-muted)] leading-relaxed">
          Intelligent computer vision, real-time IoT hardware telemetry, and zero-install client-side utilities in one unified developer workspace.
        </p>

        {/* 3. Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/tools"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[var(--color-primary-hover)] hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Wrench size={17} weight="bold" />
            <span>Productivity Tools</span>
            <ArrowRight size={15} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/about"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-muted)] px-6 py-3 text-sm font-bold text-[var(--color-ink)] shadow-2xs transition-all duration-200 hover:bg-[var(--color-paper-surface)] hover:border-[var(--color-rule-strong)] active:scale-95 cursor-pointer"
          >
            <Sparkle size={17} weight="bold" className="text-[var(--color-primary)]" />
            <span>About Developer</span>
          </Link>
        </div>

        {/* 4. Clean Feature Badges (No search bar, no emojis) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-[var(--color-ink-secondary)]">
          <span className="rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3.5 py-1 shadow-2xs font-mono text-[11px]">
            6 Client Tools
          </span>
          <span className="rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3.5 py-1 shadow-2xs font-mono text-[11px]">
            Plant Vision AI
          </span>
          <span className="rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3.5 py-1 shadow-2xs font-mono text-[11px]">
            ESP32 IoT Cloud
          </span>
        </div>
      </div>
    </section>
  );
}
