'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DownloadSimple,
  ArrowSquareOut,
  Tag,
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

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs transition-all duration-200 hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5">
      {/* Top Header: Badge, Version, Featured Star */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Format Badge */}
            <span
              className={`inline-flex items-center justify-center rounded px-2 py-0.5 font-mono text-[10.5px] font-bold ${
                resource.file_format === 'PDF'
                  ? 'badge-pdf'
                  : resource.file_format === 'DOCX'
                  ? 'badge-docx'
                  : resource.file_format === 'XLSX'
                  ? 'badge-xlsx'
                  : 'badge-pptx'
              }`}
            >
              {resource.file_format}
            </span>

            {/* Version Badge */}
            <span className="inline-flex items-center rounded-md border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-muted)]">
              {resource.current_version}
            </span>
          </div>

          {resource.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-amber-subtle)] px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800">
              <span>★</span> Featured
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/resources/${resource.slug}`} className="block mt-3 group-hover:text-[var(--color-primary)] transition-colors">
          <h3 className="font-display text-base font-semibold leading-snug text-[var(--color-ink)] line-clamp-2">
            {resource.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)] line-clamp-2">
          {resource.description || 'No description provided.'}
        </p>
      </div>

      {/* Meta tags & Action Bar */}
      <div className="mt-4 pt-3.5 border-t border-[var(--color-rule-subtle)]">
        {/* Department and Category context */}
        <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
          <div className="flex items-center gap-1.5 truncate">
            <Buildings size={13} className="shrink-0 text-[var(--color-primary)]" />
            <span className="truncate font-medium">
              {resource.department?.abbreviation || 'University'}
            </span>
          </div>
          <span className="font-mono text-[10.5px]">
            {formatFileSize(resource.file_size)}
          </span>
        </div>

        {/* Direct Actions: Download button + Details link */}
        <div className="mt-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-muted)] font-mono">
            <span>{resource.download_count + (downloaded ? 1 : 0)} downloads</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/resources/${resource.slug}`}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-2.5 text-xs font-medium text-[var(--color-ink-secondary)] transition-all hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
            >
              <span>Details</span>
            </Link>

            <button
              type="button"
              onClick={handleDownloadClick}
              disabled={downloading}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold shadow-xs transition-all active:scale-95 ${
                downloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
              }`}
            >
              {downloading ? (
                <ClockCounterClockwise size={14} className="animate-spin" />
              ) : downloaded ? (
                <>
                  <CheckCircle size={14} weight="fill" />
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <DownloadSimple size={14} weight="bold" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
