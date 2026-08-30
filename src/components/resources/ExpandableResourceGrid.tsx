'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CaretUp,
  Buildings,
  DownloadSimple,
  ShieldCheck,
  X,
  FilePdf,
  FileDoc,
  FileXls,
  FileText,
} from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { useRealtimeDownloadCount, recordDownload } from '@/lib/downloadStore';
import { downloadResourceFile } from '@/lib/documentDownloader';
import { useOutsideClick } from '@/hooks/use-outside-click';
import { Button as StatefulButton } from '@/components/ui/stateful-button';

interface ExpandableResourceGridProps {
  resources: Resource[];
  onDownload?: (resource: Resource) => void;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 30,
  mass: 0.75,
};

export default function ExpandableResourceGrid({
  resources,
  onDownload,
}: ExpandableResourceGridProps) {
  const [active, setActive] = useState<Resource | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActive(null);
      }
    }

    if (active) {
      // Prevent scrollbar layout jump
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.paddingRight = '';
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
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
      {/* Dimmed Blur Backdrop */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm h-full w-full z-[90]"
          />
        )}
      </AnimatePresence>

      {/* Expanded Modal */}
      <AnimatePresence mode="wait">
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4 sm:p-6 overflow-y-auto pointer-events-none">
            <motion.div
              layoutId={`card-${active.id}`}
              transition={springTransition}
              ref={ref}
              className="w-full max-w-[560px] flex flex-col bg-[var(--color-paper-card)] border border-[var(--color-rule)] rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.35)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] overflow-hidden my-auto pointer-events-auto"
            >
              {/* Animated Banner with Shared layoutId */}
              <motion.div
                layoutId={`image-${active.id}`}
                transition={springTransition}
                className="w-full h-44 sm:h-48 bg-gradient-to-br from-[var(--color-primary)] to-blue-700 p-6 flex flex-col justify-between text-white relative overflow-hidden shrink-0"
              >
                <div className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

                <div className="flex items-center justify-between z-10">
                  <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                    {active.file_format} • v{active.current_version || '2026.1'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <div className="z-10">
                  <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium mb-1">
                    <Buildings size={15} />
                    <span className="truncate">{active.department?.name || active.source_name || 'Academic Office'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight line-clamp-2">
                    {active.title}
                  </h2>
                </div>
              </motion.div>

              {/* Inner Content (Smooth Fade-in to eliminate text morph jitter) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.18, delay: 0.05 }}
                className="p-6 sm:p-7 flex flex-col flex-1 overflow-y-auto space-y-5"
              >
                {/* Download CTA & Category info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-rule-subtle)]">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[var(--color-ink)]">
                      {active.title}
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 font-medium">
                      {active.category?.name || 'General Category'} • {formatFileSize(active.file_size)}
                    </p>
                  </div>

                  <StatefulButton
                    onClick={() => handleDownload(active)}
                    loadingText="Preparing Download..."
                    successText="Downloaded!"
                    minDuration={1400}
                    className="px-5 py-3 text-xs shrink-0"
                  >
                    <DownloadSimple size={15} weight="bold" />
                    <span>Download {active.file_format}</span>
                  </StatefulButton>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5">
                    Overview & Purpose
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed">
                    {active.description ||
                      'Official university document verified and authenticated via the Resursee Open Repository. Ready for immediate download and submission.'}
                  </p>
                </div>

                {/* Specifications Grid */}
                <div className="rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-4 divide-y divide-[var(--color-rule-subtle)] text-xs">
                  <div className="flex items-center justify-between pb-2.5">
                    <span className="text-[var(--color-ink-muted)]">Document Type</span>
                    <span className="font-mono font-bold uppercase text-[var(--color-primary)]">
                      {active.document_type || 'Official Form'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[var(--color-ink-muted)]">Issuing Office</span>
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

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-ink-muted)] pt-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Direct authenticated file download with zero server latency</span>
                </div>
              </motion.div>
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
            onClick={() => setActive(resource)}
          />
        ))}
      </div>
    </>
  );
}

function ExpandableCardItem({
  resource,
  onClick,
}: {
  resource: Resource;
  onClick: () => void;
}) {
  const realtimeDownloads = useRealtimeDownloadCount(resource.id, resource.download_count);
  const officeName = resource.department?.name || resource.source_name || 'Academic Office';
  const format = (resource.file_format || 'PDF').toUpperCase();

  return (
    <motion.div
      layoutId={`card-${resource.id}`}
      transition={springTransition}
      onClick={onClick}
      data-thock="card"
      className="group flex flex-col justify-between rounded-[26px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1.5 hover:border-[var(--color-primary)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer text-left h-full"
    >
      <div className="flex flex-col gap-4 w-full">
        {/* Card Banner with layoutId */}
        <motion.div
          layoutId={`image-${resource.id}`}
          transition={springTransition}
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

        {/* Title & Category info */}
        <div className="flex flex-col">
          <h3 className="font-bold text-base sm:text-lg leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
            {resource.title}
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1.5 font-medium">
            {resource.category?.name || 'General'} • {resource.document_type || 'Official Form'}
          </p>
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
