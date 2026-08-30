'use client';

import React from 'react';
import { motion } from 'motion/react';

interface LoaderOneProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoaderOne({ className = '', size = 'md' }: LoaderOneProps) {
  const sizeMap = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const dotSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className={`${dotSize} rounded-full bg-[var(--color-primary)] shadow-[0_0_12px_var(--color-primary-glow)]`}
          animate={{
            scale: [1, 1.45, 1],
            opacity: [0.35, 1, 0.35],
            y: [0, -4, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function FullscreenLoader({ message = 'Loading Resursee...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--color-paper)]/85 backdrop-blur-md transition-opacity">
      <div className="relative flex flex-col items-center justify-center">
        {/* Outer ambient glow ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="h-20 w-20 rounded-full border-2 border-dashed border-[var(--color-primary)] opacity-40 mb-6"
        />

        {/* Centered LoaderOne */}
        <div className="absolute top-6">
          <LoaderOne size="md" />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-ink-muted)]"
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}
