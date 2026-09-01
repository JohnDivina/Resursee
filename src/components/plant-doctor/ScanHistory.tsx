'use client';

import React from 'react';
import { PlantDiagnosisResult } from '@/types/plantDoctor';
import { ClockCounterClockwise, Trash, ArrowRight, Plant, WarningCircle, CheckCircle } from '@phosphor-icons/react';

interface ScanHistoryProps {
  history: PlantDiagnosisResult[];
  onSelect: (item: PlantDiagnosisResult) => void;
  onClear: () => void;
}

export default function ScanHistory({ history, onSelect, onClear }: ScanHistoryProps) {
  if (!history || history.length === 0) return null;

  return (
    <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-rule-subtle)]">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-blue-500/10 text-blue-600 dark:text-sky-400">
            <ClockCounterClockwise size={18} weight="bold" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[var(--color-ink)]">
              Recent Plant Scans ({history.length})
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Saved in local browser memory
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
        >
          <Trash size={13} />
          <span>Clear History</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="group flex flex-col justify-between rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-4 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">
                  {new Date(item.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold ${
                    item.isHealthy
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-rose-500/10 text-rose-600'
                  }`}
                >
                  {item.isHealthy ? (
                    <CheckCircle size={10} weight="fill" />
                  ) : (
                    <WarningCircle size={10} weight="fill" />
                  )}
                  <span className="capitalize">{item.severity}</span>
                </span>
              </div>

              <h4 className="mt-2 text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                {item.primaryDiagnosis}
              </h4>
              <p className="mt-0.5 text-xs text-[var(--color-ink-muted)] line-clamp-1">
                {item.plantName} ({item.scientificName})
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-2 text-[11px] font-bold text-[var(--color-primary)]">
              <span>View Full Report</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
