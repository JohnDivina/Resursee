'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarBody, SidebarLink, Links } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme/ThemeToggle';
import {
  IconMessageChatbot,
  IconCpu,
  IconEye,
  IconDatabase,
  IconSettings,
  IconArrowLeft,
  IconTerminal2,
  IconDownload,
  IconCheck,
  IconCopy,
  IconSearch,
  IconFileText,
  IconUpload,
  IconSparkles,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconAlertCircle,
  IconX,
  IconHistory,
  IconPlus,
  IconTrash,
  IconFileExport,
  IconAdjustmentsHorizontal,
  IconInfoCircle,
  IconAlertTriangle,
  IconLayersLinked,
  IconDisc,
} from '@tabler/icons-react';
import {
  checkOllamaConnection,
  getRunningModels,
  pullOllamaModel,
  deleteOllamaModel,
  showOllamaModel,
  streamOllamaChat,
  DEFAULT_OLLAMA_ENDPOINT,
} from '@/lib/ollamaClient';
import { OllamaModel, OllamaConnectionStatus, AIHubSession } from '@/types/aiHub';

// --- Types ---
type ActiveTab = 'chat' | 'models' | 'vision' | 'rag' | 'settings';

interface ModelItem {
  id: string;
  name: string;
  category: 'compact' | 'reasoning' | 'code' | 'vision';
  parameters: string;
  size: string;
  vram: string;
  description: string;
  isDownloaded?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeSnippet?: string;
  timestamp: string;
}

const CATALOG_MODELS: ModelItem[] = [
  {
    id: 'llama3.2:1b',
    name: 'Llama 3.2 (1B)',
    category: 'compact',
    parameters: '1.24B',
    size: '1.3 GB',
    vram: '2 GB',
    description: 'Meta’s ultra-compact model optimized for edge devices, instant responses, and low memory usage.',
    isDownloaded: true,
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 (3B)',
    category: 'compact',
    parameters: '3.21B',
    size: '2.0 GB',
    vram: '4 GB',
    description: 'High-efficiency instruction model with strong tool calling and multilingual capabilities.',
    isDownloaded: false,
  },
  {
    id: 'deepseek-r1:1.5b',
    name: 'DeepSeek R1 (1.5B)',
    category: 'reasoning',
    parameters: '1.58B',
    size: '1.1 GB',
    vram: '2.5 GB',
    description: 'Distilled reasoning powerhouse with step-by-step chain-of-thought verification for math and logic.',
    isDownloaded: true,
  },
  {
    id: 'qwen2.5-coder:1.5b',
    name: 'Qwen 2.5 Coder (1.5B)',
    category: 'code',
    parameters: '1.54B',
    size: '1.2 GB',
    vram: '2.5 GB',
    description: 'Alibaba’s specialized code assistant with syntax mastery across TypeScript, Python, C++, and Rust.',
    isDownloaded: false,
  },
  {
    id: 'llava:7b',
    name: 'LLaVA (7B Vision)',
    category: 'vision',
    parameters: '7.0B',
    size: '4.7 GB',
    vram: '8 GB',
    description: 'Multimodal vision transformer capable of visual OCR, foliar inspection, and document diagram analysis.',
    isDownloaded: false,
  },
  {
    id: 'phi3.5:latest',
    name: 'Phi-3.5 Mini (3.8B)',
    category: 'reasoning',
    parameters: '3.82B',
    size: '2.2 GB',
    vram: '4 GB',
    description: 'Microsoft’s high-density reasoning model capable of 128k context windows on compact hardware.',
    isDownloaded: false,
  },
];

// Helper to format inline code & bold text within markdown lines
function parseInlineFormatting(text: string) {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const tokens = text.split(regex);

  return tokens.map((token, i) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={i}
          className="rounded-md bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--color-ink)] border border-neutral-300 dark:border-neutral-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-bold text-[var(--color-ink)]">
          {token.slice(2, -2)}
        </strong>
      );
    }
    return token;
  });
}

