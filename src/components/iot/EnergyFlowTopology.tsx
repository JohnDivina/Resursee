'use client';

import React, { useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { IoTTelemetry, IoTActuator } from '@/types/iotCloud';
import {
  Cpu,
  Broadcast,
  WifiHigh,
  WifiSlash,
  CloudArrowUp,
  ToggleRight,
  Gauge,
  SlidersHorizontal,
  PlugsConnected,
  ArrowsLeftRight,
  CheckCircle,
  WarningCircle,
  ShieldCheck,
  Globe,
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

  // Connection Alive / Disconnected states for each tier
  const [esp32Alive, setEsp32Alive] = useState(true);
  const [sensorsAlive, setSensorsAlive] = useState(true);
  const [internetAlive, setInternetAlive] = useState(true);
  const [cloudAlive, setCloudAlive] = useState(true);
  const [actuatorsAlive, setActuatorsAlive] = useState(true);

  // Link simulation preset active indicator
  const [activePreset, setActivePreset] = useState<
    'all_active' | 'wifi_cut' | 'sensor_fault' | 'cloud_maint' | 'relays_cut'
  >('all_active');

  // Compute live readings derived from real telemetry
  const temp = sensorsAlive && telemetry?.temperature !== undefined ? telemetry.temperature : 25.4;
  const hum = sensorsAlive && telemetry?.humidity !== undefined ? telemetry.humidity : 63.8;
  const soil = sensorsAlive && telemetry?.soilMoisture !== undefined ? telemetry.soilMoisture : 58;
  const light = sensorsAlive && telemetry?.light !== undefined ? telemetry.light : 720;

  // Active actuator statuses
  const pumpActuator = actuators.find(
    (a) => a.name.toLowerCase().includes('pump') || a.pin === 2 || a.pin === 26
  );
  const lightActuator = actuators.find(
    (a) => a.name.toLowerCase().includes('light') || a.pin === 4 || a.pin === 27
  );
  const fanActuator = actuators.find(
    (a) => a.name.toLowerCase().includes('fan') || a.pin === 15 || a.pin === 14
  );

  const pumpState = actuatorsAlive && pumpActuator ? pumpActuator.state : false;
  const lightState = actuatorsAlive && lightActuator ? lightActuator.state : true;
  const fanState = actuatorsAlive && fanActuator ? fanActuator.state : false;
  const activeRelayCount = [pumpState, lightState, fanState].filter(Boolean).length;

  // Apply scenario presets
  const handleApplyPreset = (
    preset: 'all_active' | 'wifi_cut' | 'sensor_fault' | 'cloud_maint' | 'relays_cut'
  ) => {
    setActivePreset(preset);
    if (preset === 'all_active') {
      setEsp32Alive(true);
      setSensorsAlive(true);
      setInternetAlive(true);
      setCloudAlive(true);
      setActuatorsAlive(true);
    } else if (preset === 'wifi_cut') {
      setEsp32Alive(true);
      setSensorsAlive(true);
      setInternetAlive(false); // Wi-Fi / Internet disconnected
      setCloudAlive(true);
      setActuatorsAlive(true);
    } else if (preset === 'sensor_fault') {
      setEsp32Alive(true);
      setSensorsAlive(false); // Sensor lines disconnected
      setInternetAlive(true);
      setCloudAlive(true);
      setActuatorsAlive(true);
    } else if (preset === 'cloud_maint') {
      setEsp32Alive(true);
      setSensorsAlive(true);
      setInternetAlive(true);
      setCloudAlive(false); // Cloud API returns 503 / unreachable
      setActuatorsAlive(true);
    } else if (preset === 'relays_cut') {
      setEsp32Alive(true);
      setSensorsAlive(true);
      setInternetAlive(true);
      setCloudAlive(true);
      setActuatorsAlive(false); // Actuator relay disconnected
    }
  };

  // Determine line activity based on node states
  const sensorToEsp32Active = sensorsAlive && esp32Alive;
  const esp32ToInternetActive = esp32Alive && internetAlive;
  const internetToCloudActive = internetAlive && cloudAlive;
  const internetToActuatorsActive = internetAlive && actuatorsAlive && esp32Alive;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#121212] space-y-6">
      {/* 1. Header & Live Connection Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <Broadcast size={16} weight="bold" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              ESP32 · Internet · Cloud Flow Topology
            </h3>
            <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
              REAL-TIME SVG BUS
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Real-time connection topology and telemetry flow between ESP32 Hardware, Local Internet Gateway, and Resursee IoT Cloud.
          </p>
        </div>

        {/* Quick Simulation Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] text-neutral-400 uppercase mr-1 hidden lg:inline">
            Link State:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('all_active')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'all_active' &&
                esp32Alive &&
                sensorsAlive &&
                internetAlive &&
                cloudAlive &&
                actuatorsAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            All Active
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('wifi_cut')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'wifi_cut' && !internetAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            Wi-Fi Dropped
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('sensor_fault')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'sensor_fault' && !sensorsAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            Sensor Fault
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('cloud_maint')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'cloud_maint' && !cloudAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            Cloud Offline
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('relays_cut')}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border',
              activePreset === 'relays_cut' && !actuatorsAlive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            )}
          >
            Relays Cut
          </button>
        </div>
      </div>

      {/* 2. Visual Topology Grid (Adapted to ESP32 - Internet - Cloud) */}
      <div className="relative mx-auto max-w-4xl py-2 select-none">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[520px]">
          {/* SVG Animated Flow Connections Overlay */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 800 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Path 1: Sensors (Bottom-Left 220, 380) to ESP32 (Top-Left 220, 120) */}
              <path
                id={`${uid}-path-sensors-to-esp32`}
                d="M 220 380 L 220 120"
              />
              {/* Path 2: ESP32 (Top-Left 220, 120) to Internet Gateway (Center 330, 250) */}
              <path
                id={`${uid}-path-esp32-to-internet`}
                d="M 220 120 L 220 250 L 330 250"
              />
              {/* Path 3: Internet Gateway (470, 250) to Resursee Cloud (Top-Right 580, 120) */}
              <path
                id={`${uid}-path-internet-to-cloud`}
                d="M 470 250 L 580 250 L 580 120"
              />
              {/* Path 4: Internet Gateway (470, 250) to Actuators (Bottom-Right 580, 380) */}
              <path
                id={`${uid}-path-internet-to-actuators`}
                d="M 470 250 L 580 250 L 580 380"
              />
            </defs>

            {/* Base Dashed Connection Lines */}
            {/* 1. Sensors -> ESP32 Line */}
            <path
              d="M 220 380 L 220 120"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className={cn(
                'transition-colors duration-500',
                sensorToEsp32Active
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-300 dark:text-neutral-700 opacity-40'
              )}
            />

            {/* 2. ESP32 -> Internet Line */}
            <path
              d="M 220 120 L 220 250 L 330 250"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className={cn(
                'transition-colors duration-500',
                esp32ToInternetActive
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-300 dark:text-neutral-700 opacity-40'
              )}
            />

            {/* 3. Internet -> Cloud Line */}
            <path
              d="M 470 250 L 580 250 L 580 120"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className={cn(
                'transition-colors duration-500',
                internetToCloudActive
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-300 dark:text-neutral-700 opacity-40'
              )}
            />

            {/* 4. Internet -> Actuators Line */}
            <path
              d="M 470 250 L 580 250 L 580 380"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className={cn(
                'transition-colors duration-500',
                internetToActuatorsActive
                  ? 'text-neutral-800 dark:text-neutral-200'
                  : 'text-neutral-300 dark:text-neutral-700 opacity-40'
              )}
            />

            {/* Animated Flow Particles (Showing WHERE connection is alive) */}
            {/* 1. Sensors -> ESP32 Signal Flow */}
            {sensorToEsp32Active && (
              <circle r="4.5" className="fill-neutral-900 dark:fill-white">
                <animateMotion
                  dur="2.0s"
                  repeatCount="indefinite"
                  path="M 220 380 L 220 120"
                />
              </circle>
            )}

            {/* 2. ESP32 -> Internet Gateway Wi-Fi Packets */}
            {esp32ToInternetActive && (
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

            {/* 3. Internet Gateway -> Resursee Cloud Ingest Stream */}
            {internetToCloudActive && (
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

            {/* 4. Cloud Commands -> Internet -> Actuator Relays */}
            {internetToActuatorsActive && (
              <circle r="4.5" className="fill-neutral-900 dark:fill-white">
                <animateMotion
                  dur="2.6s"
                  repeatCount="indefinite"
                  path="M 470 250 L 580 250 L 580 380"
                />
              </circle>
            )}
          </svg>

          {/* Metric Callouts on Connecting Segments */}
          <div className="absolute top-[50%] left-[24%] -translate-y-1/2 -translate-x-1/2 pointer-events-none">
            <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200 bg-white/95 dark:bg-[#121212]/95 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 shadow-2xs">
              {internetAlive ? 'RSSI: -58 dBm' : 'NO CARRIER'}
            </span>
          </div>

          <div className="absolute top-[50%] right-[24%] -translate-y-1/2 translate-x-1/2 pointer-events-none">
            <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200 bg-white/95 dark:bg-[#121212]/95 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 shadow-2xs">
              {cloudAlive && internetAlive ? 'TLS 1.3 / 443' : 'UNREACHABLE'}
            </span>
          </div>

          {/* 💻 1. TOP-LEFT NODE: ESP32 MICROCONTROLLER */}
          <div className="absolute top-2 left-2 sm:left-4 sm:top-4 z-10 w-[42%] max-w-[210px]">
            <div
              className={cn(
                'rounded-xl border p-3 transition-all',
                esp32Alive
                  ? 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-[#181818]'
                  : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
                    <Cpu size={16} weight="bold" />
                  </div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    ESP32 MCU
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setEsp32Alive(!esp32Alive)}
                  title={esp32Alive ? 'Click to cut ESP32' : 'Click to reconnect ESP32'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold border cursor-pointer transition',
                    esp32Alive
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'border-neutral-300 bg-neutral-200 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      esp32Alive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                    )}
                  />
                  <span>{esp32Alive ? 'ALIVE' : 'CUT'}</span>
                </button>
              </div>

              {/* Numerical Readout */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {esp32Alive ? '240 MHz' : 'OFFLINE'}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    CORE 0/1
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>{esp32Alive ? '192.168.1.142' : '0.0.0.0'}</span>
                  <span>2.5s POLL</span>
                </div>
              </div>
            </div>
          </div>

          {/* ☁️ 2. TOP-RIGHT NODE: RESURSEE IOT CLOUD PLATFORM */}
          <div className="absolute top-2 right-2 sm:right-4 sm:top-4 z-10 w-[42%] max-w-[210px]">
            <div
              className={cn(
                'rounded-xl border p-3 transition-all',
                cloudAlive
                  ? 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-[#181818]'
                  : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
                    <CloudArrowUp size={16} weight="bold" />
                  </div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    IoT Cloud
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCloudAlive(!cloudAlive)}
                  title={cloudAlive ? 'Click to cut Cloud Ingest' : 'Click to reconnect Cloud Ingest'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold border cursor-pointer transition',
                    cloudAlive
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'border-neutral-300 bg-neutral-200 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      cloudAlive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                    )}
                  />
                  <span>{cloudAlive ? 'ALIVE' : 'OFF'}</span>
                </button>
              </div>

              {/* Numerical Readout */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {cloudAlive ? '200 OK' : '503 ERR'}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    /api/iot/ingest
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>TOKEN: OK</span>
                  <span>18/60 RATE</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🌐 3. CENTER HUB: INTERNET GATEWAY & TRANSIT */}
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 p-3 sm:p-4 shadow-lg min-w-[130px] sm:min-w-[160px] text-center">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Globe size={18} weight="bold" />
                <span className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">
                  Internet Hub
                </span>
              </div>

              {/* Live Hub Readout */}
              <div className="space-y-0.5 font-mono text-[10px] sm:text-[11px]">
                <div className="font-bold text-xs sm:text-sm">
                  {internetAlive ? '38 ms PING' : 'DISCONNECTED'}
                </div>
                <div className="opacity-75">
                  {internetAlive ? '180 B · 24 PKT/M' : 'PACKET LOSS'}
                </div>
              </div>

              {/* Discrete State Pill */}
              <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/20 dark:bg-neutral-900/10 px-2 py-0.5 text-[9px] font-mono font-semibold">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    internetAlive
                      ? 'bg-white dark:bg-neutral-900 animate-pulse'
                      : 'bg-neutral-400'
                  )}
                />
                <span>{internetAlive ? 'ESP32 ⇄ CLOUD' : 'NO CARRIER'}</span>
              </div>
            </div>
          </div>

          {/* 📊 4. BOTTOM-LEFT NODE: HARDWARE SENSORS & ADC */}
          <div className="absolute bottom-2 left-2 sm:left-4 sm:bottom-4 z-10 w-[42%] max-w-[210px]">
            <div
              className={cn(
                'rounded-xl border p-3 transition-all',
                sensorsAlive
                  ? 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-[#181818]'
                  : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
                    <SlidersHorizontal size={16} weight="bold" />
                  </div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    Sensors (ADC)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSensorsAlive(!sensorsAlive)}
                  title={sensorsAlive ? 'Click to cut Sensors' : 'Click to reconnect Sensors'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold border cursor-pointer transition',
                    sensorsAlive
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'border-neutral-300 bg-neutral-200 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      sensorsAlive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                    )}
                  />
                  <span>{sensorsAlive ? 'ALIVE' : 'CUT'}</span>
                </button>
              </div>

              {/* Numerical Readout */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {sensorsAlive ? `${temp}°C · ${hum}%` : 'NO DATA'}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    DHT22
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>SOIL: {sensorsAlive ? `${soil}%` : '--'}</span>
                  <span>LUX: {sensorsAlive ? `${light}` : '--'}</span>
                </div>
                <div className="text-[10px] font-semibold text-neutral-500 uppercase pt-0.5">
                  {sensorsAlive ? 'GPIO 4 · GPIO 34 · GPIO 35' : 'ADC DISCONNECTED'}
                </div>
              </div>
            </div>
          </div>

          {/* ⚡ 5. BOTTOM-RIGHT NODE: RELAY ACTUATORS */}
          <div className="absolute bottom-2 right-2 sm:right-4 sm:bottom-4 z-10 w-[42%] max-w-[210px]">
            <div
              className={cn(
                'rounded-xl border p-3 transition-all',
                actuatorsAlive
                  ? 'border-neutral-300 bg-white shadow-xs dark:border-neutral-700 dark:bg-[#181818]'
                  : 'border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/60'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
                    <ToggleRight size={16} weight="bold" />
                  </div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    Actuator Relays
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActuatorsAlive(!actuatorsAlive)}
                  title={actuatorsAlive ? 'Click to cut Relays' : 'Click to reconnect Relays'}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold border cursor-pointer transition',
                    actuatorsAlive
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                      : 'border-neutral-300 bg-neutral-200 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      actuatorsAlive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                    )}
                  />
                  <span>{actuatorsAlive ? 'ALIVE' : 'CUT'}</span>
                </button>
              </div>

              {/* Numerical Readout */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    {actuatorsAlive ? `${activeRelayCount}/3 ON` : 'ISOLATED'}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    GPIO PINS
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>PUMP: {pumpState ? 'ON' : 'OFF'}</span>
                  <span>LIGHT: {lightState ? 'ON' : 'OFF'}</span>
                </div>
                <div className="text-[10px] font-semibold text-neutral-500 uppercase pt-0.5">
                  {actuatorsAlive ? 'GPIO 26 · GPIO 27 · GPIO 14' : 'RELAYS DISARMED'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Hardware Relay Dependency Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 font-mono">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 rounded-full shrink-0',
              internetAlive && cloudAlive && esp32Alive
                ? 'bg-neutral-900 dark:bg-white'
                : 'bg-neutral-400'
            )}
          />
          <span>
            Connection Bus: {esp32ToInternetActive && internetToCloudActive ? 'End-to-End Online (ESP32 → Wi-Fi → Resursee Ingest)' : 'Degraded / Link Interrupted'}
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
