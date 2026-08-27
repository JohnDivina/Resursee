'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DownloadSimple,
  CaretUp,
  Buildings,
  CheckCircle,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import { Resource } from '@/types/database';

interface ResourceCardProps {
  resource: Resource;
  onDownload?: (resource: Resource) => void;
}

export default function ResourceCard({ resource, onDownload }: ResourceCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);

    if (onDownload) {
      onDownload(resource);
    }

    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    }, 600);
  };

  // Get initial representation
  const firstLetter = resource.title.trim().charAt(0).toUpperCase();

  return (
    <div className="group relative flex flex-col justify-between rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] hover:-translate-y-0.5">
      {/* Top Header: Squircle Icon Badge & Upvote/Download Pill */}
      <div>
        <div className="flex items-start justify-between">
          {/* iOS Squircle Icon Badge */}
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--color-primary)] text-white font-bold text-lg shadow-xs transition-transform group-hover:scale-105 select-none">
            {resource.file_format === 'PDF' ? (
              <span className="font-extrabold text-base">P</span>
            ) : resource.file_format === 'DOCX' ? (
              <span className="font-extrabold text-base">W</span>
            ) : resource.file_format === 'XLSX' ? (
              <span className="font-extrabold text-base">X</span>
            ) : (
              <span>{firstLetter}</span>
            )}
          </div>

          {/* Upvote / Download Stat Indicator (Apple Style) */}
          <div className="flex flex-col items-center">
            <CaretUp size={15} weight="fill" className="text-emerald-600" />
            <span className="font-mono text-xs font-bold text-[var(--color-ink)]">
              {resource.download_count + (downloaded ? 1 : 0)}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link
          href={`/resources/${resource.slug}`}
          className="block mt-4 group-hover:text-[var(--color-primary)] transition-colors"
        >
          <h3 className="text-base sm:text-lg font-bold leading-snug text-[var(--color-ink)] tracking-tight line-clamp-2">
            {resource.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] leading-relaxed line-clamp-2">
          {resource.description || 'Verified university document.'}
        </p>
      </div>

      {/* Bottom Row: Category Pill & Details / Download */}
      <div className="mt-5 pt-3.5 border-t border-[var(--color-rule-subtle)] flex items-center justify-between gap-2">
        {/* Category Pill */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-semibold text-xs text-[var(--color-ink-secondary)] truncate">
            {resource.category?.name || 'General'}
          </span>
          <span className="hidden sm:inline rounded-full bg-[var(--color-paper-muted)] px-2.5 py-1 font-mono text-[10.5px] text-[var(--color-ink-muted)]">
            {resource.department?.abbreviation || 'UNIV'}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={downloading}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold shadow-2xs transition-all active:scale-95 ${
              downloaded
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
            }`}
          >
            {downloading ? (
              <ClockCounterClockwise size={13} className="animate-spin" />
            ) : downloaded ? (
              <>
                <CheckCircle size={13} weight="fill" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <DownloadSimple size={13} weight="bold" />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
