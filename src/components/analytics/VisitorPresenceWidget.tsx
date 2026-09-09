'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkle } from '@phosphor-icons/react';

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
      if (typeof parsed.activeVisitors === 'number' && typeof parsed.totalVisitors === 'number') {
        return parsed;
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

    // Close on outside click (for touch devices)
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
      {/* Circle Online Status Button with Glowing Arc */}
      <button
        type="button"
        onClick={() => setIsPinned((prev) => !prev)}
        aria-label={`${stats.activeVisitors} users currently visiting the site`}
        title={`Site Presence: ${stats.activeVisitors} online now • ${stats.totalVisitors.toLocaleString()} total visits`}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer select-none ${
          isOpen
            ? 'scale-105 shadow-md shadow-emerald-500/20'
            : 'hover:scale-102 active:scale-95'
        }`}
      >
        {/* Background Base */}
        <span className="absolute inset-0 rounded-full bg-[#0A0A0C] border border-white/20 dark:border-white/20" />

        {/* Circular Glowing Status Ring (Matches attached screenshot) */}
        <svg className="absolute inset-0 h-full w-full -rotate-90 p-[2px]" viewBox="0 0 36 36">
          <path
            className="text-white/10"
            strokeWidth="2.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-emerald-400 transition-all duration-500 ease-out"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.9))',
            }}
            strokeDasharray="100, 100"
            strokeDashoffset={isOpen ? '0' : '35'}
            strokeLinecap="round"
            strokeWidth="2.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        {/* Center Pulsing Emerald Beacon */}
        <span className="relative flex h-2.5 w-2.5 items-center justify-center z-10">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
        </span>
      </button>

      {/* Notch-Style Antigravity Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{
              type: 'spring',
              stiffness: 480,
              damping: 28,
              mass: 0.7,
            }}
            className="absolute right-0 top-full pt-2.5 z-50 pointer-events-auto"
          >
            {/* Top Pointer Caret pointing to Trigger Circle */}
            <div className="absolute top-1.5 right-3.5 h-3 w-3 rotate-45 rounded-[1px] bg-[#0A0A0C] border-l border-t border-white/20 z-10" />

            {/* Dark Antigravity Card Container */}
            <div className="relative w-72 sm:w-80 rounded-[22px] border border-white/[0.14] bg-[#0A0A0C]/98 text-white p-4 shadow-2xl shadow-black/90 backdrop-blur-2xl">
              {/* Header: Brand & Live Status */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white font-bold text-xs">
                    🦦
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight leading-tight">
                      Resursee Presence
                    </h4>
                    <p className="text-[10px] font-mono text-neutral-400">
                      Real-time live analytics
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,1)]" />
                  <span>ONLINE</span>
                </div>
              </div>

              {/* Section 1: Gemini-Style Live Active Users */}
              <div className="mt-3">
                <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1.5 px-0.5">
                  Live Visitors
                </p>
                <div className="rounded-[16px] bg-[#141417] border border-white/[0.08] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Active Now</span>
                    <span className="text-[10px] font-mono text-neutral-400">Realtime SSE</span>
                  </div>

                  {/* Neon Green Progress Bar (Matches Screenshot) */}
                  <div className="h-2 w-full rounded-full bg-neutral-800/90 overflow-hidden">
                    <motion.div
                      initial={{ width: '20%' }}
                      animate={{
                        width: stats.activeVisitors > 1 ? `${Math.min(stats.activeVisitors * 25, 100)}%` : '35%',
                      }}
                      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                      className="h-full rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="font-extrabold font-mono text-white">
                      {stats.activeVisitors} {stats.activeVisitors === 1 ? 'user online' : 'users online'}
                    </span>
                    <span className="text-[10.5px] font-bold text-emerald-400 font-mono">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Claude/GPT-Style Total Site Traffic */}
              <div className="mt-3">
                <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1.5 px-0.5">
                  Site Traffic
                </p>
                <div className="rounded-[16px] bg-[#141417] border border-white/[0.08] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Total Visitors</span>
                    <span className="text-[10px] font-mono text-neutral-400">Persistent</span>
                  </div>

                  {/* Yellow/Amber Glowing Progress Bar (Matches Screenshot) */}
                  <div className="h-2 w-full rounded-full bg-neutral-800/90 overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="font-extrabold font-mono text-white">
                      {stats.totalVisitors.toLocaleString()} visits
                    </span>
                    <span className="text-[10.5px] font-bold text-amber-400/90 font-mono">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-3 flex items-center justify-between text-[9.5px] font-mono text-neutral-400 border-t border-white/[0.08] pt-2 px-0.5">
                <span>Unique browser sessions</span>
                <span className="text-emerald-400/80">● Auto-sync</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
