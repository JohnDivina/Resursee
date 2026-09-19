export type TranscriptionTier = 'browser' | 'local';

export type SupportedLanguage =
  | 'auto'
  | 'fil'
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'pt'
  | 'it'
  | 'nl'
  | 'ru'
  | 'ar'
  | 'hi'
  | 'th';

export interface Revision {
  timestamp: string;
  previousText: string;
  newText: string;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerLabel: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  language: string;
  isEdited: boolean;
  originalText?: string;
  revisionHistory: Revision[];
}

export interface Speaker {
  id: string;
  label: string;
  color: string;
  segmentCount: number;
}

export type NoteCategory =
  | 'key_point'
  | 'decision'
  | 'action_item'
  | 'question'
  | 'follow_up';

export interface MeetingNoteItem {
  id: string;
  category: NoteCategory;
  content: string;
  timestamp: number;
  sourceSegmentId?: string;
  assignee?: string;
  isCompleted?: boolean;
}

export interface Bookmark {
  id: string;
  timestamp: number;
  label: string;
  color?: string;
}

export type TranscriberStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'transcribing'
  | 'diarizing'
  | 'generating_notes'
  | 'complete'
  | 'error';

export interface TranscriberSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
  language: SupportedLanguage;
  tier: TranscriptionTier;
  status: TranscriberStatus;
  segments: TranscriptSegment[];
  speakers: Speaker[];
  summary: string;
  meetingNotes: MeetingNoteItem[];
  userNotes: string;
  bookmarks: Bookmark[];
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  modelUsed?: string;
  error?: string;
}

export interface BenchmarkResult {
  tier: TranscriptionTier;
  modelName: string;
  audioDurationSeconds: number;
  transcriptionTimeSeconds: number;
  realtimeFactor: number;
  wordCount: number;
  segmentCount: number;
  timestamp: string;
}

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  badge?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Auto-detect', nativeLabel: 'Automatic' },
  { code: 'fil', label: 'Tagalog / Taglish', nativeLabel: 'Filipino / Taglish', badge: 'Default' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย' },
];

export type CuratedModelTier = 'fast' | 'balanced' | 'accurate';

export interface CuratedSpeechModel {
  id: string;
  name: string;
  tier: CuratedModelTier;
  tierLabel: string;
  params: string;
  downloadSize: string;
  architecture: string;
  description: string;
  taglishCapability: 'Good' | 'High' | 'State of the Art';
  isFree: boolean;
  huggingFaceRepo: string;
}

export const CURATED_SPEECH_MODELS: CuratedSpeechModel[] = [
  {
    id: 'large-v3-turbo',
    name: 'large-v3-turbo',
    tier: 'balanced',
    tierLabel: 'Balanced',
    params: '~809M',
    downloadSize: '1.6 GB',
    architecture: 'OpenAI Whisper large-v3 pruned decoder (4 layers)',
    description:
      "OpenAI's turbo model: large-v3 with the decoder pruned from 32 layers to 4. Same encoder, keeping transcription real-time with state-of-the-art accuracy on Taglish and multilingual code-switching.",
    taglishCapability: 'State of the Art',
    isFree: true,
    huggingFaceRepo: 'onnx-community/whisper-large-v3-turbo',
  },
  {
    id: 'large-v3-turbo-quantized',
    name: 'large-v3-turbo (quantized)',
    tier: 'fast',
    tierLabel: 'Fast',
    params: '~809M (8-bit)',
    downloadSize: '626 MB',
    architecture: 'OpenAI Whisper large-v3 turbo INT8 quantized',
    description:
      'The same turbo model, quantized for faster throughput and lighter memory consumption. Near-identical accuracy on Tagalog and English conversations.',
    taglishCapability: 'State of the Art',
    isFree: true,
    huggingFaceRepo: 'onnx-community/whisper-large-v3-turbo',
  },
  {
    id: 'large-v3',
    name: 'large-v3 (full, not turbo)',
    tier: 'accurate',
    tierLabel: 'Accurate',
    params: '1.55B',
    downloadSize: '3.1 GB',
    architecture: 'OpenAI Whisper large-v3 full 32-layer decoder',
    description:
      'Full 1.5B parameter OpenAI Whisper model. Highest acoustic fidelity for noisy meeting rooms, multiple accents, and difficult audio.',
    taglishCapability: 'State of the Art',
    isFree: true,
    huggingFaceRepo: 'onnx-community/whisper-large-v3',
  },
  {
    id: 'whisper-base',
    name: 'base',
    tier: 'fast',
    tierLabel: 'Lightweight',
    params: '74M',
    downloadSize: '145 MB',
    architecture: 'OpenAI Whisper base multilingual',
    description:
      'Compact multilingual model for rapid transcription on lower-spec hardware.',
    taglishCapability: 'Good',
    isFree: true,
    huggingFaceRepo: 'onnx-community/whisper-base',
  },
  {
    id: 'whisper-tiny',
    name: 'tiny',
    tier: 'fast',
    tierLabel: 'Ultra-Fast',
    params: '39M',
    downloadSize: '75 MB',
    architecture: 'OpenAI Whisper tiny multilingual',
    description:
      'Instant loading with minimal CPU/RAM usage. Ideal for quick voice memos and fast tests.',
    taglishCapability: 'Good',
    isFree: true,
    huggingFaceRepo: 'onnx-community/whisper-tiny',
  },
];

