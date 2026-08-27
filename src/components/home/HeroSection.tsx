'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlass,
  ArrowRight,
} from '@phosphor-icons/react';
import ResourceShowcase from '@/components/home/ResourceShowcase';
import StatsStrip from '@/components/home/StatsStrip';
import InteractiveParticles from '@/components/motion/InteractiveParticles';
import { mockResources, mockDepartments } from '@/lib/mockData';

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
        router.push(`/resources?q=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-black/[0.05] dark:border-white/[0.08] bg-[var(--color-paper-surface)] py-16 sm:py-24">
      {/* Interactive Constellation Particles & Magnetic Cursor Lines */}
      <InteractiveParticles
        particleCount={48}
        connectionDistance={110}
        mouseRadius={100}
        accentMode="mixed"
      />

      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-[42rem] rounded-full bg-[radial-gradient(ellipse_at_center,var(--color-primary-glow)_0%,transparent_70%)] blur-2xl opacity-50" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* 1. Primary Tagline Headline (Apple SF Pro bold typography) */}
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-5xl sm:leading-[1.12] lg:text-6xl">
          Find the university resources you need{' '}
          <span className="relative whitespace-nowrap text-[var(--color-primary)]">
            <span>in seconds</span>
          </span>
          .
        </h1>

        {/* 2. Interactive Circular Button & Document Showcase */}
        <ResourceShowcase resources={mockResources} />

        {/* 3. Prominent Central Search Bar (Apple Squircle Style) */}
        <div className="mx-auto mt-2 max-w-2xl">
          <form
            onSubmit={handleSearchSubmit}
            className="group relative flex items-center rounded-[20px] border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#131b2e] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_4px_var(--color-primary-glow)]"
          >
            <div className="flex pl-3 text-[var(--color-primary)]">
              <MagnifyingGlass size={22} weight="bold" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search forms, templates, policies, documents..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-sm font-medium text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-hidden sm:text-base"
              aria-label="Search university resources"
            />

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-[14px] bg-[var(--color-primary)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 sm:px-5 sm:text-sm shrink-0"
            >
              <span>Search Hub</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>
        </div>

        {/* 4. Dynamic Statistics Strip (Verified %, Offices, Revisions, Active Docs) */}
        <StatsStrip resources={mockResources} departments={mockDepartments} />
      </div>
    </section>
  );
}
