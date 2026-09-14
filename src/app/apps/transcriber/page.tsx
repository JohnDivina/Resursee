'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarProvider,
} from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme/ThemeToggle';
import {
  Microphone,
  UploadSimple,
  ClockCounterClockwise,
  Export,
  Cpu,
  Lightning,
  Gear,
  ArrowLeft,
  SlidersHorizontal,
  BookmarkSimple,
  MagnifyingGlass,
  Plus,
  Trash,
  CheckCircle,
  WarningCircle,
  Sparkle,
  User,
  X,
  Play,
  Stop,
} from '@phosphor-icons/react';
import {
  TranscriberSession,
  TranscriptSegment,
  Speaker,
  MeetingNoteItem,
  Bookmark,
  TranscriptionTier,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  BenchmarkResult,
} from '@/types/transcriber';
import {
  decodeAudioFile,
  getAudioWaveform,
} from '@/lib/audioProcessor';
import {
  transcribeWithBrowser,
  generateMeetingNotesLocal,
  extractSpeakers,
  mergeSpeakersInTranscript,
  reassignSegmentSpeaker,
  runTierBenchmark,
} from '@/lib/transcriberEngine';
import {
  checkOllamaConnection,
  startOllamaDaemon,
  stopOllamaDaemon,
  DEFAULT_OLLAMA_ENDPOINT,
} from '@/lib/ollamaClient';
import { OllamaModel } from '@/types/aiHub';
import {
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
} from '@/lib/transcriberStorage';
import {
  exportToTXT,
  exportToMarkdown,
  exportToSRT,
  exportToVTT,
  exportToJSON,
  downloadFile,
} from '@/lib/transcriberExport';

import { AudioPlayer } from '@/components/transcriber/AudioPlayer';
import { RecordingControls } from '@/components/transcriber/RecordingControls';
import { FileDropZone } from '@/components/transcriber/FileDropZone';
import { TranscriptEditor } from '@/components/transcriber/TranscriptEditor';
import { MeetingNotes } from '@/components/transcriber/MeetingNotes';
import { SpeakerManager } from '@/components/transcriber/SpeakerManager';
import { TranscriberSearch } from '@/components/transcriber/TranscriberSearch';
import { BenchmarkRunner } from '@/components/transcriber/BenchmarkRunner';

type SidebarTab =
  | 'record'
  | 'import'
  | 'history'
  | 'export'
  | 'models'
  | 'benchmark'
  | 'settings';

