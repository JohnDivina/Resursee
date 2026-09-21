'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Slide, PresentationDeck, CopilotMode } from '@/types/presentation';
import {
  Sparkle,
  X,
  PaperPlaneTilt,
  Plus,
  PencilSimple,
  Copy,
  Check,
  Lightning,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { streamOllamaChat, DEFAULT_OLLAMA_ENDPOINT } from '@/lib/ollamaClient';
import { OllamaChatMessage } from '@/types/aiHub';
import { cn } from '@/lib/utils';

interface FloatingAIChatProps {
  deck: PresentationDeck;
  currentSlide: Slide;
  selectedModel: string;
  ollamaStatus: 'connected' | 'checking' | 'offline';
  onInsertSlide: (newSlide: Slide) => void;
  onUpdateCurrentSlide: (updatedSlide: Slide) => void;
  onStartOllama?: () => void;
  copilotMode?: CopilotMode;
  onToggleCopilotMode?: (mode: CopilotMode) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingAIChat({
  deck,
  currentSlide,
  selectedModel,
  ollamaStatus,
  onInsertSlide,
  onUpdateCurrentSlide,
  onStartOllama,
  copilotMode = 'textual',
  onToggleCopilotMode,
}: FloatingAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        copilotMode === 'textual'
          ? "⚡ **Textual Editing Mode Active (Optimized for ≤3B parameter models)**\nI specialize in ultra-fast bullet rewrites, slide proofreading, speaker notes, and concise title improvements.\n\nAsk me to tighten your active slide or try the suggestions below!"
          : "👋 **Full Slide Design Copilot Ready**\nI can suggest technical slide layouts, restructure your bullet points, craft engineering diagrams, and create new slides for your presentation.\n\nHow can I enhance your deck?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Parse structured markdown text into a Slide object
  const parseSlideFromAI = (text: string): Partial<Slide> => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    let title = 'New Technical Slide';
    let subtitle: string | undefined = undefined;
    const bullets: string[] = [];

    lines.forEach((line) => {
      if (line.startsWith('# ')) {
        title = line.replace(/^#+\s*/, '');
      } else if (line.startsWith('## ') && !subtitle) {
        subtitle = line.replace(/^##+\s*/, '');
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        bullets.push(line.replace(/^[-*]\s*/, ''));
      }
    });

    if (bullets.length === 0 && lines.length > 1) {
      lines.slice(1).forEach((l) => {
        if (!l.startsWith('#')) bullets.push(l);
      });
    }

    return {
      title,
      subtitle,
      bullets: bullets.length > 0 ? bullets.slice(0, 5) : ['Key point from AI synthesis'],
    };
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input.trim();
    if (!promptToSend || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setIsGenerating(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, initialAssistantMsg]);

    const systemPrompt =
      copilotMode === 'textual'
        ? `You are an ultra-fast, lightweight slide text editor optimized for compact language models (≤3B parameters).
Your goal is PURELY textual editing and refinement. Do not output complex markdown layouts, code wrappers, or lengthy conversational intros.
Active Presentation: "${deck.title}"
Current Slide: "${currentSlide.title}"
Current Bullets: ${JSON.stringify(currentSlide.bullets || [])}

Instructions:
1. Provide a crisp slide title (# Title)
2. Provide a short subtitle (## Subtitle)
3. Provide 3-4 tight, high-impact bullet points (- Bullet)
4. Keep the wording brief, technical, and executive-ready.`
        : `You are an expert technical presentation designer and slide author.
Active Presentation: "${deck.title}" (Total slides: ${deck.slides.length})
Current Slide #${deck.slides.findIndex((s) => s.id === currentSlide.id) + 1}:
- Title: "${currentSlide.title}"
- Subtitle: "${currentSlide.subtitle || 'None'}"
- Layout: "${currentSlide.layout}"
- Bullets: ${JSON.stringify(currentSlide.bullets || [])}

When asked to generate or modify slides:
- Provide punchy, high-impact titles (# Slide Title)
- Provide concise subtitles (## Subtitle)
- Provide 3-4 crisp technical bullet points (- Bullet item)
- Focus on clarity, enterprise engineering rigor, and brevity.`;

    const chatHistory: OllamaChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: promptToSend },
    ];

    try {
      if (ollamaStatus === 'connected') {
        await streamOllamaChat(
          DEFAULT_OLLAMA_ENDPOINT,
          {
            model: selectedModel || 'qwen2.5-coder',
            messages: chatHistory,
          },
          (fullText: string) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullText } : m))
            );
          }
        );
        setIsGenerating(false);
      } else {
        generateSmartFallback(promptToSend, assistantMsgId);
      }
    } catch {
      generateSmartFallback(promptToSend, assistantMsgId);
    }
  };

  const generateSmartFallback = (prompt: string, msgId: string) => {
    setTimeout(() => {
      const q = prompt.toLowerCase();
      let response = '';

      if (q.includes('bullet') || q.includes('punchy') || q.includes('rewrite')) {
        response = `Here is a tightened, high-impact rewrite of your current slide:\n\n# ${currentSlide.title || 'Technical Architecture Overview'}\n## High-Throughput Distributed Microservices\n\n- Zero-latency caching layer utilizing Redis multi-node clusters\n- End-to-end cryptographic mutual TLS (mTLS) zero-trust encryption\n- Autonomous failover with sub-3-second recovery point objective\n- 99.995% guaranteed production availability SLA`;
      } else if (q.includes('metric') || q.includes('stat') || q.includes('kpi')) {
        response = `Here is a high-impact technical metrics slide proposal:\n\n# Production Scalability Benchmarks\n## Empirical Performance Across 100k Ingress Requests\n\n- p99 Ingress Latency: 12.4ms (down from 48ms)\n- Daily Event Ingestion: 2.4 Billion operations\n- Cluster CPU Utilization: 68% optimal load\n- Cloud Egress Savings: $120,000 annualized reduction`;
      } else if (q.includes('roadmap') || q.includes('timeline')) {
        response = `Here is an engineering execution roadmap slide:\n\n# Engineering Delivery Milestones\n## Phased Architecture Deployment Plan\n\n- Sprint 1-2: Core engine containerization and baseline benchmarking\n- Sprint 3-4: Local Ollama model integration and streaming pipeline\n- Sprint 5-6: Penetration security audit and zero-trust verification\n- Sprint 7-8: Cross-platform desktop release for enterprise clients`;
      } else {
        response = `Here is a structured slide draft for your presentation:\n\n# ${prompt.slice(0, 40) || 'Technical Systems Architecture'}\n## Enterprise System Design Overview\n\n- Modular bounded contexts enforcing domain isolation\n- Real-time event streaming with Apache Kafka message brokers\n- Strict Row Level Security policies active across 100% of data stores\n- Client-side offline evaluation enabled via WebAssembly runtime`;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: response } : m))
      );
      setIsGenerating(false);
    }, 400);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (id: string, text: string) => {
    const parsed = parseSlideFromAI(text);
    const newSlide: Slide = {
      id: `ai-slide-${Date.now()}`,
      layout: 'bullets-points',
      title: parsed.title || 'AI Generated Slide',
      subtitle: parsed.subtitle,
      bullets: parsed.bullets || ['Key takeaway'],
      tag: 'AI PROPOSAL',
    };
    onInsertSlide(newSlide);
    setInsertedId(id);
    setTimeout(() => setInsertedId(null), 2000);
  };

  const handleApply = (id: string, text: string) => {
    const parsed = parseSlideFromAI(text);
    onUpdateCurrentSlide({
      ...currentSlide,
      title: parsed.title || currentSlide.title,
      subtitle: parsed.subtitle || currentSlide.subtitle,
      bullets: parsed.bullets || currentSlide.bullets,
    });
    setAppliedId(id);
    setTimeout(() => setAppliedId(null), 2000);
  };

  return (
    <>
      {/* Floating Bottom-Right Circular Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex h-13 w-13 items-center justify-center rounded-full shadow-2xl transition-all duration-200 cursor-pointer group',
          isOpen
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rotate-90 scale-95'
            : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:scale-105 active:scale-95'
        )}
        title="Presentation AI Copilot (Ollama)"
      >
        {isOpen ? (
          <X size={22} weight="bold" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkle size={24} weight="fill" />
            <span
              className={cn(
                'absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-black',
                ollamaStatus === 'connected' ? 'bg-emerald-500' : 'bg-neutral-400'
              )}
            />
          </div>
        )}
      </button>

      {/* Floating Collapsible Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[80vh] rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#111114]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Drawer Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/60 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shrink-0">
                <Sparkle size={15} weight="fill" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-xs text-neutral-900 dark:text-white truncate">
                    Slide Copilot
                  </span>
                  <span className="rounded-full bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.2 font-mono text-[9px] font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[120px]">
                    {selectedModel || 'Local LLM'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        ollamaStatus === 'connected' ? 'bg-emerald-500' : 'bg-neutral-400'
                      )}
                    />
                    <span>{ollamaStatus === 'connected' ? 'Ollama Active' : 'Offline'}</span>
                  </span>
                  <span>•</span>
                  {/* 1-Click Copilot Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleCopilotMode?.(copilotMode === 'textual' ? 'full-design' : 'textual')}
                    className="font-mono text-[9px] font-bold text-neutral-600 dark:text-neutral-300 hover:underline cursor-pointer"
                    title="Click to toggle between Textual Mode (≤3B) and Full Design Mode (7B+)"
                  >
                    {copilotMode === 'textual' ? '⚡ Textual (≤3B)' : '🎨 Full Design (7B+)'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-neutral-50/40 dark:bg-black/20">
            <button
              type="button"
              onClick={() => handleSend('Make the current slide bullet points punchier and more concise')}
              className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-[10px] font-mono font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0 cursor-pointer shadow-2xs"
            >
              ⚡ Punchier Bullets
            </button>
            <button
              type="button"
              onClick={() => handleSend('Suggest 3 executive headlines for this slide')}
              className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-[10px] font-mono font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0 cursor-pointer shadow-2xs"
            >
              🎯 Polish Title
            </button>
            <button
              type="button"
              onClick={() => handleSend('Draft concise speaker notes for this slide')}
              className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-[10px] font-mono font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0 cursor-pointer shadow-2xs"
            >
              📝 Speaker Notes
            </button>
            <button
              type="button"
              onClick={() => handleSend('Add a technical metrics slide with 4 key KPIs')}
              className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1 text-[10px] font-mono font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0 cursor-pointer shadow-2xs"
            >
              📊 Stats Slide
            </button>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';

              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex flex-col',
                    isAssistant ? 'items-start' : 'items-end'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[90%] rounded-2xl p-3 shadow-2xs leading-relaxed break-words whitespace-pre-wrap',
                      isAssistant
                        ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800'
                        : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    )}
                  >
                    {m.content || (
                      <div className="flex items-center gap-1.5 text-neutral-400 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce" />
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                        <span className="ml-1 font-mono text-[10px]">Generating slide edits...</span>
                      </div>
                    )}
                  </div>

                  {/* Assistant Message Actions */}
                  {isAssistant && m.content && m.id !== 'welcome' && (
                    <div className="flex items-center gap-1.5 mt-1.5 px-1">
                      <button
                        type="button"
                        onClick={() => handleInsert(m.id, m.content)}
                        className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer transition-colors"
                        title="Insert as a new slide after current"
                      >
                        {insertedId === m.id ? (
                          <>
                            <Check size={11} className="text-emerald-500" />
                            <span>Inserted!</span>
                          </>
                        ) : (
                          <>
                            <Plus size={11} weight="bold" />
                            <span>Insert Slide</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApply(m.id, m.content)}
                        className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer transition-colors"
                        title="Update active slide title and bullets with this text"
                      >
                        {appliedId === m.id ? (
                          <>
                            <Check size={11} className="text-emerald-500" />
                            <span>Applied!</span>
                          </>
                        ) : (
                          <>
                            <PencilSimple size={11} weight="bold" />
                            <span>Apply to Current</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer transition-colors"
                        title="Copy raw markdown"
                      >
                        {copiedId === m.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-[#151518] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  copilotMode === 'textual'
                    ? 'Prompt for bullet rewrites, proofreading, or titles...'
                    : 'Prompt for slide layouts, technical architectures, or takeaways...'
                }
                className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-30 cursor-pointer hover:opacity-90 transition shadow-2xs shrink-0"
              >
                {isGenerating ? (
                  <ArrowsClockwise size={14} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={14} weight="bold" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
