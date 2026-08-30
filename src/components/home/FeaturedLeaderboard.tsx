'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { CaretUp, CaretDown, ArrowRight, Fire, ChartLineUp } from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { mockResources } from '@/lib/mockData';
import { getStoredDownloads } from '@/lib/downloadStore';
import { getLiveResources } from '@/lib/resourceStore';

type TimeFilter = 'today' | 'week' | 'month' | 'all';

interface FeaturedLeaderboardProps {
  resources?: Resource[];
}

function LeaderboardItemCard({
  resource,
  rank,
  liveDownloads,
  previousRank,
}: {
  resource: Resource;
  rank: number;
  liveDownloads: number;
  previousRank: number;
}) {
  const officeName = resource.department?.abbreviation || resource.source_name || 'Academic';
  const categoryName = resource.category?.name || 'General';

  // Format Icon
  const firstLetter = resource.title.trim().charAt(0).toUpperCase();

  // Rank movement
  const rankDiff = previousRank - rank; // positive means climbed up

  return (
    <Link
      href={`/resources/${resource.slug}`}
      data-thock="card"
      className="group relative flex items-center justify-between gap-3 rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-3.5 sm:p-4 transition-all duration-200 ease-out hover:bg-[var(--color-primary-subtle)]/30 hover:border-[var(--color-primary)]/40 hover:shadow-xs cursor-pointer block text-left"
    >
      {/* Left side: Rank + Squircle Icon + Text info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rank Number Badge */}
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
          rank === 1
            ? 'bg-amber-400 text-slate-950 shadow-xs'
            : rank === 2
            ? 'bg-slate-300 text-slate-900'
            : rank === 3
            ? 'bg-amber-700/20 text-amber-800 dark:text-amber-300'
            : 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
        }`}>
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
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
            <span className="truncate">{categoryName}</span>
            <span>•</span>
            <span className="text-[var(--color-ink-muted)] shrink-0">{officeName}</span>
          </div>

          {/* Title */}
          <h3 className="mt-0.5 text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors duration-200 tracking-tight truncate">
            {resource.title}
          </h3>

          {/* One-liner summary */}
          <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)] truncate">
            {resource.description || 'Verified university clearance form and document.'}
          </p>
        </div>
      </div>

      {/* Right side: Trending + Live Downloads */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Rank Trend Indicator */}
        <div className="flex items-center gap-0.5 font-mono text-[11px] font-bold">
          {rankDiff > 0 ? (
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              <CaretUp size={12} weight="bold" />
              <span>+{rankDiff}</span>
            </span>
          ) : rankDiff < 0 ? (
            <span className="flex items-center text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
              <CaretDown size={12} weight="bold" />
              <span>{rankDiff}</span>
            </span>
          ) : (
            <span className="flex items-center text-[var(--color-ink-muted)] bg-[var(--color-paper-muted)] px-2 py-0.5 rounded-full text-[10px]">
              • Hot
            </span>
          )}
        </div>

        {/* Real-Time Total Downloads Box */}
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] px-3 py-1 min-w-[54px] shadow-2xs group-hover:border-[var(--color-primary)]/40 transition-colors">
          <CaretUp size={12} weight="fill" className="text-emerald-600" />
          <span className="font-mono text-xs font-bold text-[var(--color-ink)]">
            {liveDownloads.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedLeaderboard({
  resources: initialResources,
}: FeaturedLeaderboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [liveList, setLiveList] = useState<Resource[]>(initialResources || mockResources);
  const [downloadsMap, setDownloadsMap] = useState<Record<string, number>>({});

  const refreshData = () => {
    setLiveList(getLiveResources());
    setDownloadsMap(getStoredDownloads());
  };

  useEffect(() => {
    refreshData();

    const handleCatalogUpdate = () => refreshData();
    const handleDownloadUpdate = () => setDownloadsMap(getStoredDownloads());

    window.addEventListener('resursee_catalog_updated', handleCatalogUpdate);
    window.addEventListener('resursee-download-updated', handleDownloadUpdate);
    window.addEventListener('storage', handleCatalogUpdate);

    return () => {
      window.removeEventListener('resursee_catalog_updated', handleCatalogUpdate);
      window.removeEventListener('resursee-download-updated', handleDownloadUpdate);
      window.removeEventListener('storage', handleCatalogUpdate);
    };
  }, []);

  // Compute live download count for each resource
  const getResourceDownloads = (r: Resource) => {
    return downloadsMap[r.id] !== undefined ? downloadsMap[r.id] : r.download_count;
  };

  // Dynamically sorted leaderboard based on real-time downloads
  const rankedItems = useMemo(() => {
    const sorted = [...liveList].sort((a, b) => {
      const countA = getResourceDownloads(a);
      const countB = getResourceDownloads(b);
      return countB - countA;
    });
    return sorted.slice(0, 8);
  }, [liveList, downloadsMap]);

  const totalDownloads = useMemo(() => {
    return liveList.reduce((acc, curr) => acc + getResourceDownloads(curr), 0);
  }, [liveList, downloadsMap]);

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Community Leaderboard
            </h2>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex items-center gap-1 rounded-[16px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-1 shadow-2xs">
            {(['today', 'week', 'month', 'all'] as TimeFilter[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeFilter(tf)}
                className={`rounded-[12px] px-3 py-1.5 font-mono text-xs font-bold capitalize transition-all cursor-pointer ${
                  timeFilter === tf
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                {tf === 'all' ? 'All-Time' : tf}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {rankedItems.map((resource, index) => {
            const currentRank = index + 1;
            const liveDownloads = getResourceDownloads(resource);
            // Dynamic previous rank baseline to illustrate trend
            const baseRank = liveList.findIndex((r) => r.id === resource.id) + 1;

            return (
              <LeaderboardItemCard
                key={resource.id}
                resource={resource}
                rank={currentRank}
                liveDownloads={liveDownloads}
                previousRank={baseRank || currentRank}
              />
            );
          })}
        </div>

        {/* View full directory link */}
        <div className="mt-8 text-center">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] px-6 py-2.5 text-xs font-bold text-[var(--color-ink)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <span>Explore Complete Document Catalog ({liveList.length} Files)</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
