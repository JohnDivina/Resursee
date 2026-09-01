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
          ? 'border-emerald-500/40 bg-emerald-500/[0.04] shadow-md'
          : 'border-[var(--color-rule)] bg-[var(--color-paper-card)]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
              isSimulating
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
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
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold ${
                  isSimulating
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-500/10 text-neutral-500'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-neutral-400'
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
              ? 'bg-rose-500 text-white shadow-sm hover:bg-rose-600'
              : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700'
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
