'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkle,
  FileText,
  Wrench,
  Newspaper,
  UploadSimple,
  Command,
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react';
import { useSound } from '@/components/sound/SoundProvider';

interface FeatureCard {
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
  ctaText: string;
  badge?: string;
}

export default function PlatformShowcaseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { playThock, playDeepThock } = useSound();

  const handleOpen = () => {
    playDeepThock(0.3);
    setIsOpen(true);
  };

  const handleClose = () => {
    playThock(1.1, 0.2);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const features: FeatureCard[] = [
    {
      title: 'Resource & Forms Hub',
      category: 'Document Central',
      description:
        'Instant access to official university forms, clearance slips, cross-enrollment templates, and department circulars with real-time version history.',
      icon: <FileText size={22} className="text-white" weight="bold" />,
      iconBg: 'bg-blue-600',
      href: '/resources',
      ctaText: 'Explore directory',
      badge: '50+ Forms',
    },
    {
      title: 'Browser Productivity Tools',
      category: '100% Client-Side',
      description:
        'Compress scanned documents, scale 2x2 ID photos, crop application signatures, convert WebP/PNG/JPG, and merge pages into PDFs with zero server uploads.',
      icon: <Wrench size={22} className="text-white" weight="bold" />,
      iconBg: 'bg-indigo-600',
      href: '/tools',
      ctaText: 'Open toolbox',
      badge: '6 Utilities',
    },
    {
      title: 'Campus News & Advisories',
      category: 'Automated Ingestion',
      description:
        'Live announcements, registrar advisories, enrollment schedules, and policy circulars curated in a single distraction-free feed.',
      icon: <Newspaper size={22} className="text-white" weight="bold" />,
      iconBg: 'bg-emerald-600',
      href: '/news',
      ctaText: 'Read updates',
      badge: 'Live Feed',
    },
    {
      title: 'Community Submissions',
      category: 'Crowdsourced Catalog',
      description:
        'Found a new syllabus template or updated form? Submit it directly for administrative review to keep the campus repository complete.',
      icon: <UploadSimple size={22} className="text-white" weight="bold" />,
      iconBg: 'bg-amber-500',
      href: '/contribute',
      ctaText: 'Contribute a form',
      badge: 'Community',
    },
  ];

  return (
    <>
      {/* Restored Landing Page Circular Button Trigger */}
      <div className="relative mx-auto my-6 flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={handleOpen}
          data-thock="card"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="What can I use Resursee for?"
          className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-[var(--color-primary)] hover:shadow-[0_0_24px_var(--color-primary-glow)] hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="pointer-events-none absolute inset-0 -m-1 rounded-full border border-[var(--color-primary)]/25 animate-ping opacity-75" />

          <div className="relative flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110">
              <span className="text-sm select-none">🦦</span>
            </div>
            <Sparkle
              size={12}
              weight="fill"
              className="absolute -top-1 -right-1 text-amber-500 animate-pulse"
            />
          </div>
        </button>

        <button
          type="button"
          onClick={handleOpen}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <span>What can I use Resursee for?</span>
          <span className="text-[10px] text-[var(--color-primary)] font-bold">✨</span>
        </button>
      </div>

      {/* Pop-Up Modal Dialog (Z-50 full screen - never cut in half) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Dialog Content Container */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)] text-left"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close modal"
                className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] transition-all active:scale-95 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-white font-bold text-xl shadow-xs select-none">
                  🦦
                </span>
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    Everything in One Hub
                  </span>
                  <h2 id="modal-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
                    What you can use Resursee for
                  </h2>
                </div>
              </div>

              {/* 4 Feature Pillars Grid */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {features.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={handleClose}
                    data-thock="card"
                    className="group flex flex-col justify-between rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-5 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${item.iconBg} shadow-xs transition-transform duration-300 group-hover:scale-110`}>
                          {item.icon}
                        </div>
                        <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[var(--color-ink-secondary)]">
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="mt-3.5 text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-3 text-xs font-bold text-[var(--color-primary)]">
                      <span>{item.ctaText}</span>
                      <ArrowRight size={13} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Keyboard Pro-Tip Bar */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-[20px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-muted)]/40 p-4 text-xs">
                <div className="flex items-center gap-2 text-[var(--color-ink-secondary)]">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>100% Client-Side privacy for all paperwork tools.</span>
                </div>

                <div className="flex items-center gap-1.5 text-[var(--color-ink-muted)] font-medium">
                  <span>Quick search anywhere:</span>
                  <kbd className="inline-flex items-center gap-0.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--color-ink)]">
                    <Command size={10} /> K
                  </kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
