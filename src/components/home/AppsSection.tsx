'use client';

import React from 'react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import {
  Plant,
  Cpu,
  SlidersHorizontal,
} from '@phosphor-icons/react';

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
        <BentoGrid className="max-w-7xl mx-auto md:auto-rows-[19rem] grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
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

// 1. Minimalist Graphic: Plant Vision
const MinimalGraphicPlantVision = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-neutral-50/60 dark:bg-neutral-900/30 rounded-2xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs transition-transform duration-300 group-hover/bento:scale-105">
        <Plant size={32} weight="duotone" />
      </div>

      <div className="mt-4 flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 font-mono text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Foliage Pathology Analysis</span>
      </div>
    </div>
  );
};

// 2. Minimalist Graphic: ESP32 IoT Cloud Platform
const MinimalGraphicIoTCloud = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-neutral-50/60 dark:bg-neutral-900/30 rounded-2xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs transition-transform duration-300 group-hover/bento:scale-105">
        <Cpu size={32} weight="duotone" />
      </div>

      <div className="mt-4 flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 font-mono text-[10.5px] font-semibold text-blue-700 dark:text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        <span>Hardware Telemetry Stream</span>
      </div>
    </div>
  );
};

// 3. Minimalist Graphic: Client-Side Media Toolbox
const MinimalGraphicMediaToolbox = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-neutral-50/60 dark:bg-neutral-900/30 rounded-2xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs transition-transform duration-300 group-hover/bento:scale-105">
        <SlidersHorizontal size={32} weight="duotone" />
      </div>

      <div className="mt-4 flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 px-3 py-1 font-mono text-[10.5px] font-semibold text-purple-700 dark:text-purple-400">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
        <span>In-Browser Local Processing</span>
      </div>
    </div>
  );
};

const items = [
  {
    title: 'Plant Vision',
    description: 'Upload a plant photo to instantly evaluate foliar diseases, fungal blights, and pest damage with AI.',
    header: <MinimalGraphicPlantVision />,
    className: 'md:col-span-1',
    href: '/apps/plant-doctor',
  },
  {
    title: 'ESP32 IoT Cloud Platform',
    description: 'Connect your ESP32 microcontrollers to stream live sensor telemetry and control GPIO switches in real time.',
    header: <MinimalGraphicIoTCloud />,
    className: 'md:col-span-1',
    href: '/apps/iot-cloud',
  },
  {
    title: 'Client-Side Media Toolbox',
    description: 'Compress, crop, scale, and convert images or PDFs directly in your browser with complete privacy.',
    header: <MinimalGraphicMediaToolbox />,
    className: 'md:col-span-1',
    href: '/tools',
  },
];
