'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedResources from '@/components/home/FeaturedResources';
import LatestNews from '@/components/home/LatestNews';
import ToolsPreview from '@/components/home/ToolsPreview';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources, mockNewsArticles } from '@/lib/mockData';
import { Resource } from '@/types/database';
import { CheckCircle } from '@phosphor-icons/react';

export default function HomePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDownload = (resource: Resource) => {
    setToastMessage(`Downloading "${resource.title}" (${resource.file_format})`);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
        {/* 2. Hero Section: Tagline → Circle Showcase → Search → Dynamic Stats */}
        <HeroSection />

        {/* 3. Featured & Frequently Used University Resources */}
        <FeaturedResources resources={mockResources} onDownload={handleDownload} />

        {/* 4. Verified Campus News & Memos */}
        <LatestNews articles={mockNewsArticles} />

        {/* 5. Resursee Productivity Toolbox Preview */}
        <ToolsPreview />
      </main>

      {/* 6. Global Footer */}
      <Footer />

      {/* Download Action Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-dark-surface)] px-4 py-3 text-xs font-medium text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
