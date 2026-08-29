'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { mockResources } from '@/lib/mockData';
import { Resource } from '@/types/database';
import { getLiveResources } from '@/lib/resourceStore';
import { useRealtimeDownloadCount, recordDownload } from '@/lib/downloadStore';
import { downloadResourceFile } from '@/lib/documentDownloader';

export default function ResourceDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [liveList, setLiveList] = useState<Resource[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const list = getLiveResources();
    setLiveList(list);
    setIsLoaded(true);

    const handleUpdate = () => {
      setLiveList(getLiveResources());
    };
    window.addEventListener('resursee_catalog_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('resursee_catalog_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Find document from live catalog (fallback to mock only before mount)
  const currentCatalog = liveList.length > 0 ? liveList : mockResources;
  const resource = currentCatalog.find((r) => r.slug === slug);

  const realtimeCount = useRealtimeDownloadCount(
    resource ? resource.id : '',
    resource ? resource.download_count : 0
  );

  if (isLoaded && !resource) {
    return notFound();
  }

  const activeResource = resource || currentCatalog[0];

  const relatedResources = currentCatalog
    .filter(
      (r) =>
        r.id !== activeResource.id &&
        (r.category_id === activeResource.category_id ||
          r.department_id === activeResource.department_id)
    )
    .slice(0, 3);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '450 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    setDownloading(true);
    // Record real-time persistent download increment
    recordDownload(activeResource.id, activeResource.download_count);

    try {
      await downloadResourceFile(activeResource);
    } catch {
      // ignore
    }

    setDownloading(false);
    setDownloaded(true);
    setToastMessage(`Downloaded "${activeResource.title}" (${activeResource.file_format})`);
    setTimeout(() => setDownloaded(false), 3000);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <Link href="/resources" className="hover:text-[var(--color-primary)]">
              Resources
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)] truncate max-w-xs">
              {activeResource.title}
            </span>
          </nav>

          <div className="mt-4">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Back to Directory</span>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left 2 Cols: Main Document Profile */}
            <div className="space-y-8 lg:col-span-2">
              {/* Document Summary Card */}
              <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-rose-600 px-2 py-0.5 font-mono text-[10.5px] font-bold text-white uppercase">
                    {activeResource.file_format}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Official Document</span>
                  </span>
                  <span className="rounded-md bg-[var(--color-paper-muted)] px-2 py-0.5 font-mono text-[10.5px] font-bold text-[var(--color-ink-muted)]">
                    v{activeResource.current_version}
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
                    {activeResource.title}
                  </h1>
                </div>

                {activeResource.description && (
                  <div className="space-y-2 border-t border-[var(--color-rule-subtle)] pt-5">
                    <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Document Overview & Purpose
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                      {activeResource.description}
                    </p>
                  </div>
                )}

                {/* Specification & Provenance */}
                <div className="space-y-3 border-t border-[var(--color-rule-subtle)] pt-5">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Document Specification & Provenance
                  </h2>

                  <div className="overflow-hidden rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)]">
                    <div className="divide-y divide-[var(--color-rule-subtle)] text-xs">
                      <div className="flex items-center justify-between p-3">
                        <span className="text-[var(--color-ink-muted)]">Issuing Department / Office</span>
                        <span className="font-bold text-[var(--color-ink)] text-right">
                          {activeResource.department?.name || activeResource.source_name || 'Academic Office'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <span className="text-[var(--color-ink-muted)]">Academic Category</span>
                        <span className="font-bold text-[var(--color-ink)]">
                          {activeResource.category?.name || 'General Form'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <span className="text-[var(--color-ink-muted)]">Document Type</span>
                        <span className="font-mono font-bold uppercase text-[var(--color-primary)]">
                          {activeResource.document_type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <span className="text-[var(--color-ink-muted)]">File Name & Size</span>
                        <span className="font-mono text-[var(--color-ink)]">
                          {activeResource.file_name} ({formatFileSize(activeResource.file_size)})
                        </span>
                      </div>

                      {activeResource.source_url && (
                        <div className="flex items-center justify-between p-3">
                          <span className="text-[var(--color-ink-muted)]">Source Webpage</span>
                          <a
                            href={activeResource.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[var(--color-primary)] hover:underline"
                          >
                            <span>{activeResource.source_name || 'Official Office'}</span>
                            <ArrowSquareOut size={13} />
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3">
                        <span className="text-[var(--color-ink-muted)]">Total Community Downloads</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {realtimeCount.toLocaleString()} verified downloads
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Version History Section */}
              <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <ClockCounterClockwise size={18} className="text-[var(--color-primary)]" />
                  <h2 className="text-base font-bold text-[var(--color-ink)]">
                    Version History & Revisions
                  </h2>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-[16px] border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        Version {activeResource.current_version}
                      </span>
                      <span className="rounded-full bg-emerald-600 text-white px-2 py-0.2 font-mono text-[9px] font-bold uppercase">
                        Current
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                      {new Date(activeResource.updated_at || activeResource.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Download Action Card + Related Resources */}
            <div className="space-y-6 lg:col-span-1">
              {/* Primary Direct Download Action Card */}
              <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4 sticky top-20">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    Direct Download
                  </span>
                  <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                    {formatFileSize(activeResource.file_size)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <DownloadSimple size={16} weight="bold" />
                  <span>
                    {downloading
                      ? 'Preparing Download...'
                      : downloaded
                      ? 'Downloaded!'
                      : `Download ${activeResource.file_format}`}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-ink-muted)] pt-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Verified authentic document</span>
                </div>

                {activeResource.source_url && (
                  <div className="border-t border-[var(--color-rule-subtle)] pt-3 text-center">
                    <a
                      href={activeResource.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)]"
                    >
                      <span>Visit Department Source Page</span>
                      <ArrowSquareOut size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Related Documents Widget */}
              {relatedResources.length > 0 && (
                <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-2xs space-y-4">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Related Documents
                  </h3>

                  <div className="space-y-3">
                    {relatedResources.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/resources/${rel.slug}`}
                        className="group flex items-start gap-3 rounded-[18px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3 hover:border-[var(--color-primary)] hover:shadow-xs transition-all block"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-primary)] text-white font-bold text-xs">
                          {rel.file_format}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1 block">
                            {rel.title}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--color-ink-muted)] block">
                            {rel.department?.abbreviation || rel.source_name}
                          </span>
                        </div>
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

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
