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

export default function ResourceDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const resource = mockResources.find((r) => r.slug === slug) || mockResources[0];

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
            {/* Left 2 Cols: Main Info, Description, Metadata Table, Versions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Card */}
              <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs">
                {/* Format & Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center rounded px-2.5 py-0.5 font-mono text-xs font-bold ${
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

                  <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-2.5 py-0.5 font-mono text-xs text-[var(--color-ink-muted)]">
                    Version {resource.current_version}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active / Current
                  </span>

                  {resource.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-amber-subtle)] px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-800">
                      ★ Featured Document
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                  {resource.title}
                </h1>

                {/* Description */}
                <div className="mt-4 border-t border-[var(--color-rule-subtle)] pt-4">
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Document Overview
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-secondary)]">
                    {resource.description || 'No detailed summary provided.'}
                  </p>
                </div>

                {/* Technical Metadata Table */}
                <div className="mt-6 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-surface)] overflow-hidden">
                  <div className="border-b border-[var(--color-rule)] bg-[var(--color-paper-muted)]/50 px-4 py-2.5 text-xs font-mono font-semibold uppercase text-[var(--color-ink-muted)]">
                    Document Specification & Provenance
                  </div>
                  <dl className="divide-y divide-[var(--color-rule-subtle)] text-xs">
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Issuing Office / Department</dt>
                      <dd className="font-semibold text-[var(--color-ink)] text-right">
                        {resource.department?.name} ({resource.department?.abbreviation})
                      </dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Category</dt>
                      <dd className="font-semibold text-[var(--color-ink)]">{resource.category?.name}</dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Document Type</dt>
                      <dd className="font-mono uppercase text-[var(--color-ink)]">{resource.document_type}</dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">File Name & Size</dt>
                      <dd className="font-mono text-[var(--color-ink)]">
                        {resource.file_name} ({formatFileSize(resource.file_size)})
                      </dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Official Verified Source</dt>
                      <dd className="text-right">
                        {resource.source_url ? (
                          <a
                            href={resource.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-[var(--color-primary)] hover:underline"
                          >
                            <span>{resource.source_name || 'Official Portal'}</span>
                            <ArrowSquareOut size={12} />
                          </a>
                        ) : (
                          <span className="text-[var(--color-ink-muted)]">Internal University Archives</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <dt className="text-[var(--color-ink-muted)]">Total Downloads</dt>
                      <dd className="font-mono font-semibold text-[var(--color-ink)]">
                        {resource.download_count + (downloaded ? 1 : 0)} verified downloads
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Version History Card */}
              <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs">
                <div className="flex items-center gap-2 font-display text-base font-bold text-[var(--color-ink)]">
                  <ClockCounterClockwise size={18} className="text-[var(--color-primary)]" />
                  <span>Document Version History</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  Previous revisions and historical iterations of this document.
                </p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-subtle)] p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[var(--color-primary)]">
                        Version {resource.current_version}
                      </span>
                      <span className="rounded-sm bg-[var(--color-primary)] px-1.5 py-0.2 font-mono text-[9px] font-bold text-white uppercase">
                        Active
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">Current Revision</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink-muted)] opacity-75">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">Version 2025.0</span>
                      <span className="rounded-sm bg-gray-200 px-1.5 py-0.2 font-mono text-[9px] text-gray-700 uppercase">
                        Archived
                      </span>
                    </div>
                    <span className="font-mono text-[11px]">Superceded by 2026.1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Quick Download Box & Related Resources */}
            <div className="space-y-6 lg:col-span-1">
              {/* Sticky Download Box */}
              <div className="sticky top-24 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-paper-card)] p-6 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                    Direct Download
                  </span>
                  <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                    {formatFileSize(resource.file_size)}
                  </span>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold shadow-md transition-all active:scale-95 ${
                      downloaded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:shadow-lg'
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
                  <span>Virus-scanned & verified authentic file</span>
                </div>

                {resource.source_url && (
                  <div className="mt-4 border-t border-[var(--color-rule)] pt-4 text-center">
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
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs">
                  <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                    Related University Documents
                  </h3>
                  <div className="mt-3 space-y-3">
                    {relatedResources.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/resources/${rel.slug}`}
                        className="group block rounded-lg border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3 text-xs transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-card)]"
                      >
                        <span className="font-mono text-[10px] font-bold text-[var(--color-primary)]">
                          {rel.file_format} · {rel.department?.abbreviation}
                        </span>
                        <h4 className="mt-1 font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] line-clamp-2">
                          {rel.title}
                        </h4>
                      </Link>
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-dark-surface)] px-4 py-3 text-xs font-medium text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
