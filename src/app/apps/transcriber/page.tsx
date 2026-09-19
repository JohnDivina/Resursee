'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from '@/components/ui/sidebar';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
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
  FileText,
  ArrowsClockwise,
  DownloadSimple,
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
  CuratedModelTier,
  CuratedSpeechModel,
  CURATED_SPEECH_MODELS,
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

  // Curated OpenAI Whisper model state
  const [curatedModelId, setCuratedModelId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('resursee_curated_whisper_model') || 'large-v3-turbo';
      } catch {}
    }
    return 'large-v3-turbo';
  });
  const [selectedQualityTab, setSelectedQualityTab] = useState<CuratedModelTier | 'all'>('balanced');

  const handleSelectCuratedModel = (modelId: string) => {
    setCuratedModelId(modelId);
    try {
      localStorage.setItem('resursee_curated_whisper_model', modelId);
    } catch {}
  };

  const activeCuratedModel =
    CURATED_SPEECH_MODELS.find((m) => m.id === curatedModelId) ||
    CURATED_SPEECH_MODELS[0];

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

  // Handle Recording Completion
  const handleRecordingComplete = async (
    audioBlob: Blob,
    rawSamples: Float32Array,
    duration: number,
    liveDraftText?: string
  ) => {
    setErrorMessage(null);
    const audioUrl = URL.createObjectURL(audioBlob);

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
      await executeTranscription(rawSamples, duration, liveDraftText, audioBlob);
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

      await executeTranscription(decoded.channelData, decoded.duration, undefined, file);
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
    liveDraftText?: string,
    audioBlob?: Blob
  ) => {
    setSession((prev) => ({ ...prev, status: 'transcribing' }));

    try {
      const result = await transcribeWithBrowser(
        channelData,
        session.language,
        curatedModelId,
        liveDraftText,
        ({ status, percentage }) => {
          setProgressStatus(status);
          setProgressPercent(percentage);
        },
        audioBlob || session.audioBlob,
        curatedModelId
      );

      const speakers = extractSpeakers(result.segments);

      setSession((prev) => ({
        ...prev,
        status: 'complete',
        segments: result.segments,
        speakers,
        summary: result.summary || prev.summary,
        meetingNotes: result.meetingNotes.length > 0 ? result.meetingNotes : prev.meetingNotes,
        modelUsed: liveDraftText
          ? 'Live Speech Recognition'
          : result.summary
          ? `OpenAI Whisper (${activeCuratedModel.name})`
          : `Whisper (${activeCuratedModel.name})`,
      }));

      setProgressPercent(100);
      setProgressStatus('');

      // Automatically generate local notes if segments exist and notes were not already populated
      if (result.segments.length > 0 && (!result.meetingNotes || result.meetingNotes.length === 0)) {
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
    } catch (err: any) {
      console.error('Transcription execution error:', err);
      const msg = err?.message || 'Transcription failed.';
      setErrorMessage(msg);
      setSession((prev) => ({ ...prev, status: 'error', error: msg }));
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
  const handleExport = (format: 'txt' | 'md' | 'srt' | 'vtt' | 'json' | 'wav') => {
    const baseName =
      session.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'meeting_transcript';
    switch (format) {
      case 'wav':
        if (session.audioBlob) {
          const url = URL.createObjectURL(session.audioBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseName}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else if (session.audioUrl) {
          const a = document.createElement('a');
          a.href = session.audioUrl;
          a.download = `${baseName}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        break;
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

  // Mobile Brand Header (for responsive mobile top navbar)
  const mobileBrand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-xs">
        <Microphone size={16} weight="bold" />
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-xs text-neutral-900 dark:text-white leading-none">
          AI Transcriber
        </span>
        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
          100% Client-Side &amp; Local
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-neutral-100/60 text-neutral-900 antialiased dark:bg-[#0c0c0c]/80 dark:text-neutral-100 backdrop-blur-xs">
      {/* LEFT APP SIDEBAR */}
      <Sidebar open={openSidebar} setOpen={setOpenSidebar} animate={true}>
        <SidebarBody brand={mobileBrand} className="justify-between gap-6 border-r border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-[#111111]/85 backdrop-blur-md">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
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
            <div className="mb-6 px-1">
              <div className="flex items-center gap-2.5 py-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
                  <Microphone size={16} weight="bold" />
                </div>
                <motion.div
                  animate={{
                    display: openSidebar ? 'flex' : 'none',
                    opacity: openSidebar ? 1 : 0,
                  }}
                  className="flex flex-col truncate min-w-0"
                >
                  <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                    AI Transcriber
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400 truncate">
                    100% Client-Side &amp; Local
                  </span>
                </motion.div>
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
                className={cn(
                  'group flex cursor-pointer items-center rounded-xl border border-neutral-200 bg-neutral-50 p-2 transition-all hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/80',
                  openSidebar ? 'justify-between' : 'justify-center'
                )}
                title={
                  ollamaStatus === 'connected'
                    ? 'Click to stop local Ollama background daemon'
                    : 'Click to start local Ollama background daemon'
                }
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      ollamaStatus === 'connected'
                        ? 'bg-neutral-900 dark:bg-white'
                        : isStartingOllama || isStoppingOllama || ollamaStatus === 'checking'
                        ? 'bg-neutral-400 animate-pulse'
                        : 'bg-neutral-400'
                    }`}
                  />
                  <motion.span
                    animate={{
                      display: openSidebar ? 'inline-block' : 'none',
                      opacity: openSidebar ? 1 : 0,
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
                    display: openSidebar ? 'inline-block' : 'none',
                    opacity: openSidebar ? 1 : 0,
                  }}
                  className="font-mono text-[10px] text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"
                >
                  {ollamaStatus === 'connected' ? 'Stop' : 'Start'}
                </motion.span>
              </div>

              {/* UI Mode Toggle: Simple vs Advanced */}
              <motion.div
                animate={{
                  display: openSidebar ? 'flex' : 'none',
                  opacity: openSidebar ? 1 : 0,
                }}
                className="items-center justify-between px-1 text-xs"
              >
                <span className="text-neutral-500 dark:text-neutral-400">Mode:</span>
                <button
                  type="button"
                  onClick={() =>
                    setUiMode(uiMode === 'simple' ? 'advanced' : 'simple')
                  }
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 cursor-pointer"
                >
                  {uiMode === 'simple' ? 'Simple' : 'Advanced'}
                </button>
              </motion.div>

              {/* Theme Toggle & New Session Button */}
              <div
                className={cn(
                  'flex items-center px-1',
                  openSidebar ? 'justify-between' : 'justify-center'
                )}
              >
                <ThemeToggle />
                <motion.button
                  animate={{
                    display: openSidebar ? 'flex' : 'none',
                    opacity: openSidebar ? 1 : 0,
                  }}
                  type="button"
                  onClick={handleNewSession}
                  className="items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                  title="Start New Session"
                >
                  <Plus size={13} weight="bold" />
                  <span>New</span>
                </motion.button>
              </div>
            </div>
          </SidebarBody>
        </Sidebar>

        {/* MAIN APPLICATION WORKSPACE */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* TOP APP BAR */}
          <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 sm:px-6 dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md min-w-0">
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
              {activeTab === 'record' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                        Live Microphone Recording
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Record speech directly in your browser or desktop app. Audio is processed with live speech recognition and AI turn diarization.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleNewSession}
                      className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>Start Fresh Session</span>
                    </button>
                  </div>

                  {/* Curated Model Selection Pill / Quality Bar */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Cpu size={14} weight="bold" className="text-neutral-700 dark:text-neutral-300" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Whisper Model:
                      </span>
                      <span className="font-mono text-[11px] font-bold text-neutral-900 dark:text-white">
                        {activeCuratedModel.name}
                      </span>
                      <span className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {activeCuratedModel.tierLabel} • {activeCuratedModel.params}
                      </span>
                      <span className="hidden sm:inline rounded-md bg-neutral-200/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        100% Free &amp; Local
                      </span>
                    </div>

                    {/* Quick Tier Switcher */}
                    <div className="flex items-center gap-1">
                      {(['fast', 'balanced', 'accurate'] as const).map((tier) => {
                        const targetModel = CURATED_SPEECH_MODELS.find((m) => m.tier === tier);
                        const isActive = activeCuratedModel.tier === tier;
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => targetModel && handleSelectCuratedModel(targetModel.id)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                              isActive
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                                : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <RecordingControls
                    onRecordingComplete={handleRecordingComplete}
                    isProcessing={session.status === 'transcribing'}
                    language={session.language}
                  />
                </div>
              )}

              {activeTab === 'import' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                        Local Media File Import
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Drop an MP3, WAV, M4A, AIFF, MP4, or MOV file for speech transcription and turn diarization.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleNewSession}
                      className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      <Plus size={14} weight="bold" />
                      <span>Start Fresh Session</span>
                    </button>
                  </div>

                  {/* Curated Model Selection Pill / Quality Bar */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Cpu size={14} weight="bold" className="text-neutral-700 dark:text-neutral-300" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Whisper Model:
                      </span>
                      <span className="font-mono text-[11px] font-bold text-neutral-900 dark:text-white">
                        {activeCuratedModel.name}
                      </span>
                      <span className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {activeCuratedModel.tierLabel} • {activeCuratedModel.params}
                      </span>
                      <span className="hidden sm:inline rounded-md bg-neutral-200/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        100% Free &amp; Local
                      </span>
                    </div>

                    {/* Quick Tier Switcher */}
                    <div className="flex items-center gap-1">
                      {(['fast', 'balanced', 'accurate'] as const).map((tier) => {
                        const targetModel = CURATED_SPEECH_MODELS.find((m) => m.tier === tier);
                        const isActive = activeCuratedModel.tier === tier;
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => targetModel && handleSelectCuratedModel(targetModel.id)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                              isActive
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                                : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <FileDropZone
                    onFileSelect={handleFileSelect}
                    isProcessing={session.status === 'transcribing'}
                  />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
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
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
                  <h2 className="mb-2 text-base font-bold text-neutral-900 dark:text-white">
                    Export Transcripts & Meeting Intelligence
                  </h2>
                  <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
                    Download this session directly to your device:
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                    {[
                      { id: 'wav', title: 'Audio (.wav)', desc: 'Universal 16kHz PCM audio', disabled: !session.audioBlob && !session.audioUrl },
                      { id: 'txt', title: 'Plain Text (.txt)', desc: 'Speaker turns & times', disabled: session.segments.length === 0 },
                      { id: 'md', title: 'Markdown (.md)', desc: 'Summary + Notes + Dialog', disabled: session.segments.length === 0 },
                      { id: 'srt', title: 'SubRip (.srt)', desc: 'Video subtitles', disabled: session.segments.length === 0 },
                      { id: 'vtt', title: 'WebVTT (.vtt)', desc: 'Web video cues', disabled: session.segments.length === 0 },
                      { id: 'json', title: 'JSON (.json)', desc: 'Lossless raw payload', disabled: session.segments.length === 0 },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => handleExport(fmt.id as any)}
                        disabled={fmt.disabled}
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
                <div className="mb-6 space-y-6">
                  {/* Architectural Clarification Card */}
                  <div className="rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu size={18} weight="bold" className="text-neutral-900 dark:text-white" />
                      <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                        AI Engine Architecture &amp; Roles
                      </h2>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                      Resursee uses two completely separate, independent engines. OpenAI Whisper handles audio transcription, while Ollama handles text summarization.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <Microphone size={15} weight="bold" /> 1. Speech-to-Text Engine
                          </span>
                          <span className="rounded-md border border-neutral-300 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                            Independent Engine
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          Powered by <strong>OpenAI Whisper</strong> on-device via WebGPU / ONNX WebAssembly. It runs directly in your app/browser to convert audio waveforms into text. <strong>It does NOT run inside or require Ollama.</strong>
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <FileText size={15} weight="bold" /> 2. Meeting Notes LLM
                          </span>
                          <span className="rounded-md border border-neutral-300 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                            Text LLM Only
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          Powered by <strong>Ollama</strong> (e.g. Llama 3, Mistral, Qwen) or our built-in summarizer. Ollama does not process audio files; it strictly reads the completed transcript text to synthesize action items and executive summaries.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Speech-to-Text Engine (OpenAI Whisper) */}
                  <div className="rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Speech-to-Text Models (OpenAI Whisper)
                          </h2>
                          <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            On-Device WebGPU
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Curated OpenAI Whisper open-source models for on-device Filipino-English (Taglish) and multilingual conversations. Runs independently of Ollama.
                        </p>
                      </div>
                    </div>

                    {/* Quality Switcher */}
                    <div className="mb-6 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Speech Quality Preset
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-white">
                          Model Preset
                        </span>

                        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-800">
                          {(['fast', 'balanced', 'accurate'] as const).map((tier) => {
                            const targetModel = CURATED_SPEECH_MODELS.find((m) => m.tier === tier);
                            const isActive = activeCuratedModel.tier === tier;
                            return (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => {
                                  setSelectedQualityTab(tier);
                                  if (targetModel) handleSelectCuratedModel(targetModel.id);
                                }}
                                className={`rounded-md px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                                  isActive
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                              >
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active Model Description Card */}
                      <div className="rounded-xl border border-neutral-200 bg-white p-3.5 text-xs dark:border-neutral-800 dark:bg-neutral-900/30">
                        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                          <span className="font-mono font-bold text-neutral-900 dark:text-white">
                            {activeCuratedModel.name}
                          </span>
                          . {activeCuratedModel.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 dark:border-neutral-800">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500 dark:text-neutral-400">Architecture:</span>
                            <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                              {activeCuratedModel.architecture}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                            <span className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                              Downloaded &amp; Ready • 100% Free &amp; Local
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* On this Device Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Curated Whisper Models on this Device
                        </h3>
                        <span className="font-mono text-[10px] text-neutral-400">
                          Open-Source Weights (MIT License) • $0 API Cost
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {CURATED_SPEECH_MODELS.map((model) => {
                          const isSelected = activeCuratedModel.id === model.id;
                          return (
                            <div
                              key={model.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                                isSelected
                                  ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900/60'
                                  : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#141414] dark:hover:border-neutral-700'
                              }`}
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isSelected ? (
                                    <CheckCircle size={15} weight="fill" className="text-neutral-900 dark:text-white shrink-0" />
                                  ) : (
                                    <div className="h-3.5 w-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0" />
                                  )}
                                  <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white">
                                    {model.name}
                                  </span>
                                  <span className="rounded-md border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                    {model.tierLabel}
                                  </span>
                                  <span className="rounded-md border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                    Taglish: {model.taglishCapability}
                                  </span>
                                </div>

                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-5 leading-normal">
                                  {model.description}
                                </p>
                              </div>

                              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 sm:pl-4">
                                <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                                  {model.downloadSize}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleSelectCuratedModel(model.id)}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                                      : 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                                  }`}
                                >
                                  {isSelected ? 'Active' : 'Select'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Meeting Intelligence & Notes LLM (Ollama) */}
                  <div className="rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div>
                        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                          Meeting Intelligence &amp; Ollama Integration
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Text summarization engine for meeting notes, executive briefs, and action item synthesis. (Does not transcribe audio).
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => probeOllama()}
                          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 cursor-pointer"
                          title="Check Ollama status on localhost:11434"
                        >
                          <ArrowsClockwise size={13} weight="bold" />
                          <span>Refresh Ollama</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4 mt-4">
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
                          <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white" />
                          <span>Built-in Browser Summarizer</span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          Instant smart heuristic summarization and action item extractor directly in your browser. Zero setup or external server required.
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
                          <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white" />
                          <span>Local Ollama LLM (localhost:11434)</span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          Connects to your local Ollama instance (running Llama 3, Mistral, Gemma, or Qwen) for deep meeting intelligence synthesis.
                        </p>
                      </div>
                    </div>

                    {/* Local Model Selector & Connection Status */}
                    {installedModels.length > 0 ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white" />
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            Ollama Connected ({installedModels.length} text models available):
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          >
                            {installedModels.map((m) => (
                              <option key={m.name} value={m.name}>
                                {m.name} ({m.details?.parameter_size || 'LLM'})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>
                          Ollama daemon is currently not running on <code>localhost:11434</code>. Resursee will automatically use the built-in summarizer for meeting notes.
                        </span>
                        <span className="font-mono text-[11px] text-neutral-400 shrink-0">
                          Run: <code>ollama serve</code>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'benchmark' && uiMode === 'advanced' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
                  <BenchmarkRunner
                    currentTier={session.tier}
                    onRunBenchmark={handleRunBenchmark}
                  />
                </div>
              )}

              {activeTab === 'settings' && uiMode === 'advanced' && (
                <div className="mb-6 rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-[#121212]/85 backdrop-blur-md">
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

              {/* LIVE TRANSCRIBING / PROCESSING BANNER */}
              {session.status === 'transcribing' && (
                <div className="mb-6 rounded-2xl border border-neutral-300 bg-neutral-100/95 p-4 sm:p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/90 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm shrink-0">
                        <ArrowsClockwise size={20} weight="bold" className="animate-spin" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900 dark:text-white">
                            AI Model is Transcribing Audio...
                          </span>
                          <span className="rounded-md border border-neutral-300 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            Active Processing
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {progressStatus || 'Analyzing audio track and generating conversational turns...'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Stage Status */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0 sm:w-56">
                      <div className="flex w-full justify-between font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>Progress</span>
                        <span>{progressPercent > 0 ? `${progressPercent}%` : 'Processing'}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-neutral-900 transition-all duration-300 dark:bg-white"
                          style={{ width: `${Math.max(15, progressPercent)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-neutral-400">
                        Neural model active • Not frozen
                      </span>
                    </div>
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
            <aside className="hidden lg:flex w-80 2xl:w-96 flex-col border-l border-neutral-200 bg-white/90 p-4 dark:border-neutral-800 dark:bg-[#111111]/85 backdrop-blur-md shrink-0 min-w-0">
              {/* Panel Tabs (Equally Distributed so No Tab is Cut Off) */}
              <div className="mb-4 flex items-center justify-between gap-1 border-b border-neutral-200 pb-2 dark:border-neutral-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('notes')}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
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
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
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
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
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
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
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
                <aside className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white/95 p-4 shadow-2xl dark:bg-[#121212]/90 backdrop-blur-md min-w-0 z-10">
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

                  {/* Drawer Header Tabs (Equally Distributed) */}
                  <div className="flex items-center justify-between gap-1 border-b border-neutral-200 p-3 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setRightPanelTab('notes')}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
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
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
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
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
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
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
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
  );
}
