'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CaretUp,
  Buildings,
  DownloadSimple,
  ShieldCheck,
  FileText,
  X,
  FilePdf,
  FileDoc,
  FileXls,
} from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { useRealtimeDownloadCount, recordDownload } from '@/lib/downloadStore';
import { downloadResourceFile } from '@/lib/documentDownloader';
import { useOutsideClick } from '@/hooks/use-outside-click';

interface ExpandableResourceGridProps {
  resources: Resource[];
  onDownload?: (resource: Resource) => void;
}

export default function ExpandableResourceGrid({
  resources,
  onDownload,
}: ExpandableResourceGridProps) {
  const [active, setActive] = useState<Resource | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '450 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = async (res: Resource) => {
    setDownloading(true);
    recordDownload(res.id, res.download_count);
    if (onDownload) onDownload(res);

    try {
      await downloadResourceFile(res);
    } catch {
      // fallback
    }

    setDownloading(false);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md h-full w-full z-[90]"
          />
        )}
      </AnimatePresence>

      {/* Expanded Modal */}
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4 sm:p-6 overflow-y-auto">
            <motion.button
              key={`button-${active.id}-${id}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.05 } }}
              className="flex absolute top-4 right-4 sm:top-6 sm:right-6 items-center justify-center bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-full h-9 w-9 shadow-lg hover:scale-105 transition-transform z-10 cursor-pointer"
              onClick={() => setActive(null)}
              aria-label="Close document preview"
            >
              <X size={18} weight="bold" />
            </motion.button>

            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="w-full max-w-[540px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-[var(--color-paper-card)] border border-[var(--color-rule)] rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden my-auto"
            >
              {/* Document Banner */}
              <motion.div
                layoutId={`image-${active.id}-${id}`}
                className="w-full h-48 sm:h-52 bg-gradient-to-br from-[var(--color-primary)] to-blue-700 p-6 flex flex-col justify-between text-white relative overflow-hidden shrink-0"
              >
                <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />

                <div className="flex items-center justify-between z-10">
                  <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                    {active.file_format} • v{active.current_version || '2026.1'}
                  </span>

                  <span className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white">
                    <ShieldCheck size={14} weight="fill" />
                    <span>Official University Record</span>
                  </span>
                </div>

                <div className="z-10">
                  <div className="flex items-center gap-2 text-xs text-white/80 font-semibold mb-1">
                    <Buildings size={16} />
                    <span>{active.department?.name || active.source_name || 'Academic Office'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight line-clamp-2">
                    {active.title}
                  </h2>
                </div>
              </motion.div>

              {/* Document Details & Actions */}
              <div className="p-6 sm:p-7 flex flex-col flex-1 overflow-y-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--color-rule-subtle)]">
                  <div>
                    <motion.h3
                      layoutId={`title-${active.id}-${id}`}
                      className="font-bold text-base sm:text-lg text-[var(--color-ink)]"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.id}-${id}`}
                      className="text-xs text-[var(--color-ink-muted)] mt-0.5"
                    >
                      {active.category?.name || 'General Form'} • {formatFileSize(active.file_size)}
                    </motion.p>
                  </div>

                  <motion.button
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    onClick={() => handleDownload(active)}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 px-5 py-3 text-xs rounded-full font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <DownloadSimple size={15} weight="bold" />
                    <span>
                      {downloading
                        ? 'Downloading...'
                        : downloaded
                        ? 'Downloaded!'
                        : `Download ${active.file_format}`}
                    </span>
                  </motion.button>
                </div>

                {/* Content Section */}
                <div className="pt-4 space-y-4">
                  <div>
                    <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5">
                      Overview & Instructions
                    </h4>
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed"
                    >
                      {active.description ||
                        'Official university document verified and authenticated via the Resursee Open Repository. Ready for immediate download and submission.'}
                    </motion.div>
                  </div>

                  {/* Specifications Table */}
                  <div className="rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-4 divide-y divide-[var(--color-rule-subtle)] text-xs">
                    <div className="flex items-center justify-between pb-2.5">
                      <span className="text-[var(--color-ink-muted)]">Document Type</span>
                      <span className="font-mono font-bold uppercase text-[var(--color-primary)]">
                        {active.document_type || 'Official Form'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-[var(--color-ink-muted)]">Department / Office</span>
                      <span className="font-semibold text-[var(--color-ink)] text-right">
                        {active.department?.name || 'Central Administration'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5">
                      <span className="text-[var(--color-ink-muted)]">File Name</span>
                      <span className="font-mono text-[var(--color-ink)] truncate max-w-[240px]">
                        {active.file_name || `${active.title}.${active.file_format.toLowerCase()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Grid View */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-start gap-5 sm:gap-6">
        {resources.map((resource) => (
          <ExpandableCardItem
            key={resource.id}
            resource={resource}
            id={id}
            onClick={() => setActive(resource)}
          />
        ))}
      </div>
    </>
  );
}

function ExpandableCardItem({
  resource,
  id,
  onClick,
}: {
  resource: Resource;
  id: string;
  onClick: () => void;
}) {
  const realtimeDownloads = useRealtimeDownloadCount(resource.id, resource.download_count);
  const officeName = resource.department?.name || resource.source_name || 'Academic Office';
  const format = (resource.file_format || 'PDF').toUpperCase();

  return (
    <motion.div
      layoutId={`card-${resource.id}-${id}`}
      onClick={onClick}
      data-thock="card"
      className="group flex flex-col justify-between rounded-[26px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1.5 hover:border-[var(--color-primary)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer text-left h-full"
    >
      <div className="flex flex-col gap-4 w-full">
        {/* Card Banner with layoutId */}
        <motion.div
          layoutId={`image-${resource.id}-${id}`}
          className="h-36 sm:h-40 w-full rounded-[18px] bg-gradient-to-br from-[var(--color-primary)] to-blue-700 p-4 flex flex-col justify-between text-white relative overflow-hidden"
        >
          <div className="flex items-center justify-between z-10">
            <span className="rounded-md bg-white/20 backdrop-blur-md px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              {format}
            </span>

            <div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white">
              <CaretUp size={12} weight="fill" className="text-white" />
              <span>{realtimeDownloads}</span>
            </div>
          </div>

          <div className="z-10">
            <div className="flex items-center gap-1.5 text-[11px] text-white/80 font-medium truncate">
              <Buildings size={13} className="shrink-0" />
              <span className="truncate">{officeName}</span>
            </div>
          </div>
        </motion.div>

        {/* Title & Description */}
        <div className="flex flex-col">
          <motion.h3
            layoutId={`title-${resource.id}-${id}`}
            className="font-bold text-base sm:text-lg leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2"
          >
            {resource.title}
          </motion.h3>
          <motion.p
            layoutId={`description-${resource.id}-${id}`}
            className="text-xs text-[var(--color-ink-muted)] mt-1.5 font-medium"
          >
            {resource.category?.name || 'General'} • {resource.document_type || 'Official Form'}
          </motion.p>
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-[var(--color-rule-subtle)] flex items-center justify-between text-xs">
        <span className="font-mono text-[11px] font-bold text-[var(--color-primary)]">
          v{resource.current_version || '2026.1'}
        </span>
        <span className="font-semibold text-[var(--color-ink-secondary)] group-hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors">
          <span>Preview</span>
          <DownloadSimple size={13} weight="bold" />
        </span>
      </div>
    </motion.div>
  );
}
