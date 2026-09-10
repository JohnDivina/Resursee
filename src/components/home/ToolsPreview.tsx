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
  Files,
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
        <span className="flex items-center gap-1 text-blue-600 dark:text-white">
          <FileImage size={14} weight="bold" /> clearance_photo.png
        </span>
        <span className="font-mono text-[11px] font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded-full">-88%</span>
      </div>

      <div className="relative h-4 w-full bg-slate-200 dark:bg-[#181818] rounded-full overflow-hidden p-0.5">
        <motion.div
          initial={{ width: '90%' }}
          whileHover={{ width: '22%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-blue-700 to-blue-500 dark:from-neutral-400 dark:to-white rounded-full flex items-center justify-end pr-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-white shadow-xs" />
        </motion.div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
        <span>Original: 4.8 MB</span>
        <span className="font-bold text-blue-600 dark:text-white">Compressed: 580 KB</span>
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
        className="h-20 w-20 rounded-[14px] border-2 border-dashed border-slate-300 dark:border-neutral-800 bg-white/70 dark:bg-[#0f0f0f]/80 flex flex-col items-center justify-center shadow-xs"
      >
        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-white">2 × 2 in</span>
        <span className="text-[9px] text-[var(--color-ink-muted)]">600×600px</span>
      </motion.div>

      <motion.div
        variants={{
          initial: { scale: 1 },
          hover: { scale: 0.95 },
        }}
        className="h-16 w-16 rounded-[12px] border border-slate-300 dark:border-neutral-800 bg-slate-100/60 dark:bg-[#181818]/80 flex flex-col items-center justify-center"
      >
        <span className="font-mono text-[9px] font-bold text-blue-600 dark:text-white">1 × 1 in</span>
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
      <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f] px-3 py-2 font-mono text-xs font-bold text-[var(--color-ink)] shadow-xs">
        PNG
      </div>
      <motion.div
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="text-blue-600 dark:text-white"
      >
        <ArrowsClockwise size={18} weight="bold" />
      </motion.div>
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200 shadow-xs">
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
      <div className="relative h-24 w-36 rounded-[14px] bg-slate-200/70 dark:bg-[#141414] overflow-hidden flex items-center justify-center">
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
          className="relative h-18 w-24 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shadow-xs flex items-center justify-center text-neutral-800 dark:text-neutral-200"
        >
          <Crop size={22} weight="bold" />
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
      <div className="h-20 w-16 rounded-[12px] border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center shadow-xs text-neutral-800 dark:text-neutral-200">
        <FilePdf size={24} weight="fill" />
        <span className="font-mono text-[9px] font-bold mt-1">.PDF</span>
      </div>

      <motion.div
        variants={{
          initial: { x: 0 },
          hover: { x: 4 },
        }}
        className="text-blue-600 dark:text-white"
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
            className="h-20 w-16 rounded-[12px] border border-slate-300 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f] shadow-md flex flex-col items-center justify-center"
          >
            <FileImage size={18} className="text-blue-600 dark:text-white" weight="bold" />
            <span className="font-mono text-[8px] text-[var(--color-ink-muted)] mt-1">P.{page}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

/** 6. Skeleton: Merge PDF (Merge Multiple PDFs into a Unified File) */
const SkeletonMergePdf = () => {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="flex items-center justify-center gap-3 w-full h-full p-2"
    >
      {/* Scattered Source PDFs */}
      <div className="flex -space-x-3">
        <motion.div
          variants={{
            initial: { rotate: -6 },
            hover: { rotate: 0, x: 2 },
          }}
          className="h-16 w-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center shadow-xs text-neutral-800 dark:text-neutral-200 font-mono text-[10px] font-bold"
        >
          <FilePdf size={18} weight="fill" />
          <span className="text-[8px] mt-0.5">PDF 1</span>
        </motion.div>
        <motion.div
          variants={{
            initial: { rotate: 6 },
            hover: { rotate: 0, x: -2 },
          }}
          className="h-16 w-14 rounded-lg bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center shadow-xs text-neutral-800 dark:text-neutral-200 font-mono text-[10px] font-bold"
        >
          <FilePdf size={18} weight="fill" />
          <span className="text-[8px] mt-0.5">PDF 2</span>
        </motion.div>
      </div>

      <span className="text-blue-600 dark:text-white font-bold text-sm">+</span>

      {/* Compiled Unified PDF File */}
      <motion.div
        variants={{
          initial: { scale: 1 },
          hover: { scale: 1.08, borderColor: '#2563eb' },
        }}
        className="h-20 w-16 rounded-[14px] bg-blue-600 dark:bg-white text-white dark:text-black shadow-lg flex flex-col items-center justify-center p-1.5"
      >
        <Files size={22} weight="fill" />
        <span className="font-mono text-[8px] font-bold uppercase mt-1 tracking-wider">Merged</span>
      </motion.div>
    </motion.div>
  );
};

