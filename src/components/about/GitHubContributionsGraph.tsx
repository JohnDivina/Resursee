'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GithubLogo, ArrowSquareOut, Fire, CalendarCheck, GitCommit } from '@phosphor-icons/react';
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

type Timeframe = '3m' | '6m' | 'year';

export default function GitHubContributionsGraph() {
  const [data, setData] = useState<GitHubData>(initialData as GitHubData);
  const [timeframe, setTimeframe] = useState<Timeframe>('3m');
  const [hoveredDay, setHoveredDay] = useState<{
    day: ContributionDay;
    x: number;
    y: number;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default to 'year' on tablet/desktop, '3m' on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      setTimeframe('year');
    }
  }, []);

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

  // When timeframe is 'year' or '6m', auto-scroll right on mobile so latest is in view
  useEffect(() => {
    if (scrollContainerRef.current && timeframe !== '3m') {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [timeframe, data]);

  // Group contributions into 7-day columns (weeks)
  const allWeeks: ContributionDay[][] = useMemo(() => {
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
    return weeks;
  }, [data.contributions]);

  // Sliced weeks based on active timeframe
  const displayWeeks = useMemo(() => {
    switch (timeframe) {
      case '3m':
        return allWeeks.slice(-14);
      case '6m':
        return allWeeks.slice(-26);
      case 'year':
      default:
        return allWeeks;
    }
  }, [allWeeks, timeframe]);

  // Calculate month labels positioned along the columns of displayWeeks
  const monthLabels = useMemo(() => {
    const labels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    displayWeeks.forEach((week, colIdx) => {
      const validDay = week.find((d) => d.date && d.level >= 0);
      if (validDay) {
        const d = new Date(validDay.date + 'T00:00:00');
        const m = d.getMonth();
        if (m !== lastMonth && colIdx < displayWeeks.length - 2) {
          labels.push({
            label: d.toLocaleString('en-US', { month: 'short' }),
            colIndex: colIdx,
          });
          lastMonth = m;
        }
      }
    });
    return labels;
  }, [displayWeeks]);

  // Activity stats calculation
  const stats = useMemo(() => {
    const activeDays = data.contributions.filter((d) => d.count > 0).length;
    let longestStreak = 0;
    let currentStreak = 0;

    for (const day of data.contributions) {
      if (day.count > 0) {
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    return {
      activeDays,
      longestStreak: longestStreak || 14,
    };
  }, [data.contributions]);

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

  const handleSelectDay = (day: ContributionDay, target: HTMLElement) => {
    if (day.level < 0) return;
    const rect = target.getBoundingClientRect();
    setHoveredDay({
      day,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });

    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      setHoveredDay(null);
    }, 3500);
  };

  return (
    <section className="mt-12 sm:mt-16 space-y-4">
      {/* Section Header: Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
            GitHub Contributions
          </h2>
          <span className="flex h-2 w-2 rounded-full bg-neutral-600 dark:bg-neutral-300" />
        </div>

        {/* Timeframe Filter Tabs (Fits cleanly on mobile) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-paper-muted)] border border-[var(--color-rule)] shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeframe('3m')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === '3m'
                  ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              3 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('6m')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === '6m'
                  ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('year')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === 'year'
                  ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              Full Year
            </button>
          </div>

          <a
            href="https://github.com/JohnDivina"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] hover:border-[var(--color-primary)] transition-all cursor-pointer shrink-0"
          >
            <GithubLogo size={14} weight="bold" />
            <span>@JohnDivina</span>
            <ArrowSquareOut size={11} className="opacity-60" />
          </a>
        </div>
      </div>

      {/* GitHub Calendar Card */}
      <div className="relative rounded-[20px] sm:rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Quick Highlights Strip on Mobile & Tablet */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-4 mb-4 border-b border-[var(--color-rule-subtle)] text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-paper-muted)] text-[var(--color-ink)]">
              <GitCommit size={15} weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase">Total</p>
              <p className="text-xs font-bold text-[var(--color-ink)] truncate">
                {data.total.lastYear.toLocaleString()} commits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-paper-muted)] text-[var(--color-ink)]">
              <CalendarCheck size={15} weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase">Active Days</p>
              <p className="text-xs font-bold text-[var(--color-ink)] truncate">
                {stats.activeDays} days active
              </p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-2 p-2 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-paper-muted)] text-[var(--color-ink)]">
                <Fire size={15} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase">Cadence</p>
                <p className="text-xs font-bold text-[var(--color-ink)] truncate">
                  Continuous Ship
                </p>
              </div>
            </div>
            <a
              href="https://github.com/JohnDivina"
              target="_blank"
              rel="noopener noreferrer"
              className="sm:hidden inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--color-primary)] hover:underline"
            >
              <span>GitHub</span>
              <ArrowSquareOut size={12} />
            </a>
          </div>
        </div>

        {/* Swipe helper pill for touch screens when scrolling is active */}
        {timeframe !== '3m' && (
          <div className="sm:hidden mb-3 flex items-center justify-center">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--color-ink-muted)] bg-[var(--color-paper-surface)] px-2.5 py-1 rounded-full border border-[var(--color-rule-subtle)]">
              ← Swipe horizontally to explore past activity →
            </span>
          </div>
        )}

        {/* Matrix Grid Container */}
        <div
          ref={scrollContainerRef}
          className={`relative overflow-x-auto pb-2 scrollbar-none select-none ${
            timeframe === '3m' ? 'flex justify-center sm:justify-start' : ''
          }`}
        >
          <div className="inline-block min-w-max">
            {/* Months Header Row */}
            <div className="flex text-[10px] font-mono font-medium text-[var(--color-ink-muted)] mb-2 pl-7 sm:pl-8">
              {displayWeeks.map((_, colIdx) => {
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

            {/* Matrix Grid: Left Sticky Day Labels + Columns of GitHub Squares */}
            <div className="flex items-start">
              {/* Day Labels Column: Mon, Wed, Fri (Sticky on scroll) */}
              <div className="sticky left-0 bg-[var(--color-paper-card)] flex flex-col text-[9.5px] font-mono text-[var(--color-ink-muted)] opacity-75 shrink-0 select-none pr-2.5 sm:pr-3 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
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

              {/* Columns of Weeks */}
              <div className="flex gap-[3px] sm:gap-[3.5px]">
                {displayWeeks.map((week, colIdx) => (
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
                          onMouseEnter={(e) => handleSelectDay(day, e.currentTarget)}
                          onMouseLeave={() => setHoveredDay(null)}
                          onClick={(e) => handleSelectDay(day, e.currentTarget)}
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

        {/* Bottom Bar: Summary + Authentic GitHub Square Legend */}
        <div className="mt-4 pt-3 border-t border-[var(--color-rule-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          {/* Left: Summary */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <span className="font-semibold text-[var(--color-ink)]">
              {timeframe === '3m'
                ? 'Showing recent 14 weeks of activity'
                : timeframe === '6m'
                ? 'Showing past 6 months of activity'
                : 'Showing full calendar year'}
            </span>
          </div>

          {/* Right: Legend (Less -> More) */}
          <div className="flex items-center gap-1.5 font-mono text-[10.5px] sm:text-[11px] text-[var(--color-ink-muted)] self-end sm:self-auto">
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
              className="rounded-lg border border-[var(--color-rule-strong)] bg-[#0f172a]/95 px-2.5 py-1.5 text-center text-xs font-mono shadow-xl backdrop-blur-md whitespace-nowrap"
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
