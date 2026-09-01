'use client';

import React from 'react';
import { IoTTelemetry } from '@/types/iotCloud';
import { ChartLineUp, Thermometer, Drop } from '@phosphor-icons/react';

interface TelemetryChartProps {
  telemetry: IoTTelemetry[];
  selectedMetric?: 'temperature' | 'humidity' | 'soilMoisture' | 'light';
  onMetricChange?: (metric: 'temperature' | 'humidity' | 'soilMoisture' | 'light') => void;
}

export default function TelemetryChart({
  telemetry,
  selectedMetric = 'temperature',
  onMetricChange,
}: TelemetryChartProps) {
  const data = telemetry.slice(-20); // Last 20 data points

  const values = data.map((d) => d[selectedMetric] ?? 0);
  const minVal = values.length > 0 ? Math.floor(Math.min(...values) - 2) : 0;
  const maxVal = values.length > 0 ? Math.ceil(Math.max(...values) + 2) : 100;
  const range = maxVal - minVal || 1;

  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Build SVG path points
  const points = data.map((d, idx) => {
    const val = d[selectedMetric] ?? 0;
    const x = paddingX + (idx / (Math.max(1, data.length - 1))) * chartWidth;
    const y = paddingY + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y, val, time: d.timestamp };
  });

  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    // Smooth bezier curve control points
    const prev = points[idx - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  const getMetricColor = () => {
    switch (selectedMetric) {
      case 'humidity':
        return { stroke: '#10b981', fill: 'url(#grad-humidity)' };
      case 'soilMoisture':
        return { stroke: '#f59e0b', fill: 'url(#grad-soil)' };
      case 'light':
        return { stroke: '#eab308', fill: 'url(#grad-light)' };
      case 'temperature':
      default:
        return { stroke: '#3b82f6', fill: 'url(#grad-temp)' };
    }
  };

  const metricColors = getMetricColor();

  return (
    <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-blue-500/10 text-blue-600 dark:text-sky-400">
            <ChartLineUp size={18} weight="bold" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[var(--color-ink)]">
              Live Sensor Telemetry Stream
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Real-time time-series telemetry received from ESP32
            </p>
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-[var(--color-paper-muted)] p-1">
          {[
            { id: 'temperature', label: 'Temperature (°C)' },
            { id: 'humidity', label: 'Humidity (%)' },
            { id: 'soilMoisture', label: 'Soil Moisture (%)' },
            { id: 'light', label: 'Light (lux)' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onMetricChange?.(m.id as typeof selectedMetric)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                selectedMetric === m.id
                  ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="mt-4 w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 sm:h-56">
          <defs>
            <linearGradient id="grad-temp" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-humidity" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-soil" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-black/5 dark:text-white/10"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight / 2}
            x2={width - paddingX}
            y2={paddingY + chartHeight / 2}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-black/5 dark:text-white/10"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-black/10 dark:text-white/15"
          />

          {/* Y Axis Labels */}
          <text
            x={paddingX - 8}
            y={paddingY + 4}
            textAnchor="end"
            className="text-[9px] font-mono fill-[var(--color-ink-muted)]"
          >
            {maxVal}
          </text>
          <text
            x={paddingX - 8}
            y={paddingY + chartHeight / 2 + 3}
            textAnchor="end"
            className="text-[9px] font-mono fill-[var(--color-ink-muted)]"
          >
            {((maxVal + minVal) / 2).toFixed(1)}
          </text>
          <text
            x={paddingX - 8}
            y={height - paddingY}
            textAnchor="end"
            className="text-[9px] font-mono fill-[var(--color-ink-muted)]"
          >
            {minVal}
          </text>

          {/* Gradient Area */}
          {areaD && <path d={areaD} fill={metricColors.fill} />}

          {/* Animated Line */}
          {pathD && (
            <path
              d={pathD}
              fill="transparent"
              stroke={metricColors.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Pulse on the latest data point */}
          {points.length > 0 && (
            <g transform={`translate(${points[points.length - 1].x}, ${points[points.length - 1].y})`}>
              <circle r="6" fill={metricColors.stroke} opacity="0.3" className="animate-ping" />
              <circle r="4" fill={metricColors.stroke} />
              <circle r="2" fill="#ffffff" />
            </g>
          )}
        </svg>
      </div>

      {/* Footer Status */}
      <div className="flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-3 text-[11px] font-mono text-[var(--color-ink-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Polling stream every 2000ms</span>
        </span>
        <span>
          Latest: <strong className="text-[var(--color-ink)]">{values[values.length - 1] ?? 0}</strong>
        </span>
      </div>
    </div>
  );
}