export default function TranscriberPage() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('record');
  const [uiMode, setUiMode] = useState<'simple' | 'advanced'>('advanced');
  const [openSidebar, setOpenSidebar] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Ollama Daemon State (Just like Data Studio)
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'checking' | 'offline'>('checking');
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isStartingOllama, setIsStartingOllama] = useState(false);
  const [isStoppingOllama, setIsStoppingOllama] = useState(false);

  // Active Session State (100% Client-Side & Local)
  const [session, setSession] = useState<TranscriberSession>({
    id: crypto.randomUUID(),
    title: 'Local Meeting Recording',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    duration: 0,
    language: 'fil', // Tagalog / Taglish default
    tier: 'browser', // 100% local default
    status: 'idle',
    segments: [],
    speakers: [],
    summary: '',
    meetingNotes: [],
    userNotes: '',
    bookmarks: [],
  });

  // Audio Playback State
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [rawChannelData, setRawChannelData] = useState<Float32Array | null>(null);

  // Status & Progress UI
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History sessions list
  const [savedSessions, setSavedSessions] = useState<
    Array<Omit<TranscriberSession, 'audioBlob' | 'audioUrl'>>
  >([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Right panel tab
  const [rightPanelTab, setRightPanelTab] = useState<
    'notes' | 'speakers' | 'bookmarks' | 'search'
  >('notes');

  // Probe Ollama connection on mount
  useEffect(() => {
    refreshSessionList();
    probeOllama();
  }, []);

  const probeOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 1200);
      if (res.status) {
        setOllamaStatus('connected');
        if (res.models && res.models.length > 0) {
          setInstalledModels(res.models);
          setSelectedModel((prev) => {
            if (prev) return prev;
            const preferred = res.models.find(
              (m) =>
                m.name.includes('llama3') ||
                m.name.includes('qwen') ||
                m.name.includes('mistral') ||
                m.name.includes('deepseek')
            ) || res.models[0];
            return preferred.name;
          });
        }
      } else {
        setOllamaStatus('offline');
      }
    } catch {
      setOllamaStatus('offline');
    }
  };

  // 1-Click Start Ollama Daemon (matches Data Studio)
  const handleStartOllama = async () => {
    setIsStartingOllama(true);
    try {
      await startOllamaDaemon();
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const check = await checkOllamaConnection(DEFAULT_OLLAMA_ENDPOINT, 800);
        if (check.status) {
          setOllamaStatus('connected');
          if (check.models && check.models.length > 0) {
            setInstalledModels(check.models);
            if (!selectedModel) setSelectedModel(check.models[0].name);
          }
          break;
        }
      }
    } catch (err) {
      console.error('Failed to start Ollama daemon:', err);
    } finally {
      setIsStartingOllama(false);
      probeOllama();
    }
  };

  // 1-Click Stop Ollama Daemon
  const handleStopOllama = async () => {
    setIsStoppingOllama(true);
    try {
      const res = await stopOllamaDaemon();
      if (res.stopped) {
        setOllamaStatus('offline');
      }
    } catch (err) {
      console.error('Failed to stop Ollama daemon:', err);
    } finally {
      setIsStoppingOllama(false);
      setTimeout(probeOllama, 800);
    }
  };

  const refreshSessionList = async () => {
    try {
      const list = await listSessions();
      setSavedSessions(list);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  // Auto-save session
  useEffect(() => {
    if (session.segments.length > 0 || session.userNotes) {
      saveSession({
        ...session,
        updatedAt: new Date().toISOString(),
      })
        .then(() => refreshSessionList())
        .catch(() => {});
    }
  }, [session.segments, session.meetingNotes, session.userNotes, session.title]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Space: Toggle Audio Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        const playBtn = document.querySelector(
          'button[title="Play"], button[title="Pause"]'
        ) as HTMLButtonElement;
        playBtn?.click();
      }

      // Cmd/Ctrl + B: Bookmark
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleAddBookmark(currentTime);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime]);

  // Handle Recording Completion (Receives 16kHz PCM Float32Array directly)
  const handleRecordingComplete = async (
    audioBlob: Blob,
    rawSamples: Float32Array,
    liveDraftText?: string
  ) => {
    setErrorMessage(null);
    const audioUrl = URL.createObjectURL(audioBlob);
    const duration = rawSamples.length / 16000;

    setRawChannelData(rawSamples);
    setWaveformPeaks(getAudioWaveform(rawSamples, 120));

    setSession((prev) => ({
      ...prev,
      audioBlob,
      audioUrl,
      duration,
      status: 'transcribing',
    }));

    try {
      await executeTranscription(rawSamples, duration, liveDraftText);
    } catch (err) {
      console.error('Transcription error:', err);
      const msg = err instanceof Error ? err.message : 'Transcription encountered an error.';
      setErrorMessage(msg);
      setSession((prev) => ({ ...prev, status: 'error', error: msg }));
    }
  };

  // Handle File Upload
  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    const fileNameClean = file.name.replace(/\.[^/.]+$/, '');
    const audioUrl = URL.createObjectURL(file);

    setSession((prev) => ({
      ...prev,
      title: fileNameClean,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      audioBlob: file,
      audioUrl,
      status: 'transcribing',
    }));

    try {
      setProgressStatus(`Decoding audio track from ${file.name}...`);
      setProgressPercent(15);

      const decoded = await decodeAudioFile(file);
      setRawChannelData(decoded.channelData);
      setWaveformPeaks(getAudioWaveform(decoded.channelData, 120));

      setSession((prev) => ({
        ...prev,
        duration: decoded.duration,
      }));

      await executeTranscription(decoded.channelData, decoded.duration);
    } catch (err) {
      console.error('File transcription error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to decode audio file.';
      setErrorMessage(msg);
      setSession((prev) => ({ ...prev, status: 'error', error: msg }));
    }
  };

  // Core local transcription runner
  const executeTranscription = async (
    channelData: Float32Array,
    duration: number,
    liveDraftText?: string
  ) => {
    setSession((prev) => ({ ...prev, status: 'transcribing' }));

    const result = await transcribeWithBrowser(
      channelData,
      session.language,
      'base',
      liveDraftText,
      ({ status, percentage }) => {
        setProgressStatus(status);
        setProgressPercent(percentage);
      }
    );

    const speakers = extractSpeakers(result.segments);

    setSession((prev) => ({
      ...prev,
      status: 'complete',
      segments: result.segments,
      speakers,
      summary: result.summary,
      modelUsed: 'Whisper Base (WebGPU Local)',
    }));

    setProgressPercent(100);
    setProgressStatus('');

    // Automatically generate local notes if segments exist
    if (result.segments.length > 0) {
      try {
        const notes = await generateMeetingNotesLocal(
          result.segments,
          ollamaStatus === 'connected' ? selectedModel : undefined
        );
        setSession((prev) => ({
          ...prev,
          summary: notes.summary || prev.summary,
          meetingNotes: notes.meetingNotes,
        }));
      } catch (notesErr) {
        console.warn('Initial notes generation skipped:', notesErr);
      }
    }
  };

  // Manual Notes Generation
  const handleGenerateNotes = async () => {
    if (session.segments.length === 0) return;
    setSession((prev) => ({ ...prev, status: 'generating_notes' }));

    try {
      const notes = await generateMeetingNotesLocal(
        session.segments,
        ollamaStatus === 'connected' ? selectedModel : undefined
      );
      setSession((prev) => ({
        ...prev,
        status: 'complete',
        summary: notes.summary,
        meetingNotes: notes.meetingNotes,
      }));
    } catch (err) {
      console.error('Failed to generate notes:', err);
      setSession((prev) => ({ ...prev, status: 'complete' }));
    }
  };

  // Segment editing handlers
  const handleUpdateSegment = (segmentId: string, newText: string) => {
    setSession((prev) => ({
      ...prev,
      segments: prev.segments.map((s) => {
        if (s.id === segmentId) {
          const originalText = s.originalText || s.text;
          return {
            ...s,
            text: newText,
            isEdited: true,
            originalText,
            revisionHistory: [
              ...s.revisionHistory,
              {
                timestamp: new Date().toISOString(),
                previousText: s.text,
                newText,
              },
            ],
          };
        }
        return s;
      }),
    }));
  };

  const handleRevertSegment = (segmentId: string) => {
    setSession((prev) => ({
      ...prev,
      segments: prev.segments.map((s) => {
        if (s.id === segmentId && s.originalText) {
          return {
            ...s,
            text: s.originalText,
            isEdited: false,
          };
        }
        return s;
      }),
    }));
  };

  const handleReassignSpeaker = (
    segmentId: string,
    newSpeakerId: string,
    newSpeakerLabel: string
  ) => {
    const updated = reassignSegmentSpeaker(
      session.segments,
      segmentId,
      newSpeakerId,
      newSpeakerLabel
    );
    const speakers = extractSpeakers(updated);
    setSession((prev) => ({ ...prev, segments: updated, speakers }));
  };

  const handleMergeWithPrevious = (segmentIndex: number) => {
    if (segmentIndex <= 0) return;
    setSession((prev) => {
      const prevSeg = prev.segments[segmentIndex - 1];
      const curSeg = prev.segments[segmentIndex];
      const mergedSeg: TranscriptSegment = {
        ...prevSeg,
        text: `${prevSeg.text} ${curSeg.text}`,
        endTime: curSeg.endTime,
        isEdited: true,
      };

      const newSegments = [...prev.segments];
      newSegments.splice(segmentIndex - 1, 2, mergedSeg);
      return { ...prev, segments: newSegments };
    });
  };

  // Speaker Manager Handlers
  const handleRenameSpeaker = (speakerId: string, newLabel: string) => {
    setSession((prev) => {
      const updatedSegments = prev.segments.map((s) =>
        s.speakerId === speakerId ? { ...s, speakerLabel: newLabel } : s
      );
      const updatedSpeakers = prev.speakers.map((spk) =>
        spk.id === speakerId ? { ...spk, label: newLabel } : spk
      );
      return {
        ...prev,
        segments: updatedSegments,
        speakers: updatedSpeakers,
      };
    });
  };

  const handleMergeSpeakers = (
    targetSpeakerId: string,
    sourceSpeakerId: string
  ) => {
    const targetSpk = session.speakers.find((s) => s.id === targetSpeakerId);
    if (!targetSpk) return;

    const updated = mergeSpeakersInTranscript(
      session.segments,
      targetSpeakerId,
      targetSpk.label,
      sourceSpeakerId
    );
    const speakers = extractSpeakers(updated);
    setSession((prev) => ({ ...prev, segments: updated, speakers }));
  };

  // Bookmarking Handlers
  const handleAddBookmark = (time: number) => {
    const newBm: Bookmark = {
      id: crypto.randomUUID(),
      timestamp: time,
      label: `Marker @ ${Math.floor(time)}s`,
    };
    setSession((prev) => ({
      ...prev,
      bookmarks: [...prev.bookmarks, newBm],
    }));
  };

  const handleDeleteBookmark = (id: string) => {
    setSession((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.filter((b) => b.id !== id),
    }));
  };

  // Action Items checkbox
  const handleToggleActionItem = (id: string) => {
    setSession((prev) => ({
      ...prev,
      meetingNotes: prev.meetingNotes.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      ),
    }));
  };

  // Load a session from History
  const handleLoadSession = async (id: string) => {
    const loaded = await loadSession(id);
    if (loaded) {
      setSession(loaded);
      if (loaded.audioBlob) {
        const decoded = await decodeAudioFile(loaded.audioBlob);
        setRawChannelData(decoded.channelData);
        setWaveformPeaks(getAudioWaveform(decoded.channelData, 120));
      }
    }
  };

  // Export handlers
  const handleExport = (format: 'txt' | 'md' | 'srt' | 'vtt' | 'json') => {
    const baseName =
      session.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'meeting_transcript';
    switch (format) {
      case 'txt':
        downloadFile(exportToTXT(session), `${baseName}.txt`, 'text/plain');
        break;
      case 'md':
        downloadFile(
          exportToMarkdown(session),
          `${baseName}.md`,
          'text/markdown'
        );
        break;
      case 'srt':
        downloadFile(
          exportToSRT(session),
          `${baseName}.srt`,
          'application/x-subrip'
        );
        break;
      case 'vtt':
        downloadFile(exportToVTT(session), `${baseName}.vtt`, 'text/vtt');
        break;
      case 'json':
        downloadFile(
          exportToJSON(session),
          `${baseName}.json`,
          'application/json'
        );
        break;
    }
  };

  // Benchmark runner
  const handleRunBenchmark = async (tier: TranscriptionTier): Promise<BenchmarkResult> => {
    if (!rawChannelData || session.duration <= 0) {
      throw new Error('Please record or load an audio file first to benchmark.');
    }
    return await runTierBenchmark(rawChannelData, session.duration, tier);
  };

  // Reset to New Session
  const handleNewSession = () => {
    setSession({
      id: crypto.randomUUID(),
      title: 'Local Meeting Recording',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: 0,
      language: 'fil',
      tier: 'browser',
      status: 'idle',
      segments: [],
      speakers: [],
      summary: '',
      meetingNotes: [],
      userNotes: '',
      bookmarks: [],
    });
    setWaveformPeaks([]);
    setRawChannelData(null);
    setCurrentTime(0);
    setErrorMessage(null);
  };

  return (
    <SidebarProvider open={openSidebar} setOpen={setOpenSidebar}>
      <div className="flex h-screen w-screen overflow-hidden bg-neutral-100/50 text-neutral-900 antialiased dark:bg-[#0c0c0c] dark:text-neutral-100">
        {/* LEFT APP SIDEBAR */}
        <Sidebar>
          <SidebarBody className="flex flex-col justify-between border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#111111]">
            <div className="flex flex-1 flex-col overflow-y-auto">
              {/* Back to Resursee Hub Link */}
              <div className="mb-4">
                <SidebarLink
                  link={{
                    label: 'Back to Apps',
                    href: '/',
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
              <div className="mb-6 px-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                    <Microphone size={16} weight="bold" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-white">
                      AI Transcriber
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">
                      100% Client-Side & Local
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="space-y-1">
                <SidebarLink
                  link={{
                    label: 'Record Mic',
                    onClick: () => setActiveTab('record'),
                    icon: (
                      <Microphone
                        size={18}
                        weight={activeTab === 'record' ? 'fill' : 'regular'}
                      />
                    ),
                    isActive: activeTab === 'record',
                  }}
                />
                <SidebarLink
                  link={{
                    label: 'Import File',
                    onClick: () => setActiveTab('import'),
                    icon: (
                      <UploadSimple
                        size={18}
                        weight={activeTab === 'import' ? 'bold' : 'regular'}
                      />
                    ),
                    isActive: activeTab === 'import',
                  }}
                />
                <SidebarLink
                  link={{
                    label: 'Session History',
                    onClick: () => setActiveTab('history'),
                    icon: (
                      <ClockCounterClockwise
                        size={18}
                        weight={activeTab === 'history' ? 'bold' : 'regular'}
                      />
                    ),
                    badge: savedSessions.length || undefined,
                    isActive: activeTab === 'history',
                  }}
                />
                <SidebarLink
                  link={{
                    label: 'Export Formats',
                    onClick: () => setActiveTab('export'),
                    icon: (
                      <Export
                        size={18}
                        weight={activeTab === 'export' ? 'bold' : 'regular'}
                      />
                    ),
                    isActive: activeTab === 'export',
                  }}
                />
                {uiMode === 'advanced' && (
                  <>
                    <SidebarLink
                      link={{
                        label: 'Local Engines & Ollama',
                        onClick: () => setActiveTab('models'),
                        icon: (
                          <Cpu
                            size={18}
                            weight={activeTab === 'models' ? 'bold' : 'regular'}
                          />
                        ),
                        isActive: activeTab === 'models',
                      }}
                    />
                    <SidebarLink
                      link={{
                        label: 'Speed Benchmark',
                        onClick: () => setActiveTab('benchmark'),
                        icon: (
                          <Lightning
                            size={18}
                            weight={activeTab === 'benchmark' ? 'bold' : 'regular'}
                          />
                        ),
                        isActive: activeTab === 'benchmark',
                      }}
                    />
                    <SidebarLink
                      link={{
                        label: 'Settings',
                        onClick: () => setActiveTab('settings'),
                        icon: (
                          <Gear
                            size={18}
                            weight={activeTab === 'settings' ? 'bold' : 'regular'}
                          />
                        ),
                        isActive: activeTab === 'settings',
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Sidebar Bottom Controls */}
            <div className="border-t border-neutral-200 pt-3 mt-auto space-y-2.5 dark:border-neutral-800">
              {/* Ollama Status Strip (Click to Start / Stop) */}
              <div
                onClick={() => {
                  if (ollamaStatus === 'connected') {
                    handleStopOllama();
                  } else {
                    handleStartOllama();
                  }
                }}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-2 transition-all hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/80"
                title={
                  ollamaStatus === 'connected'
                    ? 'Click to stop local Ollama background daemon'
                    : 'Click to start local Ollama background daemon'
                }
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      ollamaStatus === 'connected'
                        ? 'bg-neutral-900 dark:bg-white'
                        : isStartingOllama || isStoppingOllama || ollamaStatus === 'checking'
                        ? 'bg-neutral-400 animate-pulse'
                        : 'bg-neutral-400'
                    }`}
                  />
                  <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                    {isStartingOllama
                      ? 'Starting...'
                      : isStoppingOllama
                      ? 'Stopping...'
                      : ollamaStatus === 'connected'
                      ? `Ollama (${installedModels.length} models)`
                      : 'Ollama Standby'}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white">
                  {ollamaStatus === 'connected' ? 'Stop' : 'Start'}
                </span>
              </div>

              {/* UI Mode Toggle: Simple vs Advanced */}
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Mode:</span>
                <button
                  type="button"
                  onClick={() =>
                    setUiMode(uiMode === 'simple' ? 'advanced' : 'simple')
                  }
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  {uiMode === 'simple' ? 'Simple' : 'Advanced'}
                </button>
              </div>

              {/* Theme Toggle & New Session Button */}
              <div className="flex items-center justify-between px-1">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={handleNewSession}
                  className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  title="Start New Session"
                >
                  <Plus size={13} weight="bold" />
                  <span>New</span>
                </button>
              </div>
            </div>
          </SidebarBody>
        </Sidebar>

        {/* MAIN APPLICATION WORKSPACE */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* TOP APP BAR */}
          <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6 dark:border-neutral-800 dark:bg-[#121212] min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
              <input
                type="text"
                value={session.title}
                onChange={(e) =>
                  setSession((prev) => ({ ...prev, title: e.target.value }))
                }
                className="rounded-md border-none bg-transparent font-semibold text-xs sm:text-sm text-neutral-900 focus:bg-neutral-100 focus:outline-none dark:text-white dark:focus:bg-neutral-800 truncate min-w-0"
                placeholder="Meeting Title..."
              />
              <span className="hidden font-mono text-xs text-neutral-400 md:inline shrink-0">
                • {new Date(session.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Header Right Actions: Ollama Status, Language, and Panel Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Ollama 1-Click Start/Stop Button */}
              {ollamaStatus === 'connected' ? (
                <button
                  type="button"
                  onClick={handleStopOllama}
                  disabled={isStoppingOllama}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                  title="Stop local Ollama daemon"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                  <Stop size={12} weight="fill" />
                  <span className="hidden sm:inline">Stop Ollama</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartOllama}
                  disabled={isStartingOllama}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 cursor-pointer"
                  title="Launch local Ollama daemon"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                  <Play size={12} weight="fill" />
                  <span className="hidden sm:inline">
                    {isStartingOllama ? 'Starting...' : 'Start Ollama'}
                  </span>
                </button>
              )}

              {/* Language Indicator */}
              <span className="hidden sm:inline-flex rounded-md border border-neutral-200 bg-neutral-100 px-2.5 py-1 font-mono text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-[#1a1a1a] dark:text-neutral-300">
                {session.language === 'fil'
                  ? 'Tagalog / Taglish'
                  : session.language.toUpperCase()}
              </span>

              {/* Responsive Drawer Toggle Button for Small/Medium Screens */}
              <button
                type="button"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 lg:hidden dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                title="Toggle Notes & Search Panel"
              >
                <Sparkle size={14} weight="bold" />
                <span>Panel</span>
              </button>
            </div>
          </header>

          {/* ERROR NOTIFICATION BANNER */}
          {errorMessage && (
            <div className="flex items-center justify-between border-b border-neutral-300 bg-neutral-200/80 px-4 sm:px-6 py-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              <div className="flex items-center gap-2">
                <WarningCircle size={15} weight="bold" className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* CENTER + RIGHT PANELS GRID */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* CENTER WORKSPACE */}
            <main className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6 min-w-0">
              {/* SIDEBAR TAB SECTIONS */}
              {activeTab === 'record' && session.segments.length === 0 && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                      Live Microphone Recording
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Record speech directly in your browser. Pause and resume smoothly; gaps are not included in the file.
                    </p>
                  </div>
                  <RecordingControls
                    onRecordingComplete={handleRecordingComplete}
                    isProcessing={session.status === 'transcribing'}
                  />
                </div>
              )}

              {activeTab === 'import' && session.segments.length === 0 && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                      Local Media File Import
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Drop an MP3, WAV, M4A, AIFF, MP4, or MOV file for speech transcription and turn diarization.
                    </p>
                  </div>
                  <FileDropZone
                    onFileSelect={handleFileSelect}
                    isProcessing={session.status === 'transcribing'}
                  />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]">
                  <h2 className="mb-3 text-base font-bold text-neutral-900 dark:text-white">
                    Saved Sessions ({savedSessions.length})
                  </h2>
                  <div className="space-y-2">
                    {savedSessions.length === 0 ? (
                      <p className="text-xs text-neutral-400">
                        No saved sessions yet. Transcribed recordings are saved automatically to your device.
                      </p>
                    ) : (
                      savedSessions.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#141414] dark:hover:border-neutral-700"
                        >
                          <div className="min-w-0 mr-2">
                            <div className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                              {s.title}
                            </div>
                            <div className="font-mono text-[10px] text-neutral-400">
                              {new Date(s.createdAt).toLocaleString()} • {s.segments.length} turns
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleLoadSession(s.id)}
                              className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteSession(s.id);
                                refreshSessionList();
                              }}
                              className="rounded-md border border-neutral-200 p-1 text-neutral-500 hover:text-neutral-900 dark:border-neutral-800 dark:hover:text-white"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]">
                  <h2 className="mb-2 text-base font-bold text-neutral-900 dark:text-white">
                    Export Transcripts & Meeting Intelligence
                  </h2>
                  <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
                    Download this session directly to your device:
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {[
                      { id: 'txt', title: 'Plain Text (.txt)', desc: 'Speaker turns & times' },
                      { id: 'md', title: 'Markdown (.md)', desc: 'Summary + Notes + Dialog' },
                      { id: 'srt', title: 'SubRip (.srt)', desc: 'Video subtitles' },
                      { id: 'vtt', title: 'WebVTT (.vtt)', desc: 'Web video cues' },
                      { id: 'json', title: 'JSON (.json)', desc: 'Lossless raw payload' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => handleExport(fmt.id as any)}
                        disabled={session.segments.length === 0}
                        className="flex flex-col items-start rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-left transition hover:border-neutral-900 disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-400 cursor-pointer"
                      >
                        <Export size={18} className="mb-1 text-neutral-700 dark:text-neutral-300" />
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white">
                          {fmt.title}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {fmt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'models' && uiMode === 'advanced' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]">
                  <h2 className="mb-2 text-base font-bold text-neutral-900 dark:text-white">
                    Local Engines & Ollama Integration
                  </h2>
                  <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
                    100% private, on-device transcription and meeting note synthesis.
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
                    <div
                      onClick={() =>
                        setSession((prev) => ({ ...prev, tier: 'browser' }))
                      }
                      className={`flex flex-col items-start rounded-xl border p-4 text-left cursor-pointer transition ${
                        session.tier === 'browser'
                          ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900'
                          : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414]'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                        <span>🟢 Browser Engine (Transformers.js WebGPU)</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Runs Whisper ONNX in your browser tab with WebGPU hardware acceleration. Zero setup required.
                      </p>
                    </div>

                    <div
                      onClick={() =>
                        setSession((prev) => ({ ...prev, tier: 'local' }))
                      }
                      className={`flex flex-col items-start rounded-xl border p-4 text-left cursor-pointer transition ${
                        session.tier === 'local'
                          ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900'
                          : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414]'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                        <span>🟡 Local Ollama Engine (localhost:11434)</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Uses your local Ollama daemon for meeting intelligence, summaries, and action item synthesis.
                      </p>
                    </div>
                  </div>

                  {/* Local Model Selector */}
                  {installedModels.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Selected Ollama Model:
                      </span>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      >
                        {installedModels.map((m) => (
                          <option key={m.name} value={m.name}>
                            {m.name} ({m.details?.parameter_size || 'LLM'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'benchmark' && uiMode === 'advanced' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]">
                  <BenchmarkRunner
                    currentTier={session.tier}
                    onRunBenchmark={handleRunBenchmark}
                  />
                </div>
              )}

              {activeTab === 'settings' && uiMode === 'advanced' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]">
                  <h2 className="mb-3 text-base font-bold text-neutral-900 dark:text-white">
                    Spoken Language & Detection
                  </h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() =>
                          setSession((prev) => ({
                            ...prev,
                            language: lang.code,
                          }))
                        }
                        className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition cursor-pointer ${
                          session.language === lang.code
                            ? 'border-neutral-900 bg-neutral-100 font-bold dark:border-white dark:bg-neutral-800'
                            : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414]'
                        }`}
                      >
                        <span className="text-xs text-neutral-900 dark:text-white">
                          {lang.label}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          {lang.nativeLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AUDIO PLAYER & WAVEFORM SCRUBBER */}
              {session.duration > 0 && (
                <div className="mb-6">
                  <AudioPlayer
                    audioUrl={session.audioUrl}
                    duration={session.duration}
                    currentTime={currentTime}
                    onTimeUpdate={setCurrentTime}
                    onSeek={setCurrentTime}
                    onAddBookmark={handleAddBookmark}
                    waveformPeaks={waveformPeaks}
                  />
                </div>
              )}

              {/* TRANSCRIPT EDITOR (Feed) */}
              <div className="flex-1 min-w-0">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      Meeting Transcript
                    </h3>
                    <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[11px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                      {session.segments.length} {session.segments.length === 1 ? 'turn' : 'turns'}
                    </span>
                  </div>

                  {session.segments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleExport('md')}
                      className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    >
                      <Export size={13} />
                      <span>Download .md</span>
                    </button>
                  )}
                </div>

                <TranscriptEditor
                  segments={session.segments}
                  speakers={session.speakers}
                  currentTime={currentTime}
                  onSeek={setCurrentTime}
                  onUpdateSegment={handleUpdateSegment}
                  onRevertSegment={handleRevertSegment}
                  onReassignSpeaker={handleReassignSpeaker}
                  onMergeWithPrevious={handleMergeWithPrevious}
                  searchQuery={searchQuery}
                />
              </div>
            </main>

            {/* RIGHT SIDE PANEL (Desktop persistent column) */}
            <aside className="hidden lg:flex w-80 2xl:w-96 flex-col border-l border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#111111] shrink-0 min-w-0">
              {/* Panel Tabs */}
              <div className="mb-4 flex items-center gap-1 border-b border-neutral-200 pb-2 dark:border-neutral-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('notes')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    rightPanelTab === 'notes'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkle size={13} weight="bold" />
                  <span>Notes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightPanelTab('speakers')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    rightPanelTab === 'speakers'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <User size={13} weight="bold" />
                  <span>Speakers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightPanelTab('bookmarks')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    rightPanelTab === 'bookmarks'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <BookmarkSimple size={13} weight="bold" />
                  <span>Marks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightPanelTab('search')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    rightPanelTab === 'search'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <MagnifyingGlass size={13} weight="bold" />
                  <span>Search</span>
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto min-w-0">
                {rightPanelTab === 'notes' && (
                  <MeetingNotes
                    summary={session.summary}
                    meetingNotes={session.meetingNotes}
                    userNotes={session.userNotes}
                    onUpdateUserNotes={(userNotes) =>
                      setSession((prev) => ({ ...prev, userNotes }))
                    }
                    onToggleActionItem={handleToggleActionItem}
                    onSeek={setCurrentTime}
                    onGenerateNotes={handleGenerateNotes}
                    isGenerating={session.status === 'generating_notes'}
                  />
                )}

                {rightPanelTab === 'speakers' && (
                  <SpeakerManager
                    speakers={session.speakers}
                    onRenameSpeaker={handleRenameSpeaker}
                    onMergeSpeakers={handleMergeSpeakers}
                  />
                )}

                {rightPanelTab === 'bookmarks' && (
                  <div className="space-y-2 min-w-0">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      <span>Markers ({session.bookmarks.length})</span>
                    </div>
                    {session.bookmarks.length === 0 ? (
                      <p className="text-xs text-neutral-400">
                        Press ⌘B or click &quot;Bookmark&quot; to place timeline markers.
                      </p>
                    ) : (
                      session.bookmarks.map((bm) => (
                        <div
                          key={bm.id}
                          className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-2 text-xs dark:border-neutral-800 dark:bg-[#141414] min-w-0"
                        >
                          <button
                            type="button"
                            onClick={() => setCurrentTime(bm.timestamp)}
                            className="flex items-center gap-2 text-neutral-800 hover:underline dark:text-neutral-200 truncate min-w-0 mr-2"
                          >
                            <BookmarkSimple size={14} weight="bold" className="shrink-0" />
                            <span className="truncate">{bm.label}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBookmark(bm.id)}
                            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white shrink-0"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {rightPanelTab === 'search' && (
                  <TranscriberSearch
                    segments={session.segments}
                    meetingNotes={session.meetingNotes}
                    bookmarks={session.bookmarks}
                    onSeek={setCurrentTime}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                  />
                )}
              </div>
            </aside>

            {/* MOBILE & TABLET RESPONSIVE OVERLAY DRAWER */}
            {rightPanelOpen && (
              <div className="fixed inset-0 z-50 flex lg:hidden">
                <div
                  className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
                  onClick={() => setRightPanelOpen(false)}
                />
                <aside className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white p-4 shadow-2xl dark:bg-[#121212] min-w-0 z-10">
                  {/* Drawer Header */}
                  <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-2 dark:border-neutral-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      Intelligence & Notes
                    </span>
                    <button
                      type="button"
                      onClick={() => setRightPanelOpen(false)}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white cursor-pointer"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>

                  {/* Drawer Tabs */}
                  <div className="mb-4 flex items-center gap-1 border-b border-neutral-200 pb-2 dark:border-neutral-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRightPanelTab('notes')}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
                        rightPanelTab === 'notes'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'text-neutral-500'
                      }`}
                    >
                      <Sparkle size={12} weight="bold" />
                      <span>Notes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPanelTab('speakers')}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
                        rightPanelTab === 'speakers'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'text-neutral-500'
                      }`}
                    >
                      <User size={12} weight="bold" />
                      <span>Speakers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPanelTab('bookmarks')}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
                        rightPanelTab === 'bookmarks'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'text-neutral-500'
                      }`}
                    >
                      <BookmarkSimple size={12} weight="bold" />
                      <span>Marks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPanelTab('search')}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
                        rightPanelTab === 'search'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                          : 'text-neutral-500'
                      }`}
                    >
                      <MagnifyingGlass size={12} weight="bold" />
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto min-w-0">
                    {rightPanelTab === 'notes' && (
                      <MeetingNotes
                        summary={session.summary}
                        meetingNotes={session.meetingNotes}
                        userNotes={session.userNotes}
                        onUpdateUserNotes={(userNotes) =>
                          setSession((prev) => ({ ...prev, userNotes }))
                        }
                        onToggleActionItem={handleToggleActionItem}
                        onSeek={(t) => {
                          setCurrentTime(t);
                          setRightPanelOpen(false);
                        }}
                        onGenerateNotes={handleGenerateNotes}
                        isGenerating={session.status === 'generating_notes'}
                      />
                    )}

                    {rightPanelTab === 'speakers' && (
                      <SpeakerManager
                        speakers={session.speakers}
                        onRenameSpeaker={handleRenameSpeaker}
                        onMergeSpeakers={handleMergeSpeakers}
                      />
                    )}

                    {rightPanelTab === 'bookmarks' && (
                      <div className="space-y-2">
                        {session.bookmarks.length === 0 ? (
                          <p className="text-xs text-neutral-400">
                            No markers created yet.
                          </p>
                        ) : (
                          session.bookmarks.map((bm) => (
                            <div
                              key={bm.id}
                              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-2 text-xs dark:border-neutral-800 dark:bg-[#141414]"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentTime(bm.timestamp);
                                  setRightPanelOpen(false);
                                }}
                                className="flex items-center gap-2 text-neutral-800 truncate"
                              >
                                <BookmarkSimple size={14} weight="bold" />
                                <span className="truncate">{bm.label}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBookmark(bm.id)}
                                className="text-neutral-400"
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {rightPanelTab === 'search' && (
                      <TranscriberSearch
                        segments={session.segments}
                        meetingNotes={session.meetingNotes}
                        bookmarks={session.bookmarks}
                        onSeek={(t) => {
                          setCurrentTime(t);
                          setRightPanelOpen(false);
                        }}
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                      />
                    )}
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
