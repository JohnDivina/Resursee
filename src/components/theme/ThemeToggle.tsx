'use client';

import React from 'react';
import { Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, isTransitioning } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={isTransitioning}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode with rain effect'}
      title={theme === 'dark' ? 'Appearance: Dark (Click for Light Mode)' : 'Appearance: Light (Click for Dark Mode)'}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-card)] active:scale-95 disabled:opacity-60 ${className}`}
    >
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
        {theme === 'dark' ? (
          <Sun size={18} weight="bold" className="text-amber-400 animate-in spin-in-180 duration-200" />
        ) : (
          <Moon size={18} weight="bold" className="text-[var(--color-primary)] animate-in spin-in-180 duration-200" />
        )}
      </div>

      {/* Atmospheric indicator */}
      <span className="pointer-events-none absolute -bottom-0.5 right-1 h-1 w-1 rounded-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
