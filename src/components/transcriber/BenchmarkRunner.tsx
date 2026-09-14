'use client';

import React, { useState } from 'react';
import { BenchmarkResult, TranscriptionTier } from '@/types/transcriber';
import { Lightning, Play, CheckCircle } from '@phosphor-icons/react';

interface BenchmarkRunnerProps {
  currentTier: TranscriptionTier;
  onRunBenchmark: (tier: TranscriptionTier) => Promise<BenchmarkResult>;
}

export const BenchmarkRunner: React.FC<BenchmarkRunnerProps> = ({
  currentTier,
  onRunBenchmark,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [selectedTier, setSelectedTier] = useState<TranscriptionTier>(currentTier);

  const runTest = async () => {
    setIsRunning(true);
    try {
      const res = await onRunBenchmark(selectedTier);
      setResults((prev) => [res, ...prev]);
    } catch (err) {
      console.error('Benchmark failed:', err);
      alert('Benchmark run failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
          <Lightning size={16} weight="bold" />
          <span>Speed & RTF Benchmark</span>
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Measures Real-Time Factor (RTF = processing time / audio duration). An RTF of 0.2× means 10 seconds of audio processes in 2 seconds.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
            <button
              type="button"
              onClick={() => setSelectedTier('browser')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                selectedTier === 'browser'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Browser WebGPU
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('cloud')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                selectedTier === 'cloud'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Cloud Gemini
            </button>
          </div>

          <button
            type="button"
            onClick={runTest}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <Play size={12} weight="fill" />
            <span>{isRunning ? 'Benchmarking...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-100 font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <tr>
                <th className="p-2.5">Engine</th>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">RTF</th>
                <th className="p-2.5">Words</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {results.map((res, i) => (
                <tr key={i} className="bg-white dark:bg-[#121212]">
                  <td className="p-2.5 font-medium text-neutral-900 dark:text-white">
                    {res.modelName}
                  </td>
                  <td className="p-2.5 font-mono text-neutral-600 dark:text-neutral-400">
                    {res.transcriptionTimeSeconds}s
                  </td>
                  <td className="p-2.5 font-mono font-bold text-neutral-900 dark:text-white">
                    {res.realtimeFactor}×
                  </td>
                  <td className="p-2.5 font-mono text-neutral-600 dark:text-neutral-400">
                    {res.wordCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
