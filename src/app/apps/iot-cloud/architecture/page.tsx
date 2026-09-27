'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/theme/ThemeToggle';
import SystemArchitectureView from '@/components/iot/SystemArchitectureView';
import { Cpu, ArrowLeft, Gauge, Code, Sparkle } from '@phosphor-icons/react';

export default function DedicatedArchitecturePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 sm:px-6 dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/apps/iot-cloud"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <ArrowLeft size={14} weight="bold" />
            <span className="hidden sm:inline">Back to IoT Cloud</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <span className="font-mono text-xs text-neutral-400">/</span>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Cpu size={16} weight="bold" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
              System Architecture &amp; Data Pipeline
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/apps/iot-cloud?tab=dashboard"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <Gauge size={14} weight="bold" />
            <span>Live Telemetry</span>
          </Link>

          <Link
            href="/apps/iot-cloud?tab=firmware"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <Code size={14} weight="bold" />
            <span>Firmware</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <SystemArchitectureView
          onBackToDashboard={() => router.push('/apps/iot-cloud?tab=dashboard')}
          onOpenFirmware={() => router.push('/apps/iot-cloud?tab=firmware')}
        />
      </main>
    </div>
  );
}
