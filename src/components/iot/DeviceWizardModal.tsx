'use client';

import React, { useState } from 'react';
import { IoTDevice } from '@/types/iotCloud';
import { generateArduinoSketch } from '@/lib/arduinoSketchGenerator';
import {
  X,
  Cpu,
  Copy,
  Check,
  DownloadSimple,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  WifiHigh,
} from '@phosphor-icons/react';

interface DeviceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onDeviceCreated: (newDevice: IoTDevice) => void;
}

export default function DeviceWizardModal({
  isOpen,
  onClose,
  userId,
  onDeviceCreated,
}: DeviceWizardModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [deviceName, setDeviceName] = useState('');
  const [description, setDescription] = useState('');
  const [deviceType, setDeviceType] = useState<'esp32' | 'esp8266'>('esp32');
  const [createdDevice, setCreatedDevice] = useState<IoTDevice | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    const newDev: IoTDevice = {
      id: `dev-${userId.substring(0, 6)}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      name: deviceName.trim(),
      description: description.trim() || 'Custom IoT Node',
      deviceType,
      deviceToken: `sk_esp32_${Math.random().toString(36).substring(2, 14)}`,
      status: 'offline',
      createdAt: new Date().toISOString(),
      firmwareVersion: '1.0.0',
    };

    setCreatedDevice(newDev);
    onDeviceCreated(newDev);
    setStep(2);
  };

  const handleCopySketch = () => {
    if (!createdDevice) return;
    const sketch = generateArduinoSketch(createdDevice);
    navigator.clipboard.writeText(sketch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSketch = () => {
    if (!createdDevice) return;
    const sketch = generateArduinoSketch(createdDevice);
    const blob = new Blob([sketch], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${createdDevice.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_firmware.ino`;
    link.click();
  };

  const handleFinish = () => {
    setStep(1);
    setDeviceName('');
    setDescription('');
    setCreatedDevice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-white/20 bg-[var(--color-paper)] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-blue-500/10 text-blue-600">
              <Cpu size={18} weight="bold" />
            </span>
            <span className="text-sm font-bold text-[var(--color-ink)]">
              {step === 1 ? 'Add New ESP32 Device' : 'Ready-to-Flash Arduino Firmware'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Step 1: Device Info Form */}
        {step === 1 && (
          <form onSubmit={handleCreate} className="p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">
                Device Name
              </label>
              <input
                type="text"
                required
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Smart Hydroponics, Weather Station, Room Node"
                className="mt-2 w-full rounded-[16px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">
                Hardware Microcontroller
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  { id: 'esp32', name: 'ESP32 (WiFi + BLE)', sub: 'Dual-core 240MHz' },
                  { id: 'esp8266', name: 'ESP8266 / NodeMCU', sub: 'Single-core 80MHz' },
                ].map((board) => (
                  <div
                    key={board.id}
                    onClick={() => setDeviceType(board.id as typeof deviceType)}
                    className={`flex flex-col p-4 rounded-[18px] border cursor-pointer transition-all ${
                      deviceType === board.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/30'
                        : 'border-[var(--color-rule)] bg-[var(--color-paper-card)] hover:border-[var(--color-rule-strong)]'
                    }`}
                  >
                    <span className="text-xs font-bold text-[var(--color-ink)]">{board.name}</span>
                    <span className="text-[10.5px] text-[var(--color-ink-muted)] font-mono">{board.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider font-mono">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monitoring nursery seedlings temperature and soil humidity"
                className="mt-2 w-full rounded-[16px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-hidden focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-2.5 text-xs font-bold text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
              >
                <span>Generate Credentials & Sketch</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Generated Firmware Sketch */}
        {step === 2 && createdDevice && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Credentials Pill Box */}
            <div className="rounded-[20px] bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Device Created: {createdDevice.name}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 font-mono text-[9px] font-bold text-white">
                  <ShieldCheck size={11} />
                  Token Active
                </span>
              </div>
              <p className="font-mono text-[11px] text-[var(--color-ink)] truncate bg-white/70 dark:bg-black/40 p-2 rounded-lg border border-[var(--color-rule)]">
                Device Token: <strong className="text-emerald-600 dark:text-emerald-400">{createdDevice.deviceToken}</strong>
              </p>
            </div>

            {/* Code Box Preview */}
            <div className="relative overflow-hidden rounded-[20px] border border-neutral-800 bg-neutral-950 p-4 text-xs font-mono text-neutral-300 max-h-60 overflow-y-auto">
              <pre className="text-[11px] leading-relaxed">
                {generateArduinoSketch(createdDevice)}
              </pre>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySketch}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={15} weight="bold" />
                      <span>Sketch Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={15} weight="bold" />
                      <span>Copy Arduino C++ Sketch</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSketch}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-4 py-2.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] active:scale-95 cursor-pointer"
                >
                  <DownloadSimple size={15} />
                  <span>Download .ino</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                Go to Live Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
