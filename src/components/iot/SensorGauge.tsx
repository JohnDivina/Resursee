'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Thermometer, Drop, Sun, Sparkle, BatteryHigh } from '@phosphor-icons/react';

interface SensorGaugeProps {
  title: string;
  value: number;
  unit: string;
  minVal?: number;
  maxVal?: number;
  metricKey: 'temperature' | 'humidity' | 'light' | 'soilMoisture' | 'battery';
  color?: string;
}

export default function SensorGauge({
  title,
  value,
  unit,
  minVal = 0,
  maxVal = 100,
  metricKey,
  color = '#3b82f6',
}: SensorGaugeProps) {
  const percentage = Math.min(100, Math.max(0, ((value - minVal) / (maxVal - minVal)) * 100));

  // Circular gauge geometry
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * (circumference * 0.75); // 270 deg arc

  const getMetricIcon = () => {
    switch (metricKey) {
      case 'temperature':
        return <Thermometer size={18} weight="bold" className="text-blue-500" />;
      case 'humidity':
        return <Drop size={18} weight="bold" className="text-emerald-500" />;
      case 'light':
        return <Sun size={18} weight="bold" className="text-amber-500" />;
      case 'soilMoisture':
        return <Drop size={18} weight="fill" className="text-indigo-500" />;
      case 'battery':
      default:
        return <BatteryHigh size={18} weight="bold" className="text-emerald-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-between rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs transition-all hover:border-[var(--color-rule-strong)]">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[var(--color-paper-muted)]">
            {getMetricIcon()}
          </span>
          <span className="text-xs font-bold text-[var(--color-ink)] truncate max-w-[140px]">
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">Live</span>
      </div>

      {/* Circular Gauge Graphic */}
      <div className="relative my-4 flex items-center justify-center">
        <svg className="h-36 w-36 -rotate-135 transform" viewBox="0 0 128 128">
          {/* Background Track Arc */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            className="text-black/5 dark:text-white/10"
            strokeLinecap="round"
          />

          {/* Active Value Progress Arc */}
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Digital Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            key={value}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono text-2xl font-black text-[var(--color-ink)] tracking-tight"
          >
            {value}
            <span className="ml-0.5 text-xs font-semibold text-[var(--color-ink-muted)]">{unit}</span>
          </motion.span>
          <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
            Range {minVal}–{maxVal}
          </span>
        </div>
      </div>

      {/* Footer Range Bar */}
      <div className="flex w-full items-center justify-between border-t border-[var(--color-rule-subtle)] pt-2 text-[10.5px] font-mono text-[var(--color-ink-muted)]">
        <span>Min {minVal}{unit}</span>
        <span className="font-bold text-[var(--color-ink)]">{percentage.toFixed(0)}% Capacity</span>
        <span>Max {maxVal}{unit}</span>
      </div>
    </div>
  );
}
