'use client';

import React, { useState } from 'react';
import { StarredRepo } from '@/types/starredRepo';
import {
  Star,
  GitFork,
  ArrowSquareOut,
  Copy,
  Check,
  GithubLogo,
} from '@phosphor-icons/react';
import { formatNumber, getLanguageColor } from './StarredRepoCard';

interface StarredRepoRowProps {
  repo: StarredRepo;
  onSelectTopic?: (topic: string) => void;
  onCopyNotice?: (text: string) => void;
}

export default function StarredRepoRow({
  repo,
  onSelectTopic,
  onCopyNotice,
}: StarredRepoRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(repo.htmlUrl);
      setCopied(true);
      if (onCopyNotice) {
        onCopyNotice(`Copied GitHub link for ${repo.name}`);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      data-thock="card"
      className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 md:px-5 md:py-3.5 transition-all duration-150 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-sm"
    >
      {/* Left section: Avatar, Full Name, Language, Description */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <img
            src={repo.owner.avatarUrl}
            alt={repo.owner.login}
            className="h-6 w-6 rounded-md border border-[var(--color-rule)] shrink-0 object-cover bg-[var(--color-paper-muted)]"
            loading="lazy"
          />

          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold text-[var(--color-ink)] hover:text-[var(--color-primary)] dark:hover:text-white transition-colors tracking-tight"
          >
            {repo.fullName}
          </a>

          {repo.language && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium font-mono text-[var(--color-ink-muted)] bg-[var(--color-paper-muted)] px-2 py-0.5 rounded-md border border-[var(--color-rule-subtle)]">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${getLanguageColor(
                  repo.language
                )}`}
              />
              <span>{repo.language}</span>
            </span>
          )}

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
            <Star size={11} weight="fill" className="text-amber-500" />
            <span>{formatNumber(repo.stargazersCount)}</span>
          </div>

          {repo.forksCount > 0 && (
            <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[var(--color-ink-muted)]">
              <GitFork size={11} />
              <span>{formatNumber(repo.forksCount)}</span>
            </div>
          )}
        </div>

        <p className="mt-1 text-xs sm:text-sm text-[var(--color-ink-muted)] leading-normal line-clamp-2 md:line-clamp-1">
          {repo.description || 'No description provided.'}
        </p>

        {/* Topics preview */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {repo.topics.slice(0, 3).map((topic) => (
              <button
                key={topic}
                type="button"
                data-thock="button"
                onClick={() => onSelectTopic && onSelectTopic(topic)}
                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
              >
                #{topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto w-full md:w-auto justify-end pt-2 md:pt-0 border-t border-[var(--color-rule-subtle)] md:border-t-0">
        <button
          type="button"
          onClick={handleCopyLink}
          data-thock="button"
          title="Copy GitHub URL"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-muted)] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-500" />
              <span className="text-emerald-500 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>

        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-thock="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-ink)] text-[var(--color-paper-card)] dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
        >
          <GithubLogo size={13} weight="fill" />
          <span>Repo</span>
          <ArrowSquareOut size={12} weight="bold" />
        </a>
      </div>
    </div>
  );
}
