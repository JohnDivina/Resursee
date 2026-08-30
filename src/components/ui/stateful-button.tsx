'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, CircleNotch, WarningCircle } from '@phosphor-icons/react';

export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<any> | any;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  variant?: 'primary' | 'secondary' | 'emerald';
  minDuration?: number; // Minimum animation duration in ms (e.g. 1500ms)
}

export function Button({
  children,
  onClick,
  loadingText = 'Processing...',
  successText = 'Success!',
  errorText = 'Failed',
  variant = 'primary',
  minDuration = 1800,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const [status, setStatus] = useState<ButtonStatus>('idle');

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status === 'loading' || disabled) return;

    if (!onClick) {
      return;
    }

    setStatus('loading');
    const start = performance.now();

    try {
      await onClick(e);
      const elapsed = performance.now() - start;
      const remainingDelay = Math.max(minDuration - elapsed, 0);

      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
      }, 2200);
    } catch {
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
      }, 2500);
    }
  };

  const getVariantStyles = () => {
    if (status === 'success') {
      return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25';
    }
    if (status === 'error') {
      return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25';
    }

    switch (variant) {
      case 'secondary':
        return 'bg-[var(--color-ink)] dark:bg-white text-white dark:text-black hover:bg-[var(--color-primary)] dark:hover:bg-blue-400';
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md';
      case 'primary':
      default:
        return 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-md shadow-blue-500/20';
    }
  };

  return (
    <motion.button
      layout
      type={type}
      onClick={handleClick}
      disabled={disabled || status === 'loading'}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3.5 text-xs font-bold transition-colors select-none active:scale-95 disabled:opacity-60 cursor-pointer ${getVariantStyles()} ${className}`}
      {...(props as any)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.span>
        )}

        {status === 'loading' && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <CircleNotch size={16} weight="bold" />
            </motion.div>
            <span>{loadingText}</span>
          </motion.span>
        )}

        {status === 'success' && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="flex items-center gap-2 text-white"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.05 }}
            >
              <Check size={16} weight="bold" />
            </motion.div>
            <span>{successText}</span>
          </motion.span>
        )}

        {status === 'error' && (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="flex items-center gap-2 text-white"
          >
            <WarningCircle size={16} weight="bold" />
            <span>{errorText}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
export { Button as StatefulButton };
