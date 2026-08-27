'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowsInLineHorizontal,
  CornersOut,
  ArrowsClockwise,
  Crop,
  FilePdf,
  FileArrowDown,
  FileArrowUp,
  ShieldCheck,
  ArrowRight,
  Lightning,
} from '@phosphor-icons/react';

interface ToolItem {
  id: string;
  name: string;
  category: 'Image' | 'PDF' | 'Document';
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function ToolsPreview() {
  const tools: ToolItem[] = [
    {
      id: 'compress-image',
      name: 'Compress Image',
      category: 'Image',
      description: 'Reduce file size for university portal submissions while preserving clarity.',
      icon: <ArrowsInLineHorizontal size={22} className="text-[var(--color-primary)]" />,
      href: '/tools',
    },
    {
      id: 'resize-image',
      name: 'Resize Image',
      category: 'Image',
      description: 'Scale photos to standard 2x2, 1x1 ID dimensions or custom pixel limits.',
      icon: <CornersOut size={22} className="text-indigo-600" />,
      href: '/tools',
    },
    {
      id: 'convert-image',
      name: 'Convert Image',
      category: 'Image',
      description: 'Convert between PNG, JPG, and modern WebP formats in milliseconds.',
      icon: <ArrowsClockwise size={22} className="text-emerald-600" />,
      href: '/tools',
    },
    {
      id: 'crop-image',
      name: 'Crop Image',
      category: 'Image',
      description: 'Precision crop photos to strict institutional aspect ratios.',
      icon: <Crop size={22} className="text-amber-600" />,
      href: '/tools',
    },
    {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      category: 'PDF',
      description: 'Extract high-resolution PNG or JPG pages directly from PDF documents.',
      icon: <FileArrowDown size={22} className="text-rose-600" />,
      href: '/tools',
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF',
      category: 'PDF',
      description: 'Combine scanned clearance slips, IDs, and certificates into a single PDF.',
      icon: <FileArrowUp size={22} className="text-sky-600" />,
      href: '/tools',
    },
  ];

  return (
    <section className="border-t border-[var(--color-rule)] bg-[var(--color-paper-surface)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                Productivity Suite
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 font-mono text-[9.5px] font-bold text-emerald-700 border border-emerald-500/20">
                <ShieldCheck size={12} weight="bold" />
                <span>100% Client-Side · Zero Uploads</span>
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Tools for getting things done.
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Browser-based file utilities engineered for student and faculty workflows. Files are processed locally on your device with complete privacy.
            </p>
          </div>

          <Link
            href="/tools"
            className="group flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline shrink-0"
          >
            <span>View all productivity tools</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 6-Tool Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-surface)] hover:shadow-md hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-surface)] shadow-2xs group-hover:border-[var(--color-primary-subtle)] group-hover:bg-[var(--color-paper-card)]">
                    {tool.icon}
                  </div>
                  <span className="rounded-full bg-[var(--color-paper-muted)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]">
                    {tool.category}
                  </span>
                </div>

                <h3 className="mt-3.5 font-display text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors">
                  {tool.name}
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)] line-clamp-2">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-3 text-[11px] font-medium text-[var(--color-ink-secondary)]">
                <span className="font-mono text-[10.5px] text-emerald-700">Runs in browser</span>
                <ArrowRight size={13} className="text-[var(--color-primary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
