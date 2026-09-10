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
  Tag,
} from '@phosphor-icons/react';

interface PublicApiRowProps {
  api: PublicApi;
  onCopyNotice?: (text: string) => void;
}

export default function PublicApiRow({ api, onCopyNotice }: PublicApiRowProps) {
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

  return (
    <div
      data-thock="card"
      className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 md:px-5 md:py-3.5 transition-all duration-150 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm"
    >
      {/* Left section: Name, Category, Description */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={api.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold text-[var(--color-ink)] hover:text-[var(--color-primary)] dark:hover:text-white transition-colors tracking-tight"
          >
            {api.name}
          </a>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-ink-muted)] bg-[var(--color-paper-muted)] px-2 py-0.5 rounded-md border border-[var(--color-rule-subtle)]">
            <Tag size={10} />
            <span>{api.category}</span>
          </span>

          {api.https ? (
            <span
              title="HTTPS Supported"
              className="p-1 rounded-md text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <Lock size={12} weight="bold" />
            </span>
          ) : (
            <span
              title="HTTP Only"
              className="p-1 rounded-md text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <LockOpen size={12} weight="bold" />
            </span>
          )}
        </div>

        <p className="mt-1 text-xs sm:text-sm text-[var(--color-ink-muted)] leading-normal line-clamp-2 md:line-clamp-1">
          {api.description || 'No description provided.'}
        </p>
      </div>

      {/* Right section: Badges, Actions */}
      <div className="flex flex-wrap items-center gap-3 shrink-0 self-end md:self-auto w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t border-[var(--color-rule-subtle)] md:border-t-0">
        {/* Auth Badge */}
        <div className="flex items-center gap-2">
          {getAuthBadge(api.auth)}
          <span className="text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400">
            CORS: {api.cors}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            data-thock="button"
            title="Copy API Link"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-muted)] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} className="text-[var(--color-ink)]" />
                <span className="text-[var(--color-ink)] font-semibold text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="text-[11px]">Copy</span>
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
