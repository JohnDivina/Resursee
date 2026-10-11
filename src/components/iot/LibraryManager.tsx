'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  MagnifyingGlass,
  Check,
  ArrowsClockwise,
  Trash,
  X,
  Info,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { isTauriDesktop } from '@/lib/envDetector';
import {
  tauriListInstalledLibraries,
  tauriInstallLibrary,
  tauriUninstallLibrary,
  tauriCheckArduinoCli,
} from '@/lib/tauriBridge';

export interface LibraryItem {
  name: string;
  author: string;
  category: 'Sensors' | 'Communication' | 'Data Processing' | 'Display' | 'Device Control' | 'Timing';
  availableVersions: string[];
  description: string;
  header: string;
  builtin?: boolean;
}

export const CATALOGUE_LIBRARIES: LibraryItem[] = [
  {
    name: 'ArduinoJson',
    author: 'Benoit Blanchon',
    category: 'Data Processing',
    availableVersions: ['7.0.4', '6.21.4', '6.20.0'],
    description: 'An efficient and memory-safe JSON library for embedded C++. Fast zero-copy parsing and serialization for cloud telemetry.',
    header: '<ArduinoJson.h>',
  },
  {
    name: 'DHT sensor library',
    author: 'Adafruit',
    category: 'Sensors',
    availableVersions: ['1.4.6', '1.4.4', '1.4.2'],
    description: 'Arduino library for DHT11, DHT22, and AM2302 digital temperature and humidity sensors with precision pulse reading.',
    header: '<DHT.h>',
  },
  {
    name: 'Adafruit Unified Sensor',
    author: 'Adafruit',
    category: 'Sensors',
    availableVersions: ['1.1.14', '1.1.12', '1.1.9'],
    description: 'Required common hardware abstraction base for all Adafruit sensor drivers.',
    header: '<Adafruit_Sensor.h>',
  },
  {
    name: 'Adafruit BME280 Library',
    author: 'Adafruit',
    category: 'Sensors',
    availableVersions: ['2.2.4', '2.2.2', '2.1.0'],
    description: 'Sensor driver for BME280 temperature, humidity, and barometric pressure sensor over I2C and SPI.',
    header: '<Adafruit_BME280.h>',
  },
  {
    name: 'PubSubClient',
    author: 'Nick O\'Leary',
    category: 'Communication',
    availableVersions: ['2.8.0', '2.7.0'],
    description: 'A client library for the Arduino that provides support for MQTT messaging on microcontrollers.',
    header: '<PubSubClient.h>',
  },
  {
    name: 'WebSockets',
    author: 'Markus Sattler',
    category: 'Communication',
    availableVersions: ['2.4.1', '2.3.6'],
    description: 'WebSocket Server and Client implementation for ESP32 and ESP8266.',
    header: '<WebSocketsClient.h>',
  },
  {
    name: 'Adafruit SSD1306',
    author: 'Adafruit',
    category: 'Display',
    availableVersions: ['2.5.13', '2.5.9', '2.5.7'],
    description: 'SSD1306 OLED display driver for 128x64 and 128x32 monochrome screens.',
    header: '<Adafruit_SSD1306.h>',
  },
  {
    name: 'Adafruit GFX Library',
    author: 'Adafruit',
    category: 'Display',
    availableVersions: ['1.11.11', '1.11.9'],
    description: 'Adafruit core graphics library providing primitives (points, lines, circles, fonts).',
    header: '<Adafruit_GFX.h>',
  },
  {
    name: 'LiquidCrystal I2C',
    author: 'Frank de Brabander',
    category: 'Display',
    availableVersions: ['1.1.2', '1.1.0'],
    description: 'Library for character LCD 16x2 and 20x4 displays driven via I2C PCF8574 backpack.',
    header: '<LiquidCrystal_I2C.h>',
  },
  {
    name: 'DallasTemperature',
    author: 'Miles Burton',
    category: 'Sensors',
    availableVersions: ['3.9.0', '3.8.0'],
    description: 'Arduino library for Maxim DS18B20 1-Wire temperature sensors.',
    header: '<DallasTemperature.h>',
  },
  {
    name: 'OneWire',
    author: 'Paul Stoffregen',
    category: 'Communication',
    availableVersions: ['2.3.8', '2.3.7'],
    description: 'Control devices with Maxim/Dallas 1-Wire protocol.',
    header: '<OneWire.h>',
  },
  {
    name: 'BH1750',
    author: 'Christopher Laws',
    category: 'Sensors',
    availableVersions: ['1.3.0', '1.2.0'],
    description: 'Light sensor library for BH1750 ambient light sensor reading lux values.',
    header: '<BH1750.h>',
  },
  {
    name: 'Adafruit MPU6050',
    author: 'Adafruit',
    category: 'Sensors',
    availableVersions: ['2.2.6', '2.2.4'],
    description: 'Driver for MPU-6050 6-DoF accelerometer and gyroscope.',
    header: '<Adafruit_MPU6050.h>',
  },
  {
    name: 'ESP32Servo',
    author: 'Kevin Harrington',
    category: 'Device Control',
    availableVersions: ['3.0.6', '3.0.5'],
    description: 'Enables servo control on ESP32 boards using hardware timers.',
    header: '<ESP32Servo.h>',
  },
  {
    name: 'Adafruit NeoPixel',
    author: 'Adafruit',
    category: 'Device Control',
    availableVersions: ['1.12.3', '1.12.0'],
    description: 'Arduino library for controlling single-wire-based LED pixels and strip (WS2812B, SK6812).',
    header: '<Adafruit_NeoPixel.h>',
  },
  {
    name: 'AccelStepper',
    author: 'Mike McCauley',
    category: 'Device Control',
    availableVersions: ['1.64.0', '1.61.0'],
    description: 'Non-blocking stepper motor driver with smooth acceleration and multi-axis support.',
    header: '<AccelStepper.h>',
  },
  {
    name: 'NTPClient',
    author: 'Fabrice Weinberg',
    category: 'Timing',
    availableVersions: ['3.2.1', '3.2.0'],
    description: 'Connect to an NTP server to fetch the current time.',
    header: '<NTPClient.h>',
  },
  {
    name: 'WiFiManager',
    author: 'tzapu',
    category: 'Communication',
    availableVersions: ['2.0.17', '2.0.16'],
    description: 'ESP32 and ESP8266 WiFi Connection manager with captive portal web UI.',
    header: '<WiFiManager.h>',
  },
];

