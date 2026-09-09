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

  // Auto-scroll to the right on mobile so the latest streak is immediately in view
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
    // Check the first valid day in this week
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
   * Dot size & color styling corresponding to contribution level.
   * Matches the modern variable-diameter dot matrix design from developer portfolios.
   */
  const getDotStyle = (level: number) => {
    switch (level) {
      case 1:
        return {
          sizeClass: 'h-1.5 w-1.5 sm:h-2 sm:w-2',
          colorClass: 'bg-emerald-600/75 dark:bg-emerald-500/80',
        };
      case 2:
        return {
          sizeClass: 'h-2 w-2 sm:h-2.5 sm:w-2.5',
          colorClass: 'bg-emerald-600 dark:bg-emerald-400',
        };
      case 3:
        return {
          sizeClass: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
          colorClass: 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
        };
      case 4:
        return {
          sizeClass: 'h-3 w-3 sm:h-3.5 sm:w-3.5',
          colorClass:
            'bg-emerald-400 dark:bg-[#39d353] shadow-[0_0_10px_rgba(57,211,83,0.85)] ring-1.5 ring-emerald-400/40',
        };
      case 0:
      default:
        return {
          sizeClass: 'h-1 w-1 sm:h-1 sm:w-1',
          colorClass: 'bg-black/15 dark:bg-white/15',
        };
    }
  };

  return (
    <section className="mt-16 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              GitHub Activity & Contributions
            </h2>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
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

      {/* Main Glassmorphic Dot Matrix Card */}
      <div className="relative rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)]/85 backdrop-blur-xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Horizontal Scroll Area */}
        <div
          ref={scrollContainerRef}
          className="relative overflow-x-auto pb-2 scrollbar-none select-none"
        >
          <div className="inline-block min-w-full">
            {/* Months Header Row */}
            <div className="flex text-[10px] font-mono font-medium text-[var(--color-ink-muted)] mb-2.5 pl-6 sm:pl-7">
              {weeks.map((_, colIdx) => {
                const month = monthLabels.find((m) => m.colIndex === colIdx);
                return (
                  <div
                    key={colIdx}
                    className="w-3.5 sm:w-4 shrink-0 text-left"
                  >
                    {month ? (
                      <span className="inline-block whitespace-nowrap">{month.label}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Matrix Grid: Left Day Labels + Columns of Dots */}
            <div className="flex items-start">
              {/* Day Labels Column: Mon, Wed, Fri */}
              <div className="flex flex-col justify-between h-[105px] sm:h-[119px] pr-2.5 sm:pr-3 text-[9px] font-mono text-[var(--color-ink-muted)] opacity-60 shrink-0 select-none py-0.5">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* 53 Columns of Weeks */}
              <div className="flex gap-1 sm:gap-1.5">
                {weeks.map((week, colIdx) => (
                  <div
                    key={colIdx}
                    className="flex flex-col gap-1 sm:gap-1.5 w-3.5 sm:w-4 shrink-0 items-center justify-center"
                  >
                    {week.map((day, rowIdx) => {
                      if (day.level < 0) {
                        // Empty placeholder
                        return (
                          <div
                            key={rowIdx}
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center"
                          />
                        );
                      }

                      const { sizeClass, colorClass } = getDotStyle(day.level);

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
                          className="relative h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center cursor-pointer group"
                        >
                          <span
                            className={`rounded-full transition-all duration-200 group-hover:scale-135 ${sizeClass} ${colorClass}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Total Contributions Monospace + Legend (Matches Image 2 & 3!) */}
        <div className="mt-6 pt-4 border-t border-[var(--color-rule-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Monospace Uppercase Summary */}
          <div className="font-mono text-xs font-bold tracking-[0.14em] uppercase text-[var(--color-ink)] flex items-center gap-2">
            <span>
              {data.total.lastYear.toLocaleString()} CONTRIBUTIONS IN THE LAST YEAR
            </span>
          </div>

          {/* Minimalist Legend (Less -> More dots) */}
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-[var(--color-ink-muted)]">
            <span>Less</span>
            <div className="flex items-center gap-1.5 px-1 py-0.5 rounded-full bg-[var(--color-paper-muted)]">
              <span className="h-1 w-1 rounded-full bg-black/15 dark:bg-white/15" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600/75 dark:bg-emerald-500/80" />
              <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400 dark:bg-[#39d353] shadow-[0_0_6px_rgba(57,211,83,0.8)]" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Floating Tooltip */}
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
                top: hoveredDay.y - 12,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                zIndex: 100,
              }}
              className="rounded-xl border border-[var(--color-rule-strong)] bg-[#0f172a]/95 px-3 py-1.5 text-center text-xs font-mono shadow-xl backdrop-blur-md whitespace-nowrap"
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
