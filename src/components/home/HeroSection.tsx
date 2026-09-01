'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlass,
  ArrowRight,
  UploadSimple,
  FileText,
} from '@phosphor-icons/react';
import StatsStrip from '@/components/home/StatsStrip';
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
    <section className="relative overflow-hidden border-b border-[var(--color-rule-subtle)] bg-transparent py-16 sm:py-24">
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* 1. Primary Tagline Headline */}
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-5xl sm:leading-[1.12] lg:text-6xl">
          Find the university resources you need{' '}
          <span className="relative whitespace-nowrap text-[var(--color-primary)]">
            <span>in seconds</span>
          </span>
          .
        </h1>

        {/* 2. Dual Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Primary Button: See all documents */}
          <Link
            href="/resources"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-[var(--color-primary-hover)] hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <FileText size={17} weight="bold" />
            <span>See all documents</span>
            <ArrowRight size={15} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* Secondary Button: Contribute resources */}
          <Link
            href="/contribute"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-muted)] px-6 py-3 text-sm font-bold text-[var(--color-ink)] shadow-2xs transition-all duration-200 hover:bg-[var(--color-paper-surface)] hover:border-[var(--color-rule-strong)] active:scale-95 cursor-pointer"
          >
            <UploadSimple size={17} weight="bold" className="text-[var(--color-primary)]" />
            <span>Contribute resources</span>
          </Link>
        </div>

        {/* 3. Prominent Central Search Bar */}
        <div className="mx-auto mt-8 max-w-2xl">
          <form
            onSubmit={handleSearchSubmit}
            className="group relative flex items-center rounded-[22px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_4px_var(--color-primary-glow)]"
          >
            <div className="flex pl-3.5 text-[var(--color-primary)]">
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
              className="flex items-center gap-1.5 rounded-[16px] bg-[var(--color-primary)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 sm:px-5 sm:text-sm shrink-0 cursor-pointer"
            >
              <span>Search Hub</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>
        </div>

        {/* 4. Dynamic Statistics Strip */}
        <StatsStrip resources={mockResources} departments={mockDepartments} />
      </div>
    </section>
  );
}
