'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  Links,
} from '@/components/ui/sidebar';
import {
  Presentation,
  FilePpt,
  Sparkle,
  Gear,
  DownloadSimple,
  Play,
  Stop,
  Plus,
  Trash,
  Copy,
  Check,
  ArrowLeft,
  Terminal,
  Cpu,
  ArrowsClockwise,
  CheckCircle,
  CaretDown,
} from '@phosphor-icons/react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import SlideRail from '@/components/presentation/SlideRail';
import SlideCanvas from '@/components/presentation/SlideCanvas';
import PresenterMode from '@/components/presentation/PresenterMode';
import FloatingAIChat from '@/components/presentation/FloatingAIChat';
import {
  PresentationDeck,
  Slide,
  SlideLayout,
  TechThemeId,
  SlideTransition,
  CuratedPresentationModel,
} from '@/types/presentation';
import { TECH_THEMES, THEME_LIST } from '@/lib/presentationThemes';
import { TEMPLATE_PRESETS } from '@/lib/presentationTemplates';
import { exportToPPTX, exportToJSON, exportToHTML } from '@/lib/presentationExport';
import {
  checkOllamaConnection,
  startOllamaDaemon,
  stopOllamaDaemon,
  DEFAULT_OLLAMA_ENDPOINT,
} from '@/lib/ollamaClient';
import { OllamaModel } from '@/types/aiHub';
import { cn } from '@/lib/utils';

type ActiveTab = 'editor' | 'templates' | 'themes' | 'present' | 'settings';

const CURATED_MODELS: CuratedPresentationModel[] = [
  {
    id: 'qwen2.5-coder',
    name: 'Qwen 2.5 Coder',
    parameterSize: '7B / 14B',
    role: 'Best for Technical Slides & Code',
    strengths: ['Flawless structured JSON & markdown', 'Precise bullet points', 'System architecture code'],
    pullCommand: 'ollama run qwen2.5-coder:7b',
  },
  {
    id: 'llama3.1',
    name: 'Llama 3.1',
    parameterSize: '8B',
    role: 'Best for Storytelling & Pitch Decks',
    strengths: ['Articulate executive phrasing', 'Compelling value propositions', 'Clear takeaways'],
    pullCommand: 'ollama run llama3.1:8b',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    parameterSize: '7B',
    role: 'Best for Roadmaps & Engineering OKRs',
    strengths: ['High-density technical summaries', 'Concise phrasing', 'Sprint timetable structuring'],
    pullCommand: 'ollama run mistral:7b',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    parameterSize: '8B / 14B',
    role: 'Best for Complex System Architecture',
    strengths: ['Deep reasoning chains', 'Thorough trade-off analyses', 'Security audit breakdowns'],
    pullCommand: 'ollama run deepseek-r1:8b',
  },
  {
    id: 'gemma2',
    name: 'Gemma 2',
    parameterSize: '9B',
    role: 'Best for Engaging Headlines & Intros',
    strengths: ['Creative slide titles', 'Punchy subtitles', 'Conference keynote pacing'],
    pullCommand: 'ollama run gemma2:9b',
  },
];

const TRANSITION_OPTIONS: { id: SlideTransition; name: string; desc: string }[] = [
  { id: 'fade', name: 'Crossfade', desc: 'Smooth opacity crossfade between slides' },
  { id: 'slide-horizontal', name: 'Horizontal Slide', desc: 'Dynamic left-to-right carousel transition' },
  { id: 'slide-vertical', name: 'Vertical Stack', desc: 'Modern top-to-bottom stack slide' },
  { id: 'zoom', name: 'Depth Zoom', desc: 'Cinematic scale-in zoom effect' },
  { id: 'morph', name: 'Smooth Morph', desc: 'Fluid layout morph with spring dynamics' },
  { id: 'flip', name: '3D Card Flip', desc: 'Perspective 3D rotation transition' },
];

