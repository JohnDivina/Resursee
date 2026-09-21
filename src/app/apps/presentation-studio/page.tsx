'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PresentationDeck,
  Slide,
  SlideLayout,
  SlideTransition,
  TechThemeId,
  CopilotMode,
  CuratedPresentationModel,
  SavedDeckMeta,
} from '@/types/presentation';
import { TECH_THEMES, THEME_LIST } from '@/lib/presentationThemes';
import { TEMPLATE_PRESETS } from '@/lib/presentationTemplates';
import { exportToPPTX, exportToHTML, exportToJSON } from '@/lib/presentationExport';
import { parsePPTXFile, parseMarkdownToDeck } from '@/lib/presentationParser';
import SlideRail from '@/components/presentation/SlideRail';
import SlideCanvas from '@/components/presentation/SlideCanvas';
import PresenterMode from '@/components/presentation/PresenterMode';
import FloatingAIChat from '@/components/presentation/FloatingAIChat';
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
  UploadSimple,
  FloppyDisk,
  FolderOpen,
  CloudArrowDown,
  Lightning,
} from '@phosphor-icons/react';
import {
  checkOllamaConnection,
  startOllamaDaemon,
  stopOllamaDaemon,
  pullOllamaModel,
  DEFAULT_OLLAMA_ENDPOINT,
} from '@/lib/ollamaClient';
import { OllamaModel } from '@/types/aiHub';
import { cn } from '@/lib/utils';

type ActiveTab = 'editor' | 'templates' | 'themes' | 'present' | 'settings';

