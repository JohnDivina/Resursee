'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ContainerTextFlipProps {
  words: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
}

export function ContainerTextFlip({
  words,
  interval = 2400,
  className,
  textClassName,
}: ContainerTextFlipProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!words || words.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  const currentWord = words[currentIndex] || '';

  return (
    <motion.span
      layout
      transition={{
        layout: { duration: 0.35, ease: [0.23, 1, 0.32, 1] },
      }}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.06] px-3 sm:px-4 py-0.5 sm:py-1 align-baseline shadow-2xs transition-colors',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={currentWord}
          initial={{
            y: 24,
            opacity: 0,
            rotateX: 75,
            filter: 'blur(6px)',
          }}
          animate={{
            y: 0,
            opacity: 1,
            rotateX: 0,
            filter: 'blur(0px)',
          }}
          exit={{
            y: -24,
            opacity: 0,
            rotateX: -75,
            filter: 'blur(6px)',
          }}
          transition={{
            duration: 0.4,
            ease: [0.25, 1, 0.5, 1],
          }}
          className={cn(
            'inline-block font-extrabold text-[var(--color-primary)] tracking-tight select-none',
            textClassName
          )}
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
