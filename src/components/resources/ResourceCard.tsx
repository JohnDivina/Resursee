'use client';

import React from 'react';
import Link from 'next/link';
import { CaretUp, Buildings } from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { useRealtimeDownloadCount } from '@/lib/downloadStore';

interface ResourceCardProps {
  resource: Resource;
  onDownload?: (resource: Resource) => void;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const realtimeDownloads = useRealtimeDownloadCount(resource.id, resource.download_count);

  // Get initial representation for squircle badge
  const firstLetter = resource.title.trim().charAt(0).toUpperCase();
  const officeName = resource.department?.name || resource.source_name || 'Academic Office';

  return (
    <Link
      href={`/resources/${resource.slug}`}
      data-thock="card"
      className="group relative flex flex-col justify-between rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 cursor-pointer block text-left"
    >
      <div>
        {/* Top Header: Squircle Format Icon Badge & Real-time Upvote/Download Counter */}
        <div className="flex items-start justify-between">
          {/* Squircle Format Icon Badge */}
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

          {/* Real-time Download Count Indicator */}
          <div className="flex flex-col items-center">
            <CaretUp size={15} weight="fill" className="text-emerald-600" />
            <span className="font-mono text-xs font-bold text-[var(--color-ink)]">
              {realtimeDownloads}
            </span>
          </div>
        </div>

        {/* Title (Clean, bold, tracking-tight) */}
        <h3 className="mt-4 text-base sm:text-lg font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors tracking-tight line-clamp-2">
          {resource.title}
        </h3>
      </div>

      {/* Bottom Row: Category Pill & Issuing Office (replacing download button) */}
      <div className="mt-5 pt-3.5 border-t border-[var(--color-rule-subtle)] flex items-center justify-between gap-2 text-xs">
        {/* Category Pill */}
        <span className="rounded-full bg-[var(--color-paper-muted)] px-3 py-1 font-semibold text-xs text-[var(--color-ink-secondary)] truncate max-w-[130px]">
          {resource.category?.name || 'General'}
        </span>

        {/* Issuing Office / Department Label (Replaced Download Button) */}
        <div className="flex items-center gap-1.5 font-semibold text-[var(--color-ink-muted)] group-hover:text-[var(--color-primary)] transition-colors truncate max-w-[160px]">
          <Buildings size={14} className="shrink-0 text-[var(--color-primary)]" />
          <span className="truncate">{officeName}</span>
        </div>
      </div>
    </Link>
  );
}
