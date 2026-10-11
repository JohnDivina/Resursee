'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  UploadSimple,
  Copy,
  Check,
  DownloadSimple,
  TerminalWindow,
  Trash,
  ArrowsClockwise,
  Info,
  X,
  CaretDown,
  CaretUp,
  SlidersHorizontal,
  WifiHigh,
  Key,
  Desktop,
  Globe,
  Broadcast,
  Package,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { isTauriDesktop } from '@/lib/envDetector';
import {
  tauriCheckArduinoCli,
  tauriGetArduinoCliVersion,
  tauriListSerialPorts,
  tauriCompileSketch,
  tauriUploadSketch,
} from '@/lib/tauriBridge';
import { generateArduinoSketch } from '@/lib/arduinoSketchGenerator';
import { IoTDevice } from '@/types/iotCloud';
import { getInstalledCoreIds } from '@/components/iot/BoardsManager';

export interface Esp32CodeStudioProps {
  device: IoTDevice;
  serverOrigin?: string;
}

export const ALL_SUPPORTED_BOARDS = [
  { fqbn: 'esp32:esp32:esp32', label: 'ESP32 Dev Module (WROOM-32)', coreId: 'esp32:esp32' },
  { fqbn: 'esp32:esp32:esp32s3', label: 'ESP32-S3 Dev Module', coreId: 'esp32:esp32' },
  { fqbn: 'esp32:esp32:esp32c3', label: 'ESP32-C3 RISC-V Module', coreId: 'esp32:esp32' },
  { fqbn: 'esp8266:esp8266:generic', label: 'ESP8266 Generic Module', coreId: 'esp8266:esp8266' },
  { fqbn: 'arduino:avr:uno', label: 'Arduino Uno (AVR)', coreId: 'arduino:avr' },
  { fqbn: 'arduino:avr:nano', label: 'Arduino Nano (AVR)', coreId: 'arduino:avr' },
  { fqbn: 'arduino:mbed_nano:nano33ble', label: 'Arduino Nano 33 BLE', coreId: 'arduino:mbed_nano' },
  { fqbn: 'rp2040:rp2040:rpipico', label: 'Raspberry Pi Pico (RP2040)', coreId: 'rp2040:rp2040' },
];

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

