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
  IconRefresh,
  IconAlertCircle,
  IconX,
} from '@tabler/icons-react';

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

export default function AIHubPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2:1b');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Welcome to **Resursee Local AI Hub**. All inference and embeddings run 100% locally on your machine via the local Ollama daemon (`http://localhost:11434`) with zero cloud data egress.\n\nSelect a model or try a sample inquiry below to begin exploring.',
      timestamp: 'Just now',
    },
  ]);
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Model Library State
  const [modelCategory, setModelCategory] = useState<string>('all');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Simulated Chat Generation
  const handleSendMessage = () => {
    if (!promptInput.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const inquiry = promptInput.trim();
    setPromptInput('');
    setIsGenerating(true);

    setTimeout(() => {
      let replyContent = '';
      let code = '';

      if (inquiry.toLowerCase().includes('esp32') || inquiry.toLowerCase().includes('iot')) {
        replyContent = `Here is a lightweight FreeRTOS sensor telemetry task for the ESP32 connecting to Resursee's IoT Cloud ingestion API:`;
        code = `#include <WiFi.h>
#include <HTTPClient.h>

void telemetryTask(void *pvParameters) {
  for(;;) {
    float temperature = readDHT22();
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin("http://localhost:3000/api/iot/ingest");
      http.addHeader("Content-Type", "application/json");
      http.POST("{\\"device_id\\":\\"esp32-node\\",\\"temp\\":" + String(temperature) + "}");
      http.end();
    }
    vTaskDelay(pdMS_TO_TICKS(5000));
  }
}`;
      } else if (inquiry.toLowerCase().includes('quant') || inquiry.toLowerCase().includes('gguf')) {
        replyContent = `**Quantization Comparison: Q4_K_M vs Q8_0**\n\n- **Q4_K_M (4-bit)**: Compresses weights down to ~4.5 bits/weight. Ideal for consumer laptops (fits in 8GB–16GB RAM) with minimal perplexity degradation (< 0.15 PPL loss).\n- **Q8_0 (8-bit)**: Near-lossless precision matching original FP16 checkpoints, but requires double the VRAM.\n\nFor local execution on edge hardware, **Q4_K_M** delivers the optimal speed-to-accuracy ratio.`;
      } else {
        replyContent = `Processed query via local **${selectedModel}** engine.\n\nAll computations completed on local GPU/CPU hardware. Tokens streamed with strict data sovereignty. You can inspect the engine configuration or download larger models in the **Model Library** tab.`;
      }

      const assistantMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        codeSnippet: code || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 900);
  };

  // Simulated Model Pull
  const handlePullModel = (modelId: string) => {
    if (downloadingModelId) return;
    setDownloadingModelId(modelId);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingModelId(null);
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

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
              onClick={() => setIsSetupModalOpen(true)}
              className="group flex items-center justify-between p-2 rounded-xl bg-[var(--color-paper-card)] border border-[var(--color-rule-subtle)] hover:border-[var(--color-rule-strong)] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                <motion.span
                  animate={{
                    display: sidebarOpen ? 'inline-block' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="text-xs font-semibold text-[var(--color-ink)] truncate"
                >
                  Ollama Ready (11434)
                </motion.span>
              </div>
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="text-[10px] font-mono text-[var(--color-ink-muted)] group-hover:underline"
              >
                Guide
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
            {/* Model Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 pr-8 text-xs font-mono font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] focus:outline-hidden cursor-pointer"
              >
                {CATALOG_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.size})
                  </option>
                ))}
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
              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col gap-1.5 max-w-[88%] sm:max-w-[80%]',
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
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Code Block if Present */}
                      {msg.codeSnippet && (
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
                    <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold">
                      Temp: 0.7
                    </span>
                    <span className="hidden sm:inline rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold">
                      Ctx: 4096
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!promptInput.trim() || isGenerating}
                    className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <span>Send</span>
                    <IconPlayerPlay size={13} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MODEL LIBRARY & DOWNLOADER */}
          {activeTab === 'models' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Strip & Category Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Model Catalog & Downloader</h2>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    1-click model weights downloaded straight into your local Ollama storage.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Filter models..."
                    className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] pl-8 pr-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                  />
                </div>
              </div>

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

              {/* Models Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATALOG_MODELS.filter((m) => {
                  if (modelCategory !== 'all' && m.category !== modelCategory) return false;
                  if (modelSearch && !m.name.toLowerCase().includes(modelSearch.toLowerCase())) return false;
                  return true;
                }).map((model) => (
                  <div
                    key={model.id}
                    className="flex flex-col justify-between rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-2xs hover:border-[var(--color-rule-strong)] transition-all space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-extrabold text-[var(--color-ink)]">{model.name}</h3>
                          <span className="font-mono text-[10.5px] text-[var(--color-ink-muted)]">{model.id}</span>
                        </div>

                        {model.isDownloaded ? (
                          <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                            Installed
                          </span>
                        ) : (
                          <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold">
                            Available
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-snug">
                        {model.description}
                      </p>

                      {/* Specs Row */}
                      <div className="flex items-center gap-2 mt-4 text-[11px] font-mono text-[var(--color-ink-muted)]">
                        <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                          {model.size}
                        </span>
                        <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                          VRAM: {model.vram}
                        </span>
                        <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                          {model.parameters}
                        </span>
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

                      {/* Download / Active Action */}
                      {downloadingModelId === model.id ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink)]">
                            <span>Pulling layers...</span>
                            <span>{downloadProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                            <div
                              className="h-full bg-neutral-900 dark:bg-white transition-all duration-200"
                              style={{ width: `${downloadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : model.isDownloaded ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModel(model.id);
                            setActiveTab('chat');
                          }}
                          className="w-full rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <IconPlayerPlay size={13} fill="currentColor" />
                          <span>Launch in Chat</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePullModel(model.id)}
                          className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] py-1.5 text-xs font-bold text-[var(--color-ink)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <IconDownload size={13} />
                          <span>Pull to Ollama</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                      defaultValue="http://localhost:11434"
                      className="flex-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                      Test Link
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    Default port for Ollama daemon on macOS, Linux, and Windows.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-rule-subtle)]">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-ink)]">Temperature (Creativity vs Determinism)</label>
                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full accent-neutral-900 dark:accent-white cursor-pointer" />
                    <div className="flex justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
                      <span>0.0 (Strict Logic)</span>
                      <span>0.7 (Default)</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-ink)]">Context Token Limit</label>
                    <select
                      defaultValue="4096"
                      className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden"
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
                    defaultValue="You are a private, offline intelligence engine integrated into Resursee. Provide concise, factual, and direct answers without unnecessary filler."
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
    </div>
  );
}
