'use client';

import React, { useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import ResourceCard from '@/components/resources/ResourceCard';
import {
  DownloadSimple,
  ArrowSquareOut,
  Buildings,
  Tag,
  ShieldCheck,
  ClockCounterClockwise,
  CheckCircle,
  FileText,
  CalendarBlank,
  HardDrive,
  Info,
  ArrowLeft,
} from '@phosphor-icons/react';
import { mockResources } from '@/lib/mockData';
import { Resource } from '@/types/database';
import { useRealtimeDownloadCount, recordDownload } from '@/lib/downloadStore';

export default function ResourceDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const resource = mockResources.find((r) => r.slug === slug) || mockResources[0];

  const realtimeCount = useRealtimeDownloadCount(resource ? resource.id : '', resource ? resource.download_count : 0);

  if (!resource) {
    return notFound();
  }

  const relatedResources = mockResources
    .filter((r) => r.id !== resource.id && (r.category_id === resource.category_id || r.department_id === resource.department_id))
    .slice(0, 3);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      // Record real-time persistent download increment
      recordDownload(resource.id, resource.download_count);

      setDownloading(false);
      setDownloaded(true);
      setToastMessage(`Downloaded "${resource.title}" (${resource.file_format})`);
      setTimeout(() => setDownloaded(false), 3000);
      setTimeout(() => setToastMessage(null), 3500);
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        resources={mockResources}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <Link href="/resources" className="hover:text-[var(--color-primary)]">
              Resources
            </Link>
            <span>/</span>
            <span className="truncate font-semibold text-[var(--color-ink)]">
              {resource.title}
            </span>
          </nav>

          {/* Back to Resources button */}
          <div className="mt-4">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
            >
              <ArrowLeft size={14} />
              <span>Back to Directory</span>
            </Link>
          </div>

          {/* Main Grid: Resource Details + Action Sidebar */}
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Main Info, Metadata Table, Versions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Card */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                {/* Format & Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 font-mono text-xs font-bold ${
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

                  <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    ● Active Document
                  </span>

                  <span className="rounded-full bg-[var(--color-paper-muted)] px-3 py-0.5 font-mono text-xs text-[var(--color-ink-muted)]">
                    v{resource.current_version}
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
                  {resource.title}
                </h1>

                {/* Description */}
                {resource.description && (
                  <div className="mt-4 border-t border-[var(--color-rule-subtle)] pt-4">
                    <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Document Overview
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-secondary)]">
                      {resource.description}
                    </p>
                  </div>
                )}

                {/* Technical Metadata Table */}
                <div className="mt-6 rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] overflow-hidden">
                  <div className="border-b border-[var(--color-rule-subtle)] bg-[var(--color-paper-muted)]/50 px-4 py-2.5 text-xs font-mono font-bold uppercase text-[var(--color-ink-muted)]">
                    Document Specification & Provenance
                  </div>
                  <dl className="divide-y divide-[var(--color-rule-subtle)] text-xs">
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Issuing Department / Office</dt>
                      <dd className="font-bold text-[var(--color-ink)] text-right">
                        {resource.department?.name} ({resource.department?.abbreviation})
                      </dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Category</dt>
                      <dd className="font-semibold text-[var(--color-ink)]">{resource.category?.name}</dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Document Type</dt>
                      <dd className="font-mono uppercase font-bold text-[var(--color-ink)]">{resource.document_type}</dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">File Name & Size</dt>
                      <dd className="font-mono text-[var(--color-ink)]">
                        {resource.file_name} ({formatFileSize(resource.file_size)})
                      </dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Source Webpage</dt>
                      <dd className="text-right">
                        {resource.source_url ? (
                          <a
                            href={resource.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline"
                          >
                            <span>{resource.source_name || 'Issuing Office Portal'}</span>
                            <ArrowSquareOut size={12} />
                          </a>
                        ) : (
                          <span className="text-[var(--color-ink-muted)]">{resource.source_name || 'University Archives'}</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Total Downloads</dt>
                      <dd className="font-mono font-bold text-[var(--color-primary)]">
                        {realtimeCount} verified downloads
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Version History Card */}
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 text-base font-bold text-[var(--color-ink)]">
                  <ClockCounterClockwise size={18} className="text-[var(--color-primary)]" />
                  <h3>Version History & Revisions</h3>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-[16px] border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        Version {resource.current_version}
                      </span>
                      <span className="rounded-full bg-emerald-600 px-2 py-0.2 font-mono text-[9px] font-bold text-white uppercase">
                        Current
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                      {resource.updated_at ? new Date(resource.updated_at).toLocaleDateString() : 'Active Revision'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[16px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-3.5 text-xs text-[var(--color-ink-muted)] opacity-75">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">Version 2025.0</span>
                      <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.2 font-mono text-[9px] text-gray-700 dark:text-gray-300 uppercase">
                        Archived
                      </span>
                    </div>
                    <span className="font-mono text-[11px]">Superseded by {resource.current_version}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Quick Download Box & Related Resources */}
            <div className="space-y-6 lg:col-span-1">
              {/* Sticky Download Box */}
              <div className="sticky top-24 rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    Direct Download
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--color-ink-muted)]">
                    {formatFileSize(resource.file_size)}
                  </span>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold shadow-md transition-all active:scale-95 ${
                      downloaded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                    }`}
                  >
                    {downloading ? (
                      <>
                        <ClockCounterClockwise size={18} className="animate-spin" />
                        <span>Preparing Download...</span>
                      </>
                    ) : downloaded ? (
                      <>
                        <CheckCircle size={18} weight="fill" />
                        <span>File Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <DownloadSimple size={18} weight="bold" />
                        <span>Download {resource.file_format}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--color-ink-muted)]">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>Verified authentic document</span>
                </div>

                {resource.source_url && (
                  <div className="mt-4 border-t border-[var(--color-rule-subtle)] pt-4 text-center">
                    <a
                      href={resource.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)]"
                    >
                      <span>Visit Department Source Page</span>
                      <ArrowSquareOut size={13} />
                    </a>
                  </div>
                )}
              </div>

              {/* Related Resources Sidebar */}
              {relatedResources.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-mono text-xs font-bold text-[var(--color-ink-muted)] uppercase tracking-wider">
                    Related Documents
                  </h3>
                  <div className="space-y-3">
                    {relatedResources.map((rel) => (
                      <ResourceCard key={rel.id} resource={rel} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
