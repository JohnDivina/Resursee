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
} from '@phosphor-icons/react';

interface ToolItem {
  id: string;
  name: string;
  category: 'Image' | 'PDF' | 'Document';
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
}

export default function ToolsPreview() {
  const tools: ToolItem[] = [
    {
      id: 'compress-image',
      name: 'Compress Image',
      category: 'Image',
      description: 'Reduce file size for university portal submissions while preserving clarity.',
      icon: <ArrowsInLineHorizontal size={24} className="text-white" weight="bold" />,
      iconBg: 'bg-blue-600',
      href: '/tools/compress-image',
    },
    {
      id: 'resize-image',
      name: 'Resize Image',
      category: 'Image',
      description: 'Scale photos to standard 2x2, 1x1 ID dimensions or custom pixel limits.',
      icon: <CornersOut size={24} className="text-white" weight="bold" />,
      iconBg: 'bg-indigo-600',
      href: '/tools/resize-image',
    },
    {
      id: 'convert-image',
      name: 'Convert Image',
      category: 'Image',
      description: 'Convert between PNG, JPG, and modern WebP formats in milliseconds.',
      icon: <ArrowsClockwise size={24} className="text-white" weight="bold" />,
      iconBg: 'bg-emerald-600',
      href: '/tools/convert-image',
    },
    {
      id: 'crop-image',
      name: 'Crop Image',
      category: 'Image',
      description: 'Precision crop photos to strict institutional aspect ratios.',
      icon: <Crop size={24} className="text-white" weight="bold" />,
      iconBg: 'bg-amber-500',
      href: '/tools/crop-image',
    },
    {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      category: 'PDF',
      description: 'Extract high-resolution PNG or JPG pages directly from PDF documents.',
      icon: <FileArrowDown size={24} className="text-white" weight="bold" />,
      iconBg: 'bg-rose-500',
      href: '/tools/pdf-to-image',
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF',
      category: 'PDF',
      description: 'Combine scanned clearance slips, IDs, and certificates into a single PDF.',
      icon: <FileArrowUp size={24} className="text-white" weight="bold" />,
      iconBg: 'bg-sky-500',
      href: '/tools/image-to-pdf',
    },
  ];

  return (
    <section className="border-t border-[var(--color-rule-subtle)] bg-[var(--color-paper)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
                Productivity Suite
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 font-mono text-[9.5px] font-bold text-emerald-700 border border-emerald-500/20">
                <ShieldCheck size={12} weight="bold" />
                <span>100% Client-Side · Zero Uploads</span>
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Tools for getting things done.
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Browser-based file utilities engineered for student and faculty paperwork. Files are processed locally on your device with complete privacy.
            </p>
          </div>

          <Link
            href="/tools"
            className="group flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline shrink-0"
          >
            <span>View all productivity tools</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 6-Tool Grid (Apple Squircle Solid White Cards) */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col justify-between rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between">
                  {/* Squircle App Icon Badge */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${tool.iconBg} shadow-xs transition-transform group-hover:scale-105`}>
                    {tool.icon}
                  </div>
                  <span className="rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-semibold text-xs text-[var(--color-ink-secondary)]">
                    {tool.category}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
                  {tool.name}
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)] line-clamp-2">
                  {tool.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-3.5 text-xs font-semibold text-[var(--color-ink-secondary)]">
                <span className="font-mono text-[11px] text-emerald-600 font-bold">100% In-Browser</span>
                <div className="flex items-center gap-1 text-[var(--color-primary)] font-bold">
                  <span>Open Tool</span>
                  <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
