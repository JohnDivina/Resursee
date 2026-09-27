'use client';

import React, { useState, useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { IoTTelemetry, IoTActuator } from '@/types/iotCloud';
import {
  Sun,
  BatteryCharging,
  BatteryFull,
  BatteryHigh,
  House,
  Lightning,
  Cpu,
  Broadcast,
  CheckCircle,
  WarningCircle,
  PlugsConnected,
  Power,
  SlidersHorizontal,
  ArrowsLeftRight,
} from '@phosphor-icons/react';

interface EnergyFlowTopologyProps {
  telemetry?: IoTTelemetry;
  actuators?: IoTActuator[];
  deviceName?: string;
}

export default function EnergyFlowTopology({
  telemetry,
  actuators = [],
  deviceName = 'ESP32 Station',
}: EnergyFlowTopologyProps) {
  const uid = useId().replace(/:/g, '');

  // Connection Alive / Disconnected states
  const [solarAlive, setSolarAlive] = useState(true);
  const [batteryAlive, setBatteryAlive] = useState(true);
  const [gridAlive, setGridAlive] = useState(true);
  const [loadAlive, setLoadAlive] = useState(true);

  // Link simulation preset active indicator
  const [activePreset, setActivePreset] = useState<'normal' | 'islanded' | 'night' | 'grid_direct'>('normal');

  // Compute live values derived from current telemetry and actuator states
  const ambientLight = telemetry?.light ?? 720; // lux
  const lightFactor = Math.min(1.2, Math.max(0.05, ambientLight / 1000));

  // 1. Solar Generation (scaled realistically around ~2000W like reference or based on light)
  const baseSolarWatts = Math.round(2030 * lightFactor);
  const solarWatts = solarAlive ? Math.max(0, baseSolarWatts) : 0;
  const solarVolts = solarAlive ? (138.7 + (Math.sin(Date.now() / 4000) * 1.4)).toFixed(1) : '0.0';
  const solarAmps = solarAlive && parseFloat(solarVolts) > 0
    ? (solarWatts / parseFloat(solarVolts)).toFixed(1)
    : '0.0';
  const solarYieldPercent = Math.min(100, Math.round((solarWatts / 2400) * 100));

  // 2. Load Calculation (base ESP32 setup + active relays)
  // Check active actuators:
  const activeRelayCount = actuators.filter((a) => a.state).length;
  // Actuator power additions: Pump ~650W, Lights ~450W, Fan ~280W (typical agricultural greenhouse scale)
  let actuatorWatts = 0;
  actuators.forEach((a) => {
    if (a.state) {
      if (a.name.toLowerCase().includes('pump') || a.pin === 2 || a.pin === 26) actuatorWatts += 650;
      else if (a.name.toLowerCase().includes('light') || a.pin === 4 || a.pin === 27) actuatorWatts += 450;
      else if (a.name.toLowerCase().includes('fan') || a.pin === 15 || a.pin === 14) actuatorWatts += 280;
      else actuatorWatts += 200;
    }
  });

  const baseHouseWatts = 498;
  const totalLoadDemand = baseHouseWatts + actuatorWatts;
  const loadWatts = loadAlive ? totalLoadDemand : 0;
  const loadVA = Math.round(loadWatts * 1.08);
  const loadAmps = loadAlive ? (loadWatts / 230).toFixed(1) : '0.0';
  const loadFactorPercent = Math.min(150, Math.round((loadWatts / 2000) * 100));

  // 3. Power balance & Battery / Grid distribution
  // Net surplus or deficit
  const netPower = solarWatts - loadWatts;

  // Battery behavior
  let batteryMode: 'charging' | 'discharging' | 'idle' = 'idle';
  let batteryWatts = 0;
  let gridWatts = 0;
  let gridAmps = '0.0';

  if (batteryAlive) {
    if (netPower > 0) {
      // Surplus solar charges battery
      batteryMode = 'charging';
      batteryWatts = Math.min(1200, netPower);
      gridWatts = 0; // Self-sufficient
    } else if (netPower < 0) {
      // Deficit: battery supplies load up to its limit
      batteryMode = 'discharging';
      const deficit = Math.abs(netPower);
      if (deficit <= 1500) {
        batteryWatts = deficit;
        gridWatts = 0;
      } else {
        // Battery supplies 1500W, remainder imported from Grid
        batteryWatts = 1500;
        gridWatts = gridAlive ? deficit - 1500 : 0;
      }
    } else {
      batteryMode = 'idle';
      batteryWatts = 0;
      gridWatts = 0;
    }
  } else {
    // Battery disconnected
    batteryMode = 'idle';
    batteryWatts = 0;
    if (netPower < 0 && gridAlive) {
      gridWatts = Math.abs(netPower);
    }
  }

  if (gridWatts > 0) {
    gridAmps = (gridWatts / 230).toFixed(1);
  }

  const batteryVolts = batteryAlive ? (51.2 + (batteryMode === 'charging' ? 0.6 : -0.4)).toFixed(2) : '0.00';
  const batteryAmps = batteryAlive && batteryWatts > 0
    ? (batteryWatts / parseFloat(batteryVolts)).toFixed(1)
    : '0.0';
  const batterySOC = batteryAlive ? 96 : 0;

  // Grid metrics
  const gridVolts = gridAlive ? '227.7' : '0.0';
  const gridFreq = gridAlive ? '49.7' : '0.0';

  // Apply quick presets
  const handleApplyPreset = (preset: 'normal' | 'islanded' | 'night' | 'grid_direct') => {
    setActivePreset(preset);
    if (preset === 'normal') {
      setSolarAlive(true);
      setBatteryAlive(true);
      setGridAlive(true);
      setLoadAlive(true);
    } else if (preset === 'islanded') {
      setSolarAlive(true);
      setBatteryAlive(true);
      setGridAlive(false); // Outage / Off-grid
      setLoadAlive(true);
    } else if (preset === 'night') {
      setSolarAlive(false); // Night / shaded
      setBatteryAlive(true);
      setGridAlive(true);
      setLoadAlive(true);
    } else if (preset === 'grid_direct') {
      setSolarAlive(false);
      setBatteryAlive(false);
      setGridAlive(true);
      setLoadAlive(true);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#121212] space-y-6">
      {/* 1. Header & Live Connection Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Lightning size={16} weight="bold" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Live Energy &amp; Power Flow Topology
            </h3>
            <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
              REAL-TIME SVG BUS
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Real-time power routing across Solar PV, Battery, Hybrid Controller, Household Load, and Utility Grid.
          </p>
        </div>

        {/* Quick Simulation Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] text-neutral-400 uppercase mr-1 hidden lg:inline">
            Link State:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('normal')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'normal' && solarAlive && batteryAlive && gridAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            All Active
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('islanded')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'islanded' && !gridAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            Grid Islanded
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('night')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'night' && !solarAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            Night Mode
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('grid_direct')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'grid_direct' && !batteryAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            Mains Direct
          </button>
        </div>
      </div>

      {/* 2. Visual Topology Grid matching the Solar Diagram */}
      <div className="relative mx-auto max-w-4xl py-2 select-none">
        {/* SVG Flow Connections Overlay */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[520px]">
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 800 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Path 1: Solar (Top-Left 210, 110) to Central Hub (400, 250) */}
              <path
                id={`${uid}-path-solar-to-hub`}
                d="M 220 120 L 220 250 L 330 250"
              />
              {/* Path 2: Central Hub (400, 250) to Load (Top-Right 590, 110) */}
              <path
                id={`${uid}-path-hub-to-load`}
                d="M 470 250 L 580 250 L 580 120"
              />
              {/* Path 3: Battery (Bottom-Left 220, 390) to Central Hub (330, 250) */}
              <path
                id={`${uid}-path-hub-to-battery`}
                d="M 330 250 L 220 250 L 220 380"
              />
              <path
                id={`${uid}-path-battery-to-hub`}
                d="M 220 380 L 220 250 L 330 250"
              />
              {/* Path 4: Grid (Bottom-Right 580, 390) to Central Hub */}
              <path
                id={`${uid}-path-grid-to-hub`}
                d="M 580 380 L 580 250 L 470 250"
              />
            </defs>

            {/* Base Dashed Connection Lines */}
            {/* 1. Solar Line */}
            <path
              d="M 220 120 L 220 250 L 330 250"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className={cn(
                'transition-colors duration-500',
                solarAlive && solarWatts > 0
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-300 dark:text-neutral-700 opacity-40'
              )}
            />

            {/* 2. Load Line */}
            <path
              d="M 470 250 L 580 250 L 580 120"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className={cn(
                'transition-colors duration-500',
                loadAlive && loadWatts > 0
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-300 dark:text-neutral-700 opacity-40'
              )}
            />

            {/* 3. Battery Line */}
            <path
              d="M 220 380 L 220 250 L 330 250"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className={cn(
                'transition-colors duration-500',
                batteryAlive
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-300 dark:text-neutral-700 opacity-40'
              )}
            />

            {/* 4. Grid Line */}
            <path
              d="M 580 380 L 580 250 L 470 250"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className={cn(
                'transition-colors duration-500',
                gridAlive
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-300 dark:text-neutral-700 opacity-40'
              )}
            />

            {/* Animated Flow Particles (Showing WHERE connection is alive) */}
            {/* Solar -> Hub Flow */}
            {solarAlive && solarWatts > 0 && (
              <>
                <circle r="4.5" className="fill-neutral-900 dark:fill-white">
                  <animateMotion
                    dur="2.4s"
                    repeatCount="indefinite"
                    path="M 220 120 L 220 250 L 330 250"
                  />
                </circle>
                <circle r="4.5" className="fill-neutral-900 dark:fill-white opacity-60">
                  <animateMotion
                    dur="2.4s"
                    begin="1.2s"
                    repeatCount="indefinite"
                    path="M 220 120 L 220 250 L 330 250"
                  />
                </circle>
              </>
            )}

            {/* Hub -> Load Flow */}
            {loadAlive && loadWatts > 0 && (
              <>
                <circle r="4.5" className="fill-neutral-900 dark:fill-white">
                  <animateMotion
                    dur="2.2s"
                    repeatCount="indefinite"
                    path="M 470 250 L 580 250 L 580 120"
                  />
                </circle>
                <circle r="4.5" className="fill-neutral-900 dark:fill-white opacity-60">
                  <animateMotion
                    dur="2.2s"
                    begin="1.1s"
                    repeatCount="indefinite"
                    path="M 470 250 L 580 250 L 580 120"
                  />
                </circle>
              </>
            )}

            {/* Hub <-> Battery Flow */}
            {batteryAlive && batteryWatts > 0 && (
              <>
                {batteryMode === 'charging' ? (
                  // Flowing into battery
                  <circle r="4.5" className="fill-neutral-900 dark:fill-white">
                    <animateMotion
                      dur="2.5s"
                      repeatCount="indefinite"
                      path="M 330 250 L 220 250 L 220 380"
                    />
                  </circle>
                ) : (
                  // Flowing out of battery into hub
                  <circle r="4.5" className="fill-neutral-900 dark:fill-white">
                    <animateMotion
                      dur="2.5s"
                      repeatCount="indefinite"
                      path="M 220 380 L 220 250 L 330 250"
                    />
                  </circle>
                )}
              </>
            )}

            {/* Grid Flow (if importing backup power) */}
            {gridAlive && gridWatts > 0 && (
              <circle r="4.5" className="fill-neutral-900 dark:fill-white">
                <animateMotion
                  dur="2.5s"
                  repeatCount="indefinite"
                  path="M 580 380 L 580 250 L 470 250"
                />
              </circle>
            )}
          </svg>

          {/* Bus Metric Labels on Connecting Segments (matching reference image) */}
          <div className="absolute top-[50%] left-[24%] -translate-y-1/2 -translate-x-1/2 pointer-events-none">
            <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200 bg-white/95 dark:bg-[#121212]/95 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 shadow-2xs">
              49.9 Hz
            </span>
          </div>

          <div className="absolute top-[50%] right-[24%] -translate-y-1/2 translate-x-1/2 pointer-events-none">
            <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200 bg-white/95 dark:bg-[#121212]/95 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 shadow-2xs">
              230.2 V
            </span>
          </div>

          {/* 🌟 1. TOP-LEFT NODE: SOLAR PV ARRAY */}
          <div className="absolute top-2 left-2 sm:left-4 sm:top-4 z-10 w-[42%] max-w-[210px]">
            <div
              className={cn(
                'rounded-xl border p-3 transition-all',
                solarAlive
                  ? 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-[#181818]'
                  : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
                    <Sun size={16} weight="bold" />
                  </div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    Solar PV
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSolarAlive(!solarAlive)}
                  title={solarAlive ? 'Click to disconnect Solar PV' : 'Click to reconnect Solar PV'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold border cursor-pointer transition',
                    solarAlive
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'border-neutral-300 bg-neutral-200 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      solarAlive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                    )}
                  />
                  <span>{solarAlive ? 'ALIVE' : 'CUT'}</span>
                </button>
              </div>

              {/* Numerical Readout */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {solarWatts} W
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {solarYieldPercent}% YIELD
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>{solarVolts} V</span>
                  <span>{solarAmps} A</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🏠 2. TOP-RIGHT NODE: HOME & ACTUATOR LOAD */}
          <div className="absolute top-2 right-2 sm:right-4 sm:top-4 z-10 w-[42%] max-w-[210px]">
            <div
              className={cn(
                'rounded-xl border p-3 transition-all',
                loadAlive
                  ? 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-[#181818]'
                  : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
                    <House size={16} weight="bold" />
                  </div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    Home Load
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setLoadAlive(!loadAlive)}
                  title={loadAlive ? 'Click to trip/disconnect Load' : 'Click to reconnect Load'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold border cursor-pointer transition',
                    loadAlive
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'border-neutral-300 bg-neutral-200 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      loadAlive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                    )}
                  />
                  <span>{loadAlive ? 'ALIVE' : 'OFF'}</span>
                </button>
              </div>

              {/* Numerical Readout */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {loadWatts} W
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {loadVA} VA
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>{loadAmps} A</span>
                  <span>{loadFactorPercent}% LOAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* ⚡ 3. CENTER HUB: ESP32 HYBRID INVERTER & CONTROLLER */}
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 p-3 sm:p-4 shadow-lg min-w-[124px] sm:min-w-[150px] text-center">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Cpu size={18} weight="bold" />
                <span className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">
                  Inverter Hub
                </span>
              </div>

              {/* Live Hub Readout */}
              <div className="space-y-0.5 font-mono text-[10px] sm:text-[11px]">
                <div className="font-bold text-xs sm:text-sm">
                  {solarAlive && solarWatts > 0 ? `${solarWatts}W IN` : 'STANDBY'}
                </div>
                <div className="opacity-75">
                  {loadAlive && loadWatts > 0 ? `${loadWatts}W OUT` : '0W LOAD'}
                </div>
              </div>

              {/* Discrete State Pill */}
              <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/20 dark:bg-neutral-900/10 px-2 py-0.5 text-[9px] font-mono font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-900 shrink-0 animate-pulse" />
                <span>ESP32 BUS</span>
              </div>
            </div>
          </div>

          {/* 🔋 4. BOTTOM-LEFT NODE: BATTERY STORAGE */}
          <div className="absolute bottom-2 left-2 sm:left-4 sm:bottom-4 z-10 w-[42%] max-w-[210px]">
            <div
              className={cn(
                'rounded-xl border p-3 transition-all',
                batteryAlive
                  ? 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-[#181818]'
                  : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
                    {batteryMode === 'charging' ? (
                      <BatteryCharging size={16} weight="bold" />
                    ) : (
                      <BatteryHigh size={16} weight="bold" />
                    )}
                  </div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    Battery
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setBatteryAlive(!batteryAlive)}
                  title={batteryAlive ? 'Click to disconnect Battery' : 'Click to reconnect Battery'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold border cursor-pointer transition',
                    batteryAlive
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'border-neutral-300 bg-neutral-200 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      batteryAlive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                    )}
                  />
                  <span>{batteryAlive ? 'ALIVE' : 'CUT'}</span>
                </button>
              </div>

              {/* Numerical Readout */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {batteryWatts} W
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {batterySOC}% SOC
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>{batteryVolts} V</span>
                  <span>{batteryAmps} A</span>
                </div>
                <div className="text-[10px] font-semibold text-neutral-500 uppercase pt-0.5">
                  {batteryAlive ? batteryMode : 'OFFLINE'}
                </div>
              </div>
            </div>
          </div>

          {/* 🗼 5. BOTTOM-RIGHT NODE: UTILITY GRID */}
          <div className="absolute bottom-2 right-2 sm:right-4 sm:bottom-4 z-10 w-[42%] max-w-[210px]">
            <div
              className={cn(
                'rounded-xl border p-3 transition-all',
                gridAlive
                  ? 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-[#181818]'
                  : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
                    <PlugsConnected size={16} weight="bold" />
                  </div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    Grid Mains
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setGridAlive(!gridAlive)}
                  title={gridAlive ? 'Click to cut Grid connection' : 'Click to restore Grid connection'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold border cursor-pointer transition',
                    gridAlive
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'border-neutral-300 bg-neutral-200 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      gridAlive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                    )}
                  />
                  <span>{gridAlive ? 'ALIVE' : 'CUT'}</span>
                </button>
              </div>

              {/* Numerical Readout */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {gridWatts} W
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {gridFreq} HZ
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>{gridVolts} V</span>
                  <span>{gridAmps} A</span>
                </div>
                <div className="text-[10px] font-semibold text-neutral-500 uppercase pt-0.5">
                  {gridAlive ? (gridWatts > 0 ? 'IMPORTING' : 'ZERO-EXPORT') : 'ISLANDED'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Hardware Relay Dependency Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
          <span>
            Connected Actuators: {activeRelayCount} of {actuators.length} active (+{actuatorWatts}W dynamic load)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <span>{deviceName}</span>
          <span>•</span>
          <span>Sync cadence: 2.5s</span>
        </div>
      </div>
    </div>
  );
}
