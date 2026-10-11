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
  Sparkle,
  PaperPlaneRight,
  Robot,
  Lightning,
  Plus,
  CaretLeft,
  CaretRight,
  Eye,
} from '@phosphor-icons/react';
import { isTauriDesktop } from '@/lib/envDetector';
import {
  tauriCheckArduinoCli,
  tauriGetArduinoCliVersion,
  tauriListSerialPorts,
  tauriCompileSketch,
  tauriUploadSketch,
  tauriStartSerialMonitor,
  tauriStopSerialMonitor,
  tauriSendSerialInput,
  tauriResetBoard,
  tauriListInstalledLibraries,
} from '@/lib/tauriBridge';
import {
  checkOllamaConnection,
  startOllamaDaemon,
  stopOllamaDaemon,
  streamOllamaChat,
  DEFAULT_OLLAMA_ENDPOINT,
} from '@/lib/ollamaClient';
import { OllamaModel, OllamaChatMessage } from '@/types/aiHub';
import { generateArduinoSketch } from '@/lib/arduinoSketchGenerator';
import { IoTDevice } from '@/types/iotCloud';
import { getInstalledCoreIds } from '@/components/iot/BoardsManager';
import { computeLineDiff, DiffResult } from '@/lib/diffHelper';

export interface Esp32CodeStudioProps {
  device: IoTDevice;
  serverOrigin?: string;
}

