'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  Cpu,
  WifiHigh,
  WifiSlash,
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
  ArrowDown,
  Broadcast,
  ToggleRight,
  LockKey,
  Lightning,
  Clock,
  HardDrives,
  Graph,
  SlidersHorizontal,
  WarningCircle,
  ArrowUUpLeft,
  Globe,
} from '@phosphor-icons/react';

interface SystemArchitectureViewProps {
  onBackToDashboard?: () => void;
  onOpenFirmware?: () => void;
  deviceToken?: string;
  deviceId?: string;
}

export type FlowchartNodeId =
  | 'start_timer'
  | 'read_sensors'
  | 'serialize_json'
  | 'decision_wifi'
  | 'wifi_reconnect'
  | 'wifi_radio'
  | 'router_nat'
  | 'wan_tls'
  | 'api_ingest'
  | 'decision_auth'
  | 'auth_rejected'
  | 'db_store'
  | 'queue_actuators'
  | 'http_response'
  | 'dashboard_ui'
  | 'user_toggle'
  | 'put_actuator'
  | 'esp32_relay_exec';

interface FlowchartNodeMeta {
  id: FlowchartNodeId;
  lane: 'hardware' | 'network' | 'cloud' | 'client';
  label: string;
  sublabel: string;
  type: 'process' | 'decision' | 'terminal' | 'action';
  icon: React.ReactNode;
  codeSnippet: string;
  payloadSnippet?: string;
  description: string;
}

