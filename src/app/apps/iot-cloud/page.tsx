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
import EnergyFlowTopology from '@/components/iot/EnergyFlowTopology';
import SystemArchitectureView from '@/components/iot/SystemArchitectureView';
import Esp32CodeStudio from '@/components/iot/Esp32CodeStudio';
import BoardsManager from '@/components/iot/BoardsManager';
import LibraryManager from '@/components/iot/LibraryManager';
import WidgetGrid from '@/components/iot/WidgetGrid';
import { IoTDevice, IoTTelemetry, IoTActuator, IoTParameter, IoTWidget } from '@/types/iotCloud';
import { UserSession } from '@/lib/sessionCrypto';
import {
  getInitialDevices,
  getInitialActuators,
  generateSeedTelemetry,
  loadDeviceParameters,
  saveDeviceParameters,
  loadDeviceWidgets,
  saveDeviceWidgets,
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
  Graph,
  Package,
  TerminalWindow,
  Desktop,
} from '@phosphor-icons/react';

type IoTTab = 'dashboard' | 'actuators' | 'devices' | 'firmware' | 'guide' | 'architecture' | 'boards' | 'libraries';

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
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  // Switch tab with URL state synchronizer
  const switchTab = (tab: IoTTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

  // Sync initial tab from URL query if provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab') as IoTTab | null;
        if (
          tabParam &&
          ['dashboard', 'actuators', 'devices', 'firmware', 'guide', 'architecture', 'boards', 'libraries'].includes(tabParam)
        ) {
          setActiveTab(tabParam);
        }
      } catch {}
    }
  }, []);

  // Authentication State
  const [session, setSession] = useState<UserSession | null>(getValidCachedSession);
  const [authLoading, setAuthLoading] = useState(true);

  // IoT Dashboard State
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [telemetry, setTelemetry] = useState<IoTTelemetry[]>([]);
  const [actuators, setActuators] = useState<IoTActuator[]>([]);
  const [parameters, setParameters] = useState<IoTParameter[]>([]);
  const [widgets, setWidgets] = useState<IoTWidget[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
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
              } catch { }
            } else {
              setSession(null);
              try {
                localStorage.removeItem('resursee_user_session_cache');
                localStorage.removeItem('resursee_last_active_time');
              } catch { }
            }
          }
        } else {
          if (isMounted) {
            setSession(null);
            try {
              localStorage.removeItem('resursee_user_session_cache');
              localStorage.removeItem('resursee_last_active_time');
            } catch { }
          }
        }
      } catch (err) {
        console.error('Failed to verify session for IoT Cloud:', err);
        if (isMounted) {
          setSession(null);
          try {
            localStorage.removeItem('resursee_user_session_cache');
            localStorage.removeItem('resursee_last_active_time');
          } catch { }
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

    const telemKey = `resursee_iot_telemetry_${uid}_${deviceId}`;
    try {
      const savedTelem = localStorage.getItem(telemKey);
      if (savedTelem) {
        const parsed = JSON.parse(savedTelem);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTelemetry(parsed);
        } else {
          setTelemetry([]);
        }
      } else {
        setTelemetry([]);
      }
    } catch {
      setTelemetry([]);
    }

    const loadedParams = loadDeviceParameters(deviceId);
    setParameters(loadedParams);

    const loadedWidgets = loadDeviceWidgets(uid, deviceId);
    setWidgets(loadedWidgets);
  };

  // 🛰️ Real Hardware Telemetry Poller: Queries /api/iot/ingest for actual ESP32 packets
  useEffect(() => {
    if (!selectedDevice?.deviceToken) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/iot/ingest?deviceToken=${encodeURIComponent(selectedDevice.deviceToken)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (isMounted) {
          if (data.deviceOnline) {
            // Mark device online if real hardware packets are arriving
            if (selectedDevice.status !== 'online') {
              setSelectedDevice((prev) => prev ? { ...prev, status: 'online', lastSeenAt: new Date().toISOString() } : null);
              setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, status: 'online', lastSeenAt: new Date().toISOString() } : d));
            }

            // Ingest incoming packet if newer
            if (data.latestTelemetry && data.latestTelemetry.temperature !== undefined) {
              const packet: IoTTelemetry = {
                id: crypto.randomUUID(),
                deviceId: selectedDevice.id,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                temperature: Number(data.latestTelemetry.temperature),
                humidity: Number(data.latestTelemetry.humidity ?? 0),
                soilMoisture: Number(data.latestTelemetry.soilMoisture ?? 0),
                light: Number(data.latestTelemetry.light ?? 0),
              };

              setTelemetry((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.temperature === packet.temperature && last.humidity === packet.humidity) {
                  return prev; // duplicate packet
                }
                const updated = [...prev.slice(-29), packet];
                try {
                  localStorage.setItem(`resursee_iot_telemetry_${userId}_${selectedDevice.id}`, JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }
          } else if (!isSimulating && selectedDevice.status === 'online') {
            // Hardware dropped offline
            setSelectedDevice((prev) => prev ? { ...prev, status: 'offline' } : null);
            setDevices((prev) => prev.map((d) => d.id === selectedDevice.id ? { ...d, status: 'offline' } : d));
          }
        }
      } catch {}
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [selectedDevice?.id, selectedDevice?.deviceToken, isSimulating, userId]);

  // Virtual Telemetry Emitter (Only active when user explicitly clicks 'Start Virtual ESP32')
  useEffect(() => {
    if (!isSimulating || !selectedDevice || !userId) return;

    const interval = setInterval(() => {
      const now = new Date();
      const lastPoint = telemetry[telemetry.length - 1];

      const baseTemp = lastPoint?.temperature ?? 24.5;
      const baseHum = lastPoint?.humidity ?? 62.0;
      const baseSoil = lastPoint?.soilMoisture ?? 55;

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
        try {
          localStorage.setItem(`resursee_iot_telemetry_${userId}_${selectedDevice.id}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Synchronize with backend ingest endpoint so cloud topology probes register it
      fetch('/api/iot/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceToken: selectedDevice.deviceToken,
          temperature: nextTemp,
          humidity: nextHum,
          soilMoisture: nextSoil,
          light: nextLight,
        }),
      }).catch(() => {});
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
    } catch { }

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
    } catch { }
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
    } catch { }

    loadDeviceState(userId, newDevice.id);
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    try {
      localStorage.removeItem('resursee_user_session_cache');
      localStorage.removeItem('resursee_last_active_time');
    } catch { }
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

  const latestTelemetry = telemetry.length > 0 ? telemetry[telemetry.length - 1] : undefined;

  // Keep parameters in sync with latest telemetry & actuator states
  const activeParameters = React.useMemo(() => {
    if (!latestTelemetry && actuators.length === 0) return parameters;
    return parameters.map((p) => {
      let val = p.currentValue;
      if (p.variableName === 'temperature' && latestTelemetry?.temperature !== undefined) {
        val = latestTelemetry.temperature;
      } else if (p.variableName === 'humidity' && latestTelemetry?.humidity !== undefined) {
        val = latestTelemetry.humidity;
      } else if (p.variableName === 'soilMoisture' && latestTelemetry?.soilMoisture !== undefined) {
        val = latestTelemetry.soilMoisture;
      } else if (p.variableName === 'light' && latestTelemetry?.light !== undefined) {
        val = latestTelemetry.light;
      } else {
        const matchingAct = actuators.find((a) => a.pin === p.pin || a.name.toLowerCase().includes(p.name.toLowerCase()));
        if (matchingAct) {
          val = matchingAct.state;
        }
      }
      return val !== p.currentValue ? { ...p, currentValue: val, updatedAt: new Date().toISOString() } : p;
    });
  }, [parameters, latestTelemetry, actuators]);

  const handleSaveWidget = (widget: IoTWidget) => {
    if (!selectedDevice || !userId) return;
    setWidgets((prev) => {
      const existingIndex = prev.findIndex((w) => w.id === widget.id);
      let next: IoTWidget[];
      if (existingIndex >= 0) {
        next = [...prev];
        next[existingIndex] = widget;
      } else {
        next = [...prev, widget];
      }
      saveDeviceWidgets(selectedDevice.id, next);
      return next;
    });
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (!selectedDevice) return;
    setWidgets((prev) => {
      const next = prev.filter((w) => w.id !== widgetId);
      saveDeviceWidgets(selectedDevice.id, next);
      return next;
    });
  };

  const handleAddParameter = (param: IoTParameter) => {
    if (!selectedDevice) return;
    setParameters((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === param.id);
      let next: IoTParameter[];
      if (existingIndex >= 0) {
        next = [...prev];
        next[existingIndex] = param;
      } else {
        next = [...prev, param];
      }
      saveDeviceParameters(selectedDevice.id, next);
      return next;
    });
  };

  const handleDeleteParameter = (paramId: string) => {
    if (!selectedDevice) return;
    setParameters((prev) => {
      const next = prev.filter((p) => p.id !== paramId);
      saveDeviceParameters(selectedDevice.id, next);
      return next;
    });
    setWidgets((prev) => {
      const next = prev.filter((w) => w.parameterId !== paramId);
      saveDeviceWidgets(selectedDevice.id, next);
      return next;
    });
  };

  const handleToggleParameter = async (param: IoTParameter, newState: boolean) => {
    if (!selectedDevice) return;
    setParameters((prev) => {
      const next = prev.map((p) => (p.id === param.id ? { ...p, currentValue: newState, updatedAt: new Date().toISOString() } : p));
      saveDeviceParameters(selectedDevice.id, next);
      return next;
    });

    const matchingAct = actuators.find((a) => a.pin === param.pin || a.name.toLowerCase().includes(param.name.toLowerCase()));
    if (matchingAct) {
      await handleToggleActuator(matchingAct, newState);
    }
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
                  onClick: () => switchTab('dashboard'),
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
                  onClick: () => switchTab('actuators'),
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
                  onClick: () => switchTab('devices'),
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
                  label: 'Code Studio & Firmware',
                  onClick: () => switchTab('firmware'),
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
                  label: 'Boards Manager',
                  onClick: () => switchTab('boards'),
                  icon: (
                    <Cpu
                      size={18}
                      weight={activeTab === 'boards' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'boards',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Library Manager',
                  onClick: () => switchTab('libraries'),
                  icon: (
                    <Package
                      size={18}
                      weight={activeTab === 'libraries' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'libraries',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Hardware Guide',
                  onClick: () => switchTab('guide'),
                  icon: (
                    <BookOpen
                      size={18}
                      weight={activeTab === 'guide' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'guide',
                }}
              />

              <SidebarLink
                link={{
                  label: 'Architecture & Flow',
                  onClick: () => switchTab('architecture'),
                  icon: (
                    <Graph
                      size={18}
                      weight={activeTab === 'architecture' ? 'bold' : 'regular'}
                    />
                  ),
                  isActive: activeTab === 'architecture',
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
                      ? 'Code Studio & Firmware'
                      : activeTab === 'boards'
                        ? 'Boards Manager'
                        : activeTab === 'libraries'
                          ? 'Arduino Library Manager'
                          : activeTab === 'architecture'
                            ? 'Architecture & Data Flow'
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
            <button
              type="button"
              onClick={() => switchTab('architecture')}
              className={cn(
                'hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer',
                activeTab === 'architecture'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
              )}
              title="View End-to-End System Architecture & Flow"
            >
              <Graph size={14} weight="bold" />
              <span>Architecture</span>
            </button>

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
                  onClick={() => switchTab('firmware')}
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

            {/* 2. UNAUTHENTICATED STATE: Google Sign-In Gate OR Public Architecture View */}
            {!authLoading && !session && (
              activeTab === 'architecture' ? (
                <SystemArchitectureView
                  onBackToDashboard={() => switchTab('dashboard')}
                  onOpenFirmware={() => switchTab('firmware')}
                />
              ) : (
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

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href={`/api/auth/google?returnTo=${encodeURIComponent('/apps/iot-cloud')}`}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-6 py-3 text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition"
                      >
                        <GoogleLogo size={16} weight="bold" />
                        <span>Continue with Google</span>
                        <ArrowRight size={14} weight="bold" />
                      </a>

                      <button
                        type="button"
                        onClick={() => switchTab('architecture')}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-xs font-bold text-neutral-800 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        <Graph size={16} weight="bold" />
                        <span>Explore System Architecture</span>
                      </button>
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
              )
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
                            <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  selectedDevice.status === 'online' || isSimulating
                                    ? 'bg-neutral-900 dark:bg-white animate-pulse'
                                    : 'bg-neutral-400'
                                )}
                              />
                              <span>
                                {selectedDevice.status === 'online' || isSimulating ? 'ONLINE' : 'HARDWARE OFFLINE'}
                              </span>
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span>
                              IP: {selectedDevice.status === 'online' || isSimulating
                                ? (selectedDevice.ipAddress || '192.168.1.142')
                                : 'Awaiting Connection'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <WifiHigh size={13} />
                              <span>
                                {selectedDevice.status === 'online' || isSimulating
                                  ? `${selectedDevice.rssi || -58} dBm`
                                  : 'No Carrier'}
                              </span>
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
                          <span>Code Studio</span>
                        </button>
                      </div>
                    </div>

                    {/* Virtual Hardware Simulator Strip */}
                    <VirtualSimulator
                      isSimulating={isSimulating}
                      onToggleSimulator={() => setIsSimulating(!isSimulating)}
                      deviceName={selectedDevice.name}
                    />

                    {/* Dynamic Cloud Display Holders / Widgets */}
                    <WidgetGrid
                      device={selectedDevice}
                      widgets={widgets}
                      parameters={activeParameters}
                      telemetryHistory={telemetry}
                      onSaveWidget={handleSaveWidget}
                      onDeleteWidget={handleDeleteWidget}
                      onAddParameter={handleAddParameter}
                      onDeleteParameter={handleDeleteParameter}
                      onToggleParameter={handleToggleParameter}
                    />

                    {/* Live ESP32 ⇄ Internet ⇄ Cloud Flow Topology */}
                    <EnergyFlowTopology
                      device={selectedDevice}
                      latestTelemetry={latestTelemetry}
                      telemetryHistory={telemetry}
                      actuators={actuators}
                      onToggleActuator={handleToggleActuator}
                      isSimulating={isSimulating}
                      onToggleSimulator={() => {
                        const next = !isSimulating;
                        setIsSimulating(next);
                        if (next) {
                          setSelectedDevice((prev) => prev ? { ...prev, status: 'online' } : null);
                        }
                      }}
                    />

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

                {/* TAB 4: ARDUINO C++ CODE STUDIO & FIRMWARE */}
                <div className={activeTab === 'firmware' ? 'block' : 'hidden'}>
                  {selectedDevice ? (
                    <Esp32CodeStudio
                      device={selectedDevice}
                      serverOrigin={typeof window !== 'undefined' ? window.location.origin : 'https://resursee.vercel.app'}
                    />
                  ) : (
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-8 text-center space-y-3">
                      <Cpu size={32} className="mx-auto text-neutral-400" />
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        No ESP32 Device Selected
                      </h3>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        Select an existing device from the dropdown above or create a new ESP32 board in the Device Fleet tab.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('devices')}
                        className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-semibold hover:opacity-90 cursor-pointer"
                      >
                        Open Device Fleet
                      </button>
                    </div>
                  )}
                </div>

                {/* TAB 5: HARDWARE & WIRING GUIDE */}
                {activeTab === 'guide' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                        ESP32 Developer &amp; Hardware Guide
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Everything you need to compile, flash, wire sensors, and pair microcontrollers with Resursee IoT Cloud.
                      </p>
                    </div>

                    {/* FEATURED: Desktop Compiler & "arduino-cli not found" Guide */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-[#121212] space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                            <TerminalWindow size={20} weight="bold" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                                Desktop In-App Compiler &amp; &quot;arduino-cli not found&quot; Explained
                              </h3>
                              <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                Toolchain Guide
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-0.5">
                              Understand how in-app compiling works and how to enable 1-click flashing directly inside Resursee Desktop.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => switchTab('firmware')}
                          className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer self-start sm:self-auto"
                        >
                          <Code size={14} />
                          <span>Open Code Studio</span>
                        </button>
                      </div>

                      {/* Explanation Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161616] p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-mono text-xs font-bold">
                              1
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                              What is <code className="font-mono">arduino-cli</code>?
                            </h4>
                          </div>
                          <p className="text-[12px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            <strong>arduino-cli</strong> is the official command-line compiler and flasher developed by Arduino. It contains the behind-the-scenes <strong>Xtensa GCC cross-compiler</strong> that converts your C++ sketch into a binary file (<code>.bin</code>) and writes it directly to your ESP32 chip over USB.
                          </p>
                        </div>

                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161616] p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-mono text-xs font-bold">
                              2
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                              Why does &quot;arduino-cli not found&quot; appear?
                            </h4>
                          </div>
                          <p className="text-[12px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            Resursee Desktop scanned your machine&apos;s system PATH, but <code>arduino-cli</code> wasn&apos;t detected yet (or the app was already open before you ran <code>brew install</code>). Once installed, click the badge in Code Studio or refresh to immediately connect the compiler.
                          </p>
                        </div>
                      </div>

                      {/* Installation Steps */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                          Quick 1-Minute Setup Instructions
                        </h4>

                        <div className="space-y-2.5">
                          {/* Step 1: Install CLI */}
                          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161616] p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                Step 1: Install arduino-cli on your system
                              </span>
                              <span className="text-[10px] font-mono text-neutral-500">Terminal Command</span>
                            </div>

                            {/* macOS Homebrew */}
                            <div className="flex items-center justify-between rounded-lg bg-neutral-950 p-2.5 font-mono text-xs text-neutral-200">
                              <div className="flex items-center gap-2 overflow-x-auto">
                                <span className="text-neutral-500">macOS:</span>
                                <span className="text-white">brew install arduino-cli</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyText('brew install arduino-cli', 'brew')}
                                className="ml-2 shrink-0 rounded px-2 py-0.5 text-[11px] font-medium bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer flex items-center gap-1"
                              >
                                {copiedCmd === 'brew' ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                                <span>{copiedCmd === 'brew' ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>

                            {/* Windows winget */}
                            <div className="flex items-center justify-between rounded-lg bg-neutral-950 p-2.5 font-mono text-xs text-neutral-200">
                              <div className="flex items-center gap-2 overflow-x-auto">
                                <span className="text-neutral-500">Windows:</span>
                                <span className="text-white">winget install Arduino.ArduinoCLI</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyText('winget install Arduino.ArduinoCLI', 'winget')}
                                className="ml-2 shrink-0 rounded px-2 py-0.5 text-[11px] font-medium bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer flex items-center gap-1"
                              >
                                {copiedCmd === 'winget' ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                                <span>{copiedCmd === 'winget' ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>

                            {/* Linux */}
                            <div className="flex items-center justify-between rounded-lg bg-neutral-950 p-2.5 font-mono text-xs text-neutral-200">
                              <div className="flex items-center gap-2 overflow-x-auto">
                                <span className="text-neutral-500">Linux:</span>
                                <span className="text-white">curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyText('curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh', 'linux')}
                                className="ml-2 shrink-0 rounded px-2 py-0.5 text-[11px] font-medium bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer flex items-center gap-1"
                              >
                                {copiedCmd === 'linux' ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                                <span>{copiedCmd === 'linux' ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Step 2: Install ESP32 Core */}
                          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161616] p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                Step 2: Install the ESP32 Core compiler package
                              </span>
                              <span className="text-[10px] font-mono text-neutral-500">One-Time Core Setup</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-neutral-950 p-2.5 font-mono text-xs text-neutral-200">
                              <div className="flex items-center gap-2 overflow-x-auto">
                                <span className="text-neutral-500">$</span>
                                <span className="text-white">arduino-cli core install esp32:esp32</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyText('arduino-cli core install esp32:esp32', 'core')}
                                className="ml-2 shrink-0 rounded px-2 py-0.5 text-[11px] font-medium bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer flex items-center gap-1"
                              >
                                {copiedCmd === 'core' ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                                <span>{copiedCmd === 'core' ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              Tip: You can also install or remove cores anytime using the <strong>Boards Manager</strong> in the sidebar!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Comparison of the two workflows */}
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono mb-2">
                          Two Flexible Flashing Workflows
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                              <Desktop size={15} />
                              <span>Path A: Native In-App Compiling</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                              With <code>arduino-cli</code> installed, click <strong>Verify</strong> to build and <strong>Upload</strong> to flash your connected USB board directly inside Resursee. No other software required.
                            </p>
                          </div>
                          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                              <DownloadSimple size={15} />
                              <span>Path B: Official Arduino IDE</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                              Prefer the standard Arduino IDE or VS Code PlatformIO? Click <strong>&quot;Download .ino&quot;</strong> in Code Studio to download the pre-configured sketch, open it in Arduino IDE, and click Upload.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        ESP32 Pinout &amp; Circuit Wiring Reference
                      </h3>
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

                {/* TAB 6: SYSTEM ARCHITECTURE & DATA FLOW */}
                {activeTab === 'architecture' && (
                  <SystemArchitectureView
                    onBackToDashboard={() => switchTab('dashboard')}
                    onOpenFirmware={() => switchTab('firmware')}
                    deviceToken={selectedDevice?.deviceToken}
                    deviceId={selectedDevice?.id}
                  />
                )}

                {/* TAB 7: BOARDS MANAGER */}
                {activeTab === 'boards' && (
                  <BoardsManager />
                )}

                {/* TAB 8: ARDUINO LIBRARY MANAGER */}
                {activeTab === 'libraries' && (
                  <LibraryManager />
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
          onOpenBoardsManager={() => switchTab('boards')}
        />
      )}
    </div>
  );
}
