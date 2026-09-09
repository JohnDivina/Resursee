'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function VisitorPresenceWidget() {
  const [activeVisitors, setActiveVisitors] = useState<number>(1);
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
              setActiveVisitors(Math.max(data.activeVisitors, 1));
            }
          } catch {
            // Ignore keepalive or non-json comments
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect after 3 seconds on network interruption
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
      {/* Circle Online Status Button (Remains a sleek circle) */}
      <button
        type="button"
        onClick={() => setIsPinned((prev) => !prev)}
        aria-label={`${activeVisitors} users currently visiting the site`}
        title={`${activeVisitors} users visiting the site right now`}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer select-none ${
          isOpen
            ? 'border-emerald-500/60 bg-[var(--color-paper-card)] shadow-xs shadow-emerald-500/10 scale-102'
            : 'border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:border-emerald-500/60 hover:bg-[var(--color-paper-card)] shadow-2xs active:scale-95'
        }`}
      >
        {/* Organic Pulsing Online Beacon */}
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
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
            className="absolute right-0 top-full pt-2 z-50 whitespace-nowrap pointer-events-auto"
          >
            {/* Notch Pill Container */}
            <div className="flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-card)]/95 backdrop-blur-xl px-3.5 py-1.5 shadow-xl shadow-black/10 dark:shadow-black/40">
              {/* Inner Live Indicator */}
              <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
              </span>

              {/* Dynamic Realtime Active Visitors Count */}
              <div className="flex items-center gap-1.5 text-xs select-none">
                <motion.span
                  key={activeVisitors}
                  initial={{ scale: 1.25, color: '#10b981' }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400"
                >
                  {activeVisitors}
                </motion.span>
                <span className="font-semibold text-[11.5px] text-[var(--color-ink)]">
                  {activeVisitors === 1 ? 'user visiting the site' : 'users visiting the site'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
