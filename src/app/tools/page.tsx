'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import {
  ArrowsInLineHorizontal,
  CornersOut,
  ArrowsClockwise,
  Crop,
  FileArrowDown,
  FileArrowUp,
  HouseLine,
} from '@phosphor-icons/react';

export default function ToolsPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);

  const tools = [
    {
      id: 'compress-image',
      name: 'Compress Image',
      category: 'Image',
      description: 'Lossless & high-compression engine to reduce image file size for student portal forms.',
      icon: <ArrowsInLineHorizontal size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-blue-600',
      href: '/tools/compress-image',
    },
    {
      id: 'resize-image',
      name: 'Resize Image',
      category: 'Image',
      description: 'Scale photos to standard 2x2, 1x1 passport dimensions or custom pixel specifications.',
      icon: <CornersOut size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-indigo-600',
      href: '/tools/resize-image',
    },
    {
      id: 'convert-image',
      name: 'Convert Image',
      category: 'Image',
      description: 'Convert between PNG, JPG, and WebP formats instantly with client-side canvas.',
      icon: <ArrowsClockwise size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-emerald-600',
      href: '/tools/convert-image',
    },
    {
      id: 'crop-image',
      name: 'Crop Image',
      category: 'Image',
      description: 'Interactive canvas crop tool with standard ID photo frames and pan controls.',
      icon: <Crop size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-amber-500',
      href: '/tools/crop-image',
    },
    {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      category: 'PDF',
      description: 'Render and extract high-resolution image pages directly from multi-page PDF documents.',
      icon: <FileArrowDown size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-rose-500',
      href: '/tools/pdf-to-image',
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF',
      category: 'PDF',
      description: 'Merge multiple image scans, receipts, or clearance slips into a unified clean PDF.',
      icon: <FileArrowUp size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-sky-500',
      href: '/tools/image-to-pdf',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      {/* Header */}
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        resources={mockResources}
      />

      <main className="flex-1">
        {/* Top Banner */}
        <section className="border-b border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)] mb-3">
              <Link href="/" className="flex items-center gap-1 hover:text-[var(--color-primary)]">
                <HouseLine size={14} />
                <span>Home</span>
              </Link>
              <span>/</span>
              <span className="font-semibold text-[var(--color-ink)]">Productivity Tools</span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
                Productivity Tools
              </h1>
            </div>
          </div>
        </section>

        {/* Tools Catalog (Apple Squircle Solid White Cards) */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  data-thock="card"
                  className="group flex min-h-[220px] sm:min-h-[240px] flex-col justify-between rounded-[26px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-7 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2 hover:border-[var(--color-rule-strong)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`flex h-13 w-13 items-center justify-center rounded-[18px] ${tool.iconBg} shadow-xs transition-transform duration-300 ease-out group-hover:scale-110`}>
                        {tool.icon}
                      </div>
                      <span className="rounded-full bg-[var(--color-paper-muted)] px-3.5 py-1.5 font-semibold text-xs text-[var(--color-ink-secondary)]">
                        {tool.category}
                      </span>
                    </div>

                    <h2 className="mt-5 text-lg sm:text-xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors duration-200 tracking-tight">
                      {tool.name}
                    </h2>

                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-ink-muted)] line-clamp-3">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
