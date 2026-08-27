'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedLeaderboard from '@/components/home/FeaturedLeaderboard';
import ToolsPreview from '@/components/home/ToolsPreview';
import LatestNews from '@/components/home/LatestNews';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources, mockNewsArticles } from '@/lib/mockData';
import { CheckCircle } from '@phosphor-icons/react';

export default function HomePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      {/* 1. Minimal Header */}
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />

      {/* Global ⌘K Command Search Overlay */}
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        resources={mockResources}
      />

      <main className="flex-1">
        {/* 2. Hero Section: Tagline → Circle Pop-up Trigger → Search → Dynamic Stats */}
        <HeroSection />

        {/* 3. Community Leaderboard: Ranked Most Downloaded Forms with Time Filters */}
        <FeaturedLeaderboard resources={mockResources} />

        {/* 4. Resursee Productivity Toolbox Preview */}
        <ToolsPreview />

        {/* 5. Verified Campus News & Advisories (Positioned at bottom) */}
        <LatestNews articles={mockNewsArticles} />
      </main>

      {/* 6. Global Footer */}
      <Footer />

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