const CURATED_MODELS: CuratedPresentationModel[] = [
  // Sub-3B Lightweight Category (for users with ≤3B memory limits or low VRAM)
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 3B',
    modelTag: 'llama3.2:3b',
    parameterSize: '3.2B (~2.0 GB)',
    role: 'Fastest Overall Slide Editor & Bullet Tightener',
    strengths: ['Runs on any laptop or base M-series chip', 'Instant bullet rewrites in sub-second time', 'Concise title improvements'],
    pullCommand: 'ollama run llama3.2:3b',
    isSub3B: true,
    tagCategory: 'Sub-3B Lightweight',
  },
  {
    id: 'llama3.2:1b',
    name: 'Llama 3.2 1B',
    modelTag: 'llama3.2:1b',
    parameterSize: '1.2B (~1.3 GB)',
    role: 'Ultra-Lightweight Text Polish & Proofreading',
    strengths: ['Minimal RAM footprint (<1.5 GB)', 'Blazingly fast generation on CPU', 'Executive phrasing without overheating'],
    pullCommand: 'ollama run llama3.2:1b',
    isSub3B: true,
    tagCategory: 'Sub-3B Lightweight',
  },
  {
    id: 'qwen2.5-coder:1.5b',
    name: 'Qwen 2.5 Coder 1.5B',
    modelTag: 'qwen2.5-coder:1.5b',
    parameterSize: '1.5B (~986 MB)',
    role: 'Technical Textual Edits & Code Outlines',
    strengths: ['Specialized in code & syntax', 'Structured markdown output', 'Compact technical reasoning'],
    pullCommand: 'ollama run qwen2.5-coder:1.5b',
    isSub3B: true,
    tagCategory: 'Sub-3B Lightweight',
  },
  {
    id: 'phi3:mini',
    name: 'Phi-3 Mini',
    modelTag: 'phi3:mini',
    parameterSize: '3.8B (~2.3 GB)',
    role: 'High-Density Compact Reasoning & Bullet Summaries',
    strengths: ['Microsoft compact reasoning model', 'Dense structured takeaways', 'Excellent logic breakdown'],
    pullCommand: 'ollama run phi3:mini',
    isSub3B: true,
    tagCategory: 'Sub-3B Lightweight',
  },
  // Standard & Deep Engineering Category (7B+)
  {
    id: 'qwen2.5-coder:7b',
    name: 'Qwen 2.5 Coder 7B',
    modelTag: 'qwen2.5-coder:7b',
    parameterSize: '7B (~4.7 GB)',
    role: 'Best for Full Slide Architecture & System Design',
    strengths: ['Flawless structured JSON & markdown', 'Precise multi-column comparisons', 'System architecture diagrams'],
    pullCommand: 'ollama run qwen2.5-coder:7b',
    isSub3B: false,
    tagCategory: 'Technical Engineering',
  },
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 8B',
    modelTag: 'llama3.1:8b',
    parameterSize: '8B (~4.9 GB)',
    role: 'Best for Storytelling & Pitch Decks',
    strengths: ['Articulate executive phrasing', 'Compelling investor value propositions', 'Clear takeaways'],
    pullCommand: 'ollama run llama3.1:8b',
    isSub3B: false,
    tagCategory: 'Storytelling & Pitch',
  },
  {
    id: 'mistral:7b',
    name: 'Mistral 7B',
    modelTag: 'mistral:7b',
    parameterSize: '7B (~4.1 GB)',
    role: 'Best for Roadmaps & Engineering OKRs',
    strengths: ['High-density technical summaries', 'Concise phrasing', 'Sprint timetable structuring'],
    pullCommand: 'ollama run mistral:7b',
    isSub3B: false,
    tagCategory: 'Technical Engineering',
  },
  {
    id: 'deepseek-r1:8b',
    name: 'DeepSeek R1 8B',
    modelTag: 'deepseek-r1:8b',
    parameterSize: '8B (~4.9 GB)',
    role: 'Best for Complex Architecture Trade-Offs',
    strengths: ['Deep reasoning chains', 'Thorough trade-off analyses', 'Security audit breakdowns'],
    pullCommand: 'ollama run deepseek-r1:8b',
    isSub3B: false,
    tagCategory: 'Deep Architecture',
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

const STORAGE_ACTIVE_DECK = 'resursee_presentation_active_deck';
const STORAGE_SAVED_DECKS = 'resursee_presentation_saved_decks';
const STORAGE_COPILOT_MODE = 'resursee_presentation_copilot_mode';
const STORAGE_SELECTED_MODEL = 'resursee_presentation_model';

export default function PresentationStudioPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);

  // Presentation State (Initialized with the AI System Pitch template or restored from localStorage)
  const [deck, setDeck] = useState<PresentationDeck>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_ACTIVE_DECK);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return {
      id: 'deck-default',
      title: TEMPLATE_PRESETS[0].title,
      description: TEMPLATE_PRESETS[0].description,
      author: 'Resursee Engineering',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      themeId: TEMPLATE_PRESETS[0].themeId,
      transition: TEMPLATE_PRESETS[0].transition,
      slides: TEMPLATE_PRESETS[0].slides,
    };
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [showDecksModal, setShowDecksModal] = useState(false);
  const [savedDecks, setSavedDecks] = useState<SavedDeckMeta[]>([]);

  // Copilot Operating Mode (Textual-only for ≤3B vs Full-design for 7B+)
  const [copilotMode, setCopilotMode] = useState<CopilotMode>(() => {
    if (typeof window !== 'undefined') {
      const mode = localStorage.getItem(STORAGE_COPILOT_MODE);
      if (mode === 'full-design' || mode === 'textual') return mode;
    }
    return 'textual'; // Default to lightweight textual editing for low memory usage
  });

  // Ollama Integration State
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'checking' | 'offline'>('checking');
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_SELECTED_MODEL);
      if (saved) return saved;
    }
    return 'llama3.2:3b';
  });
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [isStoppingOllama, setIsStoppingOllama] = useState(false);

  // Model Pull State (Streaming download progress)
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<{
    percent: number;
    status: string;
    completedBytes?: number;
    totalBytes?: number;
  } | null>(null);

  // Export & Import State
  const [isExportingPPTX, setIsExportingPPTX] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedPullCmd, setCopiedPullCmd] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Theme Object
  const currentTheme = TECH_THEMES[deck.themeId] || TECH_THEMES.obsidian;
  const currentSlide = deck.slides[currentSlideIndex] || deck.slides[0];

  // Auto-Save active deck to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_ACTIVE_DECK, JSON.stringify(deck));
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeStr);
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [deck]);

  // Load Saved Decks library
  const loadSavedDecksList = () => {
    try {
      const metaStr = localStorage.getItem(STORAGE_SAVED_DECKS);
      if (metaStr) {
        setSavedDecks(JSON.parse(metaStr));
      }
    } catch {}
  };

  useEffect(() => {
    loadSavedDecksList();
  }, []);

  // Save Current Deck into Saved Decks Manager
  const handleSaveDeckToLibrary = () => {
    try {
      const meta: SavedDeckMeta = {
        id: deck.id || `deck_${Date.now()}`,
        title: deck.title || 'Untitled Presentation',
        slidesCount: deck.slides.length,
        themeId: deck.themeId,
        updatedAt: Date.now(),
      };
      // Save deck content
      localStorage.setItem(`resursee_deck_${meta.id}`, JSON.stringify(deck));
      // Update metadata list
      const existing = savedDecks.filter((d) => d.id !== meta.id);
      const updated = [meta, ...existing];
      setSavedDecks(updated);
      localStorage.setItem(STORAGE_SAVED_DECKS, JSON.stringify(updated));
      alert(`Presentation "${meta.title}" saved to your local library.`);
    } catch {
      alert('Failed to save presentation to library.');
    }
  };

  // Load a deck from Saved Decks
  const handleLoadDeckFromLibrary = (metaId: string) => {
    try {
      const content = localStorage.getItem(`resursee_deck_${metaId}`);
      if (content) {
        const parsed = JSON.parse(content);
        setDeck(parsed);
        setCurrentSlideIndex(0);
        setShowDecksModal(false);
      }
    } catch {
      alert('Could not load presentation.');
    }
  };

  // Delete a deck from Saved Decks
  const handleDeleteSavedDeck = (metaId: string) => {
    try {
      localStorage.removeItem(`resursee_deck_${metaId}`);
      const updated = savedDecks.filter((d) => d.id !== metaId);
      setSavedDecks(updated);
      localStorage.setItem(STORAGE_SAVED_DECKS, JSON.stringify(updated));
    } catch {}
  };

  // Switch Copilot Mode
  const handleToggleCopilotMode = (newMode: CopilotMode) => {
    setCopilotMode(newMode);
    localStorage.setItem(STORAGE_COPILOT_MODE, newMode);
  };

  // Ollama Daemon Probe
  const probeOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 1200);
      if (res.status && res.models) {
        setOllamaStatus('connected');
        setInstalledModels(res.models);

        // If current selectedModel is not in installed models, check if any installed model matches
        if (res.models.length > 0) {
          const isCurrentInstalled = res.models.some((m) => m.name === selectedModel);
          if (!isCurrentInstalled) {
            // Prefer a sub-3B installed model if available
            const sub3bMatch = res.models.find(
              (m) =>
                m.name.includes('1b') ||
                m.name.includes('3b') ||
                m.name.includes('1.5b') ||
                m.name.includes('mini')
            );
            const modelToSet = sub3bMatch ? sub3bMatch.name : res.models[0].name;
            setSelectedModel(modelToSet);
            localStorage.setItem(STORAGE_SELECTED_MODEL, modelToSet);
          }
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

  // Interactive Pull Model with Streaming Progress Bar
  const handlePullModel = async (modelTag: string) => {
    if (ollamaStatus !== 'connected') {
      alert('Please start the local Ollama daemon before pulling models.');
      return;
    }

    setPullingModel(modelTag);
    setPullProgress({ percent: 0, status: 'Connecting to Ollama registry...' });

    try {
      await pullOllamaModel(
        DEFAULT_OLLAMA_ENDPOINT,
        modelTag,
        (progress) => {
          setPullProgress({
            percent: progress.percent || 0,
            status: progress.status,
            completedBytes: progress.completed,
            totalBytes: progress.total,
          });
        }
      );

      // Re-probe to update installed model lists across apps
      await probeOllama();
      setSelectedModel(modelTag);
      localStorage.setItem(STORAGE_SELECTED_MODEL, modelTag);

      // Dispatch window event so AI Studio or other open tabs also update
      window.dispatchEvent(new Event('ollama-models-updated'));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Model download error: ${errorMsg}`);
    } finally {
      setPullingModel(null);
      setPullProgress(null);
    }
  };

  // Upload & Convert PowerPoint (.pptx) or Markdown (.md/.json)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      let importedDeck: PresentationDeck;

      if (file.name.endsWith('.pptx')) {
        importedDeck = await parsePPTXFile(file, deck.themeId);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        importedDeck = JSON.parse(text);
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        importedDeck = parseMarkdownToDeck(text, file.name, deck.themeId);
      } else {
        throw new Error('Unsupported file format. Please upload .pptx, .json, or .md files.');
      }

      setDeck(importedDeck);
      setCurrentSlideIndex(0);
      setActiveTab('editor');
      setImportNotification(
        `Successfully imported ${importedDeck.slides.length} slides from "${file.name}" and converted to "${currentTheme.name}"!`
      );
      setTimeout(() => setImportNotification(null), 5000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Import failed: ${errorMsg}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleUpdateSlide = (updatedSlide: Slide) => {
    setDeck((prev) => {
      const nextSlides = [...prev.slides];
      nextSlides[currentSlideIndex] = updatedSlide;
      return { ...prev, slides: nextSlides, updatedAt: Date.now() };
    });
  };

  // Clean Navigation Links (BADGES REMOVED as requested)
  const sidebarLinks: Links[] = [
    {
      label: 'Slide Editor',
      icon: <Presentation size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'editor',
      onClick: () => setActiveTab('editor'),
    },
    {
      label: 'Templates Library',
      icon: <FilePpt size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'templates',
      onClick: () => setActiveTab('templates'),
    },
    {
      label: 'Themes & Motion',
      icon: <Sparkle size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'themes',
      onClick: () => setActiveTab('themes'),
    },
    {
      label: 'Present Live',
      icon: <Play size={18} weight="fill" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'present',
      onClick: () => setIsPresenting(true),
    },
    {
      label: 'Settings & Models',
      icon: <Gear size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'settings',
      onClick: () => setActiveTab('settings'),
    },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#0c0c0e] font-sans antialiased text-neutral-900 dark:text-neutral-100">
      {/* Hidden File Input for PPTX Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pptx,.json,.md,.txt"
        className="hidden"
      />

      {/* Main Collapsible Sidepanel */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="flex flex-col justify-between h-full border-r border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-[#111114]/90 backdrop-blur-md">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {/* Unified Top-Left Back Button */}
            <div className="mb-4 pt-1">
              <a
                href="/#apps"
                className={cn(
                  'flex items-center gap-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer group',
                  sidebarOpen ? 'px-2 py-1.5' : 'justify-center py-1.5'
                )}
                title="Back to Hub"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-800 transition-colors shrink-0">
                  <ArrowLeft size={14} weight="bold" />
                </div>
                {sidebarOpen && (
                  <span className="font-mono text-xs font-bold tracking-tight">
                    Back to Hub
                  </span>
                )}
              </a>
            </div>

            {/* App Brand Header */}
            <div
              className={cn(
                'flex items-center gap-3 mb-6 px-1 transition-all',
                !sidebarOpen && 'justify-center px-0'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-black shadow-md shrink-0">
                P
              </div>
              {sidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-sm tracking-tight text-neutral-900 dark:text-white truncate">
                    Presentation Studio
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400">
                    Local Tech Decks &amp; PPTX
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>

            {/* My Saved Decks Shortcut in Sidebar */}
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
              <button
                type="button"
                onClick={() => {
                  loadSavedDecksList();
                  setShowDecksModal(true);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer text-xs font-bold',
                  sidebarOpen ? 'px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60' : 'justify-center py-2'
                )}
                title="Manage Saved Presentations"
              >
                <FolderOpen size={18} className="shrink-0" />
                {sidebarOpen && <span>My Presentations ({savedDecks.length})</span>}
              </button>
            </div>
          </div>

          {/* Bottom Sidebar Controls */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col gap-2">
            {/* Copilot Mode Indicator */}
            {sidebarOpen ? (
              <div className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 px-3 py-2 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      ollamaStatus === 'connected' ? 'bg-emerald-500' : 'bg-neutral-400'
                    )}
                  />
                  <span className="text-neutral-600 dark:text-neutral-300 capitalize">
                    {ollamaStatus === 'connected' ? (copilotMode === 'textual' ? '≤3B Textual' : '7B+ Design') : 'Offline'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleCopilotMode(copilotMode === 'textual' ? 'full-design' : 'textual')}
                  className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                >
                  Switch
                </button>
              </div>
            ) : (
              <div className="flex justify-center py-1" title={`Ollama: ${ollamaStatus}`}>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    ollamaStatus === 'connected' ? 'bg-emerald-500' : 'bg-neutral-400'
                  )}
                />
              </div>
            )}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-neutral-50 dark:bg-[#0c0c0e]">
        {/* Import Notification Banner */}
        {importNotification && (
          <div className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-medium flex items-center justify-between shadow-md z-30 animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-emerald-400" />
              <span>{importNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setImportNotification(null)}
              className="text-xs font-mono opacity-80 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Action Bar */}
        <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          {/* Left: Ollama Daemon Toggle & Model Selector */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* 1-Click Ollama Daemon Toggle */}
            {ollamaStatus === 'connected' ? (
              <button
                type="button"
                onClick={handleStopOllama}
                disabled={isStoppingOllama}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer transition shadow-2xs shrink-0"
                title="Stop local Ollama background engine"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <Stop size={13} weight="fill" />
                <span className="hidden sm:inline">Stop Ollama</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOllama}
                disabled={isStartingOllama}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2.5 py-1.5 text-xs font-bold hover:opacity-90 cursor-pointer transition shadow-2xs shrink-0"
                title="Launch local Ollama background daemon"
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

            {/* Model Selection Dropdown (Installed models grouped first) */}
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300">
              <Cpu size={14} className="text-neutral-400 shrink-0" />
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  localStorage.setItem(STORAGE_SELECTED_MODEL, e.target.value);
                }}
                className="bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer text-xs font-mono max-w-[140px] sm:max-w-[200px] truncate"
                title="Select active local model"
              >
                {installedModels.length > 0 && (
                  <optgroup label="✓ Downloaded / Installed Models">
                    {installedModels.map((m) => (
                      <option key={m.name} value={m.name} className="bg-white dark:bg-neutral-900">
                        {m.name} ({m.details?.parameter_size || 'local'})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="⚡ Sub-3B Lightweight Presets">
                  {CURATED_MODELS.filter((m) => m.isSub3B).map((cm) => (
                    <option key={cm.modelTag} value={cm.modelTag} className="bg-white dark:bg-neutral-900">
                      {cm.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🧠 Standard 7B+ Presets">
                  {CURATED_MODELS.filter((m) => !m.isSub3B).map((cm) => (
                    <option key={cm.modelTag} value={cm.modelTag} className="bg-white dark:bg-neutral-900">
                      {cm.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Active Deck Title Input */}
            <div className="hidden xl:flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-800 pl-3">
              <input
                type="text"
                value={deck.title}
                onChange={(e) => setDeck((prev) => ({ ...prev, title: e.target.value }))}
                className="font-bold text-xs bg-transparent text-neutral-900 dark:text-white focus:outline-none truncate max-w-[180px]"
                title="Click to rename presentation"
              />
              <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                <Check size={10} className="text-emerald-500" />
                <span>{lastSavedTime}</span>
              </span>
            </div>
          </div>

          {/* Right: Upload PPTX, Save, Export Menu & Present Button */}
          <div className="flex items-center gap-2">
            {/* Upload PowerPoint Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition shadow-2xs"
              title="Upload existing .pptx presentation and convert to active theme"
            >
              <UploadSimple size={14} weight="bold" />
              <span className="hidden sm:inline">Upload PPTX</span>
            </button>

            {/* Save Deck Button */}
            <button
              type="button"
              onClick={handleSaveDeckToLibrary}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition shadow-2xs"
              title="Save presentation into your library"
            >
              <FloppyDisk size={14} weight="bold" />
              <span className="hidden sm:inline">Save</span>
            </button>

            {/* Export Menu Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition shadow-2xs"
              >
                <DownloadSimple size={14} weight="bold" />
                <span className="hidden sm:inline">Export</span>
                <CaretDown size={11} />
              </button>

              {/* Export Dropdown Menu */}
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    disabled={isExportingPPTX}
                    onClick={async () => {
                      setIsExportingPPTX(true);
                      setShowExportMenu(false);
                      try {
                        await exportToPPTX(deck, currentTheme);
                      } catch {
                        alert('Failed to generate PowerPoint file.');
                      } finally {
                        setIsExportingPPTX(false);
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    <FilePpt size={16} className="text-neutral-500" />
                    <div>
                      <div className="font-bold">Microsoft PowerPoint</div>
                      <div className="text-[10px] text-neutral-400">Editable .pptx presentation</div>
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
                      <div className="font-bold">Export JSON Backup</div>
                      <div className="text-[10px] text-neutral-400">Structured raw deck data</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Launch Presenter Mode Button */}
            <button
              type="button"
              onClick={() => setIsPresenting(true)}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 sm:px-4 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
              title="Launch Fullscreen Theater Presenter Mode"
            >
              <Play size={13} weight="fill" />
              <span>Present</span>
            </button>
          </div>
        </header>

        {/* Content Tabs Switcher */}
        <div className="flex-1 flex overflow-hidden">
          {/* TAB 1: SLIDE EDITOR (Thumbnail Rail + 16:9 Stage) */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex overflow-hidden">
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
              <div className="mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  Technical Presentation Templates
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Production-grade decks pre-configured with rigorous engineering structures, metrics, and architecture diagrams.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEMPLATE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {preset.category}
                        </span>
                        <span className="font-mono text-xs text-neutral-400">
                          {preset.slidesCount} slides
                        </span>
                      </div>

                      <h3 className="font-black text-base text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {preset.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {preset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-[9px] rounded-md bg-neutral-50 dark:bg-neutral-800/80 px-1.5 py-0.5 text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Load "${preset.title}" template? (This will replace active slides)`)) {
                          setDeck({
                            id: `deck-${preset.id}-${Date.now()}`,
                            title: preset.title,
                            description: preset.description,
                            author: 'Local Author',
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            themeId: preset.themeId,
                            transition: preset.transition,
                            slides: preset.slides,
                          });
                          setCurrentSlideIndex(0);
                          setActiveTab('editor');
                        }
                      }}
                      className="mt-6 w-full rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-2 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: THEMES & MOTION */}
          {activeTab === 'themes' && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  Curated Tech Themes
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  High-contrast engineering palettes tailored for readability across light and dark venues.
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
                            ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/20 shadow-md bg-white dark:bg-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white/60 dark:bg-neutral-900/30'
                        )}
                      >
                        <div>
                          {/* Theme Color Swatch Strip */}
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className="h-6 w-6 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-2xs"
                              style={{ backgroundColor: th.previewColors.bg }}
                            />
                            <span
                              className="h-6 w-6 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-2xs"
                              style={{ backgroundColor: th.previewColors.surface }}
                            />
                            <span
                              className="h-6 w-6 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-2xs"
                              style={{ backgroundColor: th.previewColors.accent }}
                            />
                            <div className="ml-auto">
                              {isSelected && (
                                <CheckCircle size={18} weight="fill" className="text-neutral-900 dark:text-white" />
                              )}
                            </div>
                          </div>

                          <h3 className="font-black text-sm text-neutral-900 dark:text-white">
                            {th.name}
                          </h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                            {th.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between font-mono text-[10px] text-neutral-400">
                          <span>{th.badge}</span>
                          <span>{th.isDark ? 'Dark Theme' : 'Light Paper'}</span>
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

          {/* TAB 4: SETTINGS, INSTALLED MODELS & COPILOT OPERATING MODE */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-5xl mx-auto w-full space-y-10">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  Presentation Studio Settings
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Configure local model options, enable lightweight ≤3B textual mode, and download models with 1-click.
                </p>
              </div>

              {/* 1. COPILOT OPERATING MODE (Textual-Only for ≤3B vs Full Design) */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Lightning size={18} weight="bold" className="text-neutral-700 dark:text-neutral-300" />
                  <h3 className="font-black text-base text-neutral-900 dark:text-white">
                    AI Copilot Operating Mode
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
                  Select your copilot mode based on your hardware. If you are limited to up to 3B models or low VRAM, select <strong>Textual Editing Mode</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mode Card A: Textual Editing (≤3B) */}
                  <div
                    onClick={() => handleToggleCopilotMode('textual')}
                    className={cn(
                      'rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between',
                      copilotMode === 'textual'
                        ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/20 bg-neutral-50/50 dark:bg-neutral-800/40 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <span>⚡ Textual Editing Mode</span>
                          <span className="font-mono text-[9px] rounded-full bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.2">≤3B Models</span>
                        </span>
                        {copilotMode === 'textual' && (
                          <CheckCircle size={16} weight="fill" className="text-neutral-900 dark:text-white" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Optimized for fast text rewriting, concise bullet points, slide proofreading, speaker notes, and title polishing. Generates compact text with zero complex layout schema, running blazingly fast on 1B to 3B models without memory strain.
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 font-mono text-[10px] text-neutral-500">
                      Recommended for: Llama 3.2 1B/3B, Qwen 2.5 Coder 1.5B, Phi-3 Mini
                    </div>
                  </div>

                  {/* Mode Card B: Full Visual Design (7B+) */}
                  <div
                    onClick={() => handleToggleCopilotMode('full-design')}
                    className={cn(
                      'rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between',
                      copilotMode === 'full-design'
                        ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/20 bg-neutral-50/50 dark:bg-neutral-800/40 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <span>🎨 Full Layout Design Mode</span>
                          <span className="font-mono text-[9px] rounded-full bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.2">7B+ Models</span>
                        </span>
                        {copilotMode === 'full-design' && (
                          <CheckCircle size={16} weight="fill" className="text-neutral-900 dark:text-white" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Enables the AI to propose new structural slide layouts, multi-column pillar comparisons, timeline roadmaps, and architectural source code blocks.
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 font-mono text-[10px] text-neutral-500">
                      Recommended for: Qwen 2.5 Coder 7B/14B, Llama 3.1 8B, DeepSeek R1
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. INSTALLED LOCAL MODELS (Available in Presentation Studio & AI Studio) */}
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu size={18} weight="bold" className="text-neutral-700 dark:text-neutral-300" />
                    <h3 className="font-black text-base text-neutral-900 dark:text-white">
                      Downloaded &amp; Installed Models
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={probeOllama}
                    className="flex items-center gap-1 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    <ArrowsClockwise size={12} />
                    <span>Refresh</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  These models are stored in your local Ollama daemon and are shared across Presentation Studio, AI Studio, and Data Studio.
                </p>

                {installedModels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {installedModels.map((m) => {
                      const isActive = selectedModel === m.name;
                      return (
                        <div
                          key={m.name}
                          className={cn(
                            'rounded-xl border p-3 flex flex-col justify-between transition-colors',
                            isActive
                              ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60'
                              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                          )}
                        >
                          <div>
                            <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                              {m.name}
                            </div>
                            <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                              {m.details?.parameter_size || 'Installed locally'}
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                            {isActive ? (
                              <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-neutral-900 dark:text-white">
                                <Check size={12} className="text-emerald-500" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedModel(m.name);
                                  localStorage.setItem(STORAGE_SELECTED_MODEL, m.name);
                                }}
                                className="font-mono text-[10px] font-bold text-neutral-600 dark:text-neutral-300 hover:underline cursor-pointer"
                              >
                                Select Model
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-center">
                    <p className="text-xs text-neutral-500">
                      No models detected yet. Pull a lightweight Sub-3B model below in 1-click!
                    </p>
                  </div>
                )}
              </div>

              {/* 3. CURATED MODELS WITH 1-CLICK PULL & PROGRESS BAR */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Curated Models (1-Click Pull / Download)
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 mb-6">
                  Click <strong>&quot;Pull Model&quot;</strong> to automatically stream and download directly into Ollama with a live progress bar. Downloaded models are instantly available in Presentation Studio and AI Studio.
                </p>

                {/* Sub-3B Lightweight Group */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightning size={16} weight="fill" className="text-neutral-800 dark:text-neutral-200" />
                    <span className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase tracking-wide">
                      Sub-3B Lightweight Models (Ideal for Textual Editing &amp; Low VRAM)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CURATED_MODELS.filter((m) => m.isSub3B).map((m) => {
                      const isInstalled = installedModels.some((im) => im.name.startsWith(m.modelTag.split(':')[0]));
                      const isPullingThis = pullingModel === m.modelTag;

                      return (
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

                          {/* Pull Progress Bar (When downloading) */}
                          {isPullingThis && pullProgress && (
                            <div className="my-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                              <div className="flex items-center justify-between font-mono text-[10px]">
                                <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                                  {pullProgress.status || 'Downloading...'}
                                </span>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                  {pullProgress.percent}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                <div
                                  className="h-full bg-neutral-900 dark:bg-white transition-all duration-200"
                                  style={{ width: `${pullProgress.percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Pull Action Strip */}
                          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                            {isInstalled ? (
                              <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <Check size={14} weight="bold" />
                                <span>Installed</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={pullingModel !== null}
                                onClick={() => handlePullModel(m.modelTag)}
                                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer transition shadow-2xs"
                              >
                                <CloudArrowDown size={14} weight="bold" />
                                <span>Pull Model</span>
                              </button>
                            )}

                            {/* Copy Command Shortcut */}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(m.pullCommand);
                                setCopiedPullCmd(m.id);
                                setTimeout(() => setCopiedPullCmd(null), 2000);
                              }}
                              className="flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                              title="Copy terminal command"
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
                      );
                    })}
                  </div>
                </div>

                {/* Standard 7B+ Group */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu size={16} weight="fill" className="text-neutral-800 dark:text-neutral-200" />
                    <span className="font-extrabold text-sm text-neutral-900 dark:text-white uppercase tracking-wide">
                      Standard &amp; Deep Architecture Models (7B - 14B)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CURATED_MODELS.filter((m) => !m.isSub3B).map((m) => {
                      const isInstalled = installedModels.some((im) => im.name.startsWith(m.modelTag.split(':')[0]));
                      const isPullingThis = pullingModel === m.modelTag;

                      return (
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

                          {/* Pull Progress Bar (When downloading) */}
                          {isPullingThis && pullProgress && (
                            <div className="my-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                              <div className="flex items-center justify-between font-mono text-[10px]">
                                <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                                  {pullProgress.status || 'Downloading...'}
                                </span>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                  {pullProgress.percent}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                                <div
                                  className="h-full bg-neutral-900 dark:bg-white transition-all duration-200"
                                  style={{ width: `${pullProgress.percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Pull Action Strip */}
                          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                            {isInstalled ? (
                              <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <Check size={14} weight="bold" />
                                <span>Installed</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={pullingModel !== null}
                                onClick={() => handlePullModel(m.modelTag)}
                                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer transition shadow-2xs"
                              >
                                <CloudArrowDown size={14} weight="bold" />
                                <span>Pull Model</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(m.pullCommand);
                                setCopiedPullCmd(m.id);
                                setTimeout(() => setCopiedPullCmd(null), 2000);
                              }}
                              className="flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                              title="Copy terminal command"
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
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SAVED PRESENTATIONS MANAGER MODAL */}
      {showDecksModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FolderOpen size={20} weight="bold" />
                <h3 className="font-black text-base text-neutral-900 dark:text-white">
                  My Presentations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDecksModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {savedDecks.length > 0 ? (
                savedDecks.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-white">
                        {d.title}
                      </div>
                      <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                        {d.slidesCount} slides • Theme: {d.themeId}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadDeckFromLibrary(d.id)}
                        className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1 text-xs font-bold cursor-pointer"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedDeck(d.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 cursor-pointer"
                        title="Delete presentation"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No saved presentations yet. Click &quot;Save&quot; on the top bar to store your active deck here.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowDecksModal(false);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer"
              >
                <UploadSimple size={14} />
                <span>Upload PPTX / File</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDecksModal(false)}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-1.5 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Collapsible Bottom-Right AI Chatbox */}
      <FloatingAIChat
        deck={deck}
        currentSlide={currentSlide}
        selectedModel={selectedModel}
        ollamaStatus={ollamaStatus}
        copilotMode={copilotMode}
        onToggleCopilotMode={handleToggleCopilotMode}
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
          onExit={() => setIsPresenting(false)}
          theme={currentTheme}
        />
      )}
    </div>
  );
}
