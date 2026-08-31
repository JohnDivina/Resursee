'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowsInLineHorizontal,
  CornersOut,
  ArrowsClockwise,
  Crop,
  FilePdf,
  FileArrowDown,
  FileArrowUp,
  ArrowRight,
  Sparkle,
  FileImage,
} from '@phosphor-icons/react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';

// =========================================================================
// Custom Interactive Skeletons for Each Tool (Blue-Only Accent Palette)
// =========================================================================

/** 1. Skeleton: Compress Image (Interactive compression ratio animation) */
const SkeletonCompressImage = () => {
  return (
    <motion.div
      initial={{ opacity: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className="flex flex-col w-full h-full justify-center space-y-2.5 p-2"
    >
      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[var(--color-ink-muted)]">
        <span className="flex items-center gap-1 text-blue-600 dark:text-sky-400">
          <FileImage size={14} weight="bold" /> clearance_photo.png
        </span>
        <span className="text-blue-600 dark:text-sky-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">-88%</span>
      </div>

      <div className="relative h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
        <motion.div
          initial={{ width: '90%' }}
          whileHover={{ width: '22%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-full flex items-center justify-end pr-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-white shadow-xs" />
        </motion.div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
        <span>Original: 4.8 MB</span>
        <span className="font-bold text-blue-600 dark:text-sky-400">Compressed: 580 KB</span>
      </div>
    </motion.div>
  );
};

/** 2. Skeleton: Resize Image (ID Photo & Dimensions Guide) */
const SkeletonResizeImage = () => {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="flex items-center justify-center gap-3 w-full h-full p-2"
    >
      <motion.div
        variants={{
          initial: { scale: 1 },
          hover: { scale: 1.08, borderColor: 'rgba(37, 99, 235, 0.7)' },
        }}
        className="h-20 w-20 rounded-[14px] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 flex flex-col items-center justify-center shadow-xs"
      >
        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-sky-400">2 × 2 in</span>
        <span className="text-[9px] text-[var(--color-ink-muted)]">600×600px</span>
      </motion.div>

      <motion.div
        variants={{
          initial: { scale: 1 },
          hover: { scale: 0.95 },
        }}
        className="h-16 w-16 rounded-[12px] border border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 flex flex-col items-center justify-center"
      >
        <span className="font-mono text-[9px] font-bold text-blue-600 dark:text-sky-400">1 × 1 in</span>
        <span className="text-[8px] text-[var(--color-ink-muted)]">Passport</span>
      </motion.div>
    </motion.div>
  );
};

/** 3. Skeleton: Convert Image (Format Swapping Pills) */
const SkeletonConvertImage = () => {
  return (
    <motion.div
      initial={{ opacity: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center justify-center gap-2 w-full h-full p-2"
    >
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-xs font-bold text-[var(--color-ink)] shadow-xs">
        PNG
      </div>
      <motion.div
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="text-blue-600 dark:text-sky-400"
      >
        <ArrowsClockwise size={18} weight="bold" />
      </motion.div>
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 font-mono text-xs font-bold text-blue-600 dark:text-sky-400 shadow-xs">
        WEBP
      </div>
    </motion.div>
  );
};

/** 4. Skeleton: Crop Image (Interactive Viewfinder Crop Grid) */
const SkeletonCropImage = () => {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="relative w-full h-full flex items-center justify-center p-2"
    >
      <div className="relative h-24 w-36 rounded-[14px] bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden flex items-center justify-center">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div />
        </div>

        <motion.div
          variants={{
            initial: { scale: 1, rotate: 0 },
            hover: { scale: 0.85, rotate: -2 },
          }}
          transition={{ duration: 0.3 }}
          className="relative h-18 w-24 rounded-lg border-2 border-blue-600 bg-blue-500/10 shadow-xs flex items-center justify-center"
        >
          <Crop size={22} className="text-blue-600 dark:text-sky-400" weight="bold" />
        </motion.div>
      </div>
    </motion.div>
  );
};

/** 5. Skeleton: PDF to Image (Extract Pages to PNG/JPG) */
const SkeletonPdfToImage = () => {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="flex items-center justify-center gap-2 w-full h-full p-2"
    >
      {/* PDF Document Source */}
      <div className="h-20 w-16 rounded-[12px] border border-blue-500/40 bg-blue-500/10 flex flex-col items-center justify-center shadow-xs">
        <FilePdf size={24} className="text-blue-600 dark:text-sky-400" weight="fill" />
        <span className="font-mono text-[9px] font-bold text-blue-600 dark:text-sky-400 mt-1">.PDF</span>
      </div>

      <motion.div
        variants={{
          initial: { x: 0 },
          hover: { x: 4 },
        }}
        className="text-blue-600 dark:text-sky-400"
      >
        <ArrowRight size={16} weight="bold" />
      </motion.div>

      {/* Extracted Images Stack */}
      <div className="flex -space-x-4">
        {[1, 2, 3].map((page) => (
          <motion.div
            key={page}
            variants={{
              initial: { y: 0, rotate: 0 },
              hover: { y: -page * 2, rotate: (page - 2) * 4 },
            }}
            className="h-20 w-16 rounded-[12px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md flex flex-col items-center justify-center"
          >
            <FileImage size={18} className="text-blue-600 dark:text-sky-400" weight="bold" />
            <span className="font-mono text-[8px] text-[var(--color-ink-muted)] mt-1">P.{page}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

/** 6. Skeleton: Image to PDF (Merge Slips to Document) */
const SkeletonImageToPdf = () => {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="flex items-center justify-center gap-3 w-full h-full p-2"
    >
      {/* Scattered Images */}
      <div className="flex -space-x-3">
        <motion.div
          variants={{
            initial: { rotate: -6 },
            hover: { rotate: 0, x: 2 },
          }}
          className="h-16 w-14 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shadow-xs text-blue-600 dark:text-sky-400 font-mono text-[10px] font-bold"
        >
          IMG 1
        </motion.div>
        <motion.div
          variants={{
            initial: { rotate: 6 },
            hover: { rotate: 0, x: -2 },
          }}
          className="h-16 w-14 rounded-lg bg-blue-600/15 border border-blue-600/30 flex items-center justify-center shadow-xs text-blue-600 dark:text-sky-400 font-mono text-[10px] font-bold"
        >
          IMG 2
        </motion.div>
      </div>

      <span className="text-blue-600 dark:text-sky-400 font-bold">+</span>

      {/* Compiled Unified PDF File */}
      <motion.div
        variants={{
          initial: { scale: 1 },
          hover: { scale: 1.08, borderColor: '#2563eb' },
        }}
        className="h-20 w-16 rounded-[14px] bg-blue-600 text-white shadow-lg flex flex-col items-center justify-center p-1.5"
      >
        <FilePdf size={22} weight="fill" />
        <span className="font-mono text-[8px] font-bold uppercase mt-1 tracking-wider">Merged</span>
      </motion.div>
    </motion.div>
  );
};

// =========================================================================
// Bento Grid Tools Preview (Blue-Only Accent)
// =========================================================================

export default function ToolsPreview() {
  const bentoItems = [
    {
      title: 'Compress Image',
      description: 'Reduce file size by up to 90% for university portal submissions with zero visual quality loss.',
      header: <SkeletonCompressImage />,
      className: 'md:col-span-2',
      icon: <ArrowsInLineHorizontal size={18} weight="bold" className="text-blue-600 dark:text-sky-400" />,
      href: '/tools/compress-image',
    },
    {
      title: 'Resize Image',
      description: 'Scale photos to standard 2×2, 1×1 passport ID dimensions or custom pixel specifications.',
      header: <SkeletonResizeImage />,
      className: 'md:col-span-1',
      icon: <CornersOut size={18} weight="bold" className="text-blue-600 dark:text-sky-400" />,
      href: '/tools/resize-image',
    },
    {
      title: 'Convert Image',
      description: 'Convert between PNG, JPG, and modern WebP formats in milliseconds directly in browser.',
      header: <SkeletonConvertImage />,
      className: 'md:col-span-1',
      icon: <ArrowsClockwise size={18} weight="bold" className="text-blue-600 dark:text-sky-400" />,
      href: '/tools/convert-image',
    },
    {
      title: 'Crop Image',
      description: 'Interactive canvas crop tool with standard ID photo aspect ratios and pan controls.',
      header: <SkeletonCropImage />,
      className: 'md:col-span-1',
      icon: <Crop size={18} weight="bold" className="text-blue-600 dark:text-sky-400" />,
      href: '/tools/crop-image',
    },
    {
      title: 'PDF to Image',
      description: 'Extract crisp high-resolution PNG or JPG pages directly from multi-page PDF documents.',
      header: <SkeletonPdfToImage />,
      className: 'md:col-span-1',
      icon: <FileArrowDown size={18} weight="bold" className="text-blue-600 dark:text-sky-400" />,
      href: '/tools/pdf-to-image',
    },
    {
      title: 'Image to PDF',
      description: 'Combine scanned clearance slips, IDs, and certificates into a single unified PDF.',
      header: <SkeletonImageToPdf />,
      className: 'md:col-span-2',
      icon: <FileArrowUp size={18} weight="bold" className="text-blue-600 dark:text-sky-400" />,
      href: '/tools/image-to-pdf',
    },
  ];

  return (
    <section className="border-t border-[var(--color-rule-subtle)] bg-transparent py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-sky-400 mb-2">
              <Sparkle size={13} weight="fill" />
              <span>Resursee Productivity Toolbox</span>
            </div>
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

        {/* Aceternity Bento Box Grid Style */}
        <BentoGrid className="max-w-7xl mx-auto md:auto-rows-[19rem]">
          {bentoItems.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={cn('[&>p:text-lg]', item.className)}
              icon={item.icon}
              href={item.href}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
