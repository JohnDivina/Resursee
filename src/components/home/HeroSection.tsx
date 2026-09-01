'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlass,
  ArrowRight,
  Wrench,
  Sparkle,
  Cpu,
  Plant,
} from '@phosphor-icons/react';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (onSearch) {
        onSearch(searchTerm.trim());
      } else {
        router.push(`/tools?q=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  const flipWords = ['Build', 'Convert', 'Discover'];

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-rule-subtle)] bg-transparent py-16 sm:py-24">
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* 1. Primary Tagline Headline with Aceternity ContainerTextFlip at the end */}
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-5xl sm:leading-[1.18] lg:text-6xl">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span>With</span>
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              Resursee
            </span>
            <ContainerTextFlip
              words={flipWords}
              className="min-w-[130px] sm:min-w-[195px] md:min-w-[240px]"
            />
          </span>
        </h1>

        {/* 2. Dual Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Primary Button: Explore Tools */}
          <Link
            href="/tools"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[var(--color-primary-hover)] hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Wrench size={17} weight="bold" />
            <span>Productivity Tools</span>
            <ArrowRight size={15} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* Secondary Button: About & Portfolio */}
          <Link
            href="/about"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-muted)] px-6 py-3 text-sm font-bold text-[var(--color-ink)] shadow-2xs transition-all duration-200 hover:bg-[var(--color-paper-surface)] hover:border-[var(--color-rule-strong)] active:scale-95 cursor-pointer"
          >
            <Sparkle size={17} weight="bold" className="text-[var(--color-primary)]" />
            <span>About Developer</span>
          </Link>
        </div>

        {/* 3. Prominent Central Search Bar */}
        <div className="mx-auto mt-8 w-full max-w-2xl">
          <form
            onSubmit={handleSearchSubmit}
            className="group relative flex items-center rounded-[20px] sm:rounded-[22px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-1.5 sm:p-2 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_4px_var(--color-primary-glow)]"
          >
            <div className="flex pl-2.5 sm:pl-3.5 text-[var(--color-primary)] shrink-0">
              <MagnifyingGlass size={20} weight="bold" className="sm:w-[22px] sm:h-[22px]" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tools, apps, image processors..."
              className="min-w-0 flex-1 bg-transparent px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-base font-medium text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-hidden truncate"
              aria-label="Search tools and applications"
            />

            <button
              type="submit"
              className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-[14px] sm:rounded-[16px] bg-[var(--color-primary)] px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 shrink-0 cursor-pointer"
            >
              <span className="hidden sm:inline">Search Platform</span>
              <span className="sm:hidden">Search</span>
              <ArrowRight size={15} weight="bold" />
            </button>
          </form>
        </div>

        {/* 4. Quick Feature Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-[var(--color-ink-muted)]">
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3 py-1 shadow-2xs">
            <Wrench size={13} className="text-purple-500" />
            <span>6 Browser Tools</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3 py-1 shadow-2xs">
            <Plant size={13} className="text-emerald-500" />
            <span>Plant AI Vision</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3 py-1 shadow-2xs">
            <Cpu size={13} className="text-blue-500" />
            <span>ESP32 IoT Cloud</span>
          </span>
        </div>
      </div>
    </section>
  );
}
