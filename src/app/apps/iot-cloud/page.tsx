'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme/ThemeToggle';
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
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Gauge,
  ChartLine,
  ToggleRight,
  Wrench,
  DownloadSimple,
  Broadcast,
  CheckCircle,
  WarningCircle,
  PlugsConnected,
  SlidersHorizontal,
} from '@phosphor-icons/react';

type IoTTab = 'dashboard' | 'actuators' | 'devices' | 'firmware' | 'guide';

function getValidCachedSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const lastActiveStr = localStorage.getItem('resursee_last_active_time');
    const cachedStr = localStorage.getItem('resursee_user_session_cache');
    if (!cachedStr || !lastActiveStr) return null;

    const lastActive = parseInt(lastActiveStr, 10);
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

    if (isNaN(lastActive) || Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem('resursee_user_session_cache');
      localStorage.removeItem('resursee_last_active_time');
      return null;
    }

    const parsed = JSON.parse(cachedStr);
    return parsed && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

export default function IoTCloudPage() {
  const [activeTab, setActiveTab] = useState<IoTTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [copiedSketch, setCopiedSketch] = useState(false);

  // Authentication State
  const [session, setSession] = useState<UserSession | null>(getValidCachedSession);
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

  // Synchronize with global auth events and cross-tab broadcasts
  useEffect(() => {
    const handleAuthEvent = (e: any) => {
      const updatedSession = e.detail?.session ?? null;
      setSession(updatedSession);
      if (!updatedSession) {
        setDevices([]);
        setSelectedDevice(null);
      }
    };
    window.addEventListener('resursee-auth-change', handleAuthEvent);

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
      window.removeEventListener('resursee-auth-change', handleAuthEvent);
      if (channel) channel.close();
    };
  }, []);

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
              try {
                localStorage.setItem('resursee_user_session_cache', JSON.stringify(data.user));
              } catch {}
            } else {
              setSession(null);
              try {
                localStorage.removeItem('resursee_user_session_cache');
                localStorage.removeItem('resursee_last_active_time');
              } catch {}
            }
          }
        } else {
          if (isMounted) {
            setSession(null);
            try {
              localStorage.removeItem('resursee_user_session_cache');
              localStorage.removeItem('resursee_last_active_time');
            } catch {}
          }
        }
      } catch (err) {
        console.error('Failed to verify session for IoT Cloud:', err);
        if (isMounted) {
          setSession(null);
          try {
            localStorage.removeItem('resursee_user_session_cache');
            localStorage.removeItem('resursee_last_active_time');
          } catch {}
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    checkAuth();
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

      const nextTemp = parseFloat((baseTemp + (Math.random() * 0.6 - 0.3)).toFixed(1));
      const nextHum = parseFloat((baseHum + (Math.random() * 1.2 - 0.6)).toFixed(1));
      const nextSoil = Math.min(100, Math.max(0, Math.round(baseSoil + (Math.random() * 2 - 1))));
      const nextLight = Math.round(680 + Math.sin(now.getTime() / 10000) * 120 + Math.random() * 20);

      const newPoint: IoTTelemetry = {
        id: crypto.randomUUID(),
        deviceId: selectedDevice.id,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        temperature: nextTemp,
        humidity: nextHum,
        soilMoisture: nextSoil,
        light: nextLight,
      };

      setTelemetry((prev) => {
        const updated = [...prev.slice(-29), newPoint];
        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, selectedDevice, telemetry, userId]);

  // Handle Relay / Actuator Toggle
  const handleToggleActuator = async (actuator: IoTActuator, newState: boolean) => {
    if (!selectedDevice || !userId) return;

    const updated = actuators.map((a) =>
      a.id === actuator.id ? { ...a, state: newState } : a
    );
    setActuators(updated);

    const actuatorKey = `resursee_iot_actuators_${userId}_${selectedDevice.id}`;
    try {
      localStorage.setItem(actuatorKey, JSON.stringify(updated));
    } catch {}

    try {
      await fetch('/api/iot/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          deviceToken: selectedDevice.deviceToken,
          actuatorId: actuator.id,
          state: newState,
        }),
      });
    } catch {}
  };

  // Handle New Device Creation
  const handleDeviceCreated = (newDevice: IoTDevice) => {
    if (!userId) return;
    const updated = [...devices, newDevice];
    setDevices(updated);
    setSelectedDevice(newDevice);

    const storageKey = `resursee_iot_devices_${userId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    loadDeviceState(userId, newDevice.id);
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      localStorage.removeItem('resursee_user_session_cache');
      localStorage.removeItem('resursee_last_active_time');
    } catch {}
    setSession(null);
    setDevices([]);
    setSelectedDevice(null);
  };

  const handleDownloadSketch = () => {
    if (!selectedDevice) return;
    const sketch = generateArduinoSketch(selectedDevice);
    const blob = new Blob([sketch], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDevice.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_firmware.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const latestTelemetry = telemetry[telemetry.length - 1] || {
    temperature: 24.8,
    humidity: 62.5,
    soilMoisture: 60,
    light: 710,
  };

  const mobileBrand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
        <Cpu size={18} weight="bold" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-xs text-neutral-900 dark:text-white">
          ESP32 IoT Cloud
        </span>
        <span className="font-mono text-[10px] text-neutral-400">
          Hardware Telemetry
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 font-sans antialiased">
      {/* 🧭 SIDEBAR NAVIGATION */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody brand={mobileBrand} className="justify-between gap-6 border-r border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-[#111111]/85 backdrop-blur-md">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Back to Resursee Hub */}
            <div className="mb-4">
              <SidebarLink
                link={{
                  label: 'Back to Hub',
                  href: '/#apps',
                  icon: (
                    <ArrowLeft
                      size={18}
                      weight="bold"
                      className="text-neutral-600 dark:text-neutral-400"
                    />
                  ),
                }}
              />
            </div>

            {/* App Brand Header */}
            <div className="mb-6 px-1">
              <div className="flex items-center gap-2.5 py-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
                  <Cpu size={18} weight="bold" />
                </div>
                <motion.div
                  animate={{
                    display: sidebarOpen ? 'flex' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="flex flex-col truncate min-w-0"
                >
                  <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                    ESP32 IoT Cloud
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400 truncate">
                    Hardware Telemetry
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-1">
              <SidebarLink
                link={{
                  label: 'Live Telemetry',
                  onClick: () => setActiveTab('dashboard'),
                  icon: (
                    <Gauge
                      size={18}
                      weight={activeTab === 'dashboard' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'dashboard',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Relay Controls',
                  onClick: () => setActiveTab('actuators'),
                  icon: (
                    <ToggleRight
                      size={18}
                      weight={activeTab === 'actuators' ? 'bold' : 'regular'}
                    />
                  ),
                  badge: actuators.length || undefined,
                  isActive: activeTab === 'actuators',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Device Fleet',
                  onClick: () => setActiveTab('devices'),
                  icon: (
                    <PlugsConnected
                      size={18}
                      weight={activeTab === 'devices' ? 'bold' : 'regular'}
                    />
                  ),
                  badge: devices.length || undefined,
                  isActive: activeTab === 'devices',
                }}
              />

              <SidebarLink
                link={{
                  label: 'C++ Firmware',
                  onClick: () => setActiveTab('firmware'),
                  icon: (
                    <Code
                      size={18}
                      weight={activeTab === 'firmware' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'firmware',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Hardware Guide',
                  onClick: () => setActiveTab('guide'),
                  icon: (
                    <BookOpen
                      size={18}
                      weight={activeTab === 'guide' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'guide',
                }}
              />
            </div>
          </div>

          {/* Sidebar Bottom Controls */}
          <div className="border-t border-neutral-200 pt-3 mt-auto space-y-2.5 dark:border-neutral-800">
            {/* Active Device Indicator */}
            {selectedDevice && (
              <div
                onClick={() => setActiveTab('devices')}
                className={cn(
                  'group flex cursor-pointer items-center rounded-xl border border-neutral-200 bg-neutral-50 p-2 transition-all hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/80',
                  sidebarOpen ? 'justify-between' : 'justify-center'
                )}
                title="Click to view device fleet"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      selectedDevice.status === 'online'
                        ? 'bg-neutral-900 dark:bg-white'
                        : 'bg-neutral-400'
                    )}
                  />
                  <motion.span
                    animate={{
                      display: sidebarOpen ? 'inline-block' : 'none',
                      opacity: sidebarOpen ? 1 : 0,
                    }}
                    className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate"
                  >
                    {selectedDevice.name}
                  </motion.span>
                </div>
                <motion.span
                  animate={{
                    display: sidebarOpen ? 'inline-block' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="font-mono text-[10px] text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
                >
                  {selectedDevice.deviceType.toUpperCase()}
                </motion.span>
              </div>
            )}

            {/* User Session Pill */}
            {session && (
              <motion.div
                animate={{
                  display: sidebarOpen ? 'flex' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="items-center justify-between px-1 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {session.picture ? (
                    <img
                      src={session.picture}
                      alt={session.name}
                      className="h-5 w-5 rounded-full object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white text-[10px] font-bold shrink-0">
                      {session.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 truncate max-w-[120px]">
                    {session.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  title="Sign Out"
                >
                  <SignOut size={14} />
                </button>
              </motion.div>
            )}

            {/* Theme Toggle & Add Device Button */}
            <div
              className={cn(
                'flex items-center px-1',
                sidebarOpen ? 'justify-between' : 'justify-center'
              )}
            >
              <ThemeToggle />
              <motion.button
                animate={{
                  display: sidebarOpen ? 'flex' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                type="button"
                onClick={() => setWizardOpen(true)}
                className="items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                title="Add New ESP32 Device"
              >
                <Plus size={13} weight="bold" />
                <span>Add ESP32</span>
              </motion.button>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* 🖥️ MAIN APPLICATION WORKSPACE */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* TOP APP BAR */}
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 sm:px-6 dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md min-w-0 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
              ESP32 IoT Cloud
            </span>
            <span className="hidden sm:inline font-mono text-xs text-neutral-400">/</span>
            <span className="hidden sm:inline font-mono text-xs text-neutral-500 dark:text-neutral-400 capitalize">
              {activeTab === 'dashboard'
                ? 'Telemetry Dashboard'
                : activeTab === 'actuators'
                ? 'Relay Controls'
                : activeTab === 'devices'
                ? 'Device Fleet'
                : activeTab === 'firmware'
                ? 'Arduino C++ Firmware'
                : 'Hardware Guide'}
            </span>

            {/* Quick Device Switcher */}
            {selectedDevice && (
              <div className="hidden md:flex items-center gap-1.5 ml-2">
                <select
                  value={selectedDevice.id}
                  onChange={(e) => {
                    const found = devices.find((d) => d.id === e.target.value);
                    if (found) {
                      setSelectedDevice(found);
                      loadDeviceState(userId, found.id);
                    }
                  }}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-semibold text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 focus:outline-none cursor-pointer"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.deviceType.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedDevice && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-100 px-2.5 py-1 font-mono text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-[#1a1a1a] dark:text-neutral-300">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    selectedDevice.status === 'online'
                      ? 'bg-neutral-900 dark:bg-white'
                      : 'bg-neutral-400'
                  )}
                />
                <span>{selectedDevice.status.toUpperCase()}</span>
              </span>
            )}

            {session && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('firmware')}
                  className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                  title="View ready-to-flash Arduino C++ firmware"
                >
                  <Code size={14} weight="bold" />
                  <span>View .ino</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1 text-xs font-semibold shadow-2xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition cursor-pointer"
                  title="Register new ESP32 board"
                >
                  <Plus size={13} weight="bold" />
                  <span>Add Device</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* 1. AUTH LOADING STATE */}
            {authLoading && (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-xs dark:border-neutral-800 dark:bg-[#121212]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 animate-pulse">
                  <Cpu size={32} weight="bold" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-neutral-900 dark:text-white">
                  Verifying IoT Cloud Session...
                </h3>
                <p className="mt-1 font-mono text-xs text-neutral-400">
                  Establishing encrypted multi-tenant workspace
                </p>
              </div>
            )}

            {/* 2. UNAUTHENTICATED STATE: Google Sign-In Gate */}
            {!authLoading && !session && (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#121212]">
                <div className="p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm">
                    <Cpu size={28} weight="bold" />
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      Sign in to Access Your ESP32 IoT Cloud
                    </h1>
                    <p className="text-xs sm:text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Each user receives their own isolated IoT telemetry dashboard. Sign in with your Google account to connect ESP32 microcontrollers, generate ready-to-flash C++ firmware, and toggle physical GPIO relays.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <a
                      href={`/api/auth/google?returnTo=${encodeURIComponent('/apps/iot-cloud')}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-6 py-3 text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition"
                    >
                      <GoogleLogo size={16} weight="bold" />
                      <span>Continue with Google</span>
                      <ArrowRight size={14} weight="bold" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-left sm:grid-cols-3">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        Private Space
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Isolated telemetry data, tokens, and hardware configs strictly scoped to your account.
                      </p>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        Bi-Directional Relays
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Instant GPIO relay toggling with real-time feedback over HTTP/WebSockets.
                      </p>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        Instant Firmware
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Auto-generated Arduino sketches configured with your device credentials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. AUTHENTICATED WORKSPACE */}
            {!authLoading && session && (
              <>
                {/* TAB 1: LIVE TELEMETRY & GAUGES */}
                {activeTab === 'dashboard' && selectedDevice && (
                  <div className="space-y-6">
                    {/* Device Status Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#121212]">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                          <Cpu size={22} weight="bold" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                              {selectedDevice.name}
                            </h2>
                            <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                              {selectedDevice.deviceType.toUpperCase()}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span>IP: {selectedDevice.ipAddress || '192.168.1.142'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <WifiHigh size={13} />
                              <span>{selectedDevice.rssi || -58} dBm</span>
                            </span>
                            <span>•</span>
                            <span>User: {session.name.split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('actuators')}
                          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          <ToggleRight size={15} weight="bold" />
                          <span>Relays ({actuators.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('firmware')}
                          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          <Code size={15} />
                          <span>Firmware</span>
                        </button>
                      </div>
                    </div>

                    {/* Virtual Hardware Simulator Strip */}
                    <VirtualSimulator
                      isSimulating={isSimulating}
                      onToggleSimulator={() => setIsSimulating(!isSimulating)}
                      deviceName={selectedDevice.name}
                    />

                    {/* 4-Column Live Sensor Gauges */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <SensorGauge
                        title="Temperature"
                        value={latestTelemetry.temperature ?? 24.5}
                        unit="°C"
                        minVal={0}
                        maxVal={50}
                        metricKey="temperature"
                        color="currentColor"
                      />
                      <SensorGauge
                        title="Relative Humidity"
                        value={latestTelemetry.humidity ?? 62}
                        unit="%"
                        minVal={0}
                        maxVal={100}
                        metricKey="humidity"
                        color="currentColor"
                      />
                      <SensorGauge
                        title="Soil Moisture"
                        value={latestTelemetry.soilMoisture ?? 58}
                        unit="%"
                        minVal={0}
                        maxVal={100}
                        metricKey="soilMoisture"
                        color="currentColor"
                      />
                      <SensorGauge
                        title="Ambient Light"
                        value={latestTelemetry.light ?? 720}
                        unit="lux"
                        minVal={0}
                        maxVal={1200}
                        metricKey="light"
                        color="currentColor"
                      />
                    </div>

                    {/* Live Time-Series Chart */}
                    <TelemetryChart
                      telemetry={telemetry}
                      selectedMetric={selectedChartMetric}
                      onMetricChange={setSelectedChartMetric}
                    />
                  </div>
                )}

                {/* TAB 2: RELAY & GPIO CONTROLS */}
                {activeTab === 'actuators' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                        Remote Relay &amp; Actuator Controls
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Click any switch to toggle physical GPIO pins on your ESP32 in real-time with bi-directional sync.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {actuators.map((act) => (
                        <RelaySwitch
                          key={act.id}
                          actuator={act}
                          onToggle={handleToggleActuator}
                        />
                      ))}
                    </div>

                    {/* Pin Mapping Reference Table */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white">
                          GPIO Pin Allocation
                        </span>
                        <span className="font-mono text-[11px] text-neutral-400">
                          ESP32-WROOM-32
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono">
                          <span className="font-bold text-neutral-900 dark:text-white">GPIO 26</span>
                          <p className="text-[11px] text-neutral-500 mt-1">Water Pump (Relay 1)</p>
                        </div>
                        <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono">
                          <span className="font-bold text-neutral-900 dark:text-white">GPIO 27</span>
                          <p className="text-[11px] text-neutral-500 mt-1">Grow Lights (Relay 2)</p>
                        </div>
                        <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono">
                          <span className="font-bold text-neutral-900 dark:text-white">GPIO 14</span>
                          <p className="text-[11px] text-neutral-500 mt-1">Exhaust Fan (Relay 3)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: DEVICE FLEET */}
                {activeTab === 'devices' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                          Registered Device Fleet ({devices.length})
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Manage all connected ESP32 boards, Wi-Fi credentials, and device tokens.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setWizardOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-semibold shadow-xs hover:opacity-90 active:scale-95 transition cursor-pointer"
                      >
                        <Plus size={14} weight="bold" />
                        <span>Add New Board</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {devices.map((d) => (
                        <div
                          key={d.id}
                          className={cn(
                            'rounded-2xl border p-5 transition-all space-y-3',
                            selectedDevice?.id === d.id
                              ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900'
                              : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#121212]'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                                <Cpu size={18} weight="bold" />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                  {d.name}
                                </h3>
                                <span className="font-mono text-[10px] text-neutral-400">
                                  ID: {d.id}
                                </span>
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  d.status === 'online' ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'
                                )}
                              />
                              <span>{d.status.toUpperCase()}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800 pt-3">
                            <div>
                              <span className="text-[10px] text-neutral-400 uppercase">Board</span>
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{d.deviceType.toUpperCase()}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-400 uppercase">IP Address</span>
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{d.ipAddress || '192.168.1.142'}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-400 uppercase">Signal</span>
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{d.rssi || -58} dBm</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-400 uppercase">Telemetry</span>
                              <p className="font-semibold text-neutral-800 dark:text-neutral-200">Active (2.5s)</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            {selectedDevice?.id !== d.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDevice(d);
                                  loadDeviceState(userId, d.id);
                                }}
                                className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 cursor-pointer"
                              >
                                Select Device
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDevice(d);
                                loadDeviceState(userId, d.id);
                                setActiveTab('dashboard');
                              }}
                              className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                            >
                              Open Dashboard
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: ARDUINO C++ FIRMWARE */}
                {activeTab === 'firmware' && selectedDevice && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                          Arduino C++ Firmware · {selectedDevice.name}
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Pre-configured sketch ready to flash onto your ESP32 via Arduino IDE or PlatformIO.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generateArduinoSketch(selectedDevice));
                            setCopiedSketch(true);
                            setTimeout(() => setCopiedSketch(false), 2000);
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 cursor-pointer"
                        >
                          {copiedSketch ? <Check size={14} weight="bold" /> : <Copy size={14} />}
                          <span>{copiedSketch ? 'Copied!' : 'Copy Sketch'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadSketch}
                          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                        >
                          <DownloadSimple size={14} weight="bold" />
                          <span>Download .ino</span>
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#0c0c0c] p-5 text-xs font-mono text-neutral-300 max-h-[560px] overflow-y-auto">
                      <pre>{generateArduinoSketch(selectedDevice)}</pre>
                    </div>
                  </div>
                )}

                {/* TAB 5: HARDWARE & WIRING GUIDE */}
                {activeTab === 'guide' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                        ESP32 Pinout &amp; Circuit Wiring Reference
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Schematics and library configurations for connecting sensors and relays to ESP32-WROOM-32.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                          1. DHT22 Temperature &amp; Humidity
                        </span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          Connect VCC to 3.3V, GND to GND, and Data pin to <strong>GPIO 4</strong>. Use a 10kΩ pull-up resistor between 3.3V and Data if your module does not have an onboard resistor.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                          2. Capacitive Soil Moisture Sensor v1.2
                        </span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          Connect VCC to 3.3V, GND to GND, and Analog Out to <strong>GPIO 34</strong> (ADC1 Channel 6). Calibrate in water (100%) vs dry air (0%).
                        </p>
                      </div>

                      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                          3. Photoresistor (LDR) Ambient Light
                        </span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          Build a voltage divider with a 10kΩ resistor connected to GND and LDR to 3.3V. Route the junction between the resistor and LDR to <strong>GPIO 35</strong> (ADC1 Channel 7).
                        </p>
                      </div>

                      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                          4. 5V / 3.3V 3-Channel Relay Module
                        </span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          Connect VCC to 5V (VIN), GND to GND, IN1 to <strong>GPIO 26</strong>, IN2 to <strong>GPIO 27</strong>, and IN3 to <strong>GPIO 14</strong>. Ensure relays are opto-isolated.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#121212] space-y-2">
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                        Required Arduino IDE Libraries
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Open the Arduino IDE Library Manager (<code>Ctrl+Shift+I</code> or <code>Cmd+Shift+I</code>) and install:
                      </p>
                      <ul className="list-disc list-inside font-mono text-xs text-neutral-600 dark:text-neutral-300 space-y-1 pt-1">
                        <li><code>ArduinoJson</code> by Benoit Blanchon (v6 or v7)</li>
                        <li><code>DHT sensor library</code> by Adafruit</li>
                        <li><code>Adafruit Unified Sensor</code> by Adafruit</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Device Wizard Modal */}
      {userId && (
        <DeviceWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          userId={userId}
          onDeviceCreated={handleDeviceCreated}
        />
      )}
    </div>
  );
}
