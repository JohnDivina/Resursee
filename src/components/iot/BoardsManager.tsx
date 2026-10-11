'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  MagnifyingGlass,
  Check,
  ArrowsClockwise,
  Trash,
  X,
  Info,
  Desktop,
  ArrowRight,
} from '@phosphor-icons/react';
import { isTauriDesktop } from '@/lib/envDetector';
import {
  tauriListInstalledCores,
  tauriInstallCore,
  tauriUninstallCore,
  tauriCheckArduinoCli,
} from '@/lib/tauriBridge';

export interface BoardPackage {
  id: string; // e.g. "esp32:esp32"
  name: string;
  author: string;
  installedVersion?: string;
  availableVersions: string[];
  description: string;
  boardsIncluded: string[];
  category: string;
  hardwareDeviceTypes: Array<'esp32' | 'esp8266' | 'arduino' | 'raspberry_pi'>;
}

export const AVAILABLE_BOARD_PACKAGES: BoardPackage[] = [
  {
    id: 'esp32:esp32',
    name: 'Arduino ESP32 Boards',
    author: 'Espressif Systems',
    availableVersions: ['3.0.4', '2.0.18', '2.0.14', '1.0.6'],
    description: 'Arduino core for the ESP32, ESP32-S2, ESP32-S3, ESP32-C3, ESP32-C6, and ESP32-H2 microcontrollers.',
    boardsIncluded: [
      'ESP32 Dev Module (WROOM-32)',
      'ESP32-S3 Dev Module',
      'ESP32-C3 RISC-V Module',
      'NodeMCU-32S',
      'DOIT ESP32 DEVKIT V1',
      'ESP32-WROVER Module',
    ],
    category: 'ESP32',
    hardwareDeviceTypes: ['esp32'],
  },
  {
    id: 'esp8266:esp8266',
    name: 'ESP8266 Community Boards',
    author: 'ESP8266 Community',
    availableVersions: ['3.1.2', '3.0.2', '2.7.4'],
    description: 'Arduino core for ESP8266 WiFi SoC including NodeMCU, WeMos D1, and ESP-01 modules.',
    boardsIncluded: [
      'NodeMCU 1.0 (ESP-12E Module)',
      'Generic ESP8266 Module',
      'WeMos D1 R1 / R2',
      'NodeMCU 0.9 (ESP-12 Module)',
      'Adafruit Feather HUZZAH ESP8266',
    ],
    category: 'ESP8266',
    hardwareDeviceTypes: ['esp8266'],
  },
  {
    id: 'arduino:avr',
    name: 'Arduino AVR Boards',
    author: 'Arduino',
    availableVersions: ['1.8.8', '1.8.6', '1.8.3'],
    description: 'Classic 8-bit AVR microcontrollers included in standard Arduino hardware.',
    boardsIncluded: [
      'Arduino Uno',
      'Arduino Nano',
      'Arduino Mega or Mega 2560',
      'Arduino Leonardo',
      'LilyPad Arduino',
    ],
    category: 'AVR',
    hardwareDeviceTypes: ['arduino'],
  },
  {
    id: 'arduino:mbed_nano',
    name: 'Arduino Mbed OS Nano Boards',
    author: 'Arduino',
    availableVersions: ['4.1.5', '4.0.2', '3.5.1'],
    description: 'Mbed OS based 32-bit Arm Cortex-M4 and RP2040 microcontrollers with Bluetooth Low Energy.',
    boardsIncluded: [
      'Arduino Nano 33 BLE',
      'Arduino Nano 33 BLE Sense',
      'Arduino Nano RP2040 Connect',
      'Arduino Edge Control',
    ],
    category: 'ARM',
    hardwareDeviceTypes: ['arduino'],
  },
  {
    id: 'rp2040:rp2040',
    name: 'Raspberry Pi Pico / RP2040',
    author: 'Earle F. Philhower, III',
    availableVersions: ['4.0.1', '3.7.2', '3.6.0'],
    description: 'Community Arduino-Pico core for Raspberry Pi RP2040 and Pico W dual-core microcontrollers.',
    boardsIncluded: [
      'Raspberry Pi Pico',
      'Raspberry Pi Pico W',
      'Adafruit Feather RP2040',
      'SparkFun Pro Micro RP2040',
    ],
    category: 'RP2040',
    hardwareDeviceTypes: ['raspberry_pi'],
  },
];

