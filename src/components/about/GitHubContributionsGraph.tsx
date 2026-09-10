'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GithubLogo, ArrowSquareOut } from '@phosphor-icons/react';
import initialData from '@/data/github_contributions.json';

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface GitHubData {
  total: {
    lastYear: number;
    [key: string]: number;
  };
  contributions: ContributionDay[];
}

export default function GitHubContributionsGraph() {
  const [data, setData] = useState<GitHubData>(initialData as GitHubData);
  const [hoveredDay, setHoveredDay] = useState<{
    day: ContributionDay;
    x: number;
    y: number;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Background revalidation with live API
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveContributions() {
      try {
        const res = await fetch('/api/github/contributions');
        if (res.ok) {
          const freshData = await res.json();
          if (isMounted && freshData?.total && Array.isArray(freshData?.contributions)) {
            setData(freshData);
          }
        }
      } catch {
        // keep using cached initialData
      }
    }
    fetchLiveContributions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-scroll to the right on mobile so latest contributions are in view
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [data]);

  // Group contributions into 7-day columns (weeks)
  const weeks: ContributionDay[][] = [];
  let currentWeek: ContributionDay[] = [];

  // Pad the first week if the first day does not start on Sunday
  if (data.contributions.length > 0) {
    const firstDate = new Date(data.contributions[0].date + 'T00:00:00');
    const firstDayOfWeek = firstDate.getDay(); // 0 = Sun, 6 = Sat
    for (let p = 0; p < firstDayOfWeek; p++) {
      currentWeek.push({ date: '', count: 0, level: -1 }); // placeholder
    }
  }

  for (const day of data.contributions) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Calculate month labels positioned along the columns
  const monthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, colIdx) => {
    const validDay = week.find((d) => d.date && d.level >= 0);
    if (validDay) {
      const d = new Date(validDay.date + 'T00:00:00');
      const m = d.getMonth();
      if (m !== lastMonth && colIdx < weeks.length - 2) {
        monthLabels.push({
          label: d.toLocaleString('en-US', { month: 'short' }),
          colIndex: colIdx,
        });
        lastMonth = m;
      }
    }
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Authentic GitHub contribution square color palette styled with
   * clean monochrome neutral tones (Apple / Linear minimal standard).
   */
  const getSquareColorClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#e4e4e7] dark:bg-[#262626] border border-black/5 dark:border-white/5';
      case 2:
        return 'bg-[#a1a1aa] dark:bg-[#525252] border border-black/5 dark:border-white/5';
      case 3:
        return 'bg-[#52525b] dark:bg-[#a1a1aa] border border-black/5 dark:border-white/5';
      case 4:
        return 'bg-[#18181b] dark:bg-white border border-black/5 dark:border-white/10';
      case 0:
      default:
        return 'bg-[#f4f4f5] dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]';
    }
  };

  return (
    <section className="mt-16 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
            GitHub Contributions
          </h2>
          <span className="flex h-2 w-2 rounded-full bg-neutral-600 dark:bg-neutral-300" />
        </div>

        <a
          href="https://github.com/JohnDivina"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] hover:border-[var(--color-primary)] transition-all cursor-pointer"
        >
          <GithubLogo size={15} weight="bold" />
          <span>@JohnDivina</span>
          <ArrowSquareOut size={12} className="opacity-60" />
        </a>
      </div>

      {/* GitHub Calendar Card (Matches Screenshot & GitHub Look) */}
      <div className="relative rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Horizontal Scroll Area */}
        <div
          ref={scrollContainerRef}
          className="relative overflow-x-auto pb-2 scrollbar-none select-none"
        >
          <div className="inline-block min-w-full">
            {/* Months Header Row */}
            <div className="flex text-[10px] font-mono font-medium text-[var(--color-ink-muted)] mb-2 pl-7 sm:pl-8">
              {weeks.map((_, colIdx) => {
                const month = monthLabels.find((m) => m.colIndex === colIdx);
                return (
                  <div
                    key={colIdx}
                    className="w-[11px] sm:w-[12px] mr-[3px] sm:mr-[3.5px] shrink-0 text-left"
                  >
                    {month ? (
                      <span className="inline-block whitespace-nowrap">{month.label}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Matrix Grid: Left Day Labels + Columns of GitHub Squares */}
            <div className="flex items-start">
              {/* Day Labels Column: Mon, Wed, Fri aligned with rows 1, 3, 5 */}
              <div className="flex flex-col text-[9.5px] font-mono text-[var(--color-ink-muted)] opacity-70 shrink-0 select-none pr-2.5 sm:pr-3">
                <div className="h-[11px] sm:h-[12px] mb-[3px] sm:mb-[3.5px]" />
                <div className="h-[11px] sm:h-[12px] mb-[3px] sm:mb-[3.5px] flex items-center">
                  <span>Mon</span>
                </div>
                <div className="h-[11px] sm:h-[12px] mb-[3px] sm:mb-[3.5px]" />
                <div className="h-[11px] sm:h-[12px] mb-[3px] sm:mb-[3.5px] flex items-center">
                  <span>Wed</span>
                </div>
                <div className="h-[11px] sm:h-[12px] mb-[3px] sm:mb-[3.5px]" />
                <div className="h-[11px] sm:h-[12px] mb-[3px] sm:mb-[3.5px] flex items-center">
                  <span>Fri</span>
                </div>
                <div className="h-[11px] sm:h-[12px]" />
              </div>

              {/* 53 Columns of Weeks */}
              <div className="flex gap-[3px] sm:gap-[3.5px]">
                {weeks.map((week, colIdx) => (
                  <div
                    key={colIdx}
                    className="flex flex-col gap-[3px] sm:gap-[3.5px] shrink-0"
                  >
                    {week.map((day, rowIdx) => {
                      if (day.level < 0) {
                        return (
                          <div
                            key={rowIdx}
                            className="w-[11px] h-[11px] sm:w-[12px] sm:h-[12px]"
                          />
                        );
                      }

                      const colorClass = getSquareColorClass(day.level);

                      return (
                        <div
                          key={rowIdx}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredDay({
                              day,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] rounded-[2.5px] sm:rounded-[3px] cursor-pointer transition-all duration-150 hover:ring-1.5 hover:ring-black/40 dark:hover:ring-white/60 hover:scale-125 z-0 hover:z-10 ${colorClass}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Learn how we count contributions + Legend (Exact GitHub Look) */}
        <div className="mt-5 pt-3.5 border-t border-[var(--color-rule-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Left: Summary */}
          <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)]">
            <span className="font-semibold text-[var(--color-ink)]">
              {data.total.lastYear.toLocaleString()} contributions in the last year
            </span>
          </div>

          {/* Right: Authentic GitHub Square Legend (Less -> More) */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--color-ink-muted)]">
            <span>Less</span>
            <div className="flex items-center gap-[3px]">
              <div className="w-[10px] h-[10px] rounded-[2px] bg-[#f4f4f5] dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-[#e4e4e7] dark:bg-[#262626]" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-[#a1a1aa] dark:bg-[#525252]" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-[#52525b] dark:bg-[#a1a1aa]" />
              <div className="w-[10px] h-[10px] rounded-[2px] bg-[#18181b] dark:bg-white" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Floating Interactive Tooltip */}
        <AnimatePresence>
          {hoveredDay && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 2, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: hoveredDay.x,
                top: hoveredDay.y - 10,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                zIndex: 100,
              }}
              className="rounded-lg border border-[var(--color-rule-strong)] bg-[#0f172a]/95 px-2.5 py-1 text-center text-xs font-mono shadow-xl backdrop-blur-md whitespace-nowrap"
            >
              <p className="font-bold text-white text-[11px]">
                {hoveredDay.day.count === 0
                  ? 'No contributions'
                  : `${hoveredDay.day.count} contribution${hoveredDay.day.count === 1 ? '' : 's'}`}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {formatDate(hoveredDay.day.date)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