/** 7. Skeleton: Image to PDF (Convert Photo & Scan to PDF Document) */
const SkeletonImageToPdf = () => {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="flex items-center justify-center gap-3 w-full h-full p-2"
    >
      {/* Source Photo / Scan Card */}
      <motion.div
        variants={{
          initial: { rotate: -4, scale: 1 },
          hover: { rotate: 0, scale: 1.05 },
        }}
        transition={{ duration: 0.3 }}
        className="relative h-20 w-16 rounded-[13px] border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#0f0f0f] p-1.5 shadow-sm flex flex-col justify-between"
      >
        {/* Photo Viewfinder Mini Thumbnail */}
        <div className="h-11 w-full rounded-[8px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 overflow-hidden relative text-neutral-800 dark:text-neutral-200">
          <FileImage size={20} weight="bold" />
          <span className="absolute bottom-0.5 right-1 text-[6.5px] font-mono font-bold text-neutral-800 dark:text-neutral-200">
            .JPG
          </span>
        </div>
        <div className="flex items-center justify-between px-0.5 font-mono text-[7px] text-[var(--color-ink-muted)]">
          <span>photo</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-bold">300dpi</span>
        </div>
      </motion.div>

      {/* Conversion Arrow */}
      <motion.div
        variants={{
          initial: { x: 0 },
          hover: { x: 3 },
        }}
        transition={{ duration: 0.3 }}
        className="text-blue-600 dark:text-white"
      >
        <ArrowRight size={15} weight="bold" />
      </motion.div>

      {/* Converted PDF Page Document */}
      <motion.div
        variants={{
          initial: { rotate: 2, scale: 1 },
          hover: { rotate: 0, scale: 1.05, borderColor: '#525252' },
        }}
        transition={{ duration: 0.3 }}
        className="relative h-22 w-16 rounded-[13px] border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1.5 shadow-sm flex flex-col items-center justify-between"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black shadow-2xs mt-1">
          <FilePdf size={12} weight="fill" />
        </div>

        <div className="w-full space-y-1 px-1">
          <div className="h-1 w-full bg-neutral-300 dark:bg-neutral-600 rounded-full" />
          <div className="h-1 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        </div>

        <span className="font-mono text-[7.5px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-0.5">
          PDF Page
        </span>
      </motion.div>
    </motion.div>
  );
};

// =========================================================================
// Bento Grid Tools Preview
// =========================================================================

export default function ToolsPreview() {
  const bentoItems = [
    {
      title: 'Compress Image',
      description: 'Reduce file size by up to 90% for university portal submissions with zero visual quality loss.',
      header: <SkeletonCompressImage />,
      className: 'md:col-span-2 lg:col-span-2',
      icon: <ArrowsInLineHorizontal size={18} weight="bold" className="text-blue-600 dark:text-white" />,
      href: '/tools/compress-image',
    },
    {
      title: 'Resize Image',
      description: 'Scale photos to standard 2×2, 1×1 passport ID dimensions or custom pixel specifications.',
      header: <SkeletonResizeImage />,
      className: 'md:col-span-1 lg:col-span-1',
      icon: <CornersOut size={18} weight="bold" className="text-blue-600 dark:text-white" />,
      href: '/tools/resize-image',
    },
    {
      title: 'Convert Image',
      description: 'Convert between PNG, JPG, and modern WebP formats in milliseconds directly in browser.',
      header: <SkeletonConvertImage />,
      className: 'md:col-span-1 lg:col-span-1',
      icon: <ArrowsClockwise size={18} weight="bold" className="text-blue-600 dark:text-white" />,
      href: '/tools/convert-image',
    },
    {
      title: 'Crop Image',
      description: 'Interactive canvas crop tool with standard ID photo aspect ratios and pan controls.',
      header: <SkeletonCropImage />,
      className: 'md:col-span-1 lg:col-span-1',
      icon: <Crop size={18} weight="bold" className="text-blue-600 dark:text-white" />,
      href: '/tools/crop-image',
    },
    {
      title: 'PDF to Image',
      description: 'Extract crisp high-resolution PNG or JPG pages directly from multi-page PDF documents.',
      header: <SkeletonPdfToImage />,
      className: 'md:col-span-1 lg:col-span-1',
      icon: <FileArrowDown size={18} weight="bold" className="text-blue-600 dark:text-white" />,
      href: '/tools/pdf-to-image',
    },
    {
      title: 'Merge PDF',
      description: 'Combine multiple PDF documents, syllabi, or clearances into a single organized file with custom ordering.',
      header: <SkeletonMergePdf />,
      className: 'md:col-span-2 lg:col-span-2',
      icon: <Files size={18} weight="bold" className="text-blue-600 dark:text-white" />,
      href: '/tools/merge-pdf',
    },
    {
      title: 'Image to PDF',
      description: 'Combine scanned clearance slips, IDs, and certificates into a single unified PDF.',
      header: <SkeletonImageToPdf />,
      className: 'md:col-span-2 lg:col-span-1',
      icon: <FileArrowUp size={18} weight="bold" className="text-blue-600 dark:text-white" />,
      href: '/tools/image-to-pdf',
    },
  ];

  return (
    <section className="border-t border-[var(--color-rule-subtle)] bg-transparent py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
            Tools for getting things done.
          </h2>
        </div>

        {/* Aceternity Bento Box Grid Style */}
        <BentoGrid className="max-w-7xl mx-auto auto-rows-auto lg:auto-rows-[19rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