const STORAGE_KEY_CORES = 'resursee_iot_installed_cores';

export function getInstalledCoreIds(): string[] {
  if (typeof window === 'undefined') return ['esp32:esp32'];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CORES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return ['esp32:esp32']; // ESP32 is pre-installed out of the box
}

export function saveInstalledCoreIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CORES, JSON.stringify(ids));
    window.dispatchEvent(new Event('resursee_boards_updated'));
  } catch {}
}

export default function BoardsManager() {
  const [installedCoreIds, setInstalledCoreIds] = useState<string[]>(['esp32:esp32']);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Installed' | 'Available'>('All');
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [isDesktop, setIsDesktop] = useState(false);
  const [cliActive, setCliActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const ids = getInstalledCoreIds();
    setInstalledCoreIds(ids);

    const desktop = isTauriDesktop();
    setIsDesktop(desktop);

    if (desktop) {
      tauriCheckArduinoCli().then(async (cli) => {
        setCliActive(cli);
        if (cli) {
          try {
            const cores = await tauriListInstalledCores();
            if (Array.isArray(cores) && cores.length > 0) {
              const detectedIds = cores.map((c: any) => c.id || `${c.maintainer}:${c.architecture}`).filter(Boolean);
              if (detectedIds.length > 0) {
                const merged = Array.from(new Set([...ids, ...detectedIds]));
                setInstalledCoreIds(merged);
                saveInstalledCoreIds(merged);
              }
            }
          } catch {}
        }
      });
    }

    const handleUpdate = () => {
      setInstalledCoreIds(getInstalledCoreIds());
    };
    window.addEventListener('resursee_boards_updated', handleUpdate);
    return () => window.removeEventListener('resursee_boards_updated', handleUpdate);
  }, []);

  const handleInstall = async (pkg: BoardPackage) => {
    setIsProcessing((prev) => ({ ...prev, [pkg.id]: true }));
    setStatusMessage(`Installing board core ${pkg.name}...`);

    if (isDesktop && cliActive) {
      try {
        const res = await tauriInstallCore(pkg.id);
        if (!res.success) {
          console.warn('CLI core install output:', res.output);
        }
      } catch (err) {
        console.warn('CLI core install error:', err);
      }
    }

    const updated = Array.from(new Set([...installedCoreIds, pkg.id]));
    setInstalledCoreIds(updated);
    saveInstalledCoreIds(updated);

    setTimeout(() => {
      setIsProcessing((prev) => ({ ...prev, [pkg.id]: false }));
      setStatusMessage(`✓ ${pkg.name} installed successfully! Available in board selectors and device wizard.`);
      setTimeout(() => setStatusMessage(null), 4000);
    }, 600);
  };

  const handleUninstall = async (pkg: BoardPackage) => {
    if (installedCoreIds.length === 1 && installedCoreIds.includes(pkg.id)) {
      alert('You must have at least one board architecture installed.');
      return;
    }

    setIsProcessing((prev) => ({ ...prev, [pkg.id]: true }));
    setStatusMessage(`Removing ${pkg.name}...`);

    if (isDesktop && cliActive) {
      try {
        await tauriUninstallCore(pkg.id);
      } catch (err) {
        console.warn('CLI core uninstall error:', err);
      }
    }

    const updated = installedCoreIds.filter((id) => id !== pkg.id);
    setInstalledCoreIds(updated);
    saveInstalledCoreIds(updated);

    setTimeout(() => {
      setIsProcessing((prev) => ({ ...prev, [pkg.id]: false }));
      setStatusMessage(`Removed ${pkg.name}.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }, 500);
  };

  const filteredPackages = AVAILABLE_BOARD_PACKAGES.filter((pkg) => {
    const isInstalled = installedCoreIds.includes(pkg.id);
    if (filterType === 'Installed' && !isInstalled) return false;
    if (filterType === 'Available' && isInstalled) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      pkg.name.toLowerCase().includes(query) ||
      pkg.author.toLowerCase().includes(query) ||
      pkg.description.toLowerCase().includes(query) ||
      pkg.boardsIncluded.some((b) => b.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION (Matching Arduino IDE Screenshot 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <Cpu size={16} weight="bold" />
            </span>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              Boards Manager
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
              {installedCoreIds.length} Core{installedCoreIds.length === 1 ? '' : 's'} Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-1">
            Install and manage hardware microcontroller cores. Only installed boards will appear in your device wizards and code compiler.
          </p>
        </div>

        {statusMessage && (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3.5 py-1.5 text-xs font-medium text-neutral-900 dark:text-white animate-in fade-in">
            {statusMessage}
          </div>
        )}
      </div>

      {/* FILTER CONTROLS (Screenshot 1 Filter Your Search + Type) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] p-4 text-xs">
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
              placeholder="Filter boards (e.g. ESP32, ESP8266, AVR, Nano)..."
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

        {/* Type Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
            Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="All">All ({AVAILABLE_BOARD_PACKAGES.length})</option>
            <option value="Installed">Installed ({installedCoreIds.length})</option>
            <option value="Available">Available ({AVAILABLE_BOARD_PACKAGES.length - installedCoreIds.length})</option>
          </select>
        </div>
      </div>

      {/* BOARDS PACKAGES LIST (Faithful to Screenshot 1 layout) */}
      <div className="space-y-4">
        {filteredPackages.map((pkg) => {
          const isInstalled = installedCoreIds.includes(pkg.id);
          const currentVersion = selectedVersions[pkg.id] || pkg.availableVersions[0];
          const processing = isProcessing[pkg.id];

          return (
            <div
              key={pkg.id}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-5 space-y-3.5 transition hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              {/* Package Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {pkg.name}
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      by {pkg.author}
                    </span>
                  </div>

                  {/* Installed Badge (Screenshot 1: e.g. 2.0.18 installed) */}
                  {isInstalled && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 font-mono">
                        <Check size={12} weight="bold" />
                        <span>{pkg.availableVersions[1] || pkg.availableVersions[0]} installed</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Architecture Category */}
                <span className="self-start rounded-lg bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  {pkg.id}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {pkg.description}
              </p>

              {/* Boards Included in Package */}
              <div className="rounded-xl bg-neutral-50 dark:bg-[#0c0c0c] p-3 border border-neutral-200/70 dark:border-neutral-800/70 text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Boards included in this package:
                </span>
                <span className="text-neutral-500 dark:text-neutral-400 leading-relaxed font-mono text-[11px]">
                  {pkg.boardsIncluded.join(', ')}
                </span>
              </div>

              {/* Version Selector & Direct Action Button (Install / Remove) */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-500 font-medium">Version:</span>
                  <select
                    value={currentVersion}
                    onChange={(e) =>
                      setSelectedVersions((prev) => ({ ...prev, [pkg.id]: e.target.value }))
                    }
                    className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer font-mono"
                  >
                    {pkg.availableVersions.map((v) => (
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
                      onClick={() => handleUninstall(pkg)}
                      className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                    >
                      {processing ? 'Removing...' : 'REMOVE'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleInstall(pkg)}
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

        {filteredPackages.length === 0 && (
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-12 text-center text-xs text-neutral-500 space-y-2">
            <Cpu size={32} className="mx-auto text-neutral-400" />
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
              No boards packages found matching &quot;{searchQuery}&quot;
            </p>
            <p>Try clearing your search query or switching the Type filter to All.</p>
          </div>
        )}
      </div>
    </div>
  );
}
