'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  CaretLeft,
  CaretRight,
  X,
  Sparkle,
  ArrowRight,
  Buildings,
} from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { mockResources } from '@/lib/mockData';
import { useRealtimeDownloadCount } from '@/lib/downloadStore';
import { OrgLogo } from '@/components/ui/OrgLogo';

interface ResourceShowcaseProps {
  resources?: Resource[];
}

function ShowcaseCardItem({ item }: { item: Resource }) {
  const realtimeDownloads = useRealtimeDownloadCount(item.id, item.download_count);
  const officeName = item.department?.name || item.source_name || 'Academic Affairs';

  return (
    <Link
      href={`/resources/${item.slug}`}
      data-thock="card"
      className="group flex flex-col gap-3.5 rounded-[18px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper)] p-4 sm:p-5 transition-all hover:border-[var(--color-rule-strong)] block"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white dark:bg-slate-900 border border-[var(--color-rule)] p-0.5 shadow-2xs">
            <OrgLogo
              sourceName={item.source_name}
              departmentName={item.department?.name}
              title={item.title}
              size={18}
              className="h-4.5 w-4.5 object-contain"
            />
          </div>
          <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-sky-400 border border-blue-500/20">
            {item.file_format}
          </span>
          <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5 font-mono text-[10px] text-[var(--color-ink-muted)]">
            v{item.current_version}
          </span>
        </div>

        <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">
          {realtimeDownloads} downloads
        </span>
      </div>

      <h4 className="text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors tracking-tight line-clamp-2">
        {item.title}
      </h4>

      <div className="flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-3 text-xs">
        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-ink-secondary)] truncate max-w-[280px]">
          <Buildings size={13} className="text-[var(--color-primary)] shrink-0" />
          <span className="truncate">{officeName}</span>
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-[var(--color-primary)] group-hover:underline">
          <span>Open document</span>
          <ArrowRight size={13} weight="bold" />
        </span>
      </div>
    </Link>
  );
}

export default function ResourceShowcase({
  resources = mockResources,
}: ResourceShowcaseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const showcaseRef = useRef<HTMLDivElement>(null);

  const previewItems = resources.slice(0, 6);

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % previewItems.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, previewItems.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % previewItems.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + previewItems.length) % previewItems.length);
  };

  return (
    <div
      ref={showcaseRef}
      className="relative mx-auto my-6 flex flex-col items-center justify-center transition-all"
    >
      {/* 1. Initial State: The Interactive Circle Button */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse resource preview' : 'Preview documents'}
          className={`group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 hover:border-[var(--color-primary)] hover:shadow-[0_0_24px_var(--color-primary-glow)] hover:scale-105 active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            isOpen
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
              : ''
          }`}
        >
          {!isOpen && (
            <span className="pointer-events-none absolute inset-0 -m-1 rounded-full border border-[var(--color-primary)]/25 animate-ping opacity-75" />
          )}

          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X size={20} weight="bold" className="transition-transform rotate-0 group-hover:rotate-90 duration-200" />
            ) : (
              <div className="relative flex items-center justify-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] transition-transform group-hover:scale-110">
                  <span className="text-sm select-none">🦦</span>
                </div>
                <Sparkle
                  size={12}
                  weight="fill"
                  className="absolute -top-1 -right-1 text-amber-500 animate-pulse"
                />
              </div>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <span>{isOpen ? 'Close preview' : 'Quick document showcase'}</span>
          <span className="text-[10px] text-[var(--color-primary)]">{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* 2. Expanded State: Animated Resource Carousel Showcase */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, height: 'auto', scale: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl overflow-hidden pt-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md">
              {/* Carousel Header & Controls */}
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Document Showcase · {currentIndex + 1} of {previewItems.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition-colors"
                    aria-label="Previous document"
                  >
                    <CaretLeft size={14} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition-colors"
                    aria-label="Next document"
                  >
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Active Document Card Item */}
              <div className="py-3">
                <AnimatePresence mode="wait">
                  {previewItems[currentIndex] && (
                    <motion.div
                      key={previewItems[currentIndex].id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      <ShowcaseCardItem item={previewItems[currentIndex]} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress Dots Indicator */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {previewItems.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'w-6 bg-[var(--color-primary)]'
                        : 'w-1.5 bg-[var(--color-rule-strong)] hover:bg-[var(--color-ink-muted)]'
                    }`}
                    aria-label={`Jump to document ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
