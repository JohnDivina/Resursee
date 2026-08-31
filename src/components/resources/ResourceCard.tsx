'use client';

import React from 'react';
import Link from 'next/link';
import { CaretUp, Buildings } from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { useRealtimeDownloadCount } from '@/lib/downloadStore';
import { OrgLogo } from '@/components/ui/OrgLogo';

interface ResourceCardProps {
  resource: Resource;
  onDownload?: (resource: Resource) => void;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const realtimeDownloads = useRealtimeDownloadCount(resource.id, resource.download_count);
  const officeName = resource.department?.name || resource.source_name || 'Academic Office';

  return (
    <Link
      href={`/resources/${resource.slug}`}
      data-thock="card"
      className="group relative flex min-h-[220px] sm:min-h-[240px] flex-col justify-between rounded-[26px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-7 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2 hover:border-[var(--color-primary)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] cursor-pointer block text-left"
    >
      <div>
        {/* Top Header: Official Institutional Seal & Real-time Upvote/Download Counter */}
        <div className="flex items-start justify-between">
          {/* Official Institutional Seal */}
          <div className="flex h-13 w-13 items-center justify-center rounded-[18px] bg-white dark:bg-slate-900 border border-[var(--color-rule)] p-2 shadow-xs transition-transform duration-300 ease-out group-hover:scale-110 select-none">
            <OrgLogo
              sourceName={resource.source_name}
              departmentName={resource.department?.name}
              title={resource.title}
              size={36}
              className="h-8 w-8 object-contain"
            />
          </div>

          {/* Real-time Download Count Indicator */}
          <div className="flex items-center gap-1 rounded-full bg-[var(--color-paper-muted)] px-3 py-1 text-xs font-bold text-[var(--color-ink)] transition-colors group-hover:bg-[var(--color-primary-subtle)]">
            <CaretUp size={14} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono text-xs font-bold">
              {realtimeDownloads}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-5 text-lg sm:text-xl font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors duration-200 tracking-tight line-clamp-3">
          {resource.title}
        </h3>
      </div>

      {/* Bottom Row: Category Pill & Issuing Office */}
      <div className="mt-6 pt-4 border-t border-[var(--color-rule-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Pill */}
        <span className="rounded-full bg-[var(--color-paper-muted)] px-3.5 py-1.5 font-semibold text-xs text-[var(--color-ink-secondary)]">
          {resource.category?.name || 'General'}
        </span>

        {/* Issuing Office / Department Label */}
        <div className="flex items-center gap-1.5 font-semibold text-[var(--color-ink-muted)] group-hover:text-[var(--color-primary)] transition-colors duration-200">
          <Buildings size={15} className="shrink-0 text-[var(--color-primary)]" />
          <span className="truncate max-w-[180px] sm:max-w-[220px]">{officeName}</span>
        </div>
      </div>
    </Link>
  );
}
