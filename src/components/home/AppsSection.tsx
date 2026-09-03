'use client';

import React from 'react';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { motion } from 'motion/react';
import {
  Plant,
  Cpu,
  WifiHigh,
  ToggleRight,
  FileArrowDown,
  ArrowRight,
  CheckCircle,
  Scan,
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
        <BentoGrid className="max-w-7xl mx-auto md:auto-rows-[21rem] grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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

// 1. Graphic: Plant Vision AI Camera Viewfinder
const GraphicPlantVision = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-b from-emerald-950/20 via-neutral-900/10 to-transparent p-4">
      {/* Viewfinder Frame with Corner Target Reticles */}
      <div className="relative aspect-16/10 w-full max-w-[260px] overflow-hidden rounded-xl border border-emerald-500/30 bg-black/40 backdrop-blur-xs flex items-center justify-center shadow-inner">
        {/* Corner Reticles */}
        <div className="absolute top-1.5 left-1.5 h-2.5 w-2.5 border-t-2 border-l-2 border-emerald-400" />
        <div className="absolute top-1.5 right-1.5 h-2.5 w-2.5 border-t-2 border-r-2 border-emerald-400" />
        <div className="absolute bottom-1.5 left-1.5 h-2.5 w-2.5 border-b-2 border-l-2 border-emerald-400" />
        <div className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b-2 border-r-2 border-emerald-400" />

        {/* Animated Sweeping Laser Scanner */}
        <motion.div
          animate={{ y: [-45, 45, -45] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981]"
        />

        {/* Plant Leaf Icon Silhouette */}
        <div className="flex flex-col items-center justify-center text-emerald-500/80">
          <Plant size={44} weight="duotone" className="text-emerald-400" />
        </div>

        {/* Live AI Detection Bounding Box Badge */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-mono backdrop-blur-md border border-emerald-500/20">
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            Pathology Detected
          </span>
          <span className="text-neutral-400">94% Match</span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
        <Scan size={12} />
        <span>Multimodal Neural Vision Viewfinder</span>
      </div>
    </div>
  );
};

// 2. Graphic: ESP32 Hardware Module & Cloud Telemetry
const GraphicIoTCloud = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-b from-blue-950/20 via-neutral-900/10 to-transparent p-4">
      {/* ESP32 Module Representation Card */}
      <div className="w-full max-w-[260px] rounded-xl border border-blue-500/30 bg-black/40 backdrop-blur-xs p-3 shadow-inner space-y-2.5">
        {/* Chip Header: Connection Status */}
        <div className="flex items-center justify-between border-b border-blue-500/15 pb-2">
          <div className="flex items-center gap-1.5">
            <Cpu size={18} weight="duotone" className="text-blue-400" />
            <span className="font-mono text-[11px] font-bold text-white">ESP32 NodeMCU</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 font-mono text-[9px] font-bold text-blue-400 border border-blue-500/30">
            <WifiHigh size={11} weight="bold" />
            <span>Online</span>
          </span>
        </div>

        {/* Live Telemetry Sensor Stream */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/5 p-2 border border-white/5">
            <span className="block font-mono text-[9px] text-neutral-400">Temperature</span>
            <span className="font-mono text-xs font-extrabold text-blue-400">24.8°C</span>
          </div>
          <div className="rounded-lg bg-white/5 p-2 border border-white/5">
            <span className="block font-mono text-[9px] text-neutral-400">Humidity</span>
            <span className="font-mono text-xs font-extrabold text-cyan-400">64% RH</span>
          </div>
        </div>

        {/* Remote Relay Switch Indicator */}
        <div className="flex items-center justify-between rounded-lg bg-blue-500/10 px-2.5 py-1.5 border border-blue-500/20">
          <span className="font-mono text-[10px] font-semibold text-neutral-200">Relay GPIO 2</span>
          <span className="font-mono text-[10px] font-bold text-blue-400 flex items-center gap-1">
            <ToggleRight size={16} weight="fill" className="text-blue-400" />
            <span>ACTIVE</span>
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
        <span>Real-Time Bi-Directional Cloud Ingestion</span>
      </div>
    </div>
  );
};

// 3. Graphic: Client-Side Media File Optimization Deck
const GraphicMediaToolbox = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-b from-purple-950/20 via-neutral-900/10 to-transparent p-4">
      {/* File Compression Transformation Card */}
      <div className="w-full max-w-[260px] rounded-xl border border-purple-500/30 bg-black/40 backdrop-blur-xs p-3 shadow-inner space-y-2.5">
        {/* Before / After Transformation Preview */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 rounded-lg bg-white/5 p-2 border border-white/5 text-center">
            <span className="block font-mono text-[9px] text-neutral-400">Input File</span>
            <span className="font-mono text-[11px] font-bold text-neutral-300">4.8 MB</span>
          </div>

          <div className="flex items-center justify-center text-purple-400">
            <ArrowRight size={14} weight="bold" />
          </div>

          <div className="flex-1 rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20 text-center">
            <span className="block font-mono text-[9px] text-emerald-400">Optimized</span>
            <span className="font-mono text-[11px] font-bold text-emerald-400">580 KB</span>
          </div>
        </div>

        {/* Compression Efficiency Bar */}
        <div className="rounded-lg bg-purple-500/10 p-2 border border-purple-500/20 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-neutral-300 font-semibold">Lossless Compression</span>
            <span className="font-bold text-emerald-400">-88% Size</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-[88%] bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full" />
          </div>
        </div>

        {/* Local Execution Badge */}
        <div className="flex items-center justify-between text-[9.5px] font-mono text-neutral-400 pt-0.5">
          <span className="flex items-center gap-1">
            <CheckCircle size={12} weight="fill" className="text-emerald-400" />
            Zero Server Uploads
          </span>
          <span className="text-purple-300 font-semibold">100% In-Browser</span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
        <FileArrowDown size={12} />
        <span>Instant Local Document & Media Engine</span>
      </div>
    </div>
  );
};

const items = [
  {
    title: 'Plant Vision',
    description: 'Upload a plant photo to instantly evaluate foliar diseases, fungal blights, and pest damage with AI.',
    header: <GraphicPlantVision />,
    className: 'md:col-span-1',
    href: '/apps/plant-doctor',
  },
  {
    title: 'ESP32 IoT Cloud Platform',
    description: 'Connect your ESP32 microcontrollers to stream live sensor telemetry and control GPIO switches in real time.',
    header: <GraphicIoTCloud />,
    className: 'md:col-span-1',
    href: '/apps/iot-cloud',
  },
  {
    title: 'Client-Side Media Toolbox',
    description: 'Compress, crop, scale, and convert images or PDFs directly in your browser with complete privacy.',
    header: <GraphicMediaToolbox />,
    className: 'md:col-span-1',
    href: '/tools',
  },
];
