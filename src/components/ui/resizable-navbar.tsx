'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';
import { List, X } from '@phosphor-icons/react';

interface NavItem {
  name: string;
  link: string;
  icon?: any;
}

export function Navbar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <header className={`sticky top-0 z-50 w-full flex justify-center p-2 sm:p-3 pointer-events-none ${className}`}>
      {children}
    </header>
  );
}

export function NavBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else if (latest < 20) {
      setIsScrolled(false);
    }
  });

  return (
    <div
      className={`pointer-events-auto relative flex items-center justify-between rounded-full backdrop-blur-xl transition-all duration-300 ease-out will-change-[max-width,padding,background-color,border-color,box-shadow] ${
        isScrolled
          ? 'w-full max-w-5xl border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-card)]/90 px-4 sm:px-6 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          : 'w-full max-w-7xl border border-black/[0.04] dark:border-white/[0.06] bg-[var(--color-paper)]/75 px-5 sm:px-8 py-3.5 shadow-2xs'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function NavbarLogo({
  href = '/',
  label = 'Resursee',
}: {
  href?: string;
  label?: string;
  emoji?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 transition-transform active:scale-95 shrink-0"
      aria-label={label}
    >
      <img
        src="/favicon.svg"
        alt={label}
        className="h-8 w-8 rounded-lg shadow-xs shrink-0 object-contain"
      />
      <span className="text-lg font-extrabold tracking-tight text-[var(--color-ink)]">
        {label}
      </span>
    </Link>
  );
}

export function NavItems({
  items,
  pathname,
  className = '',
}: {
  items: NavItem[];
  pathname?: string;
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className={`hidden md:flex items-center gap-1 ${className}`}>
      {items.map((item, idx) => {
        const isActive = pathname === item.link || (pathname && item.link !== '/' && pathname.startsWith(`${item.link}/`));
        const Icon = item.icon;

        return (
          <Link
            key={item.link}
            href={item.link}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`relative flex items-center gap-1.5 rounded-full px-2.5 lg:px-3.5 py-1.5 text-xs lg:text-sm font-semibold transition-colors duration-150 ${
              isActive
                ? 'text-[var(--color-primary)] font-bold'
                : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
            }`}
          >
            {/* Animated Floating Pill on Hover */}
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  layoutId="navHoverPill"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-black/[0.04] dark:bg-white/[0.08] -z-10"
                />
              )}
            </AnimatePresence>

            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-[var(--color-primary)]" />
            )}

            {Icon && <Icon size={15} />}
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function NavbarButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  href?: string;
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer';

  const variantClasses = {
    primary:
      'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs px-4 py-2',
    secondary:
      'bg-[var(--color-ink)] dark:bg-white hover:bg-[var(--color-primary)] dark:hover:bg-neutral-200 text-white dark:text-black shadow-2xs px-4 py-2',
    ghost:
      'border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-ink)] text-[var(--color-ink-muted)] px-3 py-2',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={combinedClasses}>
      {children}
    </button>
  );
}

export function MobileNav({ children }: { children: React.ReactNode }) {
  return <div className="md:hidden flex items-center">{children}</div>;
}

export function MobileNavHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

export function MobileNavToggle({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink)] shadow-2xs transition-all hover:bg-[var(--color-paper-muted)] active:scale-95 cursor-pointer"
    >
      {isOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
    </button>
  );
}

export function MobileNavMenu({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-4 top-20 z-50 rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-2xl md:hidden"
        >
          <div className="flex flex-col gap-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
