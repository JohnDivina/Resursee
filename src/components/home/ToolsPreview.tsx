'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowsInLineHorizontal,
  CornersOut,
  ArrowsClockwise,
  Crop,
  FileArrowDown,
  FileArrowUp,
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
      description: 'Reduce file size for university portal submissions while preserving crisp visual clarity.',
      icon: <ArrowsInLineHorizontal size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-blue-600',
      href: '/tools/compress-image',
    },
    {
      id: 'resize-image',
      name: 'Resize Image',
      category: 'Image',
      description: 'Scale photos to standard 2x2, 1x1 ID dimensions or custom pixel specifications.',
      icon: <CornersOut size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-indigo-600',
      href: '/tools/resize-image',
    },
    {
      id: 'convert-image',
      name: 'Convert Image',
      category: 'Image',
      description: 'Convert between PNG, JPG, and modern WebP formats instantly with client-side canvas.',
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
      description: 'Extract high-resolution PNG or JPG pages directly from PDF documents.',
      icon: <FileArrowDown size={26} className="text-white" weight="bold" />,
      iconBg: 'bg-rose-500',
      href: '/tools/pdf-to-image',
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF',
      category: 'PDF',
      description: 'Combine scanned clearance slips, IDs, and certificates into a single unified PDF.',
      icon: <FileArrowUp size={26} className="text-white" weight="bold" />,
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
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Tools for getting things done.
            </h2>
          </div>

          <Link
            href="/tools"
            className="group flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline shrink-0"
          >
            <span>View all productivity tools</span>
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 6-Tool Grid (Apple Squircle Solid White Cards with Smooth Hover) */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              data-thock="card"
              className="group relative flex min-h-[220px] sm:min-h-[240px] flex-col justify-between rounded-[26px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-7 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2 hover:border-[var(--color-primary)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  {/* Squircle App Icon Badge */}
                  <div className={`flex h-13 w-13 items-center justify-center rounded-[18px] ${tool.iconBg} shadow-xs transition-transform duration-300 ease-out group-hover:scale-110`}>
                    {tool.icon}
                  </div>
                  <span className="rounded-full bg-[var(--color-paper-muted)] px-3.5 py-1.5 font-semibold text-xs text-[var(--color-ink-secondary)]">
                    {tool.category}
                  </span>
                </div>

                <h3 className="mt-5 text-lg sm:text-xl font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors duration-200 tracking-tight">
                  {tool.name}
                </h3>

                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-ink-muted)] line-clamp-3">
                  {tool.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
