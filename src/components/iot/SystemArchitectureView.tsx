'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Cpu,
  WifiHigh,
  CloudArrowUp,
  Gauge,
  ArrowsLeftRight,
  ShieldCheck,
  Code,
  CheckCircle,
  Copy,
  Check,
  Play,
  ArrowRight,
  Broadcast,
  ToggleRight,
  LockKey,
  Lightning,
  Clock,
  HardDrives,
  Graph,
} from '@phosphor-icons/react';

interface SystemArchitectureViewProps {
  onBackToDashboard?: () => void;
  onOpenFirmware?: () => void;
  deviceToken?: string;
  deviceId?: string;
}

type ArchStage = 'esp32' | 'wifi' | 'cloud' | 'dashboard';

export default function SystemArchitectureView({
  onBackToDashboard,
  onOpenFirmware,
  deviceToken = 'sk_esp32_7f9a21_9c8b1a',
  deviceId = 'dev-usr_johnrey-gh',
}: SystemArchitectureViewProps) {
  const [selectedStage, setSelectedStage] = useState<ArchStage>('esp32');
  const [simulatingPacket, setSimulatingPacket] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [packetType, setPacketType] = useState<'telemetry' | 'actuator'>('telemetry');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Run interactive packet simulation
  const handleRunSimulation = (type: 'telemetry' | 'actuator') => {
    if (simulatingPacket) return;
    setPacketType(type);
    setSimulatingPacket(true);
    setActiveStep(0);

    const steps = [0, 1, 2, 3];
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setActiveStep(step);
        if (step === 0) setSelectedStage(type === 'telemetry' ? 'esp32' : 'dashboard');
        else if (step === 1) setSelectedStage(type === 'telemetry' ? 'wifi' : 'cloud');
        else if (step === 2) setSelectedStage(type === 'telemetry' ? 'cloud' : 'wifi');
        else if (step === 3) {
          setSelectedStage(type === 'telemetry' ? 'dashboard' : 'esp32');
          setTimeout(() => {
            setSimulatingPacket(false);
            setActiveStep(-1);
          }, 1200);
        }
      }, (idx + 1) * 750);
    });
  };

  const sampleTelemetryPayload = {
    deviceToken: deviceToken,
    temperature: 25.4,
    humidity: 63.8,
    soilMoisture: 58,
    light: 720,
    rssi: -58,
    ipAddress: '192.168.1.142',
  };

  const sampleResponsePayload = {
    success: true,
    timestamp: '2026-09-27T12:00:00.000Z',
    message: 'Telemetry ingested successfully.',
    actuatorStates: {
      pin_2: false,
      pin_4: true,
      pin_15: false,
    },
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-[#121212]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
              <Graph size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                ESP32 IoT Cloud · System Architecture &amp; Data Pipeline
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                End-to-end data lifecycle: Physical hardware signal acquisition → 2.4GHz Wi-Fi WAN transport → Serverless Edge ingestion → Real-time SVG dashboard telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <Gauge size={14} weight="bold" />
              <span>Live Telemetry</span>
            </button>
          )}

          {onOpenFirmware && (
            <button
              type="button"
              onClick={onOpenFirmware}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-semibold shadow-2xs hover:opacity-90 transition cursor-pointer"
            >
              <Code size={14} weight="bold" />
              <span>Arduino Firmware (.ino)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Simulation Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
          <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Interactive Signal Simulator:
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Test bi-directional packet propagation in real time
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={simulatingPacket}
            onClick={() => handleRunSimulation('telemetry')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
              simulatingPacket && packetType === 'telemetry'
                ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
            )}
          >
            <Play size={13} weight="fill" />
            <span>Simulate Telemetry Push (Upstream)</span>
          </button>

          <button
            type="button"
            disabled={simulatingPacket}
            onClick={() => handleRunSimulation('actuator')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
              simulatingPacket && packetType === 'actuator'
                ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
            )}
          >
            <ToggleRight size={15} weight="bold" />
            <span>Simulate Relay Command (Downstream)</span>
          </button>
        </div>
      </div>

      {/* 3. Four-Tier Architecture Flow Diagram */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
            1. Multi-Tier End-to-End Architecture
          </h3>
          <span className="font-mono text-xs text-neutral-400">
            Click any block to inspect wire specs &amp; code
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* TIER 1: ESP32 HARDWARE */}
          <div
            onClick={() => setSelectedStage('esp32')}
            className={cn(
              'relative rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4',
              selectedStage === 'esp32'
                ? 'border-neutral-900 bg-white dark:border-white dark:bg-[#181818] shadow-sm'
                : 'border-neutral-200 bg-white/70 hover:border-neutral-400 dark:border-neutral-800 dark:bg-[#121212]',
              activeStep === (packetType === 'telemetry' ? 0 : 3) && 'ring-2 ring-neutral-900 dark:ring-white'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                  <Cpu size={20} weight="bold" />
                </div>
                <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                  TIER 1
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  ESP32 Hardware
                </h4>
                <p className="font-mono text-[11px] text-neutral-400">
                  Xtensa LX6 240MHz · Core 0/1
                </p>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Microcontroller reads analog ADC &amp; one-wire sensor inputs, converts metrics to JSON via ArduinoJson, and handles GPIO relay outputs.
              </p>
            </div>

            {/* Sub-spec items */}
            <div className="space-y-1.5 border-t border-neutral-200 dark:border-neutral-800 pt-3 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Temp/Hum:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">DHT22 (GPIO 4)</span>
              </div>
              <div className="flex justify-between">
                <span>Soil Moisture:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">ADC1 (GPIO 34)</span>
              </div>
              <div className="flex justify-between">
                <span>Relay Actuators:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">GPIO 2, 4, 15</span>
              </div>
              <div className="flex justify-between">
                <span>Sampling Cadence:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Every 2.5s</span>
              </div>
            </div>

            {/* Direction Indicator */}
            <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-xs">
              →
            </div>
          </div>

          {/* TIER 2: NETWORK & WAN TRANSPORT */}
          <div
            onClick={() => setSelectedStage('wifi')}
            className={cn(
              'relative rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4',
              selectedStage === 'wifi'
                ? 'border-neutral-900 bg-white dark:border-white dark:bg-[#181818] shadow-sm'
                : 'border-neutral-200 bg-white/70 hover:border-neutral-400 dark:border-neutral-800 dark:bg-[#121212]',
              activeStep === (packetType === 'telemetry' ? 1 : 2) && 'ring-2 ring-neutral-900 dark:ring-white'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                  <WifiHigh size={20} weight="bold" />
                </div>
                <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                  TIER 2
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Internet Gateway
                </h4>
                <p className="font-mono text-[11px] text-neutral-400">
                  802.11 b/g/n · TLS 1.3 / TCP
                </p>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Connects through local 2.4GHz Wi-Fi Access Point and router NAT gateway. Encrypts JSON telemetry inside TLS 1.3 tunnel over WAN.
              </p>
            </div>

            {/* Sub-spec items */}
            <div className="space-y-1.5 border-t border-neutral-200 dark:border-neutral-800 pt-3 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Protocol:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">HTTPS POST / 443</span>
              </div>
              <div className="flex justify-between">
                <span>Encryption:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">TLS 1.3 (ECDHE)</span>
              </div>
              <div className="flex justify-between">
                <span>RSSI Nominal:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">-58 dBm</span>
              </div>
              <div className="flex justify-between">
                <span>Auto-Reconnect:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Exp. Backoff</span>
              </div>
            </div>

            {/* Direction Indicator */}
            <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-xs">
              →
            </div>
          </div>

          {/* TIER 3: RESURSEE CLOUD INGESTION */}
          <div
            onClick={() => setSelectedStage('cloud')}
            className={cn(
              'relative rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4',
              selectedStage === 'cloud'
                ? 'border-neutral-900 bg-white dark:border-white dark:bg-[#181818] shadow-sm'
                : 'border-neutral-200 bg-white/70 hover:border-neutral-400 dark:border-neutral-800 dark:bg-[#121212]',
              activeStep === (packetType === 'telemetry' ? 2 : 1) && 'ring-2 ring-neutral-900 dark:ring-white'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                  <CloudArrowUp size={20} weight="bold" />
                </div>
                <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                  TIER 3
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Resursee Edge Ingest
                </h4>
                <p className="font-mono text-[11px] text-neutral-400">
                  /api/iot/ingest · Next.js API
                </p>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Serverless API validates deviceToken authentication, enforces sliding-window rate limiting, logs telemetry, and synchronizes actuator states.
              </p>
            </div>

            {/* Sub-spec items */}
            <div className="space-y-1.5 border-t border-neutral-200 dark:border-neutral-800 pt-3 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Auth:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">deviceToken Bearer</span>
              </div>
              <div className="flex justify-between">
                <span>Rate Limit:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">60 req/min (429)</span>
              </div>
              <div className="flex justify-between">
                <span>Isolation:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Tenant Scoped</span>
              </div>
              <div className="flex justify-between">
                <span>Relay Sync:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Bi-directional</span>
              </div>
            </div>

            {/* Direction Indicator */}
            <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-xs">
              →
            </div>
          </div>

          {/* TIER 4: CLIENT DASHBOARD */}
          <div
            onClick={() => setSelectedStage('dashboard')}
            className={cn(
              'relative rounded-2xl border p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4',
              selectedStage === 'dashboard'
                ? 'border-neutral-900 bg-white dark:border-white dark:bg-[#181818] shadow-sm'
                : 'border-neutral-200 bg-white/70 hover:border-neutral-400 dark:border-neutral-800 dark:bg-[#121212]',
              activeStep === (packetType === 'telemetry' ? 3 : 0) && 'ring-2 ring-neutral-900 dark:ring-white'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                  <Gauge size={20} weight="bold" />
                </div>
                <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                  TIER 4
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Resursee Dashboard
                </h4>
                <p className="font-mono text-[11px] text-neutral-400">
                  React 19 · SVG Energy Topology
                </p>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Presents real-time gauges, solar power flow SVG topology, historical charts, and provides immediate toggle switches to control physical GPIO relays.
              </p>
            </div>

            {/* Sub-spec items */}
            <div className="space-y-1.5 border-t border-neutral-200 dark:border-neutral-800 pt-3 text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Topology:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">SVG Energy Vector</span>
              </div>
              <div className="flex justify-between">
                <span>UI Update:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Optimistic + API</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">&lt; 100ms roundtrip</span>
              </div>
              <div className="flex justify-between">
                <span>Multi-Tab:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">BroadcastChannel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Deep-Dive Wire Inspector & Technical Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
              2. Wire Protocol &amp; Ingestion Deep-Dive: {selectedStage.toUpperCase()}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Payload formats, security rules, and code execution at this stage.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-neutral-400">Stage:</span>
            <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-xs font-bold text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 capitalize">
              {selectedStage}
            </span>
          </div>
        </div>

        {/* Dynamic Details based on selected stage */}
        {selectedStage === 'esp32' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} weight="bold" />
                <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Hardware Pin Assignments &amp; Architecture
                </h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                The ESP32 uses dedicated ADC1 channels and opto-isolated GPIO outputs to maintain signal isolation and protect the microcontroller from inductive relay kickback.
              </p>
              <div className="space-y-2 font-mono text-xs pt-1">
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">GPIO 4</span>
                  <span className="font-bold text-neutral-900 dark:text-white">DHT22 Digital One-Wire (Temp &amp; Hum)</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">GPIO 34 (ADC1_CH6)</span>
                  <span className="font-bold text-neutral-900 dark:text-white">Capacitive Soil Probe v1.2 (0-3.3V)</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">GPIO 35 (ADC1_CH7)</span>
                  <span className="font-bold text-neutral-900 dark:text-white">Photoresistor Light Sensor Divider</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">GPIO 2, 4, 15</span>
                  <span className="font-bold text-neutral-900 dark:text-white">Relay Actuators (Pump, Lights, Fan)</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code size={18} weight="bold" />
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                    ESP32 Serialization Code Snippet
                  </h4>
                </div>
                <span className="font-mono text-[10px] text-neutral-400">Arduino C++</span>
              </div>
              <div className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-[#0c0c0c] p-3 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                <pre>{`// Collect Sensor Metrics
float temp = dht.readTemperature();
float hum  = dht.readHumidity();
int soilRaw = analogRead(34);
int soilPct = map(soilRaw, 3200, 1400, 0, 100);

// Pack JSON using ArduinoJson v7
StaticJsonDocument<256> doc;
doc["deviceToken"] = DEVICE_TOKEN;
doc["temperature"] = temp;
doc["humidity"]    = hum;
doc["soilMoisture"]= soilPct;
doc["light"]       = analogRead(35);

String jsonPayload;
serializeJson(doc, jsonPayload);

// Dispatch to Resursee Ingestion API
http.begin(client, INGEST_URL);
http.addHeader("Content-Type", "application/json");
int httpCode = http.POST(jsonPayload);`}</pre>
              </div>
            </div>
          </div>
        )}

        {selectedStage === 'wifi' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
              <div className="flex items-center gap-2">
                <WifiHigh size={18} weight="bold" />
                <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Network Connectivity &amp; Reliability Stack
                </h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                The ESP32 firmware includes automatic Wi-Fi watchdog routines to recover gracefully from network dropouts, router reboots, or IP lease renewal events without locking up.
              </p>
              <div className="space-y-2 text-xs font-mono pt-1">
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Radio Protocol:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">802.11 b/g/n (2.4 GHz)</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Transport:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">TLS 1.3 / TCP Port 443</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Reconnection Loop:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">Non-blocking millis() check</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Packet Size:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">~180 bytes per payload</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
              <div className="flex items-center gap-2">
                <LockKey size={18} weight="bold" />
                <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Transport Security (AGENTS.md Directive)
                </h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Data transferred across public networks is secured using TLS cryptographic handshakes. Device authentication tokens are unique cryptographic hashes that isolate telemetry streams per user.
              </p>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/60 font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold">
                  <ShieldCheck size={16} />
                  <span>Security Guarantees:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400 text-[11px]">
                  <li>Non-sequential cryptographic identifiers (`dev-usr_...`)</li>
                  <li>Cryptographic Bearer token header (`x-device-token`)</li>
                  <li>Tamper-proof payload ingestion over encrypted HTTPS</li>
                  <li>Rate limited at API layer to prevent DDoS or flooding</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedStage === 'cloud' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudArrowUp size={18} weight="bold" />
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                    Wire Payload: ESP32 HTTP Request
                  </h4>
                </div>
                <span className="font-mono text-[10px] text-neutral-400">POST /api/iot/ingest</span>
              </div>
              <div className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-[#0c0c0c] p-3 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                <pre>{JSON.stringify(sampleTelemetryPayload, null, 2)}</pre>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowsLeftRight size={18} weight="bold" />
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                    Wire Response: Actuator Commands
                  </h4>
                </div>
                <span className="font-mono text-[10px] text-neutral-400">HTTP 200 OK</span>
              </div>
              <div className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-[#0c0c0c] p-3 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                <pre>{JSON.stringify(sampleResponsePayload, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}

        {selectedStage === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
              <div className="flex items-center gap-2">
                <Gauge size={18} weight="bold" />
                <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Client Reactivity &amp; Solar Topology Engine
                </h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                The Resursee dashboard translates incoming sensor data into real-time circular SVG gauges and drives the Solar &amp; Energy Flow Topology matrix with hardware-accelerated animated particles.
              </p>
              <div className="space-y-2 text-xs font-mono pt-1">
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Gauges:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">SVG 270° arc with needle interpolation</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Power Flow:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">Dynamic SVG animateMotion paths</span>
                </div>
                <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Chart Engine:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">Recharts sliding 30-sample window</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
              <div className="flex items-center gap-2">
                <ToggleRight size={18} weight="bold" />
                <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Bi-Directional Relay Control Protocol
                </h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                When a user toggles a relay switch in the web dashboard, an optimistic UI update occurs immediately, and a PUT request is dispatched to the cloud queue.
              </p>
              <div className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-[#0c0c0c] p-3 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                <pre>{`// User clicks Switch in Dashboard UI
await fetch('/api/iot/ingest', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deviceToken: "${deviceToken}",
    pin: 26,       // Water Irrigation Pump
    state: true    // Turn ON
  })
});

// On next ESP32 2.5s telemetry poll:
// Response contains { actuatorStates: { pin_26: true } }
// ESP32 executes: digitalWrite(26, HIGH);`}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Step-by-Step Sequence Breakdown */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#121212] space-y-4">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
          3. Lifecycle Sequence Breakdown (Hardware → Internet → Dashboard)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 space-y-1.5">
            <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
              Step 1: Signal Acquisition
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Every 2.5s, ESP32 samples temperature/humidity via DHT22 and capacitive soil voltage via SAR ADC1 channel 6.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 space-y-1.5">
            <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
              Step 2: JSON Packaging
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              ArduinoJson serializes the sensor values and injects the device authentication token into a compact HTTP POST body.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 space-y-1.5">
            <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
              Step 3: Wi-Fi Transmission
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Wi-Fi radio transmits payload to local gateway router, forwarding encrypted TLS 1.3 packets over public Internet.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 space-y-1.5">
            <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
              Step 4: Edge Ingestion &amp; Throttling
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              <code>/api/iot/ingest</code> checks rate limits, verifies device ownership, and stores telemetry in isolated user space.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 space-y-1.5">
            <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
              Step 5: Actuator Command Piggybacking
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              API response includes current GPIO relay target states. ESP32 parses response and sets physical pin levels.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 space-y-1.5">
            <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
              Step 6: Real-Time UI Render
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Dashboard updates live dials, pushes new telemetry point to Recharts stream, and updates animated energy flow particles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
