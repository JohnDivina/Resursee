'use client';

import React, { useState, useEffect } from 'react';
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
import { UserSession } from '@/lib/sessionCrypto';
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
  Code,
  ShieldCheck,
  Copy,
  Check,
  GoogleLogo,
  SignOut,
  ClockCountdown,
  LockKey,
  Broadcast,
  Sliders,
  Sparkle,
  ArrowRight,
} from '@phosphor-icons/react';

export default function IoTCloudPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [firmwareModalOpen, setFirmwareModalOpen] = useState(false);
  const [copiedSketch, setCopiedSketch] = useState(false);

  // Authentication State
  const [session, setSession] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // IoT Dashboard State
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [telemetry, setTelemetry] = useState<IoTTelemetry[]>([]);
  const [actuators, setActuators] = useState<IoTActuator[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedChartMetric, setSelectedChartMetric] = useState<
    'temperature' | 'humidity' | 'soilMoisture' | 'light'
  >('temperature');

  // Verify User Session via /api/auth/session
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.authenticated && data.user) {
              setSession(data.user);
            } else {
              setSession(null);
            }
          }
        } else {
          if (isMounted) setSession(null);
        }
      } catch (err) {
        console.error('Failed to verify session for IoT Cloud:', err);
        if (isMounted) setSession(null);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    checkAuth();

    // Listen to session broadcast channel (e.g., auto-logout from inactivity)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('resursee_auth_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            setSession(null);
            setDevices([]);
            setSelectedDevice(null);
          }
        };
      }
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
      if (channel) channel.close();
    };
  }, []);

  // Compute unique User ID derived strictly from Google Account
  const userId = session
    ? session.userId || `usr_${session.email.replace(/[^a-z0-9]/g, '_')}`
    : '';

  // Initialize Per-User Isolated Devices and Dashboard
  useEffect(() => {
    if (!userId) {
      setDevices([]);
      setSelectedDevice(null);
      return;
    }

    const storageKey = `resursee_iot_devices_${userId}`;

    try {
      const savedDevices = localStorage.getItem(storageKey);
      if (savedDevices) {
        const parsed = JSON.parse(savedDevices);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDevices(parsed);
          setSelectedDevice(parsed[0]);
          loadDeviceState(userId, parsed[0].id);
          return;
        }
      }

      // First time this user logs in: Provision personalized default device
      const initial = getInitialDevices(userId, session?.name);
      setDevices(initial);
      setSelectedDevice(initial[0]);
      loadDeviceState(userId, initial[0].id);
      localStorage.setItem(storageKey, JSON.stringify(initial));
    } catch {
      const initial = getInitialDevices(userId, session?.name);
      setDevices(initial);
      setSelectedDevice(initial[0]);
      loadDeviceState(userId, initial[0].id);
    }
  }, [userId, session?.name]);

  const loadDeviceState = (uid: string, deviceId: string) => {
    const actuatorKey = `resursee_iot_actuators_${uid}_${deviceId}`;
    try {
      const savedActuators = localStorage.getItem(actuatorKey);
      if (savedActuators) {
        const parsed = JSON.parse(savedActuators);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActuators(parsed);
        } else {
          const initialActuators = getInitialActuators(deviceId);
          setActuators(initialActuators);
          localStorage.setItem(actuatorKey, JSON.stringify(initialActuators));
        }
      } else {
        const initialActuators = getInitialActuators(deviceId);
        setActuators(initialActuators);
        localStorage.setItem(actuatorKey, JSON.stringify(initialActuators));
      }
    } catch {
      const initialActuators = getInitialActuators(deviceId);
      setActuators(initialActuators);
    }

    const initialTelem = generateSeedTelemetry(deviceId, 20);
    setTelemetry(initialTelem);
  };

  // Virtual Telemetry Emitter (Simulates live ESP32 broadcasting every 2.5s)
  useEffect(() => {
    if (!isSimulating || !selectedDevice || !userId) return;

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
  }, [isSimulating, selectedDevice, telemetry, userId]);

  const handleDeviceCreated = (newDev: IoTDevice) => {
    const updated = [...devices, newDev];
    setDevices(updated);
    setSelectedDevice(newDev);
    loadDeviceState(userId, newDev.id);
    localStorage.setItem(`resursee_iot_devices_${userId}`, JSON.stringify(updated));
  };

  const handleToggleActuator = async (actuator: IoTActuator, newState: boolean) => {
    // 1. Optimistic UI update
    const updated = actuators.map((a) => (a.id === actuator.id ? { ...a, state: newState } : a));
    setActuators(updated);

    if (selectedDevice && userId) {
      const actuatorKey = `resursee_iot_actuators_${userId}_${selectedDevice.id}`;
      try {
        localStorage.setItem(actuatorKey, JSON.stringify(updated));
      } catch {
        // ignore
      }

      // 2. Sync with Backend API
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setSession(null);
    setDevices([]);
    setSelectedDevice(null);
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

          {/* Loading State */}
          {authLoading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-12 text-center shadow-xs">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 animate-pulse">
                <Cpu size={36} weight="bold" />
              </div>
              <h3 className="mt-4 text-base font-extrabold text-[var(--color-ink)]">
                Verifying IoT Cloud Session...
              </h3>
              <p className="mt-1 font-mono text-xs text-[var(--color-ink-muted)]">
                Establishing encrypted, multi-tenant workspace
              </p>
            </div>
          )}

          {/* UNAUTHENTICATED STATE: Mandatory Google Sign-In Gate */}
          {!authLoading && !session && (
            <div className="overflow-hidden rounded-[36px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] shadow-xl">
              {/* Top Accent Strip */}
              <div className="h-2 w-full bg-linear-to-r from-blue-600 via-indigo-600 to-sky-500" />

              <div className="p-8 sm:p-14 text-center max-w-3xl mx-auto space-y-6">
                {/* Badge & Lock Icon */}
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1 font-mono text-[11px] font-bold text-blue-700 dark:text-sky-300 border border-blue-500/20">
                    <LockKey size={14} weight="bold" />
                    <span>Private & Multi-Tenant Workspace</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck size={14} weight="bold" />
                    <span>Google Auth Required</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)] sm:text-5xl">
                    Sign in to Access Your Personal ESP32 IoT Cloud
                  </h1>
                  <p className="text-sm leading-relaxed text-[var(--color-ink-muted)] sm:text-base">
                    Each user receives their own completely isolated IoT dashboard. Sign in with your Google account to connect your ESP32 microcontrollers, generate ready-to-flash C++ firmware, monitor real-time sensor streams, and remotely toggle physical hardware relays.
                  </p>
                </div>

                {/* Primary CTA: Google Sign-In */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`/api/auth/google?returnTo=${encodeURIComponent('/apps/iot-cloud')}`}
                    className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-full bg-[var(--color-primary)] px-8 py-4 text-sm font-extrabold text-white shadow-lg hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all cursor-pointer"
                  >
                    <GoogleLogo size={20} weight="bold" />
                    <span>Continue with Google</span>
                    <ArrowRight size={16} weight="bold" />
                  </a>
                </div>

                {/* Multi-Tenant Feature Architecture Grid */}
                <div className="mt-12 grid grid-cols-1 gap-4 pt-10 border-t border-[var(--color-rule-subtle)] text-left sm:grid-cols-3">
                  <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-5 space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-blue-500/10 text-blue-600">
                      <Cpu size={20} weight="bold" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      100% Isolated Dashboard
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      Every user has their own personal device fleet. Another person signing in gets their own separate dashboard and cannot see or access your hardware.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-5 space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-emerald-500/10 text-emerald-600">
                      <Sliders size={20} weight="bold" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      Live Telemetry & Relays
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      Stream temperature, humidity, soil moisture, and ambient light. Remotely toggle physical GPIO relay switches in real-time with sub-second latency.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-5 space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-amber-500/10 text-amber-600">
                      <ClockCountdown size={20} weight="bold" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      15-Min Inactivity Auto-Logout
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      Your session automatically locks and signs out after 15 minutes of inactivity or when closing the website to keep your hardware controls secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AUTHENTICATED STATE: Live Per-User IoT Cloud Platform */}
          {!authLoading && session && (
            <>
              {/* 2. Platform Header & User Identity Bar */}
              <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 sm:flex-row sm:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-blue-600 text-white shadow-xs">
                      <Cpu size={20} weight="bold" />
                    </span>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                      ESP32 IoT Cloud · App #2
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-blue-700 dark:text-sky-300 border border-blue-500/20">
                      <ShieldCheck size={12} weight="bold" />
                      <span>Isolated Multi-Tenant Session</span>
                    </span>
                  </div>

                  <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                    ESP32 IoT Cloud Platform
                  </h1>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm max-w-2xl">
                    Arduino Cloud-style telemetry hub. Pair your ESP32 in seconds with auto-generated C++ firmware, live sensor gauges, and remote relay controls.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* User Profile Pill & Quick Sign Out */}
                  <div className="flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3 py-1.5 shadow-2xs">
                    {session.picture ? (
                      <img
                        src={session.picture}
                        alt={session.name}
                        className="h-6 w-6 rounded-full object-cover border border-white/20"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
                        {session.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-[11px] font-extrabold text-[var(--color-ink)] leading-tight truncate max-w-[120px]">
                        {session.name}
                      </p>
                      <p className="text-[9.5px] font-mono text-[var(--color-ink-muted)] leading-tight">
                        Personal Cloud
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Sign Out of IoT Cloud"
                      className="ml-1 text-[var(--color-ink-muted)] hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <SignOut size={15} />
                    </button>
                  </div>

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
                              loadDeviceState(userId, found.id);
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
                        <span>•</span>
                        <span className="text-[10px] text-blue-600 dark:text-sky-400 font-bold">
                          Owner: {session.name.split(' ')[0]}
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

              {/* 5. Live Sensor Gauges (4-Column Grid) */}
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
            </>
          )}
        </div>
      </main>

      {/* Add Device Wizard Modal */}
      {userId && (
        <DeviceWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          userId={userId}
          onDeviceCreated={handleDeviceCreated}
        />
      )}

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