const FLOWCHART_NODES: FlowchartNodeMeta[] = [
  {
    id: 'start_timer',
    lane: 'hardware',
    label: '1. Timer Interrupt (2.5s)',
    sublabel: 'FreeRTOS Task on Core 1',
    type: 'process',
    icon: <Clock size={16} weight="bold" />,
    description: 'Periodic sampling timer configured using non-blocking millis() arithmetic in the main loop or pinned FreeRTOS task.',
    codeSnippet: `const unsigned long SEND_INTERVAL_MS = 2500;\nunsigned long lastSend = millis();\nif (millis() - lastSend >= SEND_INTERVAL_MS) {\n  lastSend = millis();\n  sendTelemetryAndSyncActuators();\n}`,
  },
  {
    id: 'read_sensors',
    lane: 'hardware',
    label: '2. Read Sensor Pins',
    sublabel: 'DHT22, Soil ADC1, Light LDR',
    type: 'process',
    icon: <SlidersHorizontal size={16} weight="bold" />,
    description: 'Acquires raw analog-to-digital conversions on ADC1 (channels 6 and 7) and reads one-wire pulses from DHT22.',
    codeSnippet: `float temp = dht.readTemperature();\nfloat hum  = dht.readHumidity();\nint soilRaw = analogRead(34); // ADC1_CH6\nint lightRaw = analogRead(35); // ADC1_CH7\nint soilPct = map(soilRaw, 3200, 1400, 0, 100);`,
  },
  {
    id: 'serialize_json',
    lane: 'hardware',
    label: '3. Serialize JSON',
    sublabel: 'StaticJsonDocument<256>',
    type: 'process',
    icon: <Code size={16} weight="bold" />,
    description: 'Packs telemetry measurements and authentication credentials into a static memory buffer using ArduinoJson v7.',
    codeSnippet: `StaticJsonDocument<256> doc;\ndoc["deviceToken"] = DEVICE_TOKEN;\ndoc["temperature"] = temp;\ndoc["humidity"]    = hum;\ndoc["soilMoisture"]= soilPct;\ndoc["light"]       = lightRaw;\nString jsonBody;\nserializeJson(doc, jsonBody);`,
    payloadSnippet: `{\n  "deviceToken": "sk_esp32_7f9a21_9c8b1a",\n  "temperature": 25.4,\n  "humidity": 63.8,\n  "soilMoisture": 58,\n  "light": 720\n}`,
  },
  {
    id: 'decision_wifi',
    lane: 'hardware',
    label: '4. Wi-Fi Connected?',
    sublabel: 'WiFi.status() == WL_CONNECTED',
    type: 'decision',
    icon: <WifiHigh size={16} weight="bold" />,
    description: 'Checks whether the ESP32 is currently associated with an active Wi-Fi AP and holds a valid DHCP lease.',
    codeSnippet: `if (WiFi.status() != WL_CONNECTED) {\n  connectWiFi(); // Trigger reconnect\n  return;\n}`,
  },
  {
    id: 'wifi_reconnect',
    lane: 'hardware',
    label: '4b. Reconnect Backoff',
    sublabel: 'connectWiFi() Exponential Loop',
    type: 'terminal',
    icon: <WifiSlash size={16} weight="bold" />,
    description: 'Attempts non-blocking reconnection to the SSID with exponential backoff to recover from router reboots without halting.',
    codeSnippet: `void connectWiFi() {\n  WiFi.mode(WIFI_STA);\n  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);\n  // Wait up to 10s with watchdog\n}`,
  },
  {
    id: 'wifi_radio',
    lane: 'network',
    label: '5. 2.4GHz RF Frame',
    sublabel: '802.11 b/g/n · RSSI -58 dBm',
    type: 'process',
    icon: <Broadcast size={16} weight="bold" />,
    description: 'Transmits modulated RF packets over 2.4 GHz channel to local router using WPA2-PSK (AES-CCMP) encryption.',
    codeSnippet: `HTTPClient http;\nWiFiClientSecure client;\nclient.setInsecure(); // Or CA root cert\nhttp.begin(client, INGEST_URL);`,
  },
  {
    id: 'router_nat',
    lane: 'network',
    label: '6. Router NAT & DNS',
    sublabel: 'LAN 192.168.1.142 → WAN',
    type: 'process',
    icon: <HardDrives size={16} weight="bold" />,
    description: 'Translates private IP to public WAN gateway and resolves DNS hostname for the Resursee cloud domain.',
    codeSnippet: `// Router NAT Table Entry:\n// 192.168.1.142:51234 -> 203.0.113.45:51234 -> resursee.com:443`,
  },
  {
    id: 'wan_tls',
    lane: 'network',
    label: '7. TLS 1.3 Tunnel',
    sublabel: 'TCP Port 443 · ~38ms Ping',
    type: 'process',
    icon: <LockKey size={16} weight="bold" />,
    description: 'Encrypted WAN transport pipeline protecting sensor payloads against eavesdropping and tampering.',
    codeSnippet: `// Handshake: ECDHE-RSA-AES128-GCM-SHA256\nPOST /api/iot/ingest HTTP/1.1\nHost: resursee.com\nContent-Type: application/json\nx-device-token: sk_esp32_7f9a21_9c8b1a`,
  },
  {
    id: 'api_ingest',
    lane: 'cloud',
    label: '8. Edge API Ingest',
    sublabel: 'Next.js POST /api/iot/ingest',
    type: 'process',
    icon: <CloudArrowUp size={16} weight="bold" />,
    description: 'Serverless Next.js edge route receives the incoming HTTP request and parses headers and body.',
    codeSnippet: `export async function POST(request: NextRequest) {\n  const token = request.headers.get('x-device-token') || body.deviceToken;\n  if (!checkRateLimit(token)) return NextResponse.json({ error: '429' }, { status: 429 });\n  // Process ingestion\n}`,
  },
  {
    id: 'decision_auth',
    lane: 'cloud',
    label: '9. Token & Rate Limit?',
    sublabel: 'Rate < 60/min · Valid Token',
    type: 'decision',
    icon: <ShieldCheck size={16} weight="bold" />,
    description: 'Verifies bearer device token exists and checks sliding-window token bucket to prevent denial of service.',
    codeSnippet: `if (record.count >= MAX_REQUESTS_PER_MINUTE) {\n  return false; // Triggers HTTP 429\n}`,
  },
  {
    id: 'auth_rejected',
    lane: 'cloud',
    label: '9b. Drop / Throttle',
    sublabel: 'HTTP 429 Too Many Requests',
    type: 'terminal',
    icon: <WarningCircle size={16} weight="bold" />,
    description: 'Drops unauthorized requests or returns HTTP 429 with Retry-After header when polling frequency exceeds 1/sec.',
    codeSnippet: `return NextResponse.json(\n  { error: 'Rate limit exceeded: Telemetry interval should be >= 1.5s' },\n  { status: 429 }\n);`,
  },
  {
    id: 'db_store',
    lane: 'cloud',
    label: '10. Commit Telemetry',
    sublabel: 'Tenant-Isolated Memory Store',
    type: 'process',
    icon: <HardDrives size={16} weight="bold" />,
    description: 'Commits normalized sensor readings with server-verified timestamps strictly scoped to the authenticated user ID.',
    codeSnippet: `const newTelemetry = {\n  id: crypto.randomUUID(),\n  deviceId,\n  timestamp: new Date().toISOString(),\n  temperature, humidity, soilMoisture, light\n};`,
  },
  {
    id: 'queue_actuators',
    lane: 'cloud',
    label: '11. Fetch Actuator Targets',
    sublabel: 'Retrieve Relays (Pins 26, 27, 14)',
    type: 'process',
    icon: <ToggleRight size={16} weight="bold" />,
    description: 'Checks the active actuator command queue to piggyback physical switch states back to the ESP32 in the response.',
    codeSnippet: `const currentActuators = activeActuators.get(token) || {\n  pin_2: false, pin_4: true, pin_15: false\n};`,
  },
  {
    id: 'http_response',
    lane: 'cloud',
    label: '12. HTTP 200 OK Response',
    sublabel: 'JSON with { actuatorStates }',
    type: 'process',
    icon: <CheckCircle size={16} weight="bold" />,
    description: 'Dispatches HTTP 200 OK JSON response delivering updated actuator states directly to the waiting ESP32 client.',
    codeSnippet: `return NextResponse.json({\n  success: true,\n  timestamp: new Date().toISOString(),\n  actuatorStates: currentActuators\n});`,
    payloadSnippet: `{\n  "success": true,\n  "timestamp": "2026-09-27T12:00:00.000Z",\n  "actuatorStates": {\n    "pin_2": false,\n    "pin_4": true,\n    "pin_15": false\n  }\n}`,
  },
  {
    id: 'dashboard_ui',
    lane: 'client',
    label: '13. Live Dashboard Update',
    sublabel: 'SVG Gauges & Flow Topology',
    type: 'process',
    icon: <Gauge size={16} weight="bold" />,
    description: 'React 19 updates circular dials, animates SVG connection flow particles, and appends to Recharts time-series stream.',
    codeSnippet: `setTelemetry((prev) => [...prev.slice(-29), newPoint]);\n// Triggers 60fps re-render of Gauges & Topology`,
  },
  {
    id: 'user_toggle',
    lane: 'client',
    label: '14. User Toggles Relay',
    sublabel: 'Click Water Pump in Dashboard',
    type: 'action',
    icon: <ToggleRight size={16} weight="bold" />,
    description: 'User clicks a relay switch in the web dashboard. An optimistic state update applies immediately in the UI.',
    codeSnippet: `handleToggleActuator(actuator, !actuator.state);`,
  },
  {
    id: 'put_actuator',
    lane: 'client',
    label: '15. Dispatch PUT Command',
    sublabel: 'PUT /api/iot/ingest { pin, state }',
    type: 'process',
    icon: <ArrowsLeftRight size={16} weight="bold" />,
    description: 'Client fires an asynchronous PUT request to queue the new actuator pin state in the cloud memory registry.',
    codeSnippet: `await fetch('/api/iot/ingest', {\n  method: 'PUT',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ deviceToken, pin: 26, state: true })\n});`,
  },
  {
    id: 'esp32_relay_exec',
    lane: 'hardware',
    label: '16. ESP32 Physical Relay',
    sublabel: 'digitalWrite(RELAY_PIN, HIGH)',
    type: 'action',
    icon: <Lightning size={16} weight="bold" />,
    description: 'On receiving the HTTP 200 response, ESP32 parses actuatorStates and drives GPIO 26 HIGH (+3.3V) to close the physical relay.',
    codeSnippet: `if (doc["actuatorStates"].containsKey("pin_2")) {\n  bool target = doc["actuatorStates"]["pin_2"];\n  digitalWrite(RELAY_PIN_PUMP, target ? HIGH : LOW);\n}`,
  },
];

