export type TranscriptionTier = 'browser' | 'local' | 'cloud';

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