export const ALL_SUPPORTED_BOARDS = [
  { fqbn: 'esp32:esp32:esp32', label: 'ESP32 Dev Module (WROOM-32)', coreId: 'esp32:esp32' },
  { fqbn: 'esp32:esp32:esp32s3:CDCOnBoot=cdc', label: 'ESP32-S3 Dev Module (Native USB CDC)', coreId: 'esp32:esp32' },
  { fqbn: 'esp32:esp32:esp32c3:CDCOnBoot=cdc', label: 'ESP32-C3 RISC-V (Native USB CDC)', coreId: 'esp32:esp32' },
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
  // --- Editor State with LocalStorage Persistence ---
  const [code, setCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`resursee_firmware_state_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.code) return parsed.code;
        }
      } catch {}
    }
    return generateArduinoSketch(device, serverOrigin);
  });
  const [template, setTemplate] = useState<'default' | 'minimal' | 'sleep' | 'diagnostic'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`resursee_firmware_state_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.template) return parsed.template;
        }
      } catch {}
    }
    return 'default';
  });
  const [boardFqbn, setBoardFqbn] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`resursee_firmware_state_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.boardFqbn) return parsed.boardFqbn;
        }
        const globalFqbn = localStorage.getItem('resursee_firmware_last_fqbn');
        if (globalFqbn) return globalFqbn;
      } catch {}
    }
    return 'esp32:esp32:esp32';
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [wifiSsid, setWifiSsid] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`resursee_firmware_state_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.wifiSsid) return parsed.wifiSsid;
        }
        const globalSsid = localStorage.getItem('resursee_firmware_last_ssid');
        if (globalSsid) return globalSsid;
      } catch {}
    }
    return 'YOUR_WIFI_SSID';
  });
  const [wifiPassword, setWifiPassword] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`resursee_firmware_state_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.wifiPassword) return parsed.wifiPassword;
        }
        const globalPass = localStorage.getItem('resursee_firmware_last_password');
        if (globalPass) return globalPass;
      } catch {}
    }
    return 'YOUR_WIFI_PASSWORD';
  });

  // --- Tauri Desktop & Arduino CLI State ---
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [cliDetected, setCliDetected] = useState<boolean | null>(null);
  const [cliVersion, setCliVersion] = useState<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`resursee_firmware_state_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.selectedPort) return parsed.selectedPort;
        }
        const globalPort = localStorage.getItem('resursee_firmware_last_port');
        if (globalPort) return globalPort;
      } catch {}
    }
    return '';
  });
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
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [baudRate, setBaudRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`resursee_firmware_state_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.baudRate) return parsed.baudRate;
        }
        const globalBaud = localStorage.getItem('resursee_firmware_last_baud');
        if (globalBaud) return Number(globalBaud);
      } catch {}
    }
    return 115200;
  });
  const [serialLogs, setSerialLogs] = useState<Array<{ id: number; time: string; text: string }>>([]);
  const [serialInput, setSerialInput] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // --- Antigravity-Style Review Changes State ---
  const [proposedCode, setProposedCode] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [reviewMode, setReviewMode] = useState<boolean>(false);

  const handleStartReview = (newCodeSnippet: string) => {
    setProposedCode(newCodeSnippet);
    const diff = computeLineDiff(code, newCodeSnippet);
    setDiffResult(diff);
    setReviewMode(true);
  };

  const handleAcceptChanges = () => {
    if (proposedCode) {
      setCode(proposedCode);
    }
    setReviewMode(false);
    setProposedCode(null);
    setDiffResult(null);
  };

  const handleDenyChanges = () => {
    setReviewMode(false);
    setProposedCode(null);
    setDiffResult(null);
  };

  // --- Local AI Assistant & Saved Conversations State ---
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'checking' | 'offline'>('checking');
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5-coder:7b');
  const [isStartingOllama, setIsStartingOllama] = useState<boolean>(false);
  const [isStoppingOllama, setIsStoppingOllama] = useState<boolean>(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState<boolean>(false);
  const [installedArduinoLibs, setInstalledArduinoLibs] = useState<any[]>([]);

  // Saved Conversations
  const [savedConversations, setSavedConversations] = useState<Array<{
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: OllamaChatMessage[];
  }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`resursee_firmware_ai_chats_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [
      {
        id: 'default',
        title: 'Firmware Assistant',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            role: 'assistant',
            content: `👋 Hello! I am your local AI hardware & firmware assistant. I have direct context of this **${device.name}** board, installed libraries, and the C++ sketch in the editor. Ask me to add sensors, implement relays, optimize loops, or fix compiler errors.`,
          },
        ],
      },
    ];
  });

  const [activeChatId, setActiveChatId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const lastId = localStorage.getItem(`resursee_firmware_ai_active_chat_${device.id}`);
        if (lastId) return lastId;
      } catch {}
    }
    return 'default';
  });

  // Auto-persist saved conversations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`resursee_firmware_ai_chats_${device.id}`, JSON.stringify(savedConversations));
        localStorage.setItem(`resursee_firmware_ai_active_chat_${device.id}`, activeChatId);
      } catch {}
    }
  }, [savedConversations, activeChatId, device.id]);

  const activeChat =
    savedConversations.find((c) => c.id === activeChatId) ||
    savedConversations[0] || {
      id: 'default',
      title: 'Firmware Assistant',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
  const activeChatIndex = Math.max(0, savedConversations.findIndex((c) => c.id === activeChat.id));
  const chatMessages = activeChat.messages;

  const [chatInput, setChatInput] = useState<string>('');
  const [isStreamingAi, setIsStreamingAi] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load installed libraries via Tauri
  const loadInstalledLibraries = async () => {
    try {
      const libs = await tauriListInstalledLibraries();
      if (Array.isArray(libs)) {
        setInstalledArduinoLibs(libs);
      }
    } catch {}
  };

  // Probe Ollama connection
  const probeOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 2000);
      if (res.status) {
        setOllamaStatus('connected');
        setInstalledModels(res.models || []);
        if (res.models && res.models.length > 0) {
          if (!selectedModel || !res.models.some((m) => m.name === selectedModel)) {
            const preferred = res.models.find((m) => /coder|code|qwen/i.test(m.name));
            setSelectedModel(preferred ? preferred.name : res.models[0].name);
          }
        }
      } else {
        setOllamaStatus('offline');
      }
    } catch {
      setOllamaStatus('offline');
    }
  };

  const handleStartOllama = async () => {
    setIsStartingOllama(true);
    try {
      await startOllamaDaemon();
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const check = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 800);
        if (check.status || attempts > 10) {
          clearInterval(interval);
          setIsStartingOllama(false);
          setOllamaStatus(check.status ? 'connected' : 'offline');
          if (check.status) {
            setInstalledModels(check.models || []);
            if (check.models.length > 0) {
              const preferred = check.models.find((m) => /coder|code|qwen/i.test(m.name));
              setSelectedModel(preferred ? preferred.name : check.models[0].name);
            }
          }
        }
      }, 1000);
    } catch {
      setIsStartingOllama(false);
      probeOllama();
    }
  };

  const handleStopOllama = async () => {
    setIsStoppingOllama(true);
    try {
      await stopOllamaDaemon();
      setOllamaStatus('offline');
    } catch {} finally {
      setIsStoppingOllama(false);
      setTimeout(probeOllama, 800);
    }
  };

  useEffect(() => {
    probeOllama();
    loadInstalledLibraries();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollTop = chatBottomRef.current.scrollHeight;
    }
  }, [chatMessages, isStreamingAi]);

  // Conversation Management Helpers
  const handleNewConversation = () => {
    const newId = `chat_${Date.now()}`;
    const newChat = {
      id: newId,
      title: `Chat ${savedConversations.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          role: 'assistant' as const,
          content: `👋 New conversation started. Ask me anything about your **${device.name}** firmware, pinouts, or C++ code.`,
        },
      ],
    };
    setSavedConversations((prev) => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleCycleConversation = (direction: 'prev' | 'next') => {
    if (savedConversations.length <= 1) return;
    const currentIdx = savedConversations.findIndex((c) => c.id === activeChat.id);
    const nextIdx =
      direction === 'next'
        ? (currentIdx + 1) % savedConversations.length
        : (currentIdx - 1 + savedConversations.length) % savedConversations.length;
    setActiveChatId(savedConversations[nextIdx].id);
  };

  const handleDeleteConversation = (idToDelete: string) => {
    if (savedConversations.length <= 1) {
      const resetChat = {
        id: `chat_${Date.now()}`,
        title: 'Firmware Assistant',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            role: 'assistant' as const,
            content: `👋 Chat reset. Ask me anything about your **${device.name}** firmware, pinouts, or C++ code.`,
          },
        ],
      };
      setSavedConversations([resetChat]);
      setActiveChatId(resetChat.id);
      return;
    }
    const remaining = savedConversations.filter((c) => c.id !== idToDelete);
    setSavedConversations(remaining);
    if (activeChatId === idToDelete) {
      setActiveChatId(remaining[0].id);
    }
  };

  const handleSendAiMessage = async (overridePrompt?: string) => {
    const text = (overridePrompt || chatInput).trim();
    if (!text || isStreamingAi) return;

    if (ollamaStatus !== 'connected') {
      alert('Local Ollama daemon is currently offline. Click "Start Local AI" first in the toolbar.');
      return;
    }

    const currentChatId = activeChat.id;
    const userMsg: OllamaChatMessage = { role: 'user', content: text };
    const updatedMessages = [...activeChat.messages, userMsg];

    // Auto-derive a concise topic title for the conversation from the first user inquiry
    let newTitle = activeChat.title;
    if (activeChat.title === 'Firmware Assistant' || activeChat.title.startsWith('Chat ')) {
      newTitle = text.slice(0, 24) + (text.length > 24 ? '...' : '');
    }

    setSavedConversations((prev) =>
      prev.map((c) =>
        c.id === currentChatId
          ? { ...c, title: newTitle, updatedAt: Date.now(), messages: updatedMessages }
          : c
      )
    );

    if (!overridePrompt) setChatInput('');
    setIsStreamingAi(true);

    // Identify target microcontroller architecture and board configuration
    const activeBoard = ALL_SUPPORTED_BOARDS.find((b) => b.fqbn === boardFqbn) || {
      label: 'ESP32 Dev Module',
      fqbn: boardFqbn,
      coreId: 'esp32:esp32',
    };
    const isEsp32 = boardFqbn.includes('esp32');
    const isEsp8266 = boardFqbn.includes('esp8266');
    const isAvr = boardFqbn.includes('avr') || boardFqbn.includes('uno');
    const isS3 = boardFqbn.includes('esp32s3') || boardFqbn.includes('esp32c3');

    // Extract list of locally installed Arduino libraries
    const libNames = installedArduinoLibs
      .map((l) => l?.library?.name || l?.name || (typeof l === 'string' ? l : ''))
      .filter(Boolean);
    const libContext =
      libNames.length > 0
        ? `Installed Arduino Libraries on this Machine:\n${libNames.map((n) => `- ${n}`).join('\n')}`
        : `Installed Arduino Libraries:\n- ArduinoJson (v7.4.3)\n- ArduinoHttpClient (v0.6.2)\n- Arduino_ESP32_OTA\n- Arduino_DebugUtils`;

    const systemPrompt: OllamaChatMessage = {
      role: 'system',
      content: `You are an expert embedded C++/Arduino firmware developer assistant inside Resursee IoT Cloud.
Context & Hardware Configuration:
- Target Board: ${activeBoard.label} (FQBN: ${boardFqbn})
- Architecture: ${isEsp32 ? 'ESP32 (Xtensa 32-bit)' : isEsp8266 ? 'ESP8266 (Tensilica 32-bit)' : isAvr ? 'Arduino AVR (ATmega328P 8-bit)' : 'RP2040'}
- Device Name: ${device.name} (ID: ${device.id})
- Cloud Ingest Endpoint: ${serverOrigin}/api/iot/ingest
- Device Token: ${device.deviceToken}
- Configured WiFi SSID: ${wifiSsid || 'YOUR_WIFI_SSID'}

${libContext}

MANDATORY HARDWARE & LIBRARY RULES:
1. TARGET NETWORKING HEADERS:
${isEsp32 ? '   - Networking: MUST use #include <WiFi.h> and #include <HTTPClient.h>. NEVER use <ESP8266WiFi.h> or <Ethernet.h>.' : ''}
${isEsp8266 ? '   - Networking: MUST use #include <ESP8266WiFi.h> and #include <ESP8266HTTPClient.h>. NEVER use <WiFi.h>.' : ''}
${isS3 ? '   - USB CDC Serial: Initialize Serial with Serial.begin(115200); unsigned long _s=millis(); while(!Serial && millis()-_s<3000);' : ''}
2. ARDUINOJSON VERSION 7 STRICT SYNTAX:
   - ArduinoJson 7.x is installed. StaticJsonDocument and DynamicJsonDocument were REMOVED in v7 and will fail compilation.
   - ALWAYS use "JsonDocument doc;" for constructing and deserializing JSON.
   - Example: JsonDocument doc; doc["key"] = value; serializeJson(doc, requestBody);
3. THIRD-PARTY LIBRARIES:
   - DO NOT hallucinate or #include third-party libraries not listed in the installed libraries above. Only use installed libraries or standard Arduino core headers.
4. Active Sketch in Editor:
\`\`\`cpp
${code}
\`\`\`
${consoleStatus === 'error' && consoleLogs ? `\nRecent Compiler Output / Errors:\n${consoleLogs}\n` : ''}

Output instructions:
- Provide clean, working, compilable C++ code wrapped in \`\`\`cpp.
- Keep explanations brief and embedded-developer focused.`,
    };

    const messagesToSend = [systemPrompt, ...updatedMessages.slice(-8)];

    let currentResponse = '';
    // Append placeholder assistant message to active chat
    setSavedConversations((prev) =>
      prev.map((c) =>
        c.id === currentChatId
          ? {
              ...c,
              messages: [...updatedMessages, { role: 'assistant', content: '' }],
            }
          : c
      )
    );

    try {
      await streamOllamaChat(
        DEFAULT_OLLAMA_ENDPOINT,
        {
          model: selectedModel,
          messages: messagesToSend,
          temperature: 0.2,
        },
        (_fullText, newChunk) => {
          currentResponse += newChunk;
          setSavedConversations((prev) =>
            prev.map((c) => {
              if (c.id !== currentChatId) return c;
              const msgs = [...c.messages];
              if (msgs.length > 0) {
                msgs[msgs.length - 1] = {
                  role: 'assistant',
                  content: currentResponse,
                };
              }
              return { ...c, messages: msgs };
            })
          );
        }
      );
    } catch (err: any) {
      setSavedConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentChatId) return c;
          const msgs = [...c.messages.slice(0, -1)];
          msgs.push({
            role: 'assistant',
            content: `⚠️ Error from Local Ollama (${err?.message || err}). Ensure Ollama is running and model "${selectedModel}" is downloaded.`,
          });
          return { ...c, messages: msgs };
        })
      );
    } finally {
      setIsStreamingAi(false);
    }
  };

  const extractCodeBlocks = (markdown: string): string[] => {
    const regex = /```(?:cpp|c\+\+|c|arduino)?\s*([\s\S]*?)```/gi;
    const blocks: string[] = [];
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      if (match[1].trim()) {
        blocks.push(match[1].trim());
      }
    }
    return blocks;
  };

  // Auto-persist sketch code and configs whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stateToSave = {
        code,
        template,
        boardFqbn,
        selectedPort,
        baudRate,
        wifiSsid,
        wifiPassword,
      };
      localStorage.setItem(`resursee_firmware_state_${device.id}`, JSON.stringify(stateToSave));
      if (selectedPort) localStorage.setItem('resursee_firmware_last_port', selectedPort);
      if (boardFqbn) localStorage.setItem('resursee_firmware_last_fqbn', boardFqbn);
      if (baudRate) localStorage.setItem('resursee_firmware_last_baud', String(baudRate));
      if (wifiSsid && wifiSsid !== 'YOUR_WIFI_SSID') localStorage.setItem('resursee_firmware_last_ssid', wifiSsid);
      if (wifiPassword && wifiPassword !== 'YOUR_WIFI_PASSWORD') localStorage.setItem('resursee_firmware_last_password', wifiPassword);
    } catch {}
  }, [code, template, boardFqbn, selectedPort, baudRate, wifiSsid, wifiPassword, device.id]);

  // Handle device switching: load newly selected device's saved state
  const lastDeviceIdRef = useRef<string>(device.id);
  useEffect(() => {
    if (lastDeviceIdRef.current !== device.id) {
      lastDeviceIdRef.current = device.id;
      try {
        const raw = localStorage.getItem(`resursee_firmware_state_${device.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.code) setCode(parsed.code);
          if (parsed.template) setTemplate(parsed.template);
          if (parsed.boardFqbn) setBoardFqbn(parsed.boardFqbn);
          if (parsed.selectedPort) setSelectedPort(parsed.selectedPort);
          if (parsed.baudRate) setBaudRate(parsed.baudRate);
          if (parsed.wifiSsid) setWifiSsid(parsed.wifiSsid);
          if (parsed.wifiPassword) setWifiPassword(parsed.wifiPassword);
          return;
        }
      } catch {}
      setCode(generateArduinoSketch(device, serverOrigin));
      setTemplate('default');
    }
  }, [device.id, serverOrigin]);

  // Web Serial refs
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const serialOutputRef = useRef<HTMLDivElement>(null);
  const consoleOutputRef = useRef<HTMLPreElement>(null);

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
    setSerialSupported(hasSerial || isDesktop);

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

  // Auto-scroll compiler terminal output
  useEffect(() => {
    if (consoleOutputRef.current) {
      consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  const refreshSerialPorts = async () => {
    const ports = await tauriListSerialPorts();
    setAvailablePorts(ports);
    if (ports.length > 0) {
      const preferred = ports.find((p) => /usb|usbmodem|usbserial|wch|slab|ttyACM|ttyUSB|COM/i.test(p));
      if (!selectedPort || /bluetooth|debug/i.test(selectedPort) || !ports.includes(selectedPort)) {
        setSelectedPort(preferred || ports[0]);
      }
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

      JsonDocument doc;
      doc["deviceToken"] = DEVICE_TOKEN;
      doc["rssi"] = WiFi.RSSI();
      doc["ipAddress"] = WiFi.localIP().toString();

      String payload;
      serializeJson(doc, payload);
      int code = http.POST(payload);
      Serial.printf("[Cloud] Telemetry POST %d | RSSI: %d dBm\\n", code, WiFi.RSSI());

      if (code == 200) {
        String resp = http.getString();
        JsonDocument rDoc;
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

    JsonDocument doc;
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

    const result = await tauriCompileSketch(code, boardFqbn, (line) => {
      setConsoleLogs((prev) => `${prev}${line}\n`);
    });
    setIsCompiling(false);
    if (result.success) {
      setConsoleStatus('success');
      setConsoleLogs((prev) => `${prev}\n✓ Compilation successful! Ready to upload.`);
    } else {
      setConsoleStatus('error');
      setConsoleLogs((prev) => `${prev}\n✗ ${result.output}`);
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

    const result = await tauriUploadSketch(selectedPort, code, boardFqbn, (line) => {
      setConsoleLogs((prev) => `${prev}${line}\n`);
    });
    setIsUploading(false);
    if (result.success) {
      setConsoleStatus('success');
      setConsoleLogs((prev) => `${prev}\n✓ Upload complete! ESP32 reset and running new firmware.`);
    } else {
      setConsoleStatus('error');
      setConsoleLogs((prev) => `${prev}\n✗ ${result.output}`);
    }
  };


  // --- Serial Monitor Handlers ---
  const appendSerialLog = (line: string) => {
    const time = new Date().toLocaleTimeString();
    setSerialLogs((prev) => [...prev.slice(-300), { id: Date.now() + Math.random(), time, text: line }]);
  };

  const handleResetBoard = async () => {
    if (!isDesktop) {
      alert('Hardware board reset is supported in Resursee Desktop via native USB DTR/RTS pulse.');
      return;
    }
    if (!selectedPort) {
      alert('Please select a hardware serial port first in the top bar.');
      return;
    }
    const wasConnected = serialConnected;
    setIsResetting(true);
    appendSerialLog('--- Pulsing hardware RST / esptool run ---');
    try {
      const res = await tauriResetBoard(selectedPort);
      if (res.success) {
        appendSerialLog('✓ Board reset signal sent. Booting firmware...');
      } else {
        appendSerialLog(`✗ Reset warning: ${res.output}`);
      }
    } catch (err: any) {
      appendSerialLog(`✗ Reset error: ${err?.message || err}`);
    } finally {
      setIsResetting(false);
      if (wasConnected) {
        setTimeout(() => {
          handleConnectSerial(false);
        }, 500);
      }
    }
  };

  const handleConnectSerial = async (pulseReset = true) => {
    // If running in Resursee Desktop, stream serial monitor natively
    if (isDesktop) {
      if (!selectedPort) {
        alert('Please select a hardware serial port first in the top bar.');
        return;
      }
      try {
        if (pulseReset) {
          appendSerialLog(`--- Requesting hardware reset for boot capture (Arduino IDE mode) ---`);
          try {
            await tauriResetBoard(selectedPort);
          } catch {}
        }
        appendSerialLog(`--- Native Serial Port Opened (${selectedPort} @ ${baudRate} baud) ---`);
        setSerialConnected(true);

        let lineBuffer = '';
        let flushTimeout: any = null;

        await tauriStartSerialMonitor(selectedPort, baudRate, (chunk) => {
          lineBuffer += chunk;
          if (lineBuffer.includes('\n')) {
            const parts = lineBuffer.split('\n');
            lineBuffer = parts.pop() || '';
            for (const l of parts) {
              appendSerialLog(l.replace(/\r/g, ''));
            }
          }
          clearTimeout(flushTimeout);
          flushTimeout = setTimeout(() => {
            if (lineBuffer) {
              appendSerialLog(lineBuffer.replace(/\r/g, ''));
              lineBuffer = '';
            }
          }, 80);
        });
      } catch (err: any) {
        appendSerialLog(`✗ Error opening serial port: ${err?.message || err}`);
        setSerialConnected(false);
      }
      return;
    }

    // Otherwise in web browser, use Web Serial API
    if (!serialSupported) {
      alert('Web Serial API is not supported in this browser. Please use Google Chrome, Edge, Brave, or Resursee Desktop.');
      return;
    }

    try {
      const nav = navigator as any;
      const port = await nav.serial.requestPort();
      await port.open({ baudRate });

      // Assert DTR for ESP32-S3/C3 native USB CDC
      try {
        await port.setSignals({ dataTerminalReady: true, requestToSend: false });
      } catch {
        // Ignored if device doesn't support setSignals
      }

      portRef.current = port;
      setSerialConnected(true);

      appendSerialLog(`--- Serial Port Opened (${baudRate} baud) ---`);

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
                appendSerialLog(l.replace(/\r/g, ''));
              }
            }
          }
        } catch {
          // Closed or disconnected
        } finally {
          appendSerialLog('--- Serial Port Disconnected ---');
          setSerialConnected(false);
        }
      })();
    } catch (err: any) {
      console.warn('Web Serial connection error:', err);
    }
  };

  const handleDisconnectSerial = async () => {
    if (isDesktop) {
      try {
        await tauriStopSerialMonitor();
      } catch {}
      setSerialConnected(false);
      return;
    }

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
    const cmd = serialInput.trim();
    if (!cmd) return;

    const time = new Date().toLocaleTimeString();
    setSerialLogs((prev) => [
      ...prev.slice(-300),
      { id: Date.now() + Math.random(), time, text: `> ${cmd}` },
    ]);
    setSerialInput('');

    if (isDesktop) {
      try {
        await tauriSendSerialInput(cmd);
      } catch (err: any) {
        appendSerialLog(`✗ Error sending serial command: ${err?.message || err}`);
      }
      return;
    }

    if (!portRef.current || !portRef.current.writable) return;
    try {
      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(portRef.current.writable).catch(() => {});
      const writer = textEncoder.writable.getWriter();
      await writer.write(cmd + '\n');
      writer.releaseLock();
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
            <div className="flex items-center gap-1.5 flex-wrap">
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

              {/* Start/Stop Local AI Daemon */}
              <button
                type="button"
                onClick={ollamaStatus === 'connected' ? handleStopOllama : handleStartOllama}
                disabled={isStartingOllama || isStoppingOllama}
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer disabled:opacity-50"
                title={ollamaStatus === 'connected' ? 'Stop local Ollama background daemon' : 'Start local Ollama background daemon'}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    ollamaStatus === 'connected'
                      ? 'bg-neutral-900 dark:bg-white'
                      : isStartingOllama || isStoppingOllama || ollamaStatus === 'checking'
                      ? 'bg-neutral-400 animate-pulse'
                      : 'bg-neutral-400'
                  }`}
                />
                <span>
                  {isStartingOllama
                    ? 'Starting AI...'
                    : isStoppingOllama
                    ? 'Stopping AI...'
                    : ollamaStatus === 'connected'
                    ? 'Stop Local AI'
                    : 'Start Local AI'}
                </span>
              </button>

              {/* Model Selector Dropdown */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="h-6 max-w-[150px] truncate rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 text-[11px] font-mono text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
                title="Select active local LLM model"
              >
                {installedModels.length > 0 ? (
                  installedModels.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))
                ) : (
                  <option value="qwen2.5-coder:7b">qwen2.5-coder:7b</option>
                )}
              </select>

              <button
                type="button"
                onClick={probeOllama}
                className="rounded-full p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                title="Refresh local Ollama models"
              >
                <ArrowsClockwise size={12} className={ollamaStatus === 'checking' ? 'animate-spin' : ''} />
              </button>
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

        {/* PRIMARY ACTIONS: VERIFY, UPLOAD, SERIAL, LOCAL AI COPILOT, DOWNLOAD */}
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

          {/* Toggle Local AI Copilot */}
          <button
            type="button"
            onClick={() => setAiCopilotOpen(!aiCopilotOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              aiCopilotOpen
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Toggle Local AI Coding Copilot"
          >
            <Sparkle size={13} weight="bold" />
            <span>Local AI Copilot</span>
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
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
              Sketch Template
            </label>
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset sketch to default generated code for this device?')) {
                  handleTemplateChange('default');
                }
              }}
              className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer underline"
              title="Reset code to freshly generated template"
            >
              Reset Default
            </button>
          </div>
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
              {availablePorts.map((p) => {
                const isUsb = /usb|usbmodem|usbserial|wch|slab|ttyACM|ttyUSB/i.test(p);
                return (
                  <option key={p} value={p}>
                    {p} {isUsb ? ' • (USB Hardware)' : ''}
                  </option>
                );
              })}
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

      {/* EDITOR & LOCAL AI WORKSPACE (SPLIT LAYOUT) */}
      <div className={`grid gap-4 items-start ${aiCopilotOpen ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Left Column: Code Editor / Diff Review */}
        <div className={`rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#0d0d0d] overflow-hidden text-neutral-200 font-mono text-xs shadow-sm flex flex-col ${aiCopilotOpen ? 'xl:col-span-7 2xl:col-span-8' : 'w-full'}`}>
          {/* Editor Tab Bar: Normal vs Review Mode */}
          {reviewMode && diffResult ? (
            <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-[#161616] text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-200">
                  Review Proposed Changes
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] font-mono text-neutral-300 border border-neutral-700">
                  <span className="text-white font-bold">+{diffResult.additions}</span>
                  <span className="text-neutral-500">/</span>
                  <span className="text-neutral-400 font-bold">-{diffResult.deletions}</span>
                  <span className="text-neutral-400">lines</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptChanges}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-neutral-950 dark:bg-white dark:text-neutral-950 hover:opacity-90 font-semibold text-xs transition cursor-pointer"
                  title="Accept all changes and apply to sketch editor"
                >
                  <Check size={13} weight="bold" />
                  <span>Accept Changes</span>
                </button>
                <button
                  type="button"
                  onClick={handleDenyChanges}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs transition cursor-pointer"
                  title="Deny changes and keep current sketch intact"
                >
                  <X size={13} weight="bold" />
                  <span>Deny Changes</span>
                </button>
              </div>
            </div>
          ) : (
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
          )}

          {/* Editor Body: Diff View or Code Textarea */}
          {reviewMode && diffResult ? (
            <div className="max-h-[540px] min-h-[420px] overflow-auto font-mono text-[11px] leading-relaxed select-text bg-[#0a0a0a]">
              {diffResult.lines.map((line, lIdx) => {
                if (line.type === 'unchanged') {
                  return (
                    <div key={lIdx} className="flex hover:bg-neutral-900/40">
                      <div className="w-12 select-none py-0.5 pr-2 pl-2 text-right text-neutral-600 bg-[#111111] border-r border-neutral-800/80 font-mono">
                        {line.oldLineNumber}
                      </div>
                      <div className="w-6 select-none py-0.5 text-center text-neutral-600 font-mono"> </div>
                      <div className="flex-1 py-0.5 px-2 text-neutral-400 whitespace-pre font-mono">
                        {line.content}
                      </div>
                    </div>
                  );
                }
                if (line.type === 'removed') {
                  return (
                    <div key={lIdx} className="flex bg-neutral-900/90 border-l-2 border-neutral-400 hover:bg-neutral-900">
                      <div className="w-12 select-none py-0.5 pr-2 pl-2 text-right text-neutral-500 bg-[#151515] border-r border-neutral-800 font-mono">
                        {line.oldLineNumber}
                      </div>
                      <div className="w-6 select-none py-0.5 text-center text-neutral-400 font-bold font-mono">-</div>
                      <div className="flex-1 py-0.5 px-2 text-neutral-300 line-through opacity-80 whitespace-pre font-mono">
                        {line.content}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={lIdx} className="flex bg-[#161d18] border-l-2 border-neutral-200 hover:bg-[#1a241c]">
                    <div className="w-12 select-none py-0.5 pr-2 pl-2 text-right text-neutral-400 bg-[#131a15] border-r border-neutral-800 font-mono">
                      {line.newLineNumber}
                    </div>
                    <div className="w-6 select-none py-0.5 text-center text-neutral-200 font-bold font-mono">+</div>
                    <div className="flex-1 py-0.5 px-2 text-white font-semibold whitespace-pre font-mono">
                      {line.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex max-h-[540px] min-h-[420px] overflow-hidden">
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
          )}

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
                  {consoleStatus === 'error' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAiCopilotOpen(true);
                        handleSendAiMessage(
                          `The sketch failed to compile with the following compiler error:\n\`\`\`\n${consoleLogs.slice(-1500)}\n\`\`\`\nPlease analyze this error, explain what caused it, and provide the complete fixed Arduino C++ code for my ${device.name}.`
                        );
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-[10px] font-semibold border border-neutral-700 cursor-pointer"
                      title="Send error log to Local AI for automatic debugging"
                    >
                      <Sparkle size={11} weight="bold" />
                      <span>Fix with Local AI</span>
                    </button>
                  )}
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
              <pre ref={consoleOutputRef} className="p-3 text-[11px] text-neutral-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {consoleLogs || 'No compiler messages.'}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Local AI Copilot Chatbox */}
        {aiCopilotOpen && (
          <div className="xl:col-span-5 2xl:col-span-4 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-[#0d0d0d] overflow-hidden text-neutral-200 flex flex-col shadow-sm max-h-[620px] min-h-[520px]">
            {/* Header: Responsive, No Robot Icon, Conversation Cycler */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800 bg-[#141414] text-[11px] shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-neutral-200 truncate">Local AI Copilot</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-[9px] font-mono text-neutral-300 border border-neutral-700 shrink-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${ollamaStatus === 'connected' ? 'bg-neutral-300' : 'bg-neutral-600'}`} />
                  {selectedModel.split(':')[0]}
                </span>
              </div>

              {/* Conversation Cycler & Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCycleConversation('prev')}
                  disabled={savedConversations.length <= 1}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Previous saved conversation"
                >
                  <CaretLeft size={12} weight="bold" />
                </button>

                <span className="text-[10px] text-neutral-400 font-mono select-none px-0.5">
                  {activeChatIndex + 1}/{savedConversations.length}
                </span>

                <button
                  type="button"
                  onClick={() => handleCycleConversation('next')}
                  disabled={savedConversations.length <= 1}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Next saved conversation"
                >
                  <CaretRight size={12} weight="bold" />
                </button>

                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] font-medium border border-neutral-700 cursor-pointer transition ml-1"
                  title="Start a new chat conversation"
                >
                  <Plus size={11} weight="bold" />
                  <span>New</span>
                </button>

                {savedConversations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(activeChat.id)}
                    className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 cursor-pointer transition"
                    title="Delete this conversation"
                  >
                    <Trash size={12} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const cleared = {
                      ...activeChat,
                      title: 'Firmware Assistant',
                      messages: [
                        {
                          role: 'assistant' as const,
                          content: `👋 Chat cleared. Ask me anything about your **${device.name}** firmware, pinouts, or C++ code.`,
                        },
                      ],
                    };
                    setSavedConversations((prev) =>
                      prev.map((c) => (c.id === activeChat.id ? cleared : c))
                    );
                  }}
                  className="text-neutral-500 hover:text-neutral-300 cursor-pointer text-[10px] px-1"
                  title="Clear messages in active conversation"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => setAiCopilotOpen(false)}
                  className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 cursor-pointer transition"
                  title="Close Local AI panel"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Quick Suggestion Chips: Fixed Vertical Collapse & Padding */}
            <div className="px-3 py-2 border-b border-neutral-800 bg-[#101010] flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0 min-h-[36px]">
              <span className="text-neutral-500 shrink-0 font-medium">Quick:</span>
              {[
                { label: 'Deep Sleep', prompt: 'Add low power deep sleep logic to this ESP32 sketch between sensor reads.' },
                { label: 'WiFi Reconnect', prompt: 'Add robust auto-reconnection handling for WiFi and HTTP telemetry.' },
                { label: 'Optimize Memory', prompt: 'Review this sketch and optimize heap allocation and string handling.' },
                { label: 'Explain Code', prompt: 'Explain how this sketch connects to Resursee IoT and sends telemetry.' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={isStreamingAi}
                  onClick={() => handleSendAiMessage(chip.prompt)}
                  className="shrink-0 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition cursor-pointer text-[10px]"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div
              ref={chatBottomRef}
              className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs bg-[#0b0b0b]"
            >
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const codeBlocks = !isUser ? extractCodeBlocks(msg.content) : [];

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-neutral-500">
                      <span>{isUser ? 'You' : `Local AI (${selectedModel.split(':')[0]})`}</span>
                    </div>

                    <div
                      className={`max-w-[95%] rounded-xl p-3 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                          : 'bg-[#151515] border border-neutral-800 text-neutral-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed break-words">
                        {msg.content}
                      </div>

                      {/* Code Block Action Triggers */}
                      {codeBlocks.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-neutral-800 space-y-2">
                          {codeBlocks.map((codeSnippet, bIdx) => (
                            <div
                              key={bIdx}
                              className="rounded-lg bg-[#0d0d0d] border border-neutral-800 p-2 font-mono text-[10px]"
                            >
                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800/80 text-[10px] text-neutral-400">
                                <span>C++ / Arduino ({codeSnippet.split('\n').length} lines)</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartReview(codeSnippet)}
                                    className="px-2 py-0.5 rounded bg-white text-neutral-950 dark:bg-white dark:text-neutral-950 font-semibold text-[9px] transition cursor-pointer flex items-center gap-1 hover:opacity-90"
                                    title="Review proposed changes before applying to editor (Antigravity mode)"
                                  >
                                    <Eye size={10} weight="bold" />
                                    <span>Review Changes</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCode((prev) => prev + '\n\n' + codeSnippet);
                                    }}
                                    className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px] font-semibold transition cursor-pointer"
                                    title="Append this snippet to the bottom of editor"
                                  >
                                    Append
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(codeSnippet);
                                    }}
                                    className="p-1 hover:text-white cursor-pointer"
                                    title="Copy code snippet"
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>
                              </div>
                              <pre className="text-[10px] text-neutral-300 overflow-x-auto max-h-36 whitespace-pre">
                                {codeSnippet.slice(0, 300)}{codeSnippet.length > 300 ? '...' : ''}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isStreamingAi && (
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 pl-1 pt-1 font-sans">
                  <ArrowsClockwise size={12} className="animate-spin text-neutral-300" />
                  <span>Local AI is generating firmware code...</span>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-2.5 border-t border-neutral-800 bg-[#121212]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAiMessage();
                    }
                  }}
                  disabled={isStreamingAi}
                  placeholder={
                    ollamaStatus === 'connected'
                      ? 'Ask AI to write code, add sensors, or edit sketch...'
                      : 'Ollama is offline. Click "Start Local AI" above.'
                  }
                  className="w-full rounded-xl border border-neutral-700 bg-[#181818] pl-3 pr-9 py-2 text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-neutral-500 transition font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleSendAiMessage()}
                  disabled={!chatInput.trim() || isStreamingAi || ollamaStatus !== 'connected'}
                  className="absolute right-1.5 rounded-lg p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Send message to Local AI"
                >
                  <PaperPlaneRight size={13} weight="bold" />
                </button>
              </div>
              <div className="flex items-center justify-between pt-1 px-1 text-[9px] text-neutral-500 font-sans">
                <span>Model: {selectedModel}</span>
                <span>Context: Active Sketch &amp; {device.name}</span>
              </div>
            </div>
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
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs text-neutral-900 dark:text-white outline-none cursor-pointer disabled:opacity-50"
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
                  onClick={() => handleConnectSerial(true)}
                  className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1 text-xs font-semibold hover:opacity-90 cursor-pointer"
                >
                  Connect Serial Port
                </button>
              )}

              {/* Reset Board button */}
              {isDesktop && (
                <button
                  type="button"
                  onClick={handleResetBoard}
                  disabled={isResetting || !selectedPort}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                  title="Send hardware RTS reset pulse to restart ESP32 and capture setup() logs"
                >
                  <ArrowsClockwise size={12} className={isResetting ? 'animate-spin' : ''} />
                  <span>{isResetting ? 'Resetting...' : 'Reset Board'}</span>
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
              <div className="text-neutral-500 text-xs py-10 text-center space-y-1.5">
                <div>
                  {serialConnected
                    ? 'Serial monitor connected & listening.'
                    : 'Serial monitor idle. Click "Connect Serial Port" to inspect real-time ESP32 Serial.println() logs.'}
                </div>
                {serialConnected && (
                  <div className="text-[11px] text-neutral-400">
                    If your ESP32 only prints during <code>setup()</code> on boot, click <strong>Reset Board</strong> above (or press the physical RST button on the board) to view boot output.
                  </div>
                )}
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
