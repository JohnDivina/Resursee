'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import AppsSection from '@/components/home/AppsSection';
import ToolsPreview from '@/components/home/ToolsPreview';
import CommandPalette from '@/components/search/CommandPalette';
import { CheckCircle } from '@phosphor-icons/react';
import { WavyBackground } from '@/components/ui/wavy-background';

export default function HomePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <WavyBackground
      isFixed={true}
      colors={['#2563eb', '#38bdf8', '#1d4ed8', '#0284c7', '#60a5fa']}
      waveOpacity={0.32}
      blur={10}
      speed="fast"
      containerClassName="min-h-screen bg-[var(--color-paper)]"
    >
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

        {/* 4. Resursee Client-Side Productivity Toolbox (Aceternity Bento Grid) */}
        <ToolsPreview />
      </main>

      {/* 5. Global Footer */}
      <Footer />

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </WavyBackground>
  );
}
