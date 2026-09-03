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

export const LoaderTwo = () => {
  const transition = (x: number) => {
    return {
      duration: 2,
      repeat: Infinity,
      repeatType: 'loop' as const,
      delay: x * 0.2,
      ease: 'easeInOut' as const,
    };
  };
  return (
    <div className="flex items-center">
      <motion.div
        transition={transition(0)}
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        className="h-4 w-4 rounded-full bg-neutral-200 shadow-md dark:bg-neutral-500"
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0.4)}
        className="h-4 w-4 -translate-x-2 rounded-full bg-neutral-200 shadow-md dark:bg-neutral-500"
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0.8)}
        className="h-4 w-4 -translate-x-4 rounded-full bg-neutral-200 shadow-md dark:bg-neutral-500"
      />
    </div>
  );
};

export const LoaderThree = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-20 w-20 stroke-neutral-500 [--fill-final:var(--color-yellow-300)] [--fill-initial:var(--color-neutral-50)] dark:stroke-neutral-100 dark:[--fill-final:var(--color-yellow-500)] dark:[--fill-initial:var(--color-neutral-800)]"
    >
      <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <motion.path
        initial={{ pathLength: 0, fill: 'var(--fill-initial)' }}
        animate={{ pathLength: 1, fill: 'var(--fill-final)' }}
        transition={{
          duration: 2,
          ease: 'easeInOut' as const,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
      />
    </motion.svg>
  );
};

export const LoaderFour = ({ text = 'Loading...' }: { text?: string }) => {
  return (
    <div className="relative font-bold text-black [perspective:1000px] dark:text-white">
      <motion.span
        animate={{
          skewX: [0, -40, 0],
          scaleX: [1, 2, 1],
        }}
        transition={{
          duration: 0.05,
          repeat: Infinity,
          repeatType: 'reverse',
          repeatDelay: 2,
          ease: 'linear' as const,
          times: [0, 0.2, 0.5, 0.8, 1],
        }}
        className="relative z-20 inline-block"
      >
        {text}
      </motion.span>
    </div>
  );
};

export const LoaderFive = ({ text, className = '' }: { text: string; className?: string }) => {
  return (
    <div className={`font-sans font-bold [--shadow-color:var(--color-neutral-500)] dark:[--shadow-color:var(--color-neutral-100)] ${className}`}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.1, 1],
            textShadow: [
              '0 0 0 var(--shadow-color)',
              '0 0 1px var(--shadow-color)',
              '0 0 0 var(--shadow-color)',
            ],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'loop',
            delay: i * 0.05,
            ease: 'easeInOut' as const,
            repeatDelay: 2,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  );
};

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
