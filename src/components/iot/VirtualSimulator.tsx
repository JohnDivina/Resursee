'use client';

import React from 'react';
import { Cpu, Play, Pause, Lightning, RadioButton } from '@phosphor-icons/react';

interface VirtualSimulatorProps {
  isSimulating: boolean;
  onToggleSimulator: () => void;
  deviceName: string;
}

export default function VirtualSimulator({
  isSimulating,
  onToggleSimulator,
  deviceName,
}: VirtualSimulatorProps) {
  return (
    <div
      className={`rounded-[24px] border p-4 sm:p-5 transition-all ${
        isSimulating
          ? 'border-neutral-400 dark:border-neutral-600 shadow-md'
          : 'border-[var(--color-rule)] bg-[var(--color-paper-card)]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
              isSimulating
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)]'
            }`}
          >
            <Cpu size={22} weight="bold" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-[var(--color-ink)]">
                Virtual ESP32 Hardware Simulator
              </h4>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-bold bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSimulating ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                  }`}
                />
                <span>{isSimulating ? 'SIMULATOR ACTIVE' : 'IDLE'}</span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-ink-muted)]">
              {isSimulating
                ? `Streaming realistic live sensor telemetry into "${deviceName}" every 2s`
                : 'Test your cloud dashboard & charts immediately without physical hardware'}
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={onToggleSimulator}
          className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 ${
            isSimulating
              ? 'bg-neutral-800 text-white hover:bg-neutral-900'
              : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs hover:opacity-90'
          }`}
        >
          {isSimulating ? (
            <>
              <Pause size={14} weight="fill" />
              <span>Stop Simulator</span>
            </>
          ) : (
            <>
              <Play size={14} weight="fill" />
              <span>Start Virtual ESP32</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
