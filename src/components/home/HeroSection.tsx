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
    <section className="relative overflow-hidden border-b border-[var(--color-rule-subtle)] bg-[#0b132b] py-16 sm:py-24 text-white">
      {/* Aceternity Volumetric Procedural Cloud Shader Background */}
      <CloudShader className="pointer-events-none z-0" speed={1.0} />

      {/* Subtle radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(11,19,43,0.4)_100%)] pointer-events-none z-1" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* 1. Primary Tagline Headline (Apple SF Pro bold typography) */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.12] lg:text-6xl drop-shadow-md">
          Find the university resources you need{' '}
          <span className="relative whitespace-nowrap text-sky-400">
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
            className="group flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-blue-500/25 active:scale-95 cursor-pointer"
          >
            <FileText size={17} weight="bold" />
            <span>See all documents</span>
            <ArrowRight size={15} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          {/* Secondary Button: Contribute resources */}
          <Link
            href="/contribute"
            data-thock="card"
            className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-95 cursor-pointer"
          >
            <UploadSimple size={17} weight="bold" className="text-sky-300" />
            <span>Contribute resources</span>
          </Link>

          {/* Real-time Foot Traffic Proof Badge (Avatar stack + verified download count) */}
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-md py-1.5 pr-3.5 pl-2 shadow-sm text-white">
            <div className="flex -space-x-2 overflow-hidden">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 font-bold text-[10px] text-white ring-2 ring-white/30 select-none">
                JD
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-bold text-[10px] text-white ring-2 ring-white/30 select-none">
                MC
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 font-bold text-[10px] text-white ring-2 ring-white/30 select-none">
                KL
              </span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 font-bold text-[10px] text-white ring-2 ring-white/30 select-none">
                AP
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-sky-300">
              +{totalDownloads.toLocaleString()} downloads
            </span>
          </div>
        </div>

        {/* 3. Prominent Central Search Bar */}
        <div className="mx-auto mt-8 max-w-2xl">
          <form
            onSubmit={handleSearchSubmit}
            className="group relative flex items-center rounded-[22px] border border-white/20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/40"
          >
            <div className="flex pl-3.5 text-blue-600 dark:text-sky-400">
              <MagnifyingGlass size={22} weight="bold" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search forms, templates, policies, documents..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-hidden sm:text-base"
              aria-label="Search university resources"
            />

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-[16px] bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95 sm:px-5 sm:text-sm shrink-0 cursor-pointer"
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
