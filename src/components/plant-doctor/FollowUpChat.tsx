'use client';

import React, { useState, useEffect } from 'react';
import { PlantDiagnosisResult, PlantChatMessage } from '@/types/plantDoctor';
import { PaperPlaneRight, Sparkle, User, Robot } from '@phosphor-icons/react';
import { streamOllamaChat, checkOllamaConnection, DEFAULT_OLLAMA_ENDPOINT } from '@/lib/ollamaClient';

interface FollowUpChatProps {
  diagnosis: PlantDiagnosisResult;
}

export default function FollowUpChat({ diagnosis }: FollowUpChatProps) {
  const [messages, setMessages] = useState<PlantChatMessage[]>([
    {
      id: 'msg-initial',
      sender: 'bot',
      text: `Hello! I'm Dr. Flora, your botanical AI assistant. I've finished analyzing your ${diagnosis.plantName} for ${diagnosis.primaryDiagnosis}. Feel free to ask any questions regarding organic alternatives, application schedules, or companion planting!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localModel, setLocalModel] = useState<string | null>(null);

  useEffect(() => {
    async function checkLocal() {
      try {
        const res = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 2000);
        if (res.status && res.models.length > 0) {
          // Prefer vision model or lightweight assistant
          const pick =
            res.models.find((m) => m.name.includes('vision') || m.name.includes('llava')) ||
            res.models[0];
          setLocalModel(pick.name);
        }
      } catch {
        // ignore
      }
    }
    checkLocal();
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: PlantChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const query = inputText.trim();
    setInputText('');
    setIsTyping(true);

    // 1. If local Ollama is available, stream answer using local LLM
    if (localModel) {
      const botMsgId = `bot-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      try {
        const systemPrompt = `You are Dr. Flora, an expert botanical pathologist and agronomy advisor. The user is asking questions about their plant:
- Plant: ${diagnosis.plantName} (${diagnosis.scientificName})
- Diagnosis: ${diagnosis.primaryDiagnosis}
- Pathogen: ${diagnosis.pathogenType}
- Severity: ${diagnosis.severity}
- Summary: ${diagnosis.summary}
- Organic Treatments: ${diagnosis.organicTreatments?.map((t) => t.title).join(', ') || 'N/A'}
- Chemical Treatments: ${diagnosis.chemicalTreatments?.map((t) => t.title).join(', ') || 'N/A'}

Provide direct, actionable, practical advice in 2-4 concise sentences. Emphasize organic protection, safety, and proper cultural practices.`;

        const ollamaHistory = [
          { role: 'system' as const, content: systemPrompt },
          ...newMessages.map((m) => ({
            role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.text,
          })),
        ];

        await streamOllamaChat(
          DEFAULT_OLLAMA_ENDPOINT,
          {
            model: localModel,
            messages: ollamaHistory,
            temperature: 0.3,
          },
          (fullText) => {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === botMsgId ? { ...msg, text: fullText } : msg))
            );
          }
        );
        setIsTyping(false);
        return;
      } catch (err) {
        console.warn('Local Ollama chat failed, falling back to rule engine:', err);
      }
    }

    // 2. Fallback rule-based botanical AI response
    setTimeout(() => {
      let reply = '';
      const lower = query.toLowerCase();

      if (lower.includes('spread') || lower.includes('neighbor') || lower.includes('contagious')) {
        reply = `Yes, ${diagnosis.primaryDiagnosis} can spread rapidly if moisture or wind carries fungal spores or pests to neighboring plants in the same family. It is strongly recommended to isolate or prune infected foliage and avoid overhead watering to prevent splashing.`;
      } else if (lower.includes('neem') || lower.includes('oil') || lower.includes('organic')) {
        reply = `When applying neem oil or organic foliar sprays, always spray during early morning or late afternoon (dusk) to prevent sunlight from causing phytotoxic leaf scorching. Make sure to spray underneath the leaves where fungal spores and pest larvae hide.`;
      } else if (lower.includes('eat') || lower.includes('fruit') || lower.includes('safe') || lower.includes('harvest')) {
        reply = `Unblemished fruit or herbs from the upper parts of the plant are safe to consume after washing thoroughly with clean water. However, discard any fruits or leaves that exhibit sunken lesions, rot, or direct fungal sporulation.`;
      } else if (lower.includes('water') || lower.includes('soil')) {
        reply = `For ${diagnosis.plantName}, water strictly at the soil base using a soaker hose or watering can rather than a garden sprinkler. Keeping the foliage completely dry reduces pathogen germination rates by over 80%.`;
      } else {
        reply = `Great question! For ${diagnosis.primaryDiagnosis} on ${diagnosis.plantName}, consistency is key. Ensure proper air circulation, avoid nitrogen-heavy fertilizers while the plant is recovering, and apply the recommended treatments once every 7 days.`;
      }

      setMessages((prev) => {
        // If botMsg was already added, update it, else append
        const hasExisting = prev.some((m) => m.id.startsWith('bot-'));
        const botMsg: PlantChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        return [...prev.filter((m) => m.text !== ''), botMsg];
      });
      setIsTyping(false);
    }, 500);
  };

  const quickQuestions = [
    'Can this disease spread to my other plants?',
    'How often should I apply organic spray?',
    'Is the fruit still safe to harvest?',
  ];

  return (
    <div className="rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--color-rule-subtle)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
          <Sparkle size={18} weight="fill" />
        </span>
        <div>
          <h3 className="text-base font-extrabold text-[var(--color-ink)]">
            Ask Plant Doctor (Follow-Up AI)
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Ask specific recovery questions for your {diagnosis.plantName}
          </p>
        </div>
      </div>

      {/* Message Stream */}
      <div className="mt-4 flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 text-xs sm:text-sm ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'bot' && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                <Robot size={15} weight="bold" />
              </span>
            )}

            <div
              className={`max-w-[85%] rounded-[20px] p-3.5 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-paper-muted)] text-[var(--color-ink)] border border-[var(--color-rule-subtle)]'
              }`}
            >
              <p>{msg.text}</p>
              <span
                className={`mt-1 block text-[9.5px] font-mono opacity-60 ${
                  msg.sender === 'user' ? 'text-white text-right' : 'text-[var(--color-ink-muted)]'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-muted)] text-[var(--color-ink)]">
                <User size={15} weight="bold" />
              </span>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              <Robot size={15} weight="bold" />
            </span>
            <div className="rounded-[16px] bg-[var(--color-paper-muted)] px-3 py-2">
              <span className="inline-block animate-pulse">Dr. Flora is typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="mt-4 flex flex-wrap gap-2">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInputText(q);
            }}
            className="rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-3 py-1 text-[11px] font-semibold text-[var(--color-ink-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors active:scale-95 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask anything about ${diagnosis.plantName} care, fertilizers, or pruning...`}
          className="flex-1 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-4 py-2.5 text-xs sm:text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-hidden focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-xs hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <PaperPlaneRight size={16} weight="bold" />
        </button>
      </form>
    </div>
  );
}