export default function Esp32CodeStudio({
  device,
  serverOrigin = 'https://resursee.vercel.app',
}: Esp32CodeStudioProps) {
  // --- Editor State ---
  const [code, setCode] = useState<string>(() => generateArduinoSketch(device, serverOrigin));
  const [template, setTemplate] = useState<'default' | 'minimal' | 'sleep' | 'diagnostic'>('default');
  const [boardFqbn, setBoardFqbn] = useState<string>('esp32:esp32:esp32');
  const [copied, setCopied] = useState<boolean>(false);
  const [wifiSsid, setWifiSsid] = useState<string>('YOUR_WIFI_SSID');
  const [wifiPassword, setWifiPassword] = useState<string>('YOUR_WIFI_PASSWORD');

  // --- Tauri Desktop & Arduino CLI State ---
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [cliDetected, setCliDetected] = useState<boolean | null>(null);
  const [cliVersion, setCliVersion] = useState<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // --- Console Drawer State ---
  const [consoleOpen, setConsoleOpen] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string>('');
  const [consoleStatus, setConsoleStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- Setup Modal State ---
  const [cliModalOpen, setCliModalOpen] = useState<boolean>(false);

  // --- Installed Boards & Cores State ---
  const [installedCores, setInstalledCores] = useState<string[]>(getInstalledCoreIds);

  useEffect(() => {
    const handleUpdate = () => {
      setInstalledCores(getInstalledCoreIds());
    };
    window.addEventListener('resursee_boards_updated', handleUpdate);
    return () => window.removeEventListener('resursee_boards_updated', handleUpdate);
  }, []);

  const availableBoards = ALL_SUPPORTED_BOARDS.filter((b) => installedCores.includes(b.coreId) || (b.coreId === 'esp32:esp32' && installedCores.includes('arduino:esp32')));

  useEffect(() => {
    if (availableBoards.length > 0 && !availableBoards.some((b) => b.fqbn === boardFqbn)) {
      setBoardFqbn(availableBoards[0].fqbn);
    }
  }, [availableBoards, boardFqbn]);

  // --- Web Serial Monitor State ---
  const [serialOpen, setSerialOpen] = useState<boolean>(false);
  const [serialSupported, setSerialSupported] = useState<boolean>(false);
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [serialLogs, setSerialLogs] = useState<Array<{ id: number; time: string; text: string }>>([]);
  const [serialInput, setSerialInput] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Web Serial refs
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const serialOutputRef = useRef<HTMLDivElement>(null);

  // Line numbering
  const lineCount = Math.max(code.split('\n').length, 1);

  const [isCheckingCli, setIsCheckingCli] = useState<boolean>(false);

  // Dynamic CLI Detector
  const checkCli = async () => {
    const desktop = isTauriDesktop();
    setIsDesktop(desktop);
    if (!desktop) return;

    setIsCheckingCli(true);
    try {
      const detected = await tauriCheckArduinoCli();
      setCliDetected(detected);
      if (detected) {
        const ver = await tauriGetArduinoCliVersion();
        setCliVersion(ver);
        refreshSerialPorts();
      }
    } finally {
      setIsCheckingCli(false);
    }
  };

  // Detect environment on mount and re-check whenever window regains focus
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
    setSerialSupported(hasSerial);

    checkCli();

    window.addEventListener('focus', checkCli);
    return () => window.removeEventListener('focus', checkCli);
  }, []);

  // Auto-scroll serial monitor
  useEffect(() => {
    if (autoScroll && serialOutputRef.current) {
      serialOutputRef.current.scrollTop = serialOutputRef.current.scrollHeight;
    }
  }, [serialLogs, autoScroll]);

  const refreshSerialPorts = async () => {
    const ports = await tauriListSerialPorts();
    setAvailablePorts(ports);
    if (ports.length > 0 && !selectedPort) {
      setSelectedPort(ports[0]);
    }
  };

  // Switch Sketch Template
  const handleTemplateChange = (newTemplate: 'default' | 'minimal' | 'sleep' | 'diagnostic') => {
    setTemplate(newTemplate);
    const token = device.deviceToken;
    const endpoint = `${serverOrigin}/api/iot/ingest`;

    if (newTemplate === 'default') {
      setCode(generateArduinoSketch(device, serverOrigin));
    } else if (newTemplate === 'minimal') {
      setCode(`/*
 * Resursee IoT Cloud · Minimal Heartbeat & Actuator Sync
 * Device: ${device.name} (${device.id})
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "${wifiSsid}";
const char* WIFI_PASSWORD = "${wifiPassword}";
const char* INGEST_URL   = "${endpoint}";
const char* DEVICE_TOKEN = "${token}";

const int RELAY_PIN = 2; // GPIO 2 (Built-in LED / Relay)
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");
}

void loop() {
  if (millis() - lastSend > 2000) {
    lastSend = millis();
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(INGEST_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-device-token", DEVICE_TOKEN);

      StaticJsonDocument<256> doc;
      doc["deviceToken"] = DEVICE_TOKEN;
      doc["rssi"] = WiFi.RSSI();
      doc["ipAddress"] = WiFi.localIP().toString();

      String payload;
      serializeJson(doc, payload);
      int code = http.POST(payload);

      if (code == 200) {
        String resp = http.getString();
        StaticJsonDocument<256> rDoc;
        deserializeJson(rDoc, resp);
        if (rDoc.containsKey("actuatorStates")) {
          bool state = rDoc["actuatorStates"]["pin_2"] | false;
          digitalWrite(RELAY_PIN, state ? HIGH : LOW);
        }
      }
      http.end();
    }
  }
}
`);
    } else if (newTemplate === 'sleep') {
      setCode(`/*
 * Resursee IoT Cloud · Deep Sleep Ultra Low-Power Battery Node
 * Device: ${device.name} (${device.id})
 * Wakes every 60 seconds, transmits telemetry, and enters deep sleep (<15µA).
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define uS_TO_S_FACTOR 1000000ULL  // Conversion factor for micro seconds to seconds
#define TIME_TO_SLEEP  60         // Time ESP32 will go to sleep (in seconds)

const char* WIFI_SSID     = "${wifiSsid}";
const char* WIFI_PASSWORD = "${wifiPassword}";
const char* INGEST_URL   = "${endpoint}";
const char* DEVICE_TOKEN = "${token}";

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\\n[Power] Wake up from Deep Sleep");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 25) {
    delay(200);
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(INGEST_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-token", DEVICE_TOKEN);

    // Read analog battery or temperature
    float simulatedBattery = 3.92; // e.g. read from voltage divider on GPIO 35

    StaticJsonDocument<256> doc;
    doc["deviceToken"] = DEVICE_TOKEN;
    doc["battery"] = simulatedBattery;
    doc["rssi"] = WiFi.RSSI();

    String payload;
    serializeJson(doc, payload);
    http.POST(payload);
    http.end();
    Serial.println("[Cloud] Telemetry pushed before sleep.");
  }

  WiFi.disconnect(true);
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  Serial.println("[Power] Entering deep sleep mode now...");
  esp_deep_sleep_start();
}

void loop() {
  // Never reached in deep sleep architecture
}
`);
    } else if (newTemplate === 'diagnostic') {
      setCode(`/*
 * Resursee IoT Cloud · Hardware Diagnostic & Serial Echo
 * Device: ${device.name} (${device.id})
 * Quick self-test for GPIO, Serial Monitor, and Chip Identification.
 */
#define STATUS_LED 2 // Onboard LED on most ESP32 Dev boards

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=========================================");
  Serial.println("  Resursee ESP32 Hardware Self-Test      ");
  Serial.println("=========================================");
  Serial.printf("Chip Model:    %s\\n", ESP.getChipModel());
  Serial.printf("Chip Revision: %d\\n", ESP.getChipRevision());
  Serial.printf("CPU Cores:     %d\\n", ESP.getChipCores());
  Serial.printf("CPU Frequency: %d MHz\\n", ESP.getCpuFreqMHz());
  Serial.printf("Flash Size:    %d MB\\n", ESP.getFlashChipSize() / (1024 * 1024));
  Serial.printf("Free Heap:     %d bytes\\n", ESP.getFreeHeap());
  Serial.println("=========================================");
  Serial.println("Type any message in Serial Monitor to test echo.");

  pinMode(STATUS_LED, OUTPUT);
}

void loop() {
  // Heartbeat blink
  digitalWrite(STATUS_LED, HIGH);
  delay(300);
  digitalWrite(STATUS_LED, LOW);
  delay(700);

  // Serial Echo
  if (Serial.available()) {
    String incoming = Serial.readStringUntil('\\n');
    Serial.print("[Echo received]: ");
    Serial.println(incoming);
  }
}
`);
    }
  };

  // Quick Replace WiFi Config in current editor
  const handleApplyWifi = () => {
    let updated = code;
    updated = updated.replace(/const char\* WIFI_SSID\s*=\s*"[^"]*";/, `const char* WIFI_SSID     = "${wifiSsid}";`);
    updated = updated.replace(/const char\* WIFI_PASSWORD\s*=\s*"[^"]*";/, `const char* WIFI_PASSWORD = "${wifiPassword}";`);
    setCode(updated);
  };

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .ino file
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${device.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_firmware.ino`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Compile / Verify ---
  const handleVerify = async () => {
    let detected = cliDetected;
    if (!detected && isDesktop) {
      detected = await tauriCheckArduinoCli();
      setCliDetected(detected);
      if (detected) {
        const ver = await tauriGetArduinoCliVersion();
        setCliVersion(ver);
      }
    }

    if (!isDesktop || !detected) {
      setCliModalOpen(true);
      return;
    }

    setIsCompiling(true);
    setConsoleOpen(true);
    setConsoleStatus('idle');
    setConsoleLogs(`[Resursee Compiler] Starting Xtensa GCC build for board: ${boardFqbn}...\n`);

    const result = await tauriCompileSketch(code, boardFqbn);
    setIsCompiling(false);
    if (result.success) {
      setConsoleStatus('success');
      setConsoleLogs((prev) => `${prev}${result.output}\n\n✓ Compilation successful! Firmware binary ready for flashing.`);
    } else {
      setConsoleStatus('error');
      setConsoleLogs((prev) => `${prev}✗ ${result.output}`);
    }
  };

  // --- Upload / Flash ---
  const handleUpload = async () => {
    let detected = cliDetected;
    if (!detected && isDesktop) {
      detected = await tauriCheckArduinoCli();
      setCliDetected(detected);
      if (detected) {
        const ver = await tauriGetArduinoCliVersion();
        setCliVersion(ver);
      }
    }

    if (!isDesktop || !detected) {
      setCliModalOpen(true);
      return;
    }

    if (!selectedPort) {
      setConsoleOpen(true);
      setConsoleStatus('error');
      setConsoleLogs('[Resursee Flasher] Error: No USB Serial port selected. Connect your ESP32 and select a COM/TTY port.');
      return;
    }

    setIsUploading(true);
    setConsoleOpen(true);
    setConsoleStatus('idle');
    setConsoleLogs(`[Resursee Flasher] Compiling & Flashing onto ${selectedPort} (${boardFqbn})...\n`);

    const result = await tauriUploadSketch(selectedPort, code, boardFqbn);
    setIsUploading(false);
    if (result.success) {
      setConsoleStatus('success');
      setConsoleLogs((prev) => `${prev}${result.output}\n\n✓ Upload complete! ESP32 reset and running new firmware.`);
    } else {
      setConsoleStatus('error');
      setConsoleLogs((prev) => `${prev}✗ ${result.output}`);
    }
  };


  // --- Web Serial API Handlers ---
  const handleConnectSerial = async () => {
    if (!serialSupported) {
      alert('Web Serial API is not supported in this browser. Please use Google Chrome, Edge, Brave, or Resursee Desktop.');
      return;
    }

    try {
      const nav = navigator as any;
      const port = await nav.serial.requestPort();
      await port.open({ baudRate });
      portRef.current = port;
      setSerialConnected(true);

      const appendLog = (line: string) => {
        const time = new Date().toLocaleTimeString();
        setSerialLogs((prev) => [...prev.slice(-300), { id: Date.now() + Math.random(), time, text: line }]);
      };

      appendLog(`--- Serial Port Opened (${baudRate} baud) ---`);

      // Read loop
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable).catch(() => {});
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let buffer = '';
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const l of lines) {
                appendLog(l.replace(/\r/g, ''));
              }
            }
          }
        } catch {
          // Closed or disconnected
        } finally {
          appendLog('--- Serial Port Disconnected ---');
          setSerialConnected(false);
        }
      })();
    } catch (err: any) {
      console.warn('Web Serial connection error:', err);
    }
  };

  const handleDisconnectSerial = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
      }
      if (portRef.current) {
        await portRef.current.close();
      }
    } catch (err) {
      console.warn('Error closing port:', err);
    } finally {
      portRef.current = null;
      readerRef.current = null;
      setSerialConnected(false);
    }
  };

  const handleSendSerialCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim() || !portRef.current || !portRef.current.writable) return;

    try {
      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(portRef.current.writable).catch(() => {});
      const writer = textEncoder.writable.getWriter();
      await writer.write(serialInput + '\n');
      writer.releaseLock();

      const time = new Date().toLocaleTimeString();
      setSerialLogs((prev) => [
        ...prev.slice(-300),
        { id: Date.now() + Math.random(), time, text: `> ${serialInput}` },
      ]);
      setSerialInput('');
    } catch (err) {
      console.warn('Failed to send serial data:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER & OPTIONAL FEATURE BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              ESP32 Code Studio &amp; Compiler
            </h2>
            {/* AGENTS.md Solid Grey Bubble without pastel wash or neon */}
            <div className="flex items-center gap-1.5">
              <span
                onClick={checkCli}
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                title="Click to re-check arduino-cli detection"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cliDetected ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'}`} />
                {isDesktop && cliDetected
                  ? `Tauri Desktop Bridge · ${cliVersion ? cliVersion.split(' ')[2] || 'CLI Ready' : 'arduino-cli'}`
                  : isDesktop
                  ? isCheckingCli ? 'Checking arduino-cli...' : 'Desktop Mode · arduino-cli not found'
                  : 'Web Code Studio · Arduino IDE / Web Serial'}
              </span>
              {isDesktop && (
                <button
                  type="button"
                  onClick={checkCli}
                  className="rounded-full p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  title="Re-check for arduino-cli"
                >
                  <ArrowsClockwise size={12} className={isCheckingCli ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-0.5">
            Targeting: <strong className="text-neutral-800 dark:text-neutral-200">{device.name}</strong> ({device.id})
            {' · '}
            <span className="text-neutral-400 dark:text-neutral-500">
              Optional hardware developer tool. Primary telemetry &amp; live actuation sync with your Google account.
            </span>
          </p>
        </div>

        {/* PRIMARY ACTIONS: VERIFY, UPLOAD, SERIAL, DOWNLOAD */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Verify (Compile) */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={isCompiling || isUploading}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
            title="Verify & compile sketch syntax (arduino-cli)"
          >
            {isCompiling ? (
              <ArrowsClockwise size={13} className="animate-spin" />
            ) : (
              <Play size={13} weight="bold" />
            )}
            <span>{isCompiling ? 'Compiling...' : 'Verify'}</span>
          </button>

          {/* Upload (Flash) */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={isCompiling || isUploading}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            title="Compile and upload binary to connected ESP32"
          >
            {isUploading ? (
              <ArrowsClockwise size={13} className="animate-spin" />
            ) : (
              <UploadSimple size={13} weight="bold" />
            )}
            <span>{isUploading ? 'Flashing...' : 'Upload'}</span>
          </button>

          {/* Toggle Serial Monitor */}
          <button
            type="button"
            onClick={() => setSerialOpen(!serialOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              serialOpen
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <TerminalWindow size={13} weight="bold" />
            <span>Serial Monitor</span>
          </button>


          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
            title="Copy sketch to clipboard"
          >
            {copied ? <Check size={13} weight="bold" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
            title="Download .ino sketch file"
          >
            <DownloadSimple size={13} />
            <span>.ino</span>
          </button>
        </div>
      </div>

      {/* TOOLBAR CONTROLS: TEMPLATE, BOARD, PORT, QUICK WIFI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] p-3 text-xs">
        {/* Template Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
            Sketch Template
          </label>
          <select
            value={template}
            onChange={(e) => handleTemplateChange(e.target.value as any)}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="default">Full IoT Telemetry &amp; Actuators</option>
            <option value="minimal">Minimal Heartbeat &amp; Relay</option>
            <option value="sleep">Ultra Low-Power Deep Sleep</option>
            <option value="diagnostic">Hardware Diagnostic &amp; Blink</option>
          </select>
        </div>

        {/* Target Board FQBN */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
              Target Board Architecture
            </label>
            <span className="text-[10px] text-neutral-400 font-mono">
              {availableBoards.length} Installed
            </span>
          </div>
          <select
            value={boardFqbn}
            onChange={(e) => setBoardFqbn(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
          >
            {availableBoards.length === 0 ? (
              <option value="">No installed boards (Install via Boards Manager)</option>
            ) : (
              availableBoards.map((b) => (
                <option key={b.fqbn} value={b.fqbn}>
                  {b.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Serial Port Selector (Desktop) or Web Serial Note */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
              Flash Serial Port
            </label>
            {isDesktop && (
              <button
                type="button"
                onClick={refreshSerialPorts}
                className="text-[10px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer flex items-center gap-0.5"
                title="Refresh hardware serial ports"
              >
                <ArrowsClockwise size={10} />
                <span>Refresh</span>
              </button>
            )}
          </div>
          {isDesktop ? (
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="">-- Select Port --</option>
              {availablePorts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              Web Serial (use button above)
            </div>
          )}
        </div>

        {/* Quick WiFi Inserter */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
              Quick WiFi Injector
            </label>
            <button
              type="button"
              onClick={handleApplyWifi}
              className="text-[10px] font-semibold text-neutral-900 dark:text-white hover:underline cursor-pointer"
            >
              Apply to Code
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="text"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              placeholder="SSID"
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-[11px] text-neutral-900 dark:text-white outline-none"
            />
            <input
              type="password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              placeholder="Pass"
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-[11px] text-neutral-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* CODE EDITOR CONTAINER */}
      <div className="rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#0d0d0d] overflow-hidden text-neutral-200 font-mono text-xs shadow-sm">
        {/* Editor Tab Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-[#141414] text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">
              {device.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_firmware.ino
            </span>
            <span className="text-neutral-500">· C++ / Wiring</span>
          </div>

          <div className="flex items-center gap-3 text-neutral-400">
            <span>{lineCount} lines</span>
            <span>UTF-8</span>
            <button
              type="button"
              onClick={() => handleTemplateChange(template)}
              className="hover:text-white cursor-pointer"
              title="Reset code to selected template"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Editor Body: Line numbers + Monospace Textarea */}
        <div className="flex max-h-[520px] min-h-[380px] overflow-hidden">
          {/* Line Numbers */}
          <div className="w-12 select-none py-3 pr-3 pl-2 text-right text-[11px] text-neutral-600 bg-[#111111] border-r border-neutral-800/80 overflow-hidden font-mono leading-relaxed">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            wrap="off"
            onKeyDown={(e) => {
              // Handle Tab key for clean 2-space indentation
              if (e.key === 'Tab') {
                e.preventDefault();
                const target = e.currentTarget;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const newCode = code.substring(0, start) + '  ' + code.substring(end);
                setCode(newCode);
                setTimeout(() => {
                  target.selectionStart = target.selectionEnd = start + 2;
                }, 0);
              }
            }}
            className="flex-1 resize-none bg-transparent p-3 text-[12px] font-mono leading-relaxed text-neutral-200 outline-none overflow-auto border-none focus:ring-0 whitespace-pre"
          />
        </div>

        {/* Collapsible Console Drawer */}
        {consoleOpen && (
          <div className="border-t border-neutral-800 bg-[#080808]">
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-neutral-800 text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-300">Terminal &amp; Compiler Output</span>
                {consoleStatus === 'success' && (
                  <span className="text-neutral-300 font-bold">✓ Ready</span>
                )}
                {consoleStatus === 'error' && (
                  <span className="text-neutral-400 font-bold">✗ Error</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsoleLogs('')}
                  className="hover:text-white cursor-pointer"
                  title="Clear console"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleOpen(false)}
                  className="hover:text-white cursor-pointer"
                  title="Close console"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            <pre className="p-3 text-[11px] text-neutral-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {consoleLogs || 'No compiler messages.'}
            </pre>
          </div>
        )}
      </div>

      {/* WEB SERIAL MONITOR DRAWER */}
      {serialOpen && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <TerminalWindow size={16} weight="bold" className="text-neutral-800 dark:text-neutral-200" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white">
                Serial Monitor (USB Debugger)
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${serialConnected ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400'}`}
                />
                {serialConnected ? `Connected (${baudRate} baud)` : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Baud Rate selector */}
              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                <span>Baud:</span>
                <select
                  value={baudRate}
                  disabled={serialConnected}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer disabled:opacity-50"
                >
                  {BAUD_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Connect / Disconnect */}
              {serialConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnectSerial}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectSerial}
                  className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1 text-xs font-semibold hover:opacity-90 cursor-pointer"
                >
                  Connect Serial Port
                </button>
              )}

              {/* Clear */}
              <button
                type="button"
                onClick={() => setSerialLogs([])}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer p-1"
                title="Clear serial logs"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          {/* Terminal View */}
          <div
            ref={serialOutputRef}
            className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-[#090909] p-3 text-xs font-mono text-neutral-200 h-64 overflow-y-auto space-y-1"
          >
            {serialLogs.length === 0 ? (
              <div className="text-neutral-500 text-xs py-10 text-center">
                Serial monitor idle. Click &quot;Connect Serial Port&quot; to inspect real-time ESP32 Serial.println() logs.
              </div>
            ) : (
              serialLogs.map((log) => (
                <div key={log.id} className="flex gap-2 leading-relaxed">
                  <span className="text-neutral-600 select-none text-[10px] pt-0.5">[{log.time}]</span>
                  <span className="break-all">{log.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Serial Send Bar */}
          <form onSubmit={handleSendSerialCommand} className="flex items-center gap-2">
            <input
              type="text"
              value={serialInput}
              disabled={!serialConnected}
              onChange={(e) => setSerialInput(e.target.value)}
              placeholder={serialConnected ? 'Send serial command (e.g. RESET, RELAY_ON)...' : 'Connect port to send serial commands'}
              className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-900 dark:text-white outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!serialConnected || !serialInput.trim()}
              className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* HOW TO COMPILE & FLASH MODAL (SHOWN WHEN CLI IS NOT DETECTED OR IN WEB) */}
      {cliModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-[#161616] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                  Hardware Compilation Guide
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-1.5">
                  1-Click Compiling &amp; Flashing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCliModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              C++ compilation for ESP32 microcontrollers requires the <strong>Xtensa GCC toolchain</strong>. You have two seamless paths to build and flash your sketch:
            </p>

            <div className="space-y-3">
              {/* PATH 1: RESURSEE DESKTOP + ARDUINO-CLI */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111111] p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Desktop size={15} className="text-neutral-800 dark:text-neutral-200" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    Path A: Resursee Desktop with arduino-cli (Native 1-Click)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Install <code>arduino-cli</code> once on your machine. Resursee Desktop will automatically detect it and enable native compiling, binary verification, and USB flashing directly inside this window:
                </p>
                <div className="rounded-lg bg-black p-2 font-mono text-[11px] text-neutral-300 space-y-1">
                  <div># macOS (Homebrew):</div>
                  <div className="text-white">brew install arduino-cli</div>
                  <div className="pt-1"># ESP32 Core:</div>
                  <div className="text-white">arduino-cli core install esp32:esp32</div>
                </div>
              </div>

              {/* PATH 2: ARDUINO IDE / PLATFORMIO */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111111] p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <DownloadSimple size={15} className="text-neutral-800 dark:text-neutral-200" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    Path B: Standard Arduino IDE / PlatformIO
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Click <strong>&quot;Download .ino&quot;</strong> above, open the file in the official Arduino IDE or VS Code with PlatformIO, and click Upload.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Download .ino File
              </button>
              <button
                type="button"
                onClick={() => setCliModalOpen(false)}
                className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
