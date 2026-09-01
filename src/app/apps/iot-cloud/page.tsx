'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import SensorGauge from '@/components/iot/SensorGauge';
import TelemetryChart from '@/components/iot/TelemetryChart';
import RelaySwitch from '@/components/iot/RelaySwitch';
import VirtualSimulator from '@/components/iot/VirtualSimulator';
import DeviceWizardModal from '@/components/iot/DeviceWizardModal';
import { IoTDevice, IoTTelemetry, IoTActuator } from '@/types/iotCloud';
import {
  getInitialDevices,
  getInitialActuators,
  generateSeedTelemetry,
} from '@/lib/iotStore';
import { generateArduinoSketch } from '@/lib/arduinoSketchGenerator';
import {
  Cpu,
  Plus,
  WifiHigh,
  WifiSlash,
  Code,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Copy,
  Check,
  Lightning,
  UserCircle,
} from '@phosphor-icons/react';

export default function IoTCloudPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [firmwareModalOpen, setFirmwareModalOpen] = useState(false);
  const [copiedSketch, setCopiedSketch] = useState(false);

  // Multi-Tenant User ID Simulation (fresh for every user)
  const [userId, setUserId] = useState('usr_johnrey_77');
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [telemetry, setTelemetry] = useState<IoTTelemetry[]>([]);
  const [actuators, setActuators] = useState<IoTActuator[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedChartMetric, setSelectedChartMetric] = useState<
    'temperature' | 'humidity' | 'soilMoisture' | 'light'
  >('temperature');

  // Initialize User's Devices and Dashboard
  useEffect(() => {
    try {
      const savedDevices = localStorage.getItem(`resursee_iot_devices_${userId}`);
      if (savedDevices) {
        const parsed = JSON.parse(savedDevices);
        setDevices(parsed);
        if (parsed.length > 0) {
          setSelectedDevice(parsed[0]);
          loadDeviceState(parsed[0].id);
        }
      } else {
        const initial = getInitialDevices(userId);
        setDevices(initial);
        setSelectedDevice(initial[0]);
        loadDeviceState(initial[0].id);
        localStorage.setItem(`resursee_iot_devices_${userId}`, JSON.stringify(initial));
      }
    } catch {
      const initial = getInitialDevices(userId);
      setDevices(initial);
      setSelectedDevice(initial[0]);
      loadDeviceState(initial[0].id);
    }
  }, [userId]);

  const loadDeviceState = (deviceId: string) => {
    const initialActuators = getInitialActuators(deviceId);
    setActuators(initialActuators);

    const initialTelem = generateSeedTelemetry(deviceId, 20);
    setTelemetry(initialTelem);
  };

  // Virtual Telemetry Emitter (Simulates live ESP32 broadcasting every 2.5s)
  useEffect(() => {
    if (!isSimulating || !selectedDevice) return;

    const interval = setInterval(() => {
      const now = new Date();
      const lastPoint = telemetry[telemetry.length - 1];

      const baseTemp = lastPoint?.temperature ?? 25.4;
      const baseHum = lastPoint?.humidity ?? 64.0;
      const baseSoil = lastPoint?.soilMoisture ?? 58;

      // Realistic sensor noise walk
      const nextTemp = parseFloat((baseTemp + (Math.random() * 0.6 - 0.3)).toFixed(1));
      const nextHum = parseFloat((baseHum + (Math.random() * 0.8 - 0.4)).toFixed(1));
      const nextSoil = Math.min(95, Math.max(20, Math.round(baseSoil + (Math.random() * 2 - 1))));
      const nextLight = Math.round(650 + Math.random() * 90);

      const newTelemetryPoint: IoTTelemetry = {
        id: `telem-${selectedDevice.id}-${Date.now()}`,
        deviceId: selectedDevice.id,
        timestamp: now.toISOString(),
        temperature: Math.min(45, Math.max(10, nextTemp)),
        humidity: Math.min(99, Math.max(20, nextHum)),
        soilMoisture: nextSoil,
        light: nextLight,
        battery: 98,
      };

      setTelemetry((prev) => [...prev.slice(-30), newTelemetryPoint]);

      // Update Device Last Seen
      setSelectedDevice((prev) =>
        prev
          ? {
              ...prev,
              lastSeenAt: now.toISOString(),
              status: 'online',
            }
          : null
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, selectedDevice, telemetry]);

  const handleDeviceCreated = (newDev: IoTDevice) => {
    const updated = [...devices, newDev];
    setDevices(updated);
    setSelectedDevice(newDev);
    loadDeviceState(newDev.id);
    localStorage.setItem(`resursee_iot_devices_${userId}`, JSON.stringify(updated));
  };

  const handleToggleActuator = async (actuator: IoTActuator, newState: boolean) => {
    // 1. Optimistic UI update
    setActuators((prev) =>
      prev.map((a) => (a.id === actuator.id ? { ...a, state: newState } : a))
    );

    // 2. Sync with Backend API
    if (selectedDevice) {
      try {
        await fetch('/api/iot/ingest', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceToken: selectedDevice.deviceToken,
            pin: actuator.pin,
            state: newState,
          }),
        });
      } catch (err) {
        console.error('Failed to sync actuator with API:', err);
      }
    }
  };

  const latestTelemetry = telemetry[telemetry.length - 1] || {
    temperature: 24.8,
    humidity: 62.5,
    soilMoisture: 60,
    light: 710,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette isOpen={searchPaletteOpen} onClose={() => setSearchPaletteOpen(false)} />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* 1. Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Apps
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)]">ESP32 IoT Cloud</span>
          </nav>

          {/* 2. Platform Header */}
          <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-blue-600 text-white shadow-xs">
                  <Cpu size={20} weight="bold" />
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                  ESP32 IoT Cloud · App #2
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-blue-700 dark:text-sky-300 border border-blue-500/20">
                  <ShieldCheck size={12} weight="bold" />
                  <span>Isolated RLS Multi-Tenant</span>
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                ESP32 IoT Cloud Platform
              </h1>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm max-w-2xl">
                Arduino Cloud-style telemetry hub. Pair your ESP32 in seconds with auto-generated C++ firmware, live sensor gauges, and remote relay controls.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
              >
                <Plus size={15} weight="bold" />
                <span>Add ESP32 Device</span>
              </button>
            </div>
          </div>

          {/* 3. Device Selector & Status Control Bar */}
          {selectedDevice && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  <Cpu size={24} weight="bold" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDevice.id}
                      onChange={(e) => {
                        const found = devices.find((d) => d.id === e.target.value);
                        if (found) {
                          setSelectedDevice(found);
                          loadDeviceState(found.id);
                        }
                      }}
                      className="font-extrabold text-sm sm:text-base text-[var(--color-ink)] bg-transparent border-b border-[var(--color-rule-strong)] pr-6 outline-hidden cursor-pointer"
                    >
                      {devices.map((d) => (
                        <option key={d.id} value={d.id} className="bg-[var(--color-paper-card)]">
                          {d.name} ({d.deviceType.toUpperCase()})
                        </option>
                      ))}
                    </select>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                        selectedDevice.status === 'online'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-neutral-500/10 text-neutral-500'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          selectedDevice.status === 'online'
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-neutral-400'
                        }`}
                      />
                      <span>{selectedDevice.status.toUpperCase()}</span>
                    </span>
                  </div>

                  <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-muted)] flex items-center gap-2">
                    <span>IP: {selectedDevice.ipAddress || '192.168.1.142'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <WifiHigh size={13} className="text-emerald-500" />
                      <span>{selectedDevice.rssi || -58} dBm</span>
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFirmwareModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-4 py-2 text-xs font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] active:scale-95 cursor-pointer"
                >
                  <Code size={15} />
                  <span>View .ino Firmware</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Live Virtual Simulator Strip */}
          {selectedDevice && (
            <VirtualSimulator
              isSimulating={isSimulating}
              onToggleSimulator={() => setIsSimulating(!isSimulating)}
              deviceName={selectedDevice.name}
            />
          )}

          {/* 5. Live Sensor Gauges (3-Column Grid) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SensorGauge
              title="Temperature"
              value={latestTelemetry.temperature ?? 24.5}
              unit="°C"
              minVal={0}
              maxVal={50}
              metricKey="temperature"
              color="#3b82f6"
            />
            <SensorGauge
              title="Relative Humidity"
              value={latestTelemetry.humidity ?? 62}
              unit="%"
              minVal={0}
              maxVal={100}
              metricKey="humidity"
              color="#10b981"
            />
            <SensorGauge
              title="Soil Moisture"
              value={latestTelemetry.soilMoisture ?? 58}
              unit="%"
              minVal={0}
              maxVal={100}
              metricKey="soilMoisture"
              color="#f59e0b"
            />
            <SensorGauge
              title="Ambient Light"
              value={latestTelemetry.light ?? 720}
              unit="lux"
              minVal={0}
              maxVal={1200}
              metricKey="light"
              color="#eab308"
            />
          </div>

          {/* 6. Live Time-Series Chart */}
          <TelemetryChart
            telemetry={telemetry}
            selectedMetric={selectedChartMetric}
            onMetricChange={setSelectedChartMetric}
          />

          {/* 7. Remote Actuator Switches (Bi-Directional Relay Control) */}
          <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-rule-subtle)]">
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-ink)]">
                  Remote Relay & Actuator Controls
                </h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Click any switch to toggle physical GPIO pins on your ESP32 in real-time
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Live Bi-Directional Sync
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {actuators.map((act) => (
                <RelaySwitch
                  key={act.id}
                  actuator={act}
                  onToggle={handleToggleActuator}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add Device Wizard Modal */}
      <DeviceWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        userId={userId}
        onDeviceCreated={handleDeviceCreated}
      />

      {/* View Firmware Modal */}
      {firmwareModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-white/20 bg-[var(--color-paper)] shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-4">
              <div className="flex items-center gap-2">
                <Code size={20} className="text-[var(--color-primary)]" />
                <h3 className="text-base font-bold text-[var(--color-ink)]">
                  Arduino C++ Firmware · {selectedDevice.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFirmwareModalOpen(false)}
                className="text-xs font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="rounded-[18px] border border-neutral-800 bg-neutral-950 p-4 text-xs font-mono text-neutral-300 max-h-72 overflow-y-auto">
              <pre>{generateArduinoSketch(selectedDevice)}</pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generateArduinoSketch(selectedDevice));
                  setCopiedSketch(true);
                  setTimeout(() => setCopiedSketch(false), 2000);
                }}
                className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
              >
                {copiedSketch ? (
                  <>
                    <Check size={15} weight="bold" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} weight="bold" />
                    <span>Copy .ino Sketch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