// Formatted Message component for parsing markdown code blocks and inline styles
function FormattedMessage({
  content,
  messageId,
  copiedKey,
  onCopy,
}: {
  content: string;
  messageId: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)(?:```|$)/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.substring(lastIndex, match.index);
      if (textChunk) parts.push({ type: 'text', content: textChunk });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      content: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const textChunk = content.substring(lastIndex);
    if (textChunk) parts.push({ type: 'text', content: textChunk });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return (
    <div className="space-y-3">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          const codeKey = `code-${messageId}-${idx}`;
          return (
            <div
              key={idx}
              className="rounded-xl border border-[var(--color-rule-strong)] bg-neutral-950 text-neutral-100 p-3 font-mono text-[11px] overflow-x-auto relative my-2 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[10px] text-neutral-400">
                <span className="font-bold uppercase tracking-wider text-neutral-300">
                  {part.language || 'code'}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(part.content, codeKey)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer bg-neutral-900 hover:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-800 text-[10px]"
                >
                  {copiedKey === codeKey ? (
                    <>
                      <IconCheck size={11} className="text-white" />
                      <span className="font-semibold text-white">Copied</span>
                    </>
                  ) : (
                    <>
                      <IconCopy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto leading-relaxed whitespace-pre font-mono">
                {part.content}
              </pre>
            </div>
          );
        }

        return (
          <div key={idx} className="space-y-1.5">
            {part.content.split('\n').map((line, lineIdx) =>
              line.trim() === '' ? (
                <div key={lineIdx} className="h-1.5" />
              ) : (
                <p key={lineIdx} className="leading-relaxed">
                  {parseInlineFormatting(line)}
                </p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AIHubPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2:1b');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Ollama Bridge State (Phase 1)
  const [endpoint, setEndpoint] = useState<string>(DEFAULT_OLLAMA_ENDPOINT);
  const [connectionStatus, setConnectionStatus] = useState<OllamaConnectionStatus>('checking');
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [runningModels, setRunningModels] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  // Dynamic Inference Parameters (Phase 2)
  const [temperature, setTemperature] = useState<number>(0.7);
  const [numCtx, setNumCtx] = useState<number>(4096);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are a private, offline intelligence engine integrated into Resursee. Provide concise, factual, and direct answers without unnecessary filler.'
  );

  // Chat State & Sessions (Phase 2)
  const DEFAULT_WELCOME: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content:
      'Welcome to **Resursee Local AI Hub**. All inference and embeddings run 100% locally on your machine via the local Ollama daemon (`http://localhost:11434`) with zero cloud data egress.\n\nSelect a model or try a sample inquiry below to begin exploring.',
    timestamp: 'Just now',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME]);
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Session Persistence & Modals (Phase 2)
  const [sessions, setSessions] = useState<AIHubSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('default-session');
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [isParametersModalOpen, setIsParametersModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Model Library Management State (Phase 3)
  const [modelCategory, setModelCategory] = useState<string>('all');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [customPullTag, setCustomPullTag] = useState<string>('');
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [inspectingModel, setInspectingModel] = useState<string | null>(null);
  const [inspectData, setInspectData] = useState<any | null>(null);
  const [isLoadingInspect, setIsLoadingInspect] = useState<boolean>(false);
  const pullAbortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll messages anchor
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Load Sessions from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('resursee_ai_hub_sessions');
      if (raw) {
        const parsed: AIHubSession[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          const active = parsed[0];
          setCurrentSessionId(active.id);
          setMessages(active.messages as ChatMessage[]);
          if (active.model) setSelectedModel(active.model);
          if (active.temperature !== undefined) setTemperature(active.temperature);
          if (active.systemPrompt) setSystemPrompt(active.systemPrompt);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse sessions:', e);
    }

    const initialSession: AIHubSession = {
      id: `sess-${Date.now()}`,
      title: 'New Conversation',
      model: selectedModel,
      temperature: 0.7,
      systemPrompt,
      messages: [DEFAULT_WELCOME],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
    setMessages(initialSession.messages as ChatMessage[]);
  }, []);

  // Save active session to localStorage
  const saveCurrentSession = (updatedMessages: ChatMessage[], newTitle?: string) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: newTitle || s.title,
            model: selectedModel,
            temperature,
            systemPrompt,
            messages: updatedMessages,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('resursee_ai_hub_sessions', JSON.stringify(next));
      }
      return next;
    });
  };

  // Session Handlers
  const handleNewChat = () => {
    if (isGenerating) handleStopGeneration();
    const newSession: AIHubSession = {
      id: `sess-${Date.now()}`,
      title: 'New Conversation',
      model: selectedModel,
      temperature,
      systemPrompt,
      messages: [
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `New session initialized. Running on local engine **${selectedModel}** with zero data egress.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages as ChatMessage[]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resursee_ai_hub_sessions', JSON.stringify(updated));
    }
  };

  const handleSelectSession = (sessionId: string) => {
    if (isGenerating) handleStopGeneration();
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setCurrentSessionId(target.id);
      setMessages(target.messages as ChatMessage[]);
      if (target.model) setSelectedModel(target.model);
      if (target.temperature !== undefined) setTemperature(target.temperature);
      if (target.systemPrompt) setSystemPrompt(target.systemPrompt);
      setIsSessionDrawerOpen(false);
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (remaining.length === 0) {
      handleNewChat();
    } else {
      setSessions(remaining);
      if (sessionId === currentSessionId) {
        setCurrentSessionId(remaining[0].id);
        setMessages(remaining[0].messages as ChatMessage[]);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('resursee_ai_hub_sessions', JSON.stringify(remaining));
      }
    }
  };

  const handleClearChat = () => {
    if (isGenerating) handleStopGeneration();
    const cleared: ChatMessage[] = [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. Ready for your inquiries on local engine **${selectedModel}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(cleared);
    saveCurrentSession(cleared);
  };

  const handleExportChat = () => {
    const session = sessions.find((s) => s.id === currentSessionId);
    const title = session?.title || 'Resursee AI Hub Conversation';
    let md = `# ${title}\n\n`;
    md += `- **Date**: ${new Date().toLocaleString()}\n`;
    md += `- **Model**: \`${selectedModel}\`\n`;
    md += `- **Daemon Endpoint**: \`${endpoint}\`\n`;
    md += `- **Temperature**: \`${temperature.toFixed(2)}\`\n`;
    md += `- **Data Sovereignty**: 100% Local Inference via Ollama\n\n---\n\n`;

    messages.forEach((m) => {
      const roleName = m.role === 'user' ? 'User' : `Assistant (${selectedModel})`;
      md += `### ${roleName} [${m.timestamp}]\n\n${m.content}\n\n`;
      if (m.codeSnippet) {
        md += `\`\`\`\n${m.codeSnippet}\n\`\`\`\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resursee-chat-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Connection Bridge Check
  const refreshConnection = async (targetEndpoint: string = endpoint) => {
    setIsCheckingConnection(true);
    setConnectionStatus('checking');
    try {
      const result = await checkOllamaConnection(targetEndpoint, 2500);
      if (result.status) {
        setConnectionStatus('connected');
        setInstalledModels(result.models);
        setConnectionError(null);

        // Check running models in VRAM
        const running = await getRunningModels(targetEndpoint);
        setRunningModels(running);

        // If current model not installed, switch to first installed model if available
        if (result.models.length > 0) {
          const hasSelected = result.models.some(
            (m) => m.name === selectedModel || m.name.startsWith(selectedModel.split(':')[0])
          );
          if (!hasSelected) {
            setSelectedModel(result.models[0].name);
          }
        }
      } else {
        setConnectionStatus('offline');
        setInstalledModels([]);
        setRunningModels([]);
        setConnectionError(result.error || 'Daemon unreachable');
      }
    } catch (err: any) {
      setConnectionStatus('offline');
      setInstalledModels([]);
      setRunningModels([]);
      setConnectionError(err.message || 'Connection failed');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    const savedEndpoint = typeof window !== 'undefined' ? localStorage.getItem('resursee_ollama_endpoint') : null;
    const activeEp = savedEndpoint || DEFAULT_OLLAMA_ENDPOINT;
    setEndpoint(activeEp);
    refreshConnection(activeEp);
  }, []);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Live Chat Generation (Phase 2 with Real Multi-Turn History, Streaming & Abort)
  const handleSendMessage = async () => {
    if (!promptInput.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Auto title session from first prompt if still default
    let updatedTitle: string | undefined;
    const curSess = sessions.find((s) => s.id === currentSessionId);
    if (curSess && curSess.title === 'New Conversation') {
      updatedTitle = userMsg.content.slice(0, 36) + (userMsg.content.length > 36 ? '...' : '');
    }

    saveCurrentSession(newMessages, updatedTitle);
    const inquiry = promptInput.trim();
    setPromptInput('');
    setIsGenerating(true);

    if (connectionStatus === 'connected') {
      const assistantId = `reply-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const withAssistant = [...newMessages, assistantMsg];
      setMessages(withAssistant);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const ollamaHistory = [
          { role: 'system' as const, content: systemPrompt },
          ...newMessages
            .filter((m) => !m.id.startsWith('welcome'))
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
        ];

        const fullOutput = await streamOllamaChat(
          endpoint,
          {
            model: selectedModel,
            messages: ollamaHistory,
            temperature,
            num_ctx: numCtx,
          },
          (fullText) => {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantId ? { ...msg, content: fullText } : msg))
            );
          },
          controller.signal
        );

        const finalized = withAssistant.map((msg) =>
          msg.id === assistantId ? { ...msg, content: fullOutput } : msg
        );
        saveCurrentSession(finalized, updatedTitle);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setMessages((prev) => {
            saveCurrentSession(prev, updatedTitle);
            return prev;
          });
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: `⚠️ Failed to stream from Ollama (${err.message}). Ensure model "${selectedModel}" is pulled locally.`,
                  }
                : msg
            )
          );
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    } else {
      // Offline fallback simulation
      setTimeout(() => {
        let replyContent = '';
        let code = '';

        if (inquiry.toLowerCase().includes('esp32') || inquiry.toLowerCase().includes('iot')) {
          replyContent = `Here is a lightweight FreeRTOS sensor telemetry task for the ESP32 connecting to Resursee's IoT Cloud ingestion API:\n\n\`\`\`cpp\n#include <WiFi.h>\n#include <HTTPClient.h>\n\nvoid telemetryTask(void *pvParameters) {\n  for(;;) {\n    float temperature = readDHT22();\n    if (WiFi.status() == WL_CONNECTED) {\n      HTTPClient http;\n      http.begin("http://localhost:3000/api/iot/ingest");\n      http.addHeader("Content-Type", "application/json");\n      http.POST("{\\"device_id\\":\\"esp32-node\\",\\"temp\\":" + String(temperature) + "}");\n      http.end();\n    }\n    vTaskDelay(pdMS_TO_TICKS(5000));\n  }\n}\n\`\`\``;
        } else if (inquiry.toLowerCase().includes('quant') || inquiry.toLowerCase().includes('gguf')) {
          replyContent = `**Quantization Comparison: Q4_K_M vs Q8_0**\n\n- **Q4_K_M (4-bit)**: Compresses weights down to ~4.5 bits/weight. Ideal for consumer laptops (fits in 8GB–16GB RAM) with minimal perplexity degradation (< 0.15 PPL loss).\n- **Q8_0 (8-bit)**: Near-lossless precision matching original FP16 checkpoints, but requires double the VRAM.\n\nFor local execution on edge hardware, **Q4_K_M** delivers the optimal speed-to-accuracy ratio.`;
        } else {
          replyContent = `Processed query via local **${selectedModel}** engine.\n\n*Running in demo simulation mode*. Connect local Ollama at \`${endpoint}\` to stream live tokens from GPU/CPU weights.`;
        }

        const assistantMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          codeSnippet: code || undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const updated = [...newMessages, assistantMsg];
        setMessages(updated);
        saveCurrentSession(updated, updatedTitle);
        setIsGenerating(false);
      }, 700);
    }
  };

  // Cancel Active Model Pull (Phase 3)
  const handleCancelPull = () => {
    if (pullAbortControllerRef.current) {
      pullAbortControllerRef.current.abort();
      pullAbortControllerRef.current = null;
    }
    setDownloadingModelId(null);
    setDownloadProgress(0);
    setDownloadStatus('');
  };

  // Live Model Pull with Real Daemon Stream (Phase 3)
  const handlePullModel = async (modelId: string) => {
    const cleanId = modelId.trim();
    if (!cleanId || downloadingModelId) return;
    setDownloadingModelId(cleanId);
    setDownloadProgress(0);
    setDownloadStatus('Connecting to Ollama registry...');

    if (connectionStatus === 'connected') {
      const controller = new AbortController();
      pullAbortControllerRef.current = controller;

      try {
        await pullOllamaModel(
          endpoint,
          cleanId,
          (progress) => {
            if (progress.status) {
              setDownloadStatus(progress.status);
            }
            if (progress.percent !== undefined) {
              setDownloadProgress(progress.percent);
            }
          },
          controller.signal
        );
        setDownloadStatus('Pull completed successfully!');
        await refreshConnection();
        setCustomPullTag('');
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Cancelled by user
        } else {
          alert(`Failed to pull model "${cleanId}": ${err.message}`);
        }
      } finally {
        setDownloadingModelId(null);
        setDownloadProgress(0);
        setDownloadStatus('');
        pullAbortControllerRef.current = null;
      }
    } else {
      // Offline fallback simulation
      const interval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setDownloadingModelId(null);
            setDownloadStatus('');
            return 100;
          }
          setDownloadStatus(`Simulating layer download (${prev + 20}%)...`);
          return prev + 20;
        });
      }, 300);
    }
  };

  // Delete Local Model from Disk (Phase 3)
  const handleDeleteModel = async () => {
    if (!modelToDelete) return;
    setIsDeleting(true);
    try {
      if (connectionStatus === 'connected') {
        await deleteOllamaModel(endpoint, modelToDelete);
        await refreshConnection();
      }
      setModelToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete model: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Inspect Model Architecture & Details (Phase 3)
  const handleInspectModel = async (modelId: string) => {
    setInspectingModel(modelId);
    setIsLoadingInspect(true);
    setInspectData(null);

    if (connectionStatus === 'connected') {
      try {
        const data = await showOllamaModel(endpoint, modelId);
        setInspectData(data);
      } catch (err: any) {
        setInspectData({ error: err.message || 'Model details not available until pulled.' });
      } finally {
        setIsLoadingInspect(false);
      }
    } else {
      // Offline fallback inspect
      const cat = CATALOG_MODELS.find((c) => c.id === modelId);
      if (cat) {
        setInspectData({
          details: {
            format: 'gguf',
            family: cat.category,
            parameter_size: cat.parameters,
            quantization_level: 'Q4_K_M',
          },
          modelfile: `# Ollama Modelfile for ${cat.name}\nFROM ${cat.id}\nPARAMETER temperature 0.7\nPARAMETER stop "<|im_end|>"`,
        });
      }
      setIsLoadingInspect(false);
    }
  };

  // Merge installed models with catalog (Phase 3)
  const allDisplayModels = React.useMemo(() => {
    const list: ModelItem[] = [...CATALOG_MODELS];

    installedModels.forEach((im) => {
      const exists = list.some(
        (cm) => cm.id === im.name || im.name.startsWith(cm.id.split(':')[0])
      );
      if (!exists) {
        list.push({
          id: im.name,
          name: im.name,
          category: im.details?.family === 'vision' ? 'vision' : 'compact',
          parameters: im.details?.parameter_size || 'Custom',
          size: `${(im.size / (1024 * 1024 * 1024)).toFixed(1)} GB`,
          vram: `${((im.size / (1024 * 1024 * 1024)) * 1.4).toFixed(1)} GB`,
          description: `Custom model pulled locally via Ollama daemon (${im.details?.quantization_level || 'GGUF'}).`,
        });
      }
    });

    return list;
  }, [installedModels]);

  const totalDiskBytes = installedModels.reduce((acc, m) => acc + (m.size || 0), 0);
  const totalDiskGB = (totalDiskBytes / (1024 * 1024 * 1024)).toFixed(2);

  // Navigation Links for Aceternity Sidebar
  const sidebarLinks: Links[] = [
    {
      label: 'Chat & Inference',
      onClick: () => setActiveTab('chat'),
      icon: <IconMessageChatbot size={18} className="shrink-0" />,
      isActive: activeTab === 'chat',
    },
    {
      label: 'Model Library',
      onClick: () => setActiveTab('models'),
      icon: <IconCpu size={18} className="shrink-0" />,
      isActive: activeTab === 'models',
      badge: '8',
    },
    {
      label: 'Vision & OCR',
      onClick: () => setActiveTab('vision'),
      icon: <IconEye size={18} className="shrink-0" />,
      isActive: activeTab === 'vision',
      badge: 'NEW',
    },
    {
      label: 'RAG & Knowledge',
      onClick: () => setActiveTab('rag'),
      icon: <IconDatabase size={18} className="shrink-0" />,
      isActive: activeTab === 'rag',
    },
    {
      label: 'Engine & Settings',
      onClick: () => setActiveTab('settings'),
      icon: <IconSettings size={18} className="shrink-0" />,
      isActive: activeTab === 'settings',
    },
  ];

  // Mobile Brand Header
  const mobileBrand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-xs">
        <IconSparkles size={16} stroke={2} />
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-xs text-[var(--color-ink)] leading-none">Resursee AI Hub</span>
        <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">Local Ollama Studio</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-[var(--color-paper)] text-[var(--color-ink)] font-sans antialiased">
      {/* 🧭 Aceternity Collapsible Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody brand={mobileBrand} className="justify-between gap-6">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Header Brand */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-bold select-none text-base">
                <IconSparkles size={18} stroke={2} />
              </div>
              <motion.div
                animate={{
                  display: sidebarOpen ? 'flex' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="flex flex-col truncate"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-[var(--color-ink)]">AI Hub Studio</span>
                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                    Local
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-[var(--color-ink-muted)]">
                  Ollama & WebLLM Engine
                </span>
              </motion.div>
            </div>

            {/* Sidebar Navigation Links */}
            <div className="mt-6 flex flex-col gap-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Sidebar Footer: Engine Status & Back to Resursee */}
          <div className="border-t border-[var(--color-rule-subtle)] pt-3 mt-auto space-y-2">
            {/* Ollama Status Pill */}
            <div
              onClick={() => {
                if (connectionStatus === 'offline') {
                  setIsSetupModalOpen(true);
                } else {
                  refreshConnection();
                }
              }}
              className="group flex items-center justify-between p-2 rounded-xl bg-[var(--color-paper-card)] border border-[var(--color-rule-subtle)] hover:border-[var(--color-rule-strong)] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    connectionStatus === 'connected'
                      ? 'bg-neutral-900 dark:bg-white'
                      : connectionStatus === 'checking'
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-neutral-400'
                  )}
                />
                <motion.span
                  animate={{
                    display: sidebarOpen ? 'inline-block' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="text-xs font-semibold text-[var(--color-ink)] truncate"
                >
                  {connectionStatus === 'connected'
                    ? `Ollama (${installedModels.length} models)`
                    : connectionStatus === 'checking'
                    ? 'Connecting...'
                    : 'Ollama Standby'}
                </motion.span>
              </div>
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="text-[10px] font-mono text-[var(--color-ink-muted)] group-hover:underline"
              >
                {connectionStatus === 'connected' ? 'Refresh' : 'Guide'}
              </motion.span>
            </div>

            {/* Return to Resursee */}
            <SidebarLink
              link={{
                label: 'Back to Resursee',
                href: '/#apps',
                icon: <IconArrowLeft size={16} className="shrink-0 text-[var(--color-ink-muted)]" />,
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* 🖥️ Main Studio Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--color-paper)]">
        {/* Top Studio Action Bar */}
        <header className="h-14 shrink-0 px-4 sm:px-6 border-b border-[var(--color-rule-subtle)] flex items-center justify-between gap-3 bg-[var(--color-paper-card)]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[var(--color-ink)] truncate">
              {activeTab === 'chat' && 'Chat & Inference Studio'}
              {activeTab === 'models' && 'Model Library & Downloader'}
              {activeTab === 'vision' && 'Vision & OCR Inspector'}
              {activeTab === 'rag' && 'RAG & Knowledge Documents'}
              {activeTab === 'settings' && 'Engine & Host Settings'}
            </h1>

            {/* Active Model Pill */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
              <span>{selectedModel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Model Selector Dropdown (combining local installed + catalog) */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 pr-8 text-xs font-mono font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] focus:outline-hidden cursor-pointer"
              >
                {installedModels.length > 0 && (
                  <optgroup label="Local Installed Models">
                    {installedModels.map((im) => (
                      <option key={im.name} value={im.name}>
                        {im.name} ({(im.size / (1024 * 1024 * 1024)).toFixed(1)} GB) • Local
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Catalog Models">
                  {CATALOG_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.size})
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[10px]">
                ▼
              </div>
            </div>

            {/* How to Run Locally Button */}
            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 shadow-2xs transition-all cursor-pointer"
            >
              <IconTerminal2 size={15} />
              <span>How to Run</span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Studio View Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {/* VIEW 1: CHAT & INFERENCE */}
          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto h-full flex flex-col justify-between gap-4">
              {/* Chat Sub-Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--color-rule-subtle)] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsSessionDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <IconHistory size={14} className="shrink-0" />
                    <span>Sessions ({sessions.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <IconPlus size={14} className="shrink-0" />
                    <span className="hidden sm:inline">New Chat</span>
                  </button>

                  <span className="text-xs font-mono text-[var(--color-ink-muted)] truncate max-w-[140px] sm:max-w-[220px]">
                    {sessions.find((s) => s.id === currentSessionId)?.title || 'New Conversation'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsParametersModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                    title="Inference Parameters (Temperature, Context Length, System Prompt)"
                  >
                    <IconAdjustmentsHorizontal size={14} />
                    <span className="hidden sm:inline">Parameters</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportChat}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                    title="Export conversation to Markdown (.md)"
                  >
                    <IconFileExport size={14} />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-1.5 text-xs text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                    title="Reset current conversation"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col gap-1.5 max-w-[90%] sm:max-w-[82%]',
                      msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    )}
                  >
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-ink-muted)]">
                      <span className="font-bold uppercase">{msg.role === 'user' ? 'You' : selectedModel}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={cn(
                        'rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium'
                          : 'bg-[var(--color-paper-card)] border border-[var(--color-rule-subtle)] text-[var(--color-ink)] shadow-2xs'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <FormattedMessage
                          content={msg.content}
                          messageId={msg.id}
                          copiedKey={copiedKey}
                          onCopy={handleCopy}
                        />
                      )}

                      {/* Fallback code snippet if present */}
                      {msg.codeSnippet && !msg.content.includes('```') && (
                        <div className="mt-3 rounded-xl border border-[var(--color-rule-strong)] bg-neutral-950 text-neutral-100 p-3 font-mono text-[11px] overflow-x-auto relative group">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[10px] text-neutral-400">
                            <span>code</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.codeSnippet!, `code-${msg.id}`)}
                              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedKey === `code-${msg.id}` ? (
                                <>
                                  <IconCheck size={12} className="text-white" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <IconCopy size={12} />
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre>{msg.codeSnippet}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-muted)] p-3 rounded-xl bg-[var(--color-paper-card)] border border-[var(--color-rule-subtle)] w-max animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                    <span>Streaming local inference from {selectedModel}...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Starter Suggestions */}
              {messages.length <= 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                  {[
                    'Explain Quantization (Q4_K_M vs Q8_0) in GGUF',
                    'Write an ESP32 FreeRTOS telemetry task in C++',
                    'Audit Python script for concurrency deadlocks',
                    'Analyze foliar leaf blight symptoms',
                  ].map((starter, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPromptInput(starter)}
                      className="p-2.5 rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] hover:bg-[var(--color-paper-muted)] hover:border-[var(--color-rule-strong)] text-left text-xs font-medium text-[var(--color-ink)] transition-all cursor-pointer shadow-2xs"
                    >
                      💡 {starter}
                    </button>
                  ))}
                </div>
              )}

              {/* Floating Bottom Input Bar */}
              <div className="relative rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-2 shadow-lg">
                <textarea
                  rows={2}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${selectedModel} anything (Shift + Enter for multiline)...`}
                  className="w-full resize-none bg-transparent px-3 py-1.5 text-xs sm:text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                />

                <div className="flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsParametersModalOpen(true)}
                      className="rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold cursor-pointer transition-colors"
                      title="Adjust Temperature"
                    >
                      Temp: {temperature.toFixed(2)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsParametersModalOpen(true)}
                      className="hidden sm:inline rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold cursor-pointer transition-colors"
                      title="Adjust Context Tokens"
                    >
                      Ctx: {numCtx}
                    </button>
                  </div>

                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      <IconPlayerStop size={13} fill="currentColor" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!promptInput.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <span>Send</span>
                      <IconPlayerPlay size={13} fill="currentColor" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MODEL LIBRARY & DOWNLOADER (Phase 3) */}
          {activeTab === 'models' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Strip & Live Machine Telemetry */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Model Catalog & Disk Manager</h2>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    Download model weights into your local Ollama storage, inspect GGUF tensor layers, or delete models to free disk space.
                  </p>
                </div>

                {/* Storage & VRAM Summary Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                    <IconDisc size={14} className="shrink-0" />
                    <span>{installedModels.length} Installed ({totalDiskGB} GB)</span>
                  </span>
                  {runningModels.length > 0 && (
                    <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping shrink-0" />
                      <span>VRAM: {runningModels[0]}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 📥 Custom Model Pull Input Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 p-3 rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] shadow-xs">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink)] shrink-0 px-1">
                  <IconDownload size={15} />
                  <span className="font-bold">Pull Custom Model:</span>
                </div>
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={customPullTag}
                    onChange={(e) => setCustomPullTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePullModel(customPullTag);
                    }}
                    placeholder="Enter any Ollama tag e.g. mistral:latest, deepseek-coder-v2:16b, starcoder2:3b, llama3.1:8b..."
                    className="w-full rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handlePullModel(customPullTag)}
                  disabled={!customPullTag.trim() || !!downloadingModelId}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                >
                  <IconDownload size={13} />
                  <span>Pull Tag</span>
                </button>
              </div>

              {/* Filter Strip & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'All Models' },
                    { id: 'compact', label: 'Fast & Compact' },
                    { id: 'reasoning', label: 'Reasoning & Math' },
                    { id: 'code', label: 'Code & Systems' },
                    { id: 'vision', label: 'Vision & Multimodal' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setModelCategory(cat.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                        modelCategory === cat.id
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search models..."
                    className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] pl-8 pr-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Models Grid (Dynamic Catalog + Local Installed) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allDisplayModels
                  .filter((m) => {
                    if (modelCategory !== 'all' && m.category !== modelCategory) return false;
                    if (
                      modelSearch &&
                      !m.name.toLowerCase().includes(modelSearch.toLowerCase()) &&
                      !m.id.toLowerCase().includes(modelSearch.toLowerCase())
                    )
                      return false;
                    return true;
                  })
                  .map((model) => {
                    const isInstalled = installedModels.some(
                      (im) => im.name === model.id || im.name.startsWith(model.id.split(':')[0])
                    );
                    const installedData = installedModels.find(
                      (im) => im.name === model.id || im.name.startsWith(model.id.split(':')[0])
                    );
                    const isLoadedInVram = runningModels.some(
                      (rm) => rm === model.id || rm.startsWith(model.id.split(':')[0])
                    );
                    const isPulling = downloadingModelId === model.id;

                    return (
                      <div
                        key={model.id}
                        className={cn(
                          'flex flex-col justify-between rounded-2xl border bg-[var(--color-paper-card)] p-5 shadow-2xs transition-all space-y-4',
                          isLoadedInVram
                            ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/10'
                            : 'border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-sm font-extrabold text-[var(--color-ink)] truncate">{model.name}</h3>
                                {isLoadedInVram && (
                                  <span className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 font-mono text-[9px] font-bold shrink-0">
                                    IN VRAM
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10.5px] text-[var(--color-ink-muted)] block truncate">{model.id}</span>
                            </div>

                            {isInstalled ? (
                              <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold flex items-center gap-1 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                                Installed
                              </span>
                            ) : (
                              <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold shrink-0">
                                Available
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-snug">
                            {model.description}
                          </p>

                          {/* Specs Row */}
                          <div className="flex items-center gap-2 mt-4 text-[11px] font-mono text-[var(--color-ink-muted)] flex-wrap">
                            <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                              {installedData ? `${(installedData.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : model.size}
                            </span>
                            <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                              VRAM: {model.vram}
                            </span>
                            <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                              {installedData?.details?.parameter_size || model.parameters}
                            </span>
                            {installedData?.details?.quantization_level && (
                              <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5 font-bold">
                                {installedData.details.quantization_level}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[var(--color-rule-subtle)] space-y-2">
                          {/* Terminal Run Pill */}
                          <div className="flex items-center justify-between rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2.5 py-1.5 text-[10.5px] font-mono text-[var(--color-ink)]">
                            <span className="truncate">ollama run {model.id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`ollama run ${model.id}`, `term-${model.id}`)}
                              className="hover:text-[var(--color-primary)] transition-colors cursor-pointer shrink-0 ml-2"
                            >
                              {copiedKey === `term-${model.id}` ? (
                                <IconCheck size={13} className="text-neutral-900 dark:text-white" />
                              ) : (
                                <IconCopy size={13} />
                              )}
                            </button>
                          </div>

                          {/* Download / Active Actions */}
                          {isPulling ? (
                            <div className="space-y-1.5 p-2 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)]">
                              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink)]">
                                <span className="truncate max-w-[170px]">{downloadStatus || 'Pulling layers...'}</span>
                                <span className="font-bold">{downloadProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                <div
                                  className="h-full bg-neutral-900 dark:bg-white transition-all duration-200"
                                  style={{ width: `${downloadProgress}%` }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleCancelPull}
                                className="w-full text-center text-[10px] font-mono text-[var(--color-ink-muted)] hover:text-red-500 transition-colors cursor-pointer pt-0.5"
                              >
                                Cancel Download
                              </button>
                            </div>
                          ) : isInstalled ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setActiveTab('chat');
                                }}
                                className="flex-1 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <IconPlayerPlay size={13} fill="currentColor" />
                                <span>Launch</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInspectModel(model.id)}
                                className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                                title="Inspect Model Architecture (GGUF tensors, Modelfile)"
                              >
                                <IconInfoCircle size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setModelToDelete(model.id)}
                                className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-1.5 text-xs text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer"
                                title="Delete from Local Disk"
                              >
                                <IconTrash size={15} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handlePullModel(model.id)}
                                className="flex-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] py-1.5 text-xs font-bold text-[var(--color-ink)] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <IconDownload size={13} />
                                <span>Pull to Ollama</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInspectModel(model.id)}
                                className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                                title="Inspect Model Architecture"
                              >
                                <IconInfoCircle size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* VIEW 3: VISION & MULTIMODAL */}
          {activeTab === 'vision' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Vision & OCR Inspection Studio</h2>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Inspect images, analyze foliar plant symptoms, or extract structured document data using local vision models.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload / Image Dropzone */}
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-8 text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
                    <IconUpload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--color-ink)]">Drag and drop an image here</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">PNG, JPG, or WebP up to 10MB</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Select Photo
                  </button>
                </div>

                {/* Inspection Console */}
                <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 space-y-4">
                  <h3 className="text-xs font-bold font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
                    Visual Prompt & Parameters
                  </h3>

                  <div>
                    <label className="text-[11px] font-bold text-[var(--color-ink)]">Active Vision Model</label>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs font-mono font-bold">
                      <span>llava:7b</span>
                      <span className="text-[10px] text-[var(--color-ink-muted)]">Multimodal 4.7 GB</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[var(--color-ink)]">Inspection Task</label>
                    <textarea
                      rows={3}
                      defaultValue="Inspect this image and identify any visible plant disease, leaf necrosis, or structural defects."
                      className="mt-1 w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Run Local Vision Analysis
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: RAG & KNOWLEDGE DOCUMENTS */}
          {activeTab === 'rag' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--color-ink)]">RAG Vector Search & Embeddings</h2>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Generate local vector embeddings via Ollama (`nomic-embed-text`) to perform semantic search across your personal notes.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--color-ink)]">Indexed Knowledge Sources</h3>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                  >
                    <IconFileText size={14} />
                    <span>Upload Document</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    { name: 'esp32_gpio_registers.pdf', chunks: 14, size: '240 KB', status: 'Indexed' },
                    { name: 'foliar_disease_guide_2026.md', chunks: 32, size: '480 KB', status: 'Indexed' },
                    { name: 'university_research_handbook.pdf', chunks: 68, size: '1.2 MB', status: 'Indexed' },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <IconFileText size={16} className="text-[var(--color-ink-muted)] shrink-0" />
                        <span className="font-semibold text-[var(--color-ink)] truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-ink-muted)]">
                        <span>{doc.chunks} chunks</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-bold">
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: ENGINE & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Engine & Daemon Settings</h2>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Configure local Ollama connection endpoints, context window length, and inference hyperparameters.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-ink)]">Ollama Local API Endpoint</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      className="flex-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('resursee_ollama_endpoint', endpoint);
                        refreshConnection(endpoint);
                      }}
                      className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                      {isCheckingConnection ? 'Connecting...' : 'Save & Refresh'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    Default port for Ollama daemon on macOS, Linux, and Windows.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-rule-subtle)]">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-ink)]">Temperature (Creativity vs Determinism)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
                      <span>0.0 (Strict Logic)</span>
                      <span className="font-bold text-[var(--color-ink)]">{temperature.toFixed(2)}</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-ink)]">Context Token Limit</label>
                    <select
                      value={numCtx.toString()}
                      onChange={(e) => setNumCtx(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden cursor-pointer"
                    >
                      <option value="2048">2,048 Tokens (Low Memory)</option>
                      <option value="4096">4,096 Tokens (Standard)</option>
                      <option value="8192">8,192 Tokens (Extended)</option>
                      <option value="16384">16,384 Tokens (Max VRAM)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-rule-subtle)]">
                  <label className="text-xs font-bold text-[var(--color-ink)]">Global System Prompt</label>
                  <textarea
                    rows={3}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 🚀 How to Run DomoDomo / Resursee AI Hub Locally Modal */}
      <AnimatePresence>
        {isSetupModalOpen && (
          <div
            onClick={() => setIsSetupModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
                    <IconTerminal2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-ink)]">
                      How to Run Resursee AI Hub Locally
                    </h3>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      Zero server egress • 100% private offline compute
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSetupModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Instructions List */}
              <div className="space-y-3 font-mono text-xs">
                {/* Step 1 */}
                <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--color-ink)]">
                      STEP 1: Install Ollama Engine (macOS, Windows, Linux)
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-[var(--color-ink-muted)]">
                    Run the terminal command below or download the standalone installer from ollama.com:
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-950 text-neutral-100 p-2 text-[11px]">
                    <code>curl -fsSL https://ollama.com/install.sh</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('curl -fsSL https://ollama.com/install.sh', 'step-1')}
                      className="text-neutral-400 hover:text-white cursor-pointer ml-2"
                    >
                      {copiedKey === 'step-1' ? <IconCheck size={13} className="text-white" /> : <IconCopy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 space-y-2">
                  <span className="font-bold text-[var(--color-ink)]">
                    STEP 2: Pull & Start a Local Model
                  </span>
                  <p className="font-sans text-[11px] text-[var(--color-ink-muted)]">
                    Launch your model in terminal to initialize the background REST daemon:
                  </p>
                  <div className="space-y-1.5 rounded-lg bg-neutral-950 text-neutral-100 p-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <code>ollama run llama3.2:1b # Text & Tools</code>
                      <button
                        type="button"
                        onClick={() => handleCopy('ollama run llama3.2:1b', 'step-2a')}
                        className="text-neutral-400 hover:text-white cursor-pointer ml-2"
                      >
                        {copiedKey === 'step-2a' ? <IconCheck size={13} className="text-white" /> : <IconCopy size={13} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-1.5">
                      <code>ollama run llava:7b # Vision & OCR</code>
                      <button
                        type="button"
                        onClick={() => handleCopy('ollama run llava:7b', 'step-2b')}
                        className="text-neutral-400 hover:text-white cursor-pointer ml-2"
                      >
                        {copiedKey === 'step-2b' ? <IconCheck size={13} className="text-white" /> : <IconCopy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 space-y-2">
                  <span className="font-bold text-[var(--color-ink)]">
                    STEP 3: Run Resursee Development Server
                  </span>
                  <p className="font-sans text-[11px] text-[var(--color-ink-muted)]">
                    Launch Resursee so the browser shares the localhost origin with Ollama:
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-950 text-neutral-100 p-2 text-[11px]">
                    <code>npm run dev</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('npm run dev', 'step-3')}
                      className="text-neutral-400 hover:text-white cursor-pointer ml-2"
                    >
                      {copiedKey === 'step-3' ? <IconCheck size={13} className="text-white" /> : <IconCopy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 space-y-1">
                  <span className="font-bold text-[var(--color-ink)]">
                    STEP 4: Open Local AI Hub
                  </span>
                  <p className="font-sans text-[11px] text-[var(--color-ink-muted)]">
                    Open <code className="font-bold text-[var(--color-ink)]">http://localhost:3000/apps/ai-hub</code> with zero cloud data transfer!
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSetupModalOpen(false)}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  Got It, Let&apos;s Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💬 Conversation Sessions Drawer Modal (Phase 2) */}
      <AnimatePresence>
        {isSessionDrawerOpen && (
          <div
            onClick={() => setIsSessionDrawerOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconHistory size={18} className="text-[var(--color-ink)]" />
                  <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Saved Conversations</h3>
                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-[10px] font-mono font-bold">
                    {sessions.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSessionDrawerOpen(false)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleNewChat();
                  setIsSessionDrawerOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-2 text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                <IconPlus size={15} />
                <span>Start New Conversation</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    className={cn(
                      'group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left',
                      sess.id === currentSessionId
                        ? 'border-neutral-900 dark:border-white bg-[var(--color-paper-surface)] shadow-2xs'
                        : 'border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] hover:border-[var(--color-rule-strong)] hover:bg-[var(--color-paper-muted)]'
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--color-ink)] truncate">
                          {sess.title}
                        </span>
                        {sess.id === currentSessionId && (
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-ink-muted)] mt-0.5">
                        <span>{sess.model || selectedModel}</span>
                        <span>•</span>
                        <span>{sess.messages.length} msgs</span>
                        <span>•</span>
                        <span>{new Date(sess.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer"
                      title="Delete Session"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚙️ Dynamic Inference Parameters Modal (Phase 2) */}
      <AnimatePresence>
        {isParametersModalOpen && (
          <div
            onClick={() => setIsParametersModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconAdjustmentsHorizontal size={18} className="text-[var(--color-ink)]" />
                  <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Inference Parameters</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParametersModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-4 text-left text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[var(--color-ink)]">Temperature (Creativity)</label>
                    <span className="font-mono font-bold text-[var(--color-ink)]">{temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
                    <span>0.0 (Strict / Code)</span>
                    <span>0.7 (Balanced)</span>
                    <span>1.0 (Creative)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--color-ink)]">Context Token Window</label>
                  <select
                    value={numCtx.toString()}
                    onChange={(e) => setNumCtx(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden cursor-pointer"
                  >
                    <option value="2048">2,048 Tokens (Low Memory)</option>
                    <option value="4096">4,096 Tokens (Standard)</option>
                    <option value="8192">8,192 Tokens (Extended)</option>
                    <option value="16384">16,384 Tokens (Max VRAM)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[var(--color-ink)]">System Prompt</label>
                    <button
                      type="button"
                      onClick={() =>
                        setSystemPrompt(
                          'You are a private, offline intelligence engine integrated into Resursee. Provide concise, factual, and direct answers without unnecessary filler.'
                        )
                      }
                      className="text-[10px] font-mono text-[var(--color-ink-muted)] hover:underline cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsParametersModalOpen(false)}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🗑️ Delete Model Confirmation Modal (Phase 3) */}
      <AnimatePresence>
        {modelToDelete && (
          <div
            onClick={() => setModelToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle size={18} className="text-neutral-800 dark:text-neutral-200" />
                  <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Delete Model from Disk</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModelToDelete(null)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[var(--color-ink-muted)]">
                <p>
                  Are you sure you want to permanently delete <strong className="text-[var(--color-ink)] font-mono">{modelToDelete}</strong> from local Ollama storage?
                </p>
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3 text-[11px] text-neutral-800 dark:text-neutral-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Local Storage Deletion</span>
                  </div>
                  <p>
                    This will delete the model weights from your machine disk and free up space. You can re-download this model anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setModelToDelete(null)}
                  className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] px-4 py-1.5 text-xs font-bold text-[var(--color-ink)] cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteModel}
                  disabled={isDeleting}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <IconTrash size={13} />
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔍 Model Architecture & Quantization Inspector Modal (Phase 3) */}
      <AnimatePresence>
        {inspectingModel && (
          <div
            onClick={() => setInspectingModel(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4 text-left max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconCpu size={18} className="text-[var(--color-ink)]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Model Architecture & Weights</h3>
                    <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{inspectingModel}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingModel(null)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {isLoadingInspect ? (
                  <div className="flex items-center justify-center py-12 text-xs font-mono text-[var(--color-ink-muted)] gap-2 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                    <span>Querying local Ollama daemon for Modelfile and GGUF parameters...</span>
                  </div>
                ) : inspectData?.error ? (
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 space-y-2 text-neutral-800 dark:text-neutral-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <IconInfoCircle size={15} />
                      <span>Model Not Yet Cached Locally</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Detailed GGUF tensor layers, Modelfile templates, and architecture parameters become inspectable once the model is pulled to your machine.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const tag = inspectingModel;
                          setInspectingModel(null);
                          handlePullModel(tag);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                      >
                        <IconDownload size={13} />
                        <span>Pull {inspectingModel} to Inspect</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Technical Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block">Format</span>
                        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{inspectData?.details?.format || 'GGUF'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block">Family</span>
                        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{inspectData?.details?.family || 'Transformer'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block">Parameters</span>
                        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{inspectData?.details?.parameter_size || 'N/A'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block">Quantization</span>
                        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{inspectData?.details?.quantization_level || 'Q4_K_M'}</span>
                      </div>
                    </div>

                    {/* Modelfile & Template Viewer */}
                    {inspectData?.modelfile && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-[var(--color-ink)]">Modelfile Blueprint</label>
                          <button
                            type="button"
                            onClick={() => handleCopy(inspectData.modelfile, 'inspect-modelfile')}
                            className="text-[10px] font-mono text-[var(--color-ink-muted)] hover:underline cursor-pointer"
                          >
                            {copiedKey === 'inspect-modelfile' ? 'Copied' : 'Copy Modelfile'}
                          </button>
                        </div>
                        <div className="rounded-xl border border-[var(--color-rule-strong)] bg-neutral-950 text-neutral-100 p-3 font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed">
                          <pre>{inspectData.modelfile}</pre>
                        </div>
                      </div>
                    )}

                    {/* Parameters Text */}
                    {inspectData?.parameters && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-[var(--color-ink)]">Inference Parameters</label>
                        <div className="rounded-xl border border-[var(--color-rule-strong)] bg-neutral-950 text-neutral-100 p-3 font-mono text-[11px] overflow-x-auto">
                          <pre>{inspectData.parameters}</pre>
                        </div>
                      </div>
                    )}

                    {/* License snippet */}
                    {inspectData?.license && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-[var(--color-ink)]">Model License</label>
                        <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-2.5 text-[10.5px] font-mono text-[var(--color-ink-muted)] max-h-24 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">{inspectData.license.slice(0, 500)}...</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setInspectingModel(null)}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
