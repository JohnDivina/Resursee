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
  FilePdf,
  FileArrowDown,
  FileArrowUp,
  ShieldCheck,
  HouseLine,
  ArrowRight,
  Sparkle,
  LockKey,
} from '@phosphor-icons/react';

export default function ToolsPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);

  const tools = [
    {
      id: 'compress-image',
      name: 'Compress Image',
      category: 'Image Tools',
      description: 'Lossless & high-compression engine to reduce image file size for student portal forms.',
      icon: <ArrowsInLineHorizontal size={26} className="text-[var(--color-primary)]" />,
      href: '/tools/compress-image',
      status: 'Live',
    },
    {
      id: 'resize-image',
      name: 'Resize Image',
      category: 'Image Tools',
      description: 'Scale photos to standard 2x2, 1x1 passport dimensions or custom pixel specifications.',
      icon: <CornersOut size={26} className="text-indigo-600" />,
      href: '/tools/resize-image',
      status: 'Live',
    },
    {
      id: 'convert-image',
      name: 'Convert Image',
      category: 'Image Tools',
      description: 'Convert between PNG, JPG, and WebP formats instantly with client-side canvas.',
      icon: <ArrowsClockwise size={26} className="text-emerald-600" />,
      href: '/tools/convert-image',
      status: 'Live',
    },
    {
      id: 'crop-image',
      name: 'Crop Image',
      category: 'Image Tools',
      description: 'Interactive canvas crop tool with standard ID photo frames and pan controls.',
      icon: <Crop size={26} className="text-amber-600" />,
      href: '/tools/crop-image',
      status: 'Live',
    },
    {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      category: 'PDF Tools',
      description: 'Render and extract high-resolution image pages directly from multi-page PDF documents.',
      icon: <FileArrowDown size={26} className="text-rose-600" />,
      href: '/tools/pdf-to-image',
      status: 'Live',
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF',
      category: 'PDF Tools',
      description: 'Merge multiple image scans, receipts, or clearance slips into a unified clean PDF.',
      icon: <FileArrowUp size={26} className="text-sky-600" />,
      href: '/tools/image-to-pdf',
      status: 'Live',
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
        <section className="border-b border-[var(--color-rule)] bg-[var(--color-paper-surface)] py-12 sm:py-16">
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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 border border-emerald-500/20 mb-3">
                <LockKey size={12} weight="bold" />
                <span>Zero Server Uploads · Runs 100% in your Browser</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
                Resursee Productivity Toolbox
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-muted)] leading-relaxed">
                Essential browser utilities built specifically for university paperwork workflows. Prepare your photos, convert documents, and assemble PDF submissions securely without leaving Resursee.
              </p>
            </div>
          </div>
        </section>

        {/* Tools Catalog */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="group flex flex-col justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs transition-all hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-surface)] group-hover:border-[var(--color-primary-subtle)] group-hover:bg-[var(--color-paper-card)] shadow-2xs">
                        {tool.icon}
                      </div>
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                        {tool.status}
                      </span>
                    </div>

                    <span className="mt-4 block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      {tool.category}
                    </span>

                    <Link href={tool.href}>
                      <h2 className="mt-1 font-display text-lg font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors">
                        {tool.name}
                      </h2>
                    </Link>

                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-[var(--color-rule-subtle)] pt-4 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                      Client-side engine
                    </span>
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all"
                    >
                      <span>Launch Tool</span>
                      <ArrowRight size={13} weight="bold" />
                    </Link>
                  </div>
                </div>
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
