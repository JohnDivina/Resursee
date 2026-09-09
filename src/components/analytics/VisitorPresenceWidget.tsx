'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users } from '@phosphor-icons/react';

interface VisitorData {
  activeVisitors: number;
  totalVisitors: number;
}

function getInitialCachedStats(): VisitorData {
  if (typeof window === 'undefined') {
    return { activeVisitors: 1, totalVisitors: 1484 };
  }
  try {
    const cached = localStorage.getItem('resursee_presence_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (typeof parsed.activeVisitors === 'number') {
        return {
          activeVisitors: Math.max(parsed.activeVisitors, 1),
          totalVisitors: parsed.totalVisitors || 1484,
        };
      }
    }
  } catch {
    // ignore
  }
  return { activeVisitors: 1, totalVisitors: 1484 };
}

export default function VisitorPresenceWidget() {
  const [stats, setStats] = useState<VisitorData>(getInitialCachedStats);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real-time SSE connection for instantaneous presence updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      if (typeof window === 'undefined' || !window.EventSource) return;

      try {
        eventSource = new EventSource('/api/analytics/visitors/stream');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (typeof data.activeVisitors === 'number') {
              const updated = {
                activeVisitors: Math.max(data.activeVisitors, 1),
                totalVisitors: typeof data.totalVisitors === 'number' ? data.totalVisitors : stats.totalVisitors,
              };
              setStats(updated);
              try {
                localStorage.setItem('resursee_presence_cache', JSON.stringify(updated));
              } catch {
                // ignore
              }
            }
          } catch {
            // Ignore non-json comments
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connectSSE();
            }, 3000);
          }
        };
      } catch {
        // Fallback
      }
    };

    connectSSE();

    // Close on outside click (for mobile tap interactions)
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPinned(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isOpen = isHovered || isPinned;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Circle Online Status Button with Status Arc & Users Icon */}
      <button
        type="button"
        onClick={() => setIsPinned((prev) => !prev)}
        aria-label={`${stats.activeVisitors} users currently visiting the site`}
        title={`Live presence: ${stats.activeVisitors} visiting right now`}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer select-none ${
          isOpen
            ? 'scale-105 border-emerald-500/60 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/20'
            : 'hover:scale-105 hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/10 active:scale-95'
        }`}
      >
        {/* Background Base */}
        <span className="absolute inset-0 rounded-full bg-[var(--color-paper-surface)] dark:bg-[#0B0B0E] border border-[var(--color-rule-strong)] dark:border-white/[0.14] transition-colors" />

        {/* Circular Glowing Status Ring (Matches attached screenshot dial) */}
        <svg className="absolute inset-0 h-full w-full -rotate-90 p-[2.5px]" viewBox="0 0 36 36">
          <path
            className="text-black/[0.06] dark:text-white/[0.08]"
            strokeWidth="2.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-emerald-500 dark:text-emerald-400 transition-all duration-500 ease-out"
            style={{
              filter: 'drop-shadow(0 0 5px rgba(52, 211, 153, 0.85))',
            }}
            strokeDasharray="100, 100"
            strokeDashoffset={isOpen ? '0' : '28'}
            strokeLinecap="round"
            strokeWidth="2.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        {/* Center Icon: Users presence */}
        <div className="relative z-10 flex items-center justify-center">
          <Users
            size={14}
            weight="bold"
            className="text-[var(--color-ink-muted)] group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200"
          />
        </div>

        {/* Live Organic Pulsing Beacon Badge */}
        <span className="absolute top-0.5 right-0.5 z-20 flex h-2 w-2 items-center justify-center pointer-events-none">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,1)]" />
        </span>
      </button>

      {/* Codenotch Notch-Style Dropdown Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.94 }}
            transition={{
              type: 'spring',
              stiffness: 480,
              damping: 26,
              mass: 0.6,
            }}
            className="absolute right-0 top-full pt-2.5 z-50 whitespace-nowrap pointer-events-auto"
          >
            {/* Top Pointer Caret pointing up to the circle */}
            <div className="absolute top-1.5 right-3.5 h-2.5 w-2.5 rotate-45 rounded-[1px] bg-[var(--color-paper-card)] dark:bg-[#0A0A0C] border-l border-t border-black/[0.08] dark:border-white/[0.14] z-10" />

            {/* Notch Pill Container (Previous clean design) */}
            <div className="relative flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.14] bg-[var(--color-paper-card)]/95 dark:bg-[#0A0A0C]/95 backdrop-blur-xl px-3.5 py-1.5 shadow-xl shadow-black/10 dark:shadow-black/50">
              {/* Inner Live Indicator */}
              <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              </span>

              {/* Dynamic Realtime Active Visitors Count */}
              <div className="flex items-center gap-1.5 text-xs select-none">
                <motion.span
                  key={stats.activeVisitors}
                  initial={{ scale: 1.25, color: '#10b981' }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400"
                >
                  {stats.activeVisitors}
                </motion.span>
                <span className="font-semibold text-[11.5px] text-[var(--color-ink)] dark:text-white">
                  {stats.activeVisitors === 1 ? 'user visiting the site' : 'users visiting the site'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
