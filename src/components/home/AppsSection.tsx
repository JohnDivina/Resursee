'use client';

import React from 'react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { motion } from 'motion/react';

export default function AppsSection() {
  return (
    <section className="relative py-14 sm:py-20 border-b border-[var(--color-rule-subtle)] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Clean Section Header */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
            Integrated Applications & Systems
          </h2>
        </div>

        {/* 3-Column Bento Grid */}
        <BentoGrid className="max-w-7xl mx-auto md:auto-rows-[20rem] grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              header={item.header}
              className={item.className}
              href={item.href}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

// 1. Skeleton One: Plant Vision (No dots, no emojis, clean iOS style)
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
      className="flex flex-1 w-full h-full min-h-[6rem] flex-col justify-center space-y-2.5 p-2 bg-transparent"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-black/10 dark:border-white/15 p-2 items-center space-x-2.5 bg-white dark:bg-black/90 shadow-2xs"
      >
        <div className="h-6 w-6 rounded-full bg-emerald-500 shrink-0" />
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
        <div className="h-6 w-6 rounded-full bg-teal-500 shrink-0" />
      </motion.div>

      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-black/10 dark:border-white/15 p-2 items-center space-x-2.5 bg-white dark:bg-black/90 shadow-2xs"
      >
        <div className="h-6 w-6 rounded-full bg-emerald-600 shrink-0" />
        <div className="flex-1 text-[11px] font-semibold text-[var(--color-ink)] truncate">
          Clinical GAP Recovery Plan Ready
        </div>
      </motion.div>
    </motion.div>
  );
};

// 2. Skeleton Two: IoT Cloud Telemetry Stream (No dots, clean metrics)
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
    { label: 'ESP32 Ingest Stream', val: '24.8°C' },
    { label: 'Foliage Humidity', val: '64%' },
    { label: 'Soil Moisture Matrix', val: '780 ADC' },
    { label: 'Remote Solenoid Relay', val: 'ACTIVE' },
    { label: 'WebSocket Latency', val: '12ms' },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] flex-col justify-center space-y-2 p-2 bg-transparent"
    >
      {telemetryMetrics.map((metric, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            variants={variants}
            className="flex flex-row rounded-full border border-black/10 dark:border-white/15 px-3 py-1.5 items-center justify-between bg-white dark:bg-black/90 shadow-2xs h-7 overflow-hidden w-full"
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

// 3. Skeleton Three: Client-Side Media Toolbox (Clean gradient & glassmorphic badges)
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

const items = [
  {
    title: 'Plant Vision',
    header: <SkeletonOne />,
    className: 'md:col-span-1',
    href: '/apps/plant-doctor',
  },
  {
    title: 'ESP32 IoT Cloud Platform',
    header: <SkeletonTwo />,
    className: 'md:col-span-1',
    href: '/apps/iot-cloud',
  },
  {
    title: 'Client-Side Media Toolbox',
    header: <SkeletonThree />,
    className: 'md:col-span-1',
    href: '/tools',
  },
];
