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
import { CloudShader } from '@/components/ui/cloud-shader';
import { mockResources, mockDepartments } from '@/lib/mockData';
import { useRealtimeTotalDownloads } from '@/lib/downloadStore';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const totalDownloads = useRealtimeTotalDownloads();

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
    <section className="relative min-h-[38rem] sm:min-h-[44rem] w-full overflow-hidden py-16 sm:py-24 flex items-center justify-center">
      {/* Aceternity Sunny Blue Sky & Fluffy Cloud WebGL Shader */}
      <CloudShader className="absolute inset-0" />

      {/* Subtle bottom gradient blending into content below */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-paper)] to-transparent pointer-events-none z-1" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* 1. Primary Tagline Headline */}
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl sm:leading-[1.12] lg:text-6xl">
          Find the university resources you need{' '}
          <span className="relative whitespace-nowrap text-white font-extrabold">
            <span>in seconds</span>
          </span>
          .
        </h1>

        {/* 2. Dual Action Buttons + Real-time Usage Proof Counter */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Primary Button: See all documents */}
          <Link
            href="/resources"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-sky-800 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/95 active:scale-95 cursor-pointer"
          >
            <FileText size={17} weight="bold" />
            <span>See all documents</span>
            <ArrowRight size={15} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* Secondary Button: Contribute resources */}
          <Link
            href="/contribute"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full border border-white/40 bg-white/15 backdrop-blur-md px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-white/25 active:scale-95 cursor-pointer"
          >
            <UploadSimple size={17} weight="bold" />
            <span>Contribute resources</span>
          </Link>

          {/* Real-time Foot Traffic Proof Badge */}
          <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/15 backdrop-blur-md py-1.5 pr-3.5 pl-2 shadow-md text-white">
            <div className="flex -space-x-2 overflow-hidden">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 font-bold text-[10px] text-white ring-2 ring-white/60 select-none">
                JD
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-bold text-[10px] text-white ring-2 ring-white/60 select-none">
                MC
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 font-bold text-[10px] text-white ring-2 ring-white/60 select-none">
                KL
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 font-bold text-[10px] text-white ring-2 ring-white/60 select-none">
                AP
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-white drop-shadow-xs">
              +{totalDownloads.toLocaleString()} downloads
            </span>
          </div>
        </div>

        {/* 3. Prominent Central Search Bar */}
        <div className="mx-auto mt-8 max-w-2xl">
          <form
            onSubmit={handleSearchSubmit}
            className="group relative flex items-center rounded-[24px] border border-white/50 bg-white/95 backdrop-blur-xl p-2 shadow-2xl transition-all focus-within:ring-4 focus-within:ring-white/40 text-slate-900"
          >
            <div className="flex pl-3.5 text-sky-700">
              <MagnifyingGlass size={22} weight="bold" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search forms, templates, policies, documents..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-500 outline-hidden sm:text-base"
              aria-label="Search university resources"
            />

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-[18px] bg-sky-700 hover:bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 sm:px-5 sm:text-sm shrink-0 cursor-pointer"
            >
              <span>Search Hub</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>
        </div>

        {/* 4. Dynamic Statistics Strip (Glassmorphic Cards) */}
        <div className="mt-8">
          <StatsStrip resources={mockResources} departments={mockDepartments} />
        </div>
      </div>
    </section>
  );
}
