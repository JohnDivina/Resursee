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
        <BentoGrid className="max-w-7xl mx-auto auto-rows-auto lg:auto-rows-[19rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

// 1. Solid Neutral Graphic: Plant Vision
const SolidGraphicPlantVision = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
      <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-transform duration-200 group-hover/bento:scale-105">
        <Plant size={30} weight="regular" />
      </div>

      <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-[10.5px] font-bold text-neutral-800 dark:text-neutral-200 max-w-full">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 dark:bg-neutral-400 shrink-0" />
        <span className="truncate">Foliage Pathology Analysis</span>
      </div>
    </div>
  );
};

// 2. Solid Neutral Graphic: ESP32 IoT Cloud Platform
const SolidGraphicIoTCloud = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
      <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-transform duration-200 group-hover/bento:scale-105">
        <Cpu size={30} weight="regular" />
      </div>

      <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-[10.5px] font-bold text-neutral-800 dark:text-neutral-200 max-w-full">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 dark:bg-neutral-400 shrink-0" />
        <span className="truncate">Hardware Telemetry Stream</span>
      </div>
    </div>
  );
};

// 3. Solid Neutral Graphic: Client-Side Media Toolbox
const SolidGraphicMediaToolbox = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
      <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-transform duration-200 group-hover/bento:scale-105">
        <SlidersHorizontal size={30} weight="regular" />
      </div>

      <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 sm:px-3 py-1 font-mono text-[10px] sm:text-[10.5px] font-bold text-neutral-800 dark:text-neutral-200 max-w-full">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 dark:bg-neutral-400 shrink-0" />
        <span className="truncate">In-Browser Local Processing</span>
      </div>
    </div>
  );
};

const items = [
  {
    title: 'Plant Vision',
    description: 'Upload a plant photo to instantly evaluate foliar diseases, fungal blights, and pest damage with AI.',
    header: <SolidGraphicPlantVision />,
    className: 'md:col-span-1 lg:col-span-1',
    href: '/apps/plant-doctor',
  },
  {
    title: 'ESP32 IoT Cloud Platform',
    description: 'Connect your ESP32 microcontrollers to stream live sensor telemetry and control GPIO switches in real time.',
    header: <SolidGraphicIoTCloud />,
    className: 'md:col-span-1 lg:col-span-1',
    href: '/apps/iot-cloud',
  },
  {
    title: 'Client-Side Media Toolbox',
    description: 'Compress, crop, scale, and convert images or PDFs directly in your browser with complete privacy.',
    header: <SolidGraphicMediaToolbox />,
    className: 'md:col-span-2 lg:col-span-1',
    href: '/tools',
  },
];
