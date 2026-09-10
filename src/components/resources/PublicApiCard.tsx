'use client';

import React, { useState } from 'react';
import { PublicApi } from '@/types/publicApi';
import {
  ArrowSquareOut,
  Copy,
  Check,
  Lock,
  LockOpen,
  Key,
  ShieldCheck,
  Globe,
  Tag,
} from '@phosphor-icons/react';

interface PublicApiCardProps {
  api: PublicApi;
  onCopyNotice?: (text: string) => void;
}

export default function PublicApiCard({ api, onCopyNotice }: PublicApiCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(api.link);
      setCopied(true);
      if (onCopyNotice) {
        onCopyNotice(`Copied link for ${api.name}`);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAuthBadge = (auth: string) => {
    const lower = auth.toLowerCase();
    if (lower === 'no' || lower === '') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
          <ShieldCheck size={12} weight="bold" className="text-neutral-500 dark:text-neutral-400" />
          No Auth
        </span>
      );
    }
    if (lower.includes('apikey')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
          <Key size={12} weight="bold" className="text-neutral-500 dark:text-neutral-400" />
          API Key
        </span>
      );
    }
    if (lower.includes('oauth')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
          <Lock size={12} weight="bold" className="text-neutral-500 dark:text-neutral-400" />
          OAuth
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
        {auth}
      </span>
    );
  };

  const getCorsBadge = (cors: string) => {
    const lower = cors.toLowerCase();
    if (lower === 'yes') {
      return (
        <span className="text-[10.5px] font-mono font-medium text-neutral-600 dark:text-neutral-400">
          CORS: Yes
        </span>
      );
    }
    if (lower === 'no') {
      return (
        <span className="text-[10.5px] font-mono font-medium text-neutral-500 dark:text-neutral-500">
          CORS: No
        </span>
      );
    }
    return (
      <span className="text-[10.5px] font-mono font-medium text-neutral-400 dark:text-neutral-500">
        CORS: {cors}
      </span>
    );
  };

  return (
    <div
      data-thock="card"
      className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 md:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
    >
      <div>
        {/* Top bar: Category + HTTPS & Auth */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper-muted)] px-2.5 py-1 rounded-lg border border-[var(--color-rule-subtle)]">
            <Tag size={11} />
            <span className="truncate max-w-[130px]">{api.category}</span>
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {api.https ? (
              <span
                title="HTTPS Supported"
                className="p-1 rounded-md text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              >
                <Lock size={12} weight="bold" />
              </span>
            ) : (
              <span
                title="HTTP Only (No HTTPS)"
                className="p-1 rounded-md text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
              >
                <LockOpen size={12} weight="bold" />
              </span>
            )}
            {getAuthBadge(api.auth)}
          </div>
        </div>

        {/* API Title */}
        <div className="mt-4">
          <h3 className="text-base sm:text-lg font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] dark:group-hover:text-white transition-colors tracking-tight line-clamp-1">
            {api.name}
          </h3>
        </div>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed line-clamp-3 min-h-[3.6rem]">
          {api.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer / Actions */}
      <div className="mt-5 pt-4 border-t border-[var(--color-rule-subtle)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getCorsBadge(api.cors)}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyLink}
            data-thock="button"
            title="Copy API URL"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-muted)] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <a
            href={api.link}
            target="_blank"
            rel="noopener noreferrer"
            data-thock="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-ink)] text-[var(--color-paper-card)] dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
          >
            <span>Visit</span>
            <ArrowSquareOut size={13} weight="bold" />
          </a>
        </div>
      </div>
    </div>
  );
}
