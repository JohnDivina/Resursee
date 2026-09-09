'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface VisitorStats {
  activeVisitors: number;
  totalVisitors: number;
}

export default function VisitorPresenceWidget() {
  const [stats, setStats] = useState<VisitorStats>({
    activeVisitors: 1,
    totalVisitors: 1482,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Send heartbeat and retrieve live metrics
  const pingPresence = async () => {
    try {
      const res = await fetch('/api/analytics/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          activeVisitors: data.activeVisitors || 1,
          totalVisitors: data.totalVisitors || 1482,
        });
      }
    } catch {
      // Graceful fallback on network glitch
    }
  };

  useEffect(() => {
    // Initial ping on mount
    pingPresence();

    // Heartbeat every 30 seconds while window is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        pingPresence();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pingPresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Promptly deregister presence when tab/window closes
    const handleUnload = () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/visitors');
        } else {
          fetch('/api/analytics/visitors', { method: 'DELETE', keepalive: true }).catch(() => {});
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    // Close on outside click for touch devices
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsPinned(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isOpen = isHovered || isPinned;

  return (
    <div
      ref={widgetRef}
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        type="button"
        layout
        onClick={() => setIsPinned(!isPinned)}
        aria-label={`Live site visitors: ${stats.activeVisitors} online, ${stats.totalVisitors} total`}
        title={`Live presence: ${stats.activeVisitors} visiting now • ${stats.totalVisitors.toLocaleString()} total visitors`}
        className={`group relative flex h-9 items-center overflow-hidden border text-[var(--color-ink)] transition-colors cursor-pointer select-none ${
          isOpen
            ? 'rounded-full px-2.5 sm:px-3 gap-2 border-emerald-500/50 bg-[var(--color-paper-card)] shadow-md shadow-emerald-500/5'
            : 'w-9 justify-center rounded-full border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:border-emerald-500/60 hover:bg-[var(--color-paper-card)] shadow-2xs'
        }`}
        transition={{
          type: 'spring',
          stiffness: 460,
          damping: 30,
          mass: 0.8,
        }}
      >
        {/* Organic Online Beacon / Radar Pulse */}
        <div className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
        </div>

        {/* Codenotch Notch-Style Expansion */}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key="notch-content"
              initial={{ opacity: 0, width: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, width: 'auto', filter: 'blur(0px)' }}
              exit={{ opacity: 0, width: 0, filter: 'blur(4px)' }}
              transition={{
                duration: 0.18,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-center gap-2 text-xs whitespace-nowrap overflow-hidden pr-0.5 select-none"
            >
              {/* Active Online Count */}
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight text-xs">
                  {stats.activeVisitors}
                </span>
                <span className="text-[10.5px] font-semibold text-[var(--color-ink-muted)]">
                  visiting
                </span>
              </div>

              {/* Minimal Divider Dot */}
              <span className="h-1 w-1 rounded-full bg-[var(--color-rule-strong)]" />

              {/* Total Visitors Count */}
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-[var(--color-ink)] font-mono tracking-tight text-xs">
                  {stats.totalVisitors.toLocaleString()}
                </span>
                <span className="text-[10.5px] font-medium text-[var(--color-ink-muted)]">
                  total
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
