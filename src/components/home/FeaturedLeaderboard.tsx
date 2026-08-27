'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CaretUp, ArrowRight } from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { mockResources } from '@/lib/mockData';
import { useRealtimeDownloadCount } from '@/lib/downloadStore';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

interface FeaturedLeaderboardProps {
  resources?: Resource[];
}

function LeaderboardItemCard({
  resource,
  rank,
  trendingDelta,
}: {
  resource: Resource;
  rank: number;
  trendingDelta: number;
}) {
  const realtimeCount = useRealtimeDownloadCount(resource.id, resource.download_count);
  const officeName = resource.department?.abbreviation || resource.source_name || 'Academic';
  const categoryName = resource.category?.name || 'General';

  // Format Icon
  const firstLetter = resource.title.trim().charAt(0).toUpperCase();

  return (
    <Link
      href={`/resources/${resource.slug}`}
      data-thock="card"
      className="group relative flex items-center justify-between gap-3 rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-3.5 sm:p-4 transition-all duration-200 ease-out hover:bg-emerald-500/[0.03] hover:border-emerald-500/40 hover:shadow-xs cursor-pointer block text-left"
    >
      {/* Left side: Rank + Squircle Icon + Text info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rank Number Badge */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100/90 dark:bg-emerald-950/70 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {rank}
        </div>

        {/* Squircle Format / App Icon */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] font-bold text-base text-white shadow-2xs transition-transform duration-200 group-hover:scale-105 select-none ${
            resource.file_format === 'PDF'
              ? 'bg-rose-600'
              : resource.file_format === 'DOCX'
              ? 'bg-blue-600'
              : resource.file_format === 'XLSX'
              ? 'bg-emerald-600'
              : 'bg-indigo-600'
          }`}
        >
          {resource.file_format === 'PDF' ? (
            <span className="font-extrabold text-sm">P</span>
          ) : resource.file_format === 'DOCX' ? (
            <span className="font-extrabold text-sm">W</span>
          ) : resource.file_format === 'XLSX' ? (
            <span className="font-extrabold text-sm">X</span>
          ) : (
            <span>{firstLetter}</span>
          )}
        </div>

        {/* Text details */}
        <div className="min-w-0 flex-1">
          {/* Category & Department Header */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <span className="truncate">{categoryName}</span>
            <span>•</span>
            <span className="text-[var(--color-ink-muted)] shrink-0">{officeName}</span>
          </div>

          {/* Title */}
          <h3 className="mt-0.5 text-sm font-bold text-[var(--color-ink)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 tracking-tight truncate">
            {resource.title}
          </h3>

          {/* One-liner summary */}
          <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)] truncate">
            {resource.description || 'Verified university clearance form and document.'}
          </p>
        </div>
      </div>

      {/* Right side: Trending + Upvotes */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Trending pill badge */}
        <span className="rounded-full bg-emerald-100/90 dark:bg-emerald-950/70 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          +{trendingDelta}
        </span>

        {/* Upvote Box */}
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] px-2.5 py-1 min-w-[42px] shadow-2xs group-hover:border-emerald-500/40 transition-colors">
          <CaretUp size={12} weight="fill" className="text-emerald-600" />
          <span className="font-mono text-[11px] font-bold text-[var(--color-ink)]">
            {realtimeCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedLeaderboard({
  resources = mockResources,
}: FeaturedLeaderboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

  const totalDownloads = useMemo(() => {
    return resources.reduce((acc, curr) => acc + curr.download_count, 0);
  }, [resources]);

  // Ranked list of top 8 resources
  const rankedItems = useMemo(() => {
    const sorted = [...resources].sort((a, b) => b.download_count - a.download_count);
    return sorted.slice(0, 8);
  }, [resources]);

  // Dynamic simulated delta based on time filter
  const getTrendingDelta = (index: number) => {
    if (timeFilter === 'today') return Math.max(1, 8 - index * 2);
    if (timeFilter === 'week') return Math.max(2, 24 - index * 3);
    if (timeFilter === 'month') return Math.max(5, 85 - index * 10);
    return Math.max(10, 150 - index * 18);
  };

  return (
    <section className="py-12 sm:py-16 bg-[var(--color-paper)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Main Leaderboard Card Container */}
        <div className="overflow-hidden rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] shadow-[0_2px_16px_rgba(0,0,0,0.03)] transition-all">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-rule-subtle)] p-5 sm:p-7 bg-[var(--color-paper-card)]">
            <div>
              <span className="text-xs font-semibold text-[var(--color-ink-muted)]">
                Community leaderboard
              </span>
              <h2 className="mt-0.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
                {totalDownloads.toLocaleString()}{' '}
                <span className="font-semibold text-lg sm:text-xl text-[var(--color-ink-secondary)]">
                  community upvotes
                </span>
              </h2>
            </div>

            {/* Time Filter Pill Switcher */}
            <div className="flex items-center rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-1 text-xs font-semibold">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'This week' },
                  { id: 'month', label: 'This month' },
                  { id: 'all', label: 'All time' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeFilter(tab.id)}
                  className={`rounded-full px-3 py-1 transition-all ${
                    timeFilter === tab.id
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Ranked Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 p-4 sm:p-6 bg-[var(--color-paper-card)]">
            {rankedItems.map((item, index) => (
              <LeaderboardItemCard
                key={item.id}
                resource={item}
                rank={index + 1}
                trendingDelta={getTrendingDelta(index)}
              />
            ))}
          </div>

          {/* Leaderboard Footer */}
          <div className="border-t border-[var(--color-rule-subtle)] bg-[var(--color-paper-muted)]/40 p-4 sm:p-5 text-center">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <span>Explore all university resources in directory</span>
              <ArrowRight size={15} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
