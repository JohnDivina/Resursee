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

interface StarredRepoCardProps {
  repo: StarredRepo;
  onSelectTopic?: (topic: string) => void;
  onCopyNotice?: (text: string) => void;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function getLanguageColor(_language: string): string {
  return 'bg-neutral-500 dark:bg-neutral-400';
}

export default function StarredRepoCard({
  repo,
  onSelectTopic,
  onCopyNotice,
}: StarredRepoCardProps) {
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
      className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 md:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-lg dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
    >
      <div>
        {/* Top bar: Owner avatar, Full Name & Stars */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={repo.owner.avatarUrl}
              alt={repo.owner.login}
              className="h-7 w-7 rounded-lg border border-[var(--color-rule)] shrink-0 object-cover bg-[var(--color-paper-muted)]"
              loading="lazy"
            />
            <div className="min-w-0">
              <span className="text-xs font-mono text-[var(--color-ink-muted)] block truncate">
                {repo.owner.login}
              </span>
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] dark:group-hover:text-white transition-colors tracking-tight truncate block"
              >
                {repo.name}
              </a>
            </div>
          </div>

          {/* Star & Fork Counts */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <Star size={12} weight="fill" className="text-neutral-500 dark:text-neutral-400" />
              <span>{formatNumber(repo.stargazersCount)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm text-[var(--color-ink-muted)] leading-relaxed line-clamp-3 min-h-[3.6rem]">
          {repo.description || 'No description provided.'}
        </p>

        {/* Topics / Tags */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {repo.topics.slice(0, 4).map((topic) => (
              <button
                key={topic}
                type="button"
                data-thock="button"
                onClick={() => onSelectTopic && onSelectTopic(topic)}
                className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer border border-[var(--color-rule-subtle)]"
              >
                #{topic}
              </button>
            ))}
            {repo.topics.length > 4 && (
              <span className="text-[10px] font-mono text-[var(--color-ink-muted)] self-center px-1">
                +{repo.topics.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Language, Forks & Actions */}
      <div className="mt-5 pt-4 border-t border-[var(--color-rule-subtle)] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[var(--color-ink-muted)] font-mono text-[11px]">
          {/* Language indicator */}
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${getLanguageColor(
                  repo.language
                )}`}
              />
              <span>{repo.language}</span>
            </div>
          )}

          {/* Fork count */}
          {repo.forksCount > 0 && (
            <div className="flex items-center gap-1" title="Forks">
              <GitFork size={12} />
              <span>{formatNumber(repo.forksCount)}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyLink}
            data-thock="button"
            title="Copy GitHub URL"
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
                <span className="hidden sm:inline text-[11px]">Copy</span>
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
    </div>
  );
}