// Tracing sequences
const UPSTREAM_TRACE: FlowchartNodeId[] = [
  'start_timer',
  'read_sensors',
  'serialize_json',
  'decision_wifi',
  'wifi_radio',
  'router_nat',
  'wan_tls',
  'api_ingest',
  'decision_auth',
  'db_store',
  'queue_actuators',
  'http_response',
  'dashboard_ui',
];

const DOWNSTREAM_TRACE: FlowchartNodeId[] = [
  'user_toggle',
  'put_actuator',
  'api_ingest',
  'queue_actuators',
  'http_response',
  'esp32_relay_exec',
];

const RECOVERY_TRACE: FlowchartNodeId[] = [
  'start_timer',
  'read_sensors',
  'serialize_json',
  'decision_wifi',
  'wifi_reconnect',
];

export default function SystemArchitectureView({
  onBackToDashboard,
  onOpenFirmware,
  deviceToken = 'sk_esp32_7f9a21_9c8b1a',
  deviceId = 'dev-usr_johnrey-gh',
}: SystemArchitectureViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<FlowchartNodeId>('api_ingest');
  const [activeTraceType, setActiveTraceType] = useState<
    'upstream' | 'downstream' | 'recovery' | null
  >(null);
  const [activeTraceStepIndex, setActiveTraceStepIndex] = useState<number>(-1);
  const [isTracing, setIsTracing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const selectedNode =
    FLOWCHART_NODES.find((n) => n.id === selectedNodeId) || FLOWCHART_NODES[0];

  // Run interactive sequence trace
  const handleStartTrace = (type: 'upstream' | 'downstream' | 'recovery') => {
    if (isTracing) return;
    setActiveTraceType(type);
    setIsTracing(true);
    setActiveTraceStepIndex(0);

    const sequence =
      type === 'upstream'
        ? UPSTREAM_TRACE
        : type === 'downstream'
          ? DOWNSTREAM_TRACE
          : RECOVERY_TRACE;

    setSelectedNodeId(sequence[0]);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < sequence.length) {
        setActiveTraceStepIndex(current);
        setSelectedNodeId(sequence[current]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsTracing(false);
          setActiveTraceStepIndex(-1);
          setActiveTraceType(null);
        }, 1500);
      }
    }, 650);
  };

  const getTraceHighlight = (nodeId: FlowchartNodeId) => {
    if (!isTracing || !activeTraceType) return false;
    const sequence =
      activeTraceType === 'upstream'
        ? UPSTREAM_TRACE
        : activeTraceType === 'downstream'
          ? DOWNSTREAM_TRACE
          : RECOVERY_TRACE;
    const nodeIndex = sequence.indexOf(nodeId);
    return nodeIndex !== -1 && nodeIndex <= activeTraceStepIndex;
  };

  const isCurrentActiveStep = (nodeId: FlowchartNodeId) => {
    if (!isTracing || !activeTraceType) return false;
    const sequence =
      activeTraceType === 'upstream'
        ? UPSTREAM_TRACE
        : activeTraceType === 'downstream'
          ? DOWNSTREAM_TRACE
          : RECOVERY_TRACE;
    return sequence[activeTraceStepIndex] === nodeId;
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* 1. Header & Live Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#121212]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
            <Graph size={20} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                ESP32 Hardware ⇄ Internet ⇄ Cloud Flowchart
              </h2>
              <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                SYSTEM BLUEPRINT
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Interactive end-to-end engineering flowchart with live execution tracing and protocol inspector.
            </p>
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
              <span>View Firmware (.ino)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Flowchart Trace Controller */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-2.5 w-2.5 rounded-full shrink-0',
              isTracing
                ? 'bg-neutral-900 dark:bg-white animate-pulse'
                : 'bg-neutral-400'
            )}
          />
          <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
            Flow Tracer:
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
            Click a path to trace packet execution through the flowchart nodes:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isTracing}
            onClick={() => handleStartTrace('upstream')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border',
              activeTraceType === 'upstream'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
            )}
          >
            <Play size={12} weight="fill" />
            <span>Trace Telemetry (Hardware → Cloud)</span>
          </button>

          <button
            type="button"
            disabled={isTracing}
            onClick={() => handleStartTrace('downstream')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border',
              activeTraceType === 'downstream'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
            )}
          >
            <ToggleRight size={14} weight="bold" />
            <span>Trace Relay Command (Cloud → Relay)</span>
          </button>

          <button
            type="button"
            disabled={isTracing}
            onClick={() => handleStartTrace('recovery')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border',
              activeTraceType === 'recovery'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
            )}
          >
            <ArrowUUpLeft size={14} weight="bold" />
            <span>Trace Wi-Fi Recovery</span>
          </button>
        </div>
      </div>

      {/* 3. The Visual Flowchart Canvas */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-[#121212] overflow-x-auto">
        <div className="min-w-[860px] space-y-6">
          {/* Swimlane Column Headers */}
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Cpu size={14} />
              <span>1. ESP32 Hardware Edge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={14} />
              <span>2. Internet &amp; Transit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CloudArrowUp size={14} />
              <span>3. Resursee Cloud Edge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge size={14} />
              <span>4. Dashboard &amp; Actuators</span>
            </div>
          </div>

          {/* FLOWCHART ROW 1: Acquisition & Ingest Kickoff */}
          <div className="grid grid-cols-4 gap-4 items-start relative">
            {/* 1. Timer Interrupt */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('start_timer')}
                className={cn(
                  'w-full rounded-full border-2 p-3 text-center transition cursor-pointer',
                  selectedNodeId === 'start_timer'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('start_timer') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-bold">
                  <Clock size={14} />
                  <span>2.5s Timer Interrupt</span>
                </div>
                <div className="text-[10px] opacity-75 font-mono">FreeRTOS Core 1 Task</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">↓ Trigger</div>
            </div>

            {/* Lane 2 empty in Row 1 */}
            <div className="h-10" />

            {/* Lane 3 empty in Row 1 */}
            <div className="h-10" />

            {/* 14. User Action in Dashboard */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('user_toggle')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'user_toggle'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('user_toggle') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <ToggleRight size={15} />
                    <span>User Toggles Relay</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    EVENT
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">Dashboard UI Click (Water Pump ON)</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">↓ Dispatch PUT</div>
            </div>
          </div>

          {/* FLOWCHART ROW 2: Sensor Sampling & Relay PUT Request */}
          <div className="grid grid-cols-4 gap-4 items-start">
            {/* 2. Read Sensors Process */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('read_sensors')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'read_sensors'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('read_sensors') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal size={15} />
                    <span>Sample Hardware Pins</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    ADC1
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">
                  DHT22 (GPIO 4) · Soil (34) · Lux (35)
                </div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">↓ Raw Values</div>
            </div>

            {/* Lane 2 empty */}
            <div className="h-10" />

            {/* Lane 3 empty */}
            <div className="h-10" />

            {/* 15. Dispatch PUT Actuator */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('put_actuator')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'put_actuator'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('put_actuator') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <ArrowsLeftRight size={15} />
                    <span>PUT /api/iot/ingest</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    ASYNC
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">{`{ pin: 26, state: true }`}</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">← Update Queue</div>
            </div>
          </div>

          {/* FLOWCHART ROW 3: Serialization & Packaging */}
          <div className="grid grid-cols-4 gap-4 items-start">
            {/* 3. Serialize JSON */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('serialize_json')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'serialize_json'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('serialize_json') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Code size={15} />
                    <span>JSON Serialization</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    BUFFER
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">ArduinoJson v7 · 180 Bytes</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">↓ Wire Payload</div>
            </div>

            <div className="h-10" />
            <div className="h-10" />
            <div className="h-10" />
          </div>

          {/* FLOWCHART ROW 4: Decision Diamond 1 (Wi-Fi Connected?) */}
          <div className="grid grid-cols-4 gap-4 items-center">
            {/* 4. Decision Diamond */}
            <div className="flex flex-col items-center relative">
              <div
                onClick={() => setSelectedNodeId('decision_wifi')}
                className={cn(
                  'w-40 h-28 rounded-2xl border-2 rotate-45 flex items-center justify-center p-2 text-center transition cursor-pointer shadow-xs',
                  selectedNodeId === 'decision_wifi'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('decision_wifi') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="-rotate-45 font-mono text-[11px] font-bold space-y-0.5">
                  <div className="flex justify-center">
                    <WifiHigh size={16} />
                  </div>
                  <div>Wi-Fi Associated?</div>
                  <div className="text-[9px] opacity-75">WL_CONNECTED</div>
                </div>
              </div>

              {/* Branch Labels */}
              <div className="w-full flex justify-between px-2 pt-3 font-mono text-[10px] font-bold text-neutral-500">
                <span>[NO] ↓</span>
                <span>[YES] →</span>
              </div>
            </div>

            {/* 5. Wi-Fi Radio Transport Node (YES Branch from Wi-Fi Diamond) */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('wifi_radio')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'wifi_radio'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('wifi_radio') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Broadcast size={15} />
                    <span>2.4 GHz RF Link</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    802.11 b/g/n
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">RSSI: -58 dBm · WPA2</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">↓ Forward Packet</div>
            </div>

            {/* Lane 3 & 4 spacer */}
            <div className="h-10" />
            <div className="h-10" />
          </div>

          {/* FLOWCHART ROW 5: Wi-Fi Recovery Branch (NO) & Router NAT (YES) */}
          <div className="grid grid-cols-4 gap-4 items-start">
            {/* 4b. Wi-Fi Reconnection Loop */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('wifi_reconnect')}
                className={cn(
                  'w-full rounded-2xl border-2 border-dashed p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'wifi_reconnect'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-400 bg-neutral-100/80 dark:border-neutral-700 dark:bg-neutral-900/60',
                  isCurrentActiveStep('wifi_reconnect') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <WifiSlash size={15} />
                    <span>connectWiFi() Loop</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    RECOVERY
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">Exponential Backoff (10s Max)</div>
              </div>
            </div>

            {/* 6. Router NAT & DNS Resolution */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('router_nat')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'router_nat'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('router_nat') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <HardDrives size={15} />
                    <span>Router NAT Gateway</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    LAN → WAN
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">IP: 192.168.1.142 · DNS Lookup</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">↓ Encrypt Uplink</div>
            </div>

            <div className="h-10" />
            <div className="h-10" />
          </div>

          {/* FLOWCHART ROW 6: TLS 1.3 WAN Transit & Cloud API Route */}
          <div className="grid grid-cols-4 gap-4 items-start">
            <div className="h-10" />

            {/* 7. TLS 1.3 WAN Transit */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('wan_tls')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'wan_tls'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('wan_tls') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <LockKey size={15} />
                    <span>WAN TLS 1.3 Tunnel</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    PORT 443
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">38ms Ping · HTTPS POST</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">→ Cloud Ingest</div>
            </div>

            {/* 8. Next.js API Route */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('api_ingest')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'api_ingest'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('api_ingest') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <CloudArrowUp size={15} />
                    <span>POST /api/iot/ingest</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    NEXT.JS
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">Header: x-device-token</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">↓ Security Check</div>
            </div>

            <div className="h-10" />
          </div>

          {/* FLOWCHART ROW 7: Decision Diamond 2 (Authentication & Rate Limiting) */}
          <div className="grid grid-cols-4 gap-4 items-center">
            <div className="h-10" />
            <div className="h-10" />

            {/* 9. Decision Diamond: Token & Rate Check */}
            <div className="flex flex-col items-center relative">
              <div
                onClick={() => setSelectedNodeId('decision_auth')}
                className={cn(
                  'w-40 h-28 rounded-2xl border-2 rotate-45 flex items-center justify-center p-2 text-center transition cursor-pointer shadow-xs',
                  selectedNodeId === 'decision_auth'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('decision_auth') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="-rotate-45 font-mono text-[11px] font-bold space-y-0.5">
                  <div className="flex justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>Valid &amp; &lt; 60/m?</div>
                  <div className="text-[9px] opacity-75">RATE LIMIT CHECK</div>
                </div>
              </div>

              {/* Branch Labels */}
              <div className="w-full flex justify-between px-2 pt-3 font-mono text-[10px] font-bold text-neutral-500">
                <span>[NO] ↓</span>
                <span>[YES] →</span>
              </div>
            </div>

            {/* 13. Client Dashboard Rendering (YES Branch Output) */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('dashboard_ui')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'dashboard_ui'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('dashboard_ui') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Gauge size={15} />
                    <span>Live Dashboard UI</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    REACT 19
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">SVG Gauges · Flow Topology</div>
              </div>
            </div>
          </div>

          {/* FLOWCHART ROW 8: Ingestion Buffer, Actuator Queuing & HTTP 200 */}
          <div className="grid grid-cols-4 gap-4 items-start">
            <div className="h-10" />
            <div className="h-10" />

            {/* 10. Database Store & Actuator Command Queue */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('db_store')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'db_store'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('db_store') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <HardDrives size={15} />
                    <span>Tenant-Isolated Ingest</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    USER STORE
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">Normalize Telemetry Point</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">↓ Fetch Actuators</div>
            </div>

            {/* 12. HTTP 200 Response Payload */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('http_response')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'http_response'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('http_response') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle size={15} />
                    <span>HTTP 200 OK Response</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    DISPATCH
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">{`{ success, actuatorStates }`}</div>
              </div>
              <div className="h-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 my-1" />
              <div className="text-[10px] text-neutral-400 font-mono">← Sync ESP32 Relay</div>
            </div>
          </div>

          {/* FLOWCHART ROW 9: Downstream Physical Relay Execution on ESP32 */}
          <div className="grid grid-cols-4 gap-4 items-start">
            {/* 16. ESP32 Physical Relay Execution (Completed Loop) */}
            <div className="flex flex-col items-center">
              <div
                onClick={() => setSelectedNodeId('esp32_relay_exec')}
                className={cn(
                  'w-full rounded-2xl border-2 p-3 transition cursor-pointer text-left',
                  selectedNodeId === 'esp32_relay_exec'
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                    : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#181818]',
                  isCurrentActiveStep('esp32_relay_exec') && 'ring-4 ring-neutral-400 dark:ring-neutral-500'
                )}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Lightning size={15} />
                    <span>GPIO Relay Execution</span>
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    GPIO 26/27/14
                  </span>
                </div>
                <div className="text-[11px] opacity-75 font-mono">digitalWrite(pin, HIGH) → Pump ON</div>
              </div>
            </div>

            <div className="h-10" />
            <div className="h-10" />
            <div className="h-10" />
          </div>
        </div>
      </div>

      {/* 4. Interactive Flowchart Node Inspector */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#121212] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shrink-0">
              {selectedNode.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {selectedNode.label}
                </h3>
                <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 uppercase">
                  {selectedNode.type}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedNode.sublabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-neutral-400">
              Lane: {selectedNode.lane.toUpperCase()}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {selectedNode.description}
        </p>

        {/* Code & Wire Payload Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                Executed Code Implementation
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedNode.codeSnippet);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                {copiedCode ? <Check size={13} weight="bold" /> : <Copy size={13} />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-[#0c0c0c] p-3 text-[11px] font-mono text-neutral-300 max-h-48 overflow-y-auto">
              <pre>{selectedNode.codeSnippet}</pre>
            </div>
          </div>

          {selectedNode.payloadSnippet ? (
            <div className="space-y-1.5">
              <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                Wire Payload Sample
              </span>
              <div className="rounded-xl border border-neutral-300 dark:border-neutral-800 bg-[#0c0c0c] p-3 text-[11px] font-mono text-neutral-300 max-h-48 overflow-y-auto">
                <pre>{selectedNode.payloadSnippet}</pre>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 flex flex-col justify-center space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <ShieldCheck size={16} />
                <span>Security &amp; Hardware Resilience</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-mono">
                This stage enforces the mandatory security directive: sliding-window rate limit checks, non-blocking watchdog timeouts, and cryptographic token validation to prevent deadlock or unauthorized manipulation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
