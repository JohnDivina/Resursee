'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import {
  IconPlant,
  IconCpu,
  IconTools,
  IconShieldCheck,
  IconFolderSearch,
  IconArrowRight,
  IconSparkles,
  IconActivity,
  IconCheck,
} from '@tabler/icons-react';
import { motion } from 'motion/react';

export default function AppsSection() {
  return (
    <section className="relative py-16 sm:py-24 border-b border-[var(--color-rule-subtle)] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                <IconSparkles size={14} />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Ecosystem & Software Suite
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
              Integrated Applications & Systems
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[var(--color-ink-muted)] max-w-2xl">
              Explore our unified ecosystem of multimodal AI vision, IoT telemetry cloud, client-side media utilities, and secure student archives.
            </p>
          </div>

          <Link
            href="/about"
            className="group flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline shrink-0"
          >
            <span>Platform architecture</span>
            <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Aceternity Bento Grid 3 */}
        <BentoGrid className="max-w-7xl mx-auto md:auto-rows-[22rem]">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={cn('[&>p:text-lg]', item.className)}
              icon={item.icon}
              href={item.href}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

// 1. Skeleton One: Plant Doctor Multimodal AI Vision
const SkeletonOne = () => {
  const variants = {
    initial: { x: 0 },
    animate: {
      x: 8,
      rotate: 2,
      transition: { duration: 0.2 },
    },
  };
  const variantsSecond = {
    initial: { x: 0 },
    animate: {
      x: -8,
      rotate: -2,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] bg-dot-pattern flex-col justify-center space-y-2.5 p-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-black/10 dark:border-white/15 p-2 items-center space-x-2.5 bg-white dark:bg-black/90 shadow-2xs"
      >
        <div className="h-7 w-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
          AI
        </div>
        <div className="flex-1 text-[11px] font-semibold text-[var(--color-ink)] truncate">
          Diagnosing Spider Mite Infestation...
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-600">
          92%
        </span>
      </motion.div>

      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-black/10 dark:border-white/15 p-2 items-center space-x-2.5 w-11/12 ml-auto bg-white dark:bg-black/90 shadow-2xs"
      >
        <div className="flex-1 text-[11px] font-semibold text-[var(--color-ink-muted)] truncate">
          Organic Neem Oil + Sulphur Protocol
        </div>
        <div className="h-7 w-7 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 shrink-0 flex items-center justify-center text-white text-[10px]">
          🌿
        </div>
      </motion.div>

      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-black/10 dark:border-white/15 p-2 items-center space-x-2.5 bg-white dark:bg-black/90 shadow-2xs"
      >
        <div className="h-7 w-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0 flex items-center justify-center text-white text-[10px]">
          ✓
        </div>
        <div className="flex-1 text-[11px] font-semibold text-[var(--color-ink)] truncate">
          Clinical GAP Recovery Plan Ready
        </div>
      </motion.div>
    </motion.div>
  );
};

// 2. Skeleton Two: IoT Cloud Real-Time Telemetry Stream
const SkeletonTwo = () => {
  const variants = {
    initial: { width: '40%' },
    animate: {
      width: '100%',
      transition: { duration: 0.3 },
    },
    hover: {
      width: ['40%', '95%', '70%', '100%'],
      transition: { duration: 2.5, repeat: Infinity },
    },
  };

  const telemetryMetrics = [
    { label: 'ESP32 Ingest Stream', val: '24.8°C', color: 'from-blue-500 to-cyan-500' },
    { label: 'Foliage Humidity', val: '64%', color: 'from-cyan-500 to-teal-500' },
    { label: 'Soil Moisture Matrix', val: '780 ADC', color: 'from-emerald-500 to-green-500' },
    { label: 'Remote Solenoid Relay', val: 'ACTIVE', color: 'from-purple-500 to-pink-500' },
    { label: 'WebSocket Latency', val: '12ms', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] bg-dot-pattern flex-col justify-center space-y-2 p-2"
    >
      {telemetryMetrics.map((metric, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            variants={variants}
            className="flex flex-row rounded-full border border-black/10 dark:border-white/15 px-3 py-1.5 items-center justify-between bg-white dark:bg-black/90 shadow-2xs h-7 overflow-hidden"
          >
            <span className="text-[10px] font-bold text-[var(--color-ink)] truncate">
              {metric.label}
            </span>
            <span className="font-mono text-[9px] font-bold text-[var(--color-primary)]">
              {metric.val}
            </span>
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
};

// 3. Skeleton Three: Client-Side Media & Productivity Toolbox
const SkeletonThree = () => {
  const variants = {
    initial: { backgroundPosition: '0 50%' },
    animate: {
      backgroundPosition: ['0, 50%', '100% 50%', '0 50%'],
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 6,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      className="flex flex-1 w-full h-full min-h-[6rem] rounded-[18px] flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner"
      style={{
        background: 'linear-gradient(-45deg, #10b981, #06b6d4, #8b5cf6, #ec4899)',
        backgroundSize: '300% 300%',
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-[200px]">
        {['PDF Compiler', 'Image Resizer', 'Lossless Compress', 'Aspect Ratio Cropper'].map((tool, idx) => (
          <span
            key={idx}
            className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 font-mono text-[9.5px] font-bold text-white border border-white/20 shadow-xs"
          >
            {tool}
          </span>
        ))}
      </div>
      <span className="mt-3 font-mono text-[9px] text-white/80 font-semibold">
        100% In-Browser Privacy
      </span>
    </motion.div>
  );
};

// 4. Skeleton Four: Universal Google Auth & Multi-Tier Quotas (Span 2)
const SkeletonFour = () => {
  const first = {
    initial: { x: 15, rotate: -3 },
    hover: { x: 0, rotate: 0 },
  };
  const second = {
    initial: { x: -15, rotate: 3 },
    hover: { x: 0, rotate: 0 },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] bg-dot-pattern flex-row items-center justify-center space-x-2 sm:space-x-3 p-2"
    >
      {/* Tier 1: Guest */}
      <motion.div
        variants={first}
        className="h-full w-1/3 rounded-[20px] bg-white dark:bg-black/90 dark:border-white/15 border border-black/10 p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-2xs"
      >
        <div className="h-9 w-9 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-sm">
          👤
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-[var(--color-ink)] mt-2 line-clamp-1">
          Guest Preview
        </p>
        <p className="mt-2 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[var(--color-ink-muted)] text-[9.5px] font-mono font-bold rounded-full px-2 py-0.5">
          1 Free Scan
        </p>
      </motion.div>

      {/* Tier 2: Verified Google User (Recommended) */}
      <motion.div className="h-full relative z-20 w-1/3 rounded-[20px] bg-white dark:bg-black/95 dark:border-emerald-500/40 border-2 border-emerald-500 p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-lg">
        <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
          G
        </div>
        <p className="text-[11px] sm:text-xs font-extrabold text-[var(--color-ink)] mt-2 line-clamp-1">
          Google Account
        </p>
        <p className="mt-2 border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-mono font-bold rounded-full px-2 py-0.5">
          10 Daily Scans
        </p>
      </motion.div>

      {/* Tier 3: Master Admin */}
      <motion.div
        variants={second}
        className="h-full w-1/3 rounded-[20px] bg-white dark:bg-black/90 dark:border-white/15 border border-black/10 p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-2xs"
      >
        <div className="h-9 w-9 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
          🛡️
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-[var(--color-ink)] mt-2 line-clamp-1">
          Master Admin
        </p>
        <p className="mt-2 border border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9.5px] font-mono font-bold rounded-full px-2 py-0.5">
          Unlimited
        </p>
      </motion.div>
    </motion.div>
  );
};

// 5. Skeleton Five: Public Document Archive & Moderation System
const SkeletonFive = () => {
  const variants = {
    initial: { x: 0 },
    animate: {
      x: 6,
      rotate: 2,
      transition: { duration: 0.2 },
    },
  };
  const variantsSecond = {
    initial: { x: 0 },
    animate: {
      x: -6,
      rotate: -2,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] bg-dot-pattern flex-col justify-center space-y-2 p-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-[16px] border border-black/10 dark:border-white/15 p-2.5 items-start space-x-2 bg-white dark:bg-black/90 shadow-2xs"
      >
        <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          📄
        </div>
        <p className="text-[10.5px] font-semibold text-[var(--color-ink)] leading-snug line-clamp-2">
          PUP QC Syllabus, Modules & Institutional Guides
        </p>
      </motion.div>

      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-black/10 dark:border-white/15 p-2 items-center justify-between space-x-2 w-11/12 ml-auto bg-white dark:bg-black/90 shadow-2xs"
      >
        <span className="text-[9.5px] font-mono font-bold text-emerald-600 flex items-center gap-1">
          <IconCheck size={12} stroke={3} />
          Verified Catalog
        </span>
        <div className="h-5 w-5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
          ✓
        </div>
      </motion.div>
    </motion.div>
  );
};

const items = [
  {
    title: 'Plant Doctor AI Vision Studio',
    description: (
      <span className="text-xs text-[var(--color-ink-muted)]">
        Instant multimodal foliage pathology with Google Gemini 3.6 Flash and clinical remedies.
      </span>
    ),
    header: <SkeletonOne />,
    className: 'md:col-span-1',
    icon: <IconPlant className="h-4 w-4 text-emerald-500" />,
    href: '/apps/plant-doctor',
  },
  {
    title: 'ESP32 IoT Cloud Platform',
    description: (
      <span className="text-xs text-[var(--color-ink-muted)]">
        WebSocket telemetry streaming, C++ firmware generator, and bi-directional GPIO control.
      </span>
    ),
    header: <SkeletonTwo />,
    className: 'md:col-span-1',
    icon: <IconCpu className="h-4 w-4 text-blue-500" />,
    href: '/apps/iot-cloud',
  },
  {
    title: 'Client-Side Media Toolbox',
    description: (
      <span className="text-xs text-[var(--color-ink-muted)]">
        100% private, zero-install document compilers, dimension scalers, and lossless croppers.
      </span>
    ),
    header: <SkeletonThree />,
    className: 'md:col-span-1',
    icon: <IconTools className="h-4 w-4 text-purple-500" />,
    href: '/tools',
  },
  {
    title: 'Universal Google SSO & Multi-Tenant Security System',
    description: (
      <span className="text-xs text-[var(--color-ink-muted)]">
        Single Sign-On across all apps, cryptographic HMAC-SHA256 tokens, and automated anti-abuse quotas.
      </span>
    ),
    header: <SkeletonFour />,
    className: 'md:col-span-2',
    icon: <IconShieldCheck className="h-4 w-4 text-emerald-500" />,
    href: '/apps/plant-doctor',
  },
  {
    title: 'Centralized Academic Archive',
    description: (
      <span className="text-xs text-[var(--color-ink-muted)]">
        Verified institutional resources, fuzzy full-text search, and student document submissions.
      </span>
    ),
    header: <SkeletonFive />,
    className: 'md:col-span-1',
    icon: <IconFolderSearch className="h-4 w-4 text-indigo-500" />,
    href: '/resources',
  },
];
