'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import AppsSection from '@/components/home/AppsSection';
import DesktopDownloadSection from '@/components/home/DesktopDownloadSection';
import ToolsPreview from '@/components/home/ToolsPreview';
import CommandPalette from '@/components/search/CommandPalette';
import { CheckCircle } from '@phosphor-icons/react';

export default function HomePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {/* 1. Minimal Header */}
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />

      {/* Global ⌘K Command Search Overlay */}
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
      />

      <main className="flex-1">
        {/* 2. Hero Section: Personal Platform Tagline & Quick Search */}
        <HeroSection />

        {/* 3. Integrated Full-Stack & AI Applications Suite */}
        <AppsSection />

        {/* 4. Native Desktop App Download Section (macOS, Windows, Linux) */}
        <DesktopDownloadSection />

        {/* 5. Resursee Client-Side Productivity Toolbox (Aceternity Bento Grid) */}
        <ToolsPreview />
      </main>

      {/* 5. Global Footer */}
      <Footer />

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