export default function PresentationStudioPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);

  // Presentation State (Initialized with the AI System Pitch template)
  const [deck, setDeck] = useState<PresentationDeck>({
    id: 'deck-default',
    title: TEMPLATE_PRESETS[0].title,
    description: TEMPLATE_PRESETS[0].description,
    author: 'Resursee Engineering',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    themeId: TEMPLATE_PRESETS[0].themeId,
    transition: TEMPLATE_PRESETS[0].transition,
    slides: TEMPLATE_PRESETS[0].slides,
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Ollama Integration State
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'checking' | 'offline'>('checking');
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5-coder');
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [isStoppingOllama, setIsStoppingOllama] = useState(false);

  // Export State
  const [isExportingPPTX, setIsExportingPPTX] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedPullCmd, setCopiedPullCmd] = useState<string | null>(null);

  // Active Theme Object
  const currentTheme = TECH_THEMES[deck.themeId] || TECH_THEMES.obsidian;
  const currentSlide = deck.slides[currentSlideIndex] || deck.slides[0];

  // Ollama Daemon Probe
  const probeOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 1200);
      if (res.status && res.models) {
        setOllamaStatus('connected');
        setInstalledModels(res.models);
        if (res.models.length > 0 && !res.models.some((m) => m.name.includes(selectedModel))) {
          setSelectedModel(res.models[0].name);
        }
      } else {
        setOllamaStatus('offline');
      }
    } catch {
      setOllamaStatus('offline');
    }
  };

  useEffect(() => {
    probeOllama();
  }, []);

  const handleStartOllama = async () => {
    setIsStartingOllama(true);
    try {
      await startOllamaDaemon();
      await new Promise((r) => setTimeout(r, 2000));
      await probeOllama();
    } catch (err) {
      console.warn('Could not auto-launch Ollama daemon:', err);
      setOllamaStatus('offline');
    } finally {
      setIsStartingOllama(false);
    }
  };

  const handleStopOllama = async () => {
    setIsStoppingOllama(true);
    try {
      await stopOllamaDaemon();
      await new Promise((r) => setTimeout(r, 1000));
      await probeOllama();
    } catch (err) {
      console.warn('Could not stop Ollama daemon:', err);
    } finally {
      setIsStoppingOllama(false);
    }
  };

  // Slide CRUD Handlers
  const handleSelectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    if (activeTab !== 'editor') setActiveTab('editor');
  };

  const handleAddSlide = (layout: SlideLayout) => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      layout,
      tag: 'New Section',
      title: 'New Presentation Slide',
      subtitle: 'Add descriptive context and core takeaways',
      bullets: layout === 'bullets-points' ? ['First key engineering insight', 'Second supporting benchmark or architectural point'] : undefined,
      metrics: layout === 'stats-metrics' ? [{ label: 'Primary KPI', value: '100%', change: '+15%' }] : undefined,
      columns: layout === 'split-columns' ? [{ heading: 'Column A', content: ['Key point 1'] }, { heading: 'Column B', content: ['Key point 2'] }] : undefined,
      codeSnippet: layout === 'code-architecture' ? { language: 'typescript', code: '// Add executable code snippet' } : undefined,
      timeline: layout === 'timeline-roadmap' ? [{ step: 'Step 1', title: 'Initiate', description: 'Execution details' }] : undefined,
      quote: layout === 'quote-highlight' ? { text: 'Bold visionary statement', author: 'Speaker' } : undefined,
    };

    setDeck((prev) => {
      const nextSlides = [...prev.slides];
      nextSlides.splice(currentSlideIndex + 1, 0, newSlide);
      return { ...prev, slides: nextSlides, updatedAt: Date.now() };
    });
    setCurrentSlideIndex((prev) => prev + 1);
  };

  const handleDuplicateSlide = (index: number) => {
    const original = deck.slides[index];
    const duplicated: Slide = {
      ...original,
      id: `slide-dup-${Date.now()}`,
      title: `${original.title} (Copy)`,
    };

    setDeck((prev) => {
      const nextSlides = [...prev.slides];
      nextSlides.splice(index + 1, 0, duplicated);
      return { ...prev, slides: nextSlides, updatedAt: Date.now() };
    });
    setCurrentSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (deck.slides.length <= 1) return;
    setDeck((prev) => {
      const nextSlides = prev.slides.filter((_, i) => i !== index);
      return { ...prev, slides: nextSlides, updatedAt: Date.now() };
    });
    if (currentSlideIndex >= deck.slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, deck.slides.length - 2));
    }
  };

  const handleMoveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= deck.slides.length) return;
    setDeck((prev) => {
      const nextSlides = [...prev.slides];
      const [moved] = nextSlides.splice(fromIndex, 1);
      nextSlides.splice(toIndex, 0, moved);
      return { ...prev, slides: nextSlides, updatedAt: Date.now() };
    });
    setCurrentSlideIndex(toIndex);
  };

  const handleUpdateSlide = (updated: Slide) => {
    setDeck((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => (s.id === updated.id ? updated : s)),
      updatedAt: Date.now(),
    }));
  };

  const handleLoadTemplate = (template: typeof TEMPLATE_PRESETS[0]) => {
    setDeck({
      id: `deck-${Date.now()}`,
      title: template.title,
      description: template.description,
      author: 'Resursee Presentation Studio',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      themeId: template.themeId,
      transition: template.transition,
      slides: template.slides,
    });
    setCurrentSlideIndex(0);
    setActiveTab('editor');
  };

  // Export actions
  const handleExportPPTX = async () => {
    setIsExportingPPTX(true);
    try {
      await exportToPPTX(deck, currentTheme);
    } catch (err) {
      console.error('PPTX export error:', err);
    } finally {
      setIsExportingPPTX(false);
      setShowExportMenu(false);
    }
  };

  // Navigation Links
  const sidebarLinks: Links[] = [
    {
      label: 'Slide Editor',
      icon: <Presentation size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'editor',
      onClick: () => setActiveTab('editor'),
      badge: `${deck.slides.length} slides`,
    },
    {
      label: 'Templates Library',
      icon: <FilePpt size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'templates',
      onClick: () => setActiveTab('templates'),
      badge: `${TEMPLATE_PRESETS.length} free`,
    },
    {
      label: 'Themes & Motion',
      icon: <Sparkle size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'themes',
      onClick: () => setActiveTab('themes'),
      badge: currentTheme.badge,
    },
    {
      label: 'Present Live',
      icon: <Play size={18} weight="fill" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'present',
      onClick: () => setIsPresenting(true),
      badge: 'Theater',
    },
    {
      label: 'Settings & Models',
      icon: <Gear size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'settings',
      onClick: () => setActiveTab('settings'),
      badge: 'Ollama',
    },
  ];

  const mobileBrand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-xs font-mono select-none">
        P
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-xs text-neutral-900 dark:text-white leading-none">
          Presentation Studio
        </span>
        <span className="text-[11px] font-mono text-neutral-500">
          Slide Builder &amp; Copilot
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans antialiased">
      {/* 🧭 Collapsible Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody brand={mobileBrand} className="justify-between gap-6 border-r border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-[#111111]/85 backdrop-blur-md">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Back to Resursee Hub */}
            <div className="mb-4">
              <SidebarLink
                link={{
                  label: 'Back to Hub',
                  href: '/#apps',
                  icon: (
                    <ArrowLeft
                      size={18}
                      weight="bold"
                      className="text-neutral-600 dark:text-neutral-400"
                    />
                  ),
                }}
              />
            </div>

            {/* App Brand Header */}
            <div className="mb-6 px-1">
              <div className="flex items-center gap-2.5 py-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs font-mono font-bold text-xs select-none">
                  P
                </div>
                <motion.div
                  animate={{
                    display: sidebarOpen ? 'flex' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="flex flex-col truncate min-w-0"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                      Presentation Studio
                    </span>
                    <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.2 font-mono text-[10px] font-bold">
                      v1.0
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400 truncate">
                    Slide Builder &amp; Presenter
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Sidebar Navigation Links */}
            <div className="space-y-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Sidebar Bottom Controls */}
          <div className="border-t border-neutral-200 pt-3 mt-auto space-y-2.5 dark:border-neutral-800">
            {/* Ollama Status Strip */}
            <div
              onClick={() => {
                if (ollamaStatus === 'connected') {
                  handleStopOllama();
                } else {
                  handleStartOllama();
                }
              }}
              className={cn(
                'group flex cursor-pointer items-center rounded-xl border border-neutral-200 bg-neutral-50 p-2 transition-all hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/80',
                sidebarOpen ? 'justify-between' : 'justify-center'
              )}
              title={
                ollamaStatus === 'connected'
                  ? 'Click to stop local Ollama background daemon'
                  : 'Click to start local Ollama background daemon'
              }
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    ollamaStatus === 'connected'
                      ? 'bg-neutral-900 dark:bg-white'
                      : isStartingOllama || isStoppingOllama || ollamaStatus === 'checking'
                      ? 'bg-neutral-400 animate-pulse'
                      : 'bg-neutral-400'
                  )}
                />
                <motion.span
                  animate={{
                    display: sidebarOpen ? 'inline-block' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate"
                >
                  {isStartingOllama
                    ? 'Starting...'
                    : isStoppingOllama
                    ? 'Stopping...'
                    : ollamaStatus === 'connected'
                    ? `Ollama (${installedModels.length} models)`
                    : 'Ollama Standby'}
                </motion.span>
              </div>
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="font-mono text-[10px] text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
              >
                {ollamaStatus === 'connected' ? 'Stop' : 'Start'}
              </motion.span>
            </div>

            {/* Theme Toggle */}
            <div
              className={cn(
                'flex items-center px-1',
                sidebarOpen ? 'justify-between' : 'justify-center'
              )}
            >
              <ThemeToggle />
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="font-mono text-[10px] text-neutral-400"
              >
                Presentation Engine
              </motion.span>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* 🖥️ Main Workspace Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-neutral-100/70 dark:bg-black">
        {/* Top Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] px-4 sm:px-6">
          {/* Left: Top Left Ollama Start/Stop + Model Selector */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Ollama 1-Click Start / Stop Button */}
            {ollamaStatus === 'connected' ? (
              <button
                type="button"
                onClick={handleStopOllama}
                disabled={isStoppingOllama}
                title="Stop local Ollama background daemon"
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer shadow-2xs transition-colors disabled:opacity-50 shrink-0"
              >
                {isStoppingOllama ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse shrink-0" />
                    <span className="hidden sm:inline">Stopping...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                    <Stop size={13} weight="fill" />
                    <span>Stop<span className="hidden sm:inline"> Ollama</span></span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOllama}
                disabled={isStartingOllama}
                title="Launch local Ollama background daemon"
                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 px-2.5 sm:px-3 py-1.5 text-xs font-bold cursor-pointer shadow-2xs transition-colors disabled:opacity-50 shrink-0"
              >
                {isStartingOllama ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse shrink-0" />
                    <span className="hidden sm:inline">Starting...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
                    <Play size={13} weight="fill" />
                    <span>Start<span className="hidden sm:inline"> Ollama</span></span>
                  </>
                )}
              </button>
            )}

            {/* Model Selection Dropdown (Beside Ollama Controls) */}
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300">
              <Cpu size={14} className="text-neutral-400 shrink-0" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer text-xs font-mono"
              >
                {installedModels.length > 0 ? (
                  <optgroup label="Installed Local Models">
                    {installedModels.map((m) => (
                      <option key={m.name} value={m.name} className="bg-white dark:bg-neutral-900">
                        {m.name} ({m.details?.parameter_size || 'local'})
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                <optgroup label="Curated Presentation Models">
                  {CURATED_MODELS.map((cm) => (
                    <option key={cm.id} value={cm.id} className="bg-white dark:bg-neutral-900">
                      {cm.name} ({cm.parameterSize})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Active Deck Title */}
            <div className="hidden lg:flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-800 pl-3">
              <input
                type="text"
                value={deck.title}
                onChange={(e) => setDeck((prev) => ({ ...prev, title: e.target.value }))}
                className="font-bold text-xs bg-transparent text-neutral-900 dark:text-white focus:outline-none truncate max-w-[200px]"
                title="Click to rename presentation"
              />
            </div>
          </div>

          {/* Right: Export Menu & Launch Presenter Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer shadow-2xs transition"
              >
                <DownloadSimple size={14} weight="bold" />
                <span className="hidden sm:inline">Export</span>
                <CaretDown size={11} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={handleExportPPTX}
                    disabled={isExportingPPTX}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    <FilePpt size={16} className="text-neutral-500" />
                    <div>
                      <div className="font-bold">{isExportingPPTX ? 'Generating...' : 'Download PPTX'}</div>
                      <div className="text-[10px] text-neutral-400">Microsoft PowerPoint format</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportToHTML(deck, currentTheme);
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    <Presentation size={16} className="text-neutral-500" />
                    <div>
                      <div className="font-bold">Download HTML</div>
                      <div className="text-[10px] text-neutral-400">Offline presentation file</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportToJSON(deck);
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    <Terminal size={16} className="text-neutral-500" />
                    <div>
                      <div className="font-bold">Backup JSON</div>
                      <div className="text-[10px] text-neutral-400">Export deck data structure</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Launch Presenter Mode Button */}
            <button
              type="button"
              onClick={() => setIsPresenting(true)}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer transition"
              title="Launch Live Fullscreen Presentation"
            >
              <Play size={13} weight="fill" />
              <span>Present</span>
            </button>
          </div>
        </header>

        {/* Tab Views Content */}
        <div className="flex-1 flex min-w-0 h-full overflow-hidden">
          {/* TAB 1: SLIDE EDITOR */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex min-w-0 h-full overflow-hidden">
              <SlideRail
                slides={deck.slides}
                currentSlideIndex={currentSlideIndex}
                onSelectSlide={handleSelectSlide}
                onAddSlide={handleAddSlide}
                onDuplicateSlide={handleDuplicateSlide}
                onDeleteSlide={handleDeleteSlide}
                onMoveSlide={handleMoveSlide}
                theme={currentTheme}
              />
              <SlideCanvas
                slide={currentSlide}
                slideIndex={currentSlideIndex}
                totalSlides={deck.slides.length}
                onUpdateSlide={handleUpdateSlide}
                theme={currentTheme}
              />
            </div>
          )}

          {/* TAB 2: TEMPLATES LIBRARY */}
          {activeTab === 'templates' && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-6xl mx-auto w-full">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  Technical Presentation Templates
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Ready-to-present technical pitch decks, system architectures, and roadmaps with pre-structured layouts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEMPLATE_PRESETS.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {tmpl.category}
                        </span>
                        <span className="font-mono text-[11px] text-neutral-400">
                          {tmpl.slidesCount} slides
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {tmpl.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                        {tmpl.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {tmpl.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-2 py-0.5 text-[10px] font-mono text-neutral-600 dark:text-neutral-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-neutral-400">
                        Theme: {TECH_THEMES[tmpl.themeId]?.name || tmpl.themeId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLoadTemplate(tmpl)}
                        className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
                      >
                        <Check size={13} weight="bold" />
                        <span>Load Deck</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: THEMES & TRANSITIONS */}
          {activeTab === 'themes' && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-10">
              {/* Tech Themes Grid */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  Curated Tech Themes
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Engineered for maximum readability, high contrast, and polished presentation styling across both dark and light stages.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                  {THEME_LIST.map((th) => {
                    const isSelected = deck.themeId === th.id;
                    return (
                      <div
                        key={th.id}
                        onClick={() => setDeck((prev) => ({ ...prev, themeId: th.id }))}
                        className={cn(
                          'rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between',
                          isSelected
                            ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 dark:ring-white/20 shadow-lg'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/40'
                        )}
                      >
                        <div>
                          {/* Miniature Color Palette Bar */}
                          <div className="flex items-center gap-1.5 mb-3">
                            <span
                              className="h-5 w-5 rounded-full border border-neutral-700/50"
                              style={{ backgroundColor: th.previewColors.bg }}
                            />
                            <span
                              className="h-5 w-5 rounded-full border border-neutral-700/50"
                              style={{ backgroundColor: th.previewColors.surface }}
                            />
                            <span
                              className="h-5 w-5 rounded-full border border-neutral-700/50"
                              style={{ backgroundColor: th.previewColors.accent }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                              {th.name}
                            </h3>
                            {isSelected && <CheckCircle size={16} weight="fill" className="text-neutral-900 dark:text-white" />}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                            {th.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between font-mono text-[10px] text-neutral-400">
                          <span>{th.badge}</span>
                          <span>{th.fontFamily}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Animated Transitions Selection */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  Slide Transition Animations
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Select the transition effect executed when advancing between slides in live Presenter Mode.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {TRANSITION_OPTIONS.map((trans) => {
                    const isSelected = deck.transition === trans.id;
                    return (
                      <div
                        key={trans.id}
                        onClick={() => setDeck((prev) => ({ ...prev, transition: trans.id }))}
                        className={cn(
                          'rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between',
                          isSelected
                            ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/20 shadow-md bg-white dark:bg-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white/60 dark:bg-neutral-900/30'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-neutral-900 dark:text-white">
                            {trans.name}
                          </span>
                          {isSelected && <CheckCircle size={15} weight="fill" className="text-neutral-900 dark:text-white" />}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {trans.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & CURATED MODELS */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  Presentation Studio Settings
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Manage local Ollama model bindings, design engine preferences, and presentation defaults.
                </p>
              </div>

              {/* Ollama Local Daemon Health Card */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                      <Cpu size={20} weight="bold" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-white">
                        Local Ollama AI Engine
                      </div>
                      <div className="font-mono text-xs text-neutral-400">
                        {DEFAULT_OLLAMA_ENDPOINT}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        ollamaStatus === 'connected' ? 'bg-emerald-500' : 'bg-neutral-400'
                      )}
                    />
                    <span className="font-mono text-xs font-bold capitalize">
                      {ollamaStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
                    Presentation Studio uses local LLMs to generate technical slides, rewrite bullet points, and suggest layouts with 100% data privacy.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={probeOllama}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <ArrowsClockwise size={13} />
                      <span>Refresh</span>
                    </button>
                    {ollamaStatus === 'connected' ? (
                      <button
                        type="button"
                        onClick={handleStopOllama}
                        disabled={isStoppingOllama}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 text-xs font-bold cursor-pointer"
                      >
                        Stop Daemon
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartOllama}
                        disabled={isStartingOllama}
                        className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold cursor-pointer"
                      >
                        Start Daemon
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Curated Models Best for Editing & Designing */}
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                  Curated Models for Presentation Design &amp; Authoring
                </h3>
                <p className="text-xs text-neutral-500 mb-6">
                  Recommended local models specifically evaluated for structured slide generation, technical storytelling, and formatting speed.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CURATED_MODELS.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-extrabold text-sm text-neutral-900 dark:text-white">
                            {m.name}
                          </div>
                          <span className="font-mono text-[10px] font-bold rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-neutral-700 dark:text-neutral-300">
                            {m.parameterSize}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                          {m.role}
                        </div>

                        <ul className="space-y-1.5 mb-4">
                          {m.strengths.map((s, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pull Command Strip */}
                      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <code className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800">
                          {m.pullCommand}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(m.pullCommand);
                            setCopiedPullCmd(m.id);
                            setTimeout(() => setCopiedPullCmd(null), 2000);
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white cursor-pointer"
                        >
                          {copiedPullCmd === m.id ? (
                            <>
                              <Check size={11} className="text-emerald-500" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy Command</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Collapsible Bottom-Right AI Chatbox */}
      <FloatingAIChat
        deck={deck}
        currentSlide={currentSlide}
        selectedModel={selectedModel}
        ollamaStatus={ollamaStatus}
        onInsertSlide={(newSlide) => {
          setDeck((prev) => {
            const nextSlides = [...prev.slides];
            nextSlides.splice(currentSlideIndex + 1, 0, newSlide);
            return { ...prev, slides: nextSlides, updatedAt: Date.now() };
          });
          setCurrentSlideIndex((prev) => prev + 1);
        }}
        onUpdateCurrentSlide={handleUpdateSlide}
        onStartOllama={handleStartOllama}
      />

      {/* Fullscreen Theater Presenter Mode */}
      {isPresenting && (
        <PresenterMode
          deck={deck}
          initialSlideIndex={currentSlideIndex}
          onClose={() => setIsPresenting(false)}
          theme={currentTheme}
        />
      )}
    </div>
  );
}