const STORAGE_KEY_LIBS = 'resursee_iot_installed_libraries';

export function getInstalledLibraryNames(): string[] {
  if (typeof window === 'undefined') return ['ArduinoJson'];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIBS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return ['ArduinoJson']; // ArduinoJson pre-installed by default
}

export function saveInstalledLibraryNames(names: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_LIBS, JSON.stringify(names));
    window.dispatchEvent(new Event('resursee_libraries_updated'));
  } catch {}
}

export default function LibraryManager() {
  const [installedNames, setInstalledNames] = useState<string[]>(['ArduinoJson']);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Installed' | 'Available'>('All');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [isDesktop, setIsDesktop] = useState(false);
  const [cliActive, setCliActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const names = getInstalledLibraryNames();
    setInstalledNames(names);

    const desktop = isTauriDesktop();
    setIsDesktop(desktop);

    if (desktop) {
      tauriCheckArduinoCli().then(async (cli) => {
        setCliActive(cli);
        if (cli) {
          try {
            const libs = await tauriListInstalledLibraries();
            if (Array.isArray(libs) && libs.length > 0) {
              const detected = libs.map((l: any) => l.library?.name || l.name).filter(Boolean);
              if (detected.length > 0) {
                const merged = Array.from(new Set([...names, ...detected]));
                setInstalledNames(merged);
                saveInstalledLibraryNames(merged);
              }
            }
          } catch {}
        }
      });
    }

    const handleUpdate = () => {
      setInstalledNames(getInstalledLibraryNames());
    };
    window.addEventListener('resursee_libraries_updated', handleUpdate);
    return () => window.removeEventListener('resursee_libraries_updated', handleUpdate);
  }, []);

  const handleInstall = async (lib: LibraryItem) => {
    setIsProcessing((prev) => ({ ...prev, [lib.name]: true }));
    setStatusMessage(`Installing library "${lib.name}"...`);

    if (isDesktop && cliActive) {
      try {
        await tauriInstallLibrary(lib.name);
      } catch (err) {
        console.warn('CLI lib install error:', err);
      }
    }

    const updated = Array.from(new Set([...installedNames, lib.name]));
    setInstalledNames(updated);
    saveInstalledLibraryNames(updated);

    setTimeout(() => {
      setIsProcessing((prev) => ({ ...prev, [lib.name]: false }));
      setStatusMessage(`✓ ${lib.name} installed successfully!`);
      setTimeout(() => setStatusMessage(null), 3500);
    }, 500);
  };

  const handleUninstall = async (lib: LibraryItem) => {
    setIsProcessing((prev) => ({ ...prev, [lib.name]: true }));
    setStatusMessage(`Removing "${lib.name}"...`);

    if (isDesktop && cliActive) {
      try {
        await tauriUninstallLibrary(lib.name);
      } catch (err) {
        console.warn('CLI lib uninstall error:', err);
      }
    }

    const updated = installedNames.filter((n) => n !== lib.name);
    setInstalledNames(updated);
    saveInstalledLibraryNames(updated);

    setTimeout(() => {
      setIsProcessing((prev) => ({ ...prev, [lib.name]: false }));
      setStatusMessage(`Removed "${lib.name}".`);
      setTimeout(() => setStatusMessage(null), 3000);
    }, 450);
  };

  const filteredLibraries = CATALOGUE_LIBRARIES.filter((lib) => {
    const isInstalled = installedNames.includes(lib.name);
    if (typeFilter === 'Installed' && !isInstalled) return false;
    if (typeFilter === 'Available' && isInstalled) return false;
    if (topicFilter !== 'All' && lib.category !== topicFilter) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      lib.name.toLowerCase().includes(query) ||
      lib.author.toLowerCase().includes(query) ||
      lib.description.toLowerCase().includes(query) ||
      lib.header.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER (Screenshot 2: LIBRARY MANAGER) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <Package size={16} weight="bold" />
            </span>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Library Manager
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
              {installedNames.length} Installed
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-1">
            Install Arduino libraries for sensors, displays, and cloud protocols. One click installs directly to your environment.
          </p>
        </div>

        {statusMessage && (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3.5 py-1.5 text-xs font-medium text-neutral-900 dark:text-white animate-in fade-in">
            {statusMessage}
          </div>
        )}
      </div>

      {/* FILTER BAR (Screenshot 2: Filter Your Search + Type + Topic) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] p-4 text-xs">
        {/* Search Input */}
        <div className="sm:col-span-2 relative">
          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
            Filter your search...
          </label>
          <div className="relative">
            <MagnifyingGlass
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library name, header, or author..."
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-8 py-2 text-xs text-neutral-900 dark:text-white outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Type Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
            Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="All">All ({CATALOGUE_LIBRARIES.length})</option>
            <option value="Installed">Installed ({installedNames.length})</option>
            <option value="Available">Available ({CATALOGUE_LIBRARIES.length - installedNames.length})</option>
          </select>
        </div>

        {/* Topic Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
            Topic
          </label>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="All">All Topics</option>
            <option value="Sensors">Sensors</option>
            <option value="Communication">Communication</option>
            <option value="Data Processing">Data Processing</option>
            <option value="Display">Display</option>
            <option value="Device Control">Device Control</option>
            <option value="Timing">Timing</option>
          </select>
        </div>
      </div>

      {/* LIBRARIES LIST (Screenshot 2 Layout) */}
      <div className="space-y-4">
        {filteredLibraries.map((lib) => {
          const isInstalled = installedNames.includes(lib.name);
          const currentVersion = selectedVersions[lib.name] || lib.availableVersions[0];
          const processing = isProcessing[lib.name];

          return (
            <div
              key={lib.name}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-5 space-y-3 transition hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {lib.name}
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      by {lib.author}
                    </span>
                  </div>

                  {/* Installed Badge */}
                  {isInstalled && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 font-mono">
                        <Check size={12} weight="bold" />
                        <span>{lib.availableVersions[0]} installed</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 self-start">
                  <span className="rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    {lib.header}
                  </span>
                  <span className="rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    {lib.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {lib.description}
              </p>

              {/* Version & Action Button (Screenshot 2: Version dropdown + INSTALL / REMOVE) */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-500 font-medium">Version:</span>
                  <select
                    value={currentVersion}
                    onChange={(e) =>
                      setSelectedVersions((prev) => ({ ...prev, [lib.name]: e.target.value }))
                    }
                    className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer font-mono"
                  >
                    {lib.availableVersions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {isInstalled ? (
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleUninstall(lib)}
                      className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      {processing ? 'Removing...' : 'REMOVE'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleInstall(lib)}
                      className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-1.5 text-xs font-bold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                    >
                      {processing ? (
                        <ArrowsClockwise size={13} className="animate-spin" />
                      ) : null}
                      <span>{processing ? 'INSTALLING...' : 'INSTALL'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredLibraries.length === 0 && (
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-12 text-center text-xs text-neutral-500 space-y-2">
            <Package size={32} className="mx-auto text-neutral-400" />
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
              No libraries found matching &quot;{searchQuery}&quot;
            </p>
            <p>Try clearing your search query or switching filters to All.</p>
          </div>
        )}
      </div>
    </div>
  );
}
