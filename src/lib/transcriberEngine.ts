import {
  TranscriptSegment,
  Speaker,
  MeetingNoteItem,
  TranscriptionTier,
  SupportedLanguage,
  BenchmarkResult,
} from '@/types/transcriber';
import { float32ArrayToWavBlob } from '@/lib/audioProcessor';

export interface TranscribeProgressCallback {
  (progress: { status: string; percentage: number; detail?: string }): void;
}

/**
 * Palette of accessible, neutral tones for speakers matching anti-slop guidelines
 */
export const SPEAKER_COLORS = [
  '#2563eb', // Indigo / Slate
  '#d97706', // Amber / Ochre
  '#059669', // Forest
  '#7c3aed', // Iris
  '#db2777', // Rose
  '#0891b2', // Teal
  '#ea580c', // Rust
  '#475569', // Slate
];

/**
 * Extract distinct speakers from transcript segments
 */
export function extractSpeakers(segments: TranscriptSegment[]): Speaker[] {
  const speakerMap = new Map<string, { label: string; count: number }>();

  segments.forEach((seg) => {
    const existing = speakerMap.get(seg.speakerId);
    if (existing) {
      existing.count += 1;
    } else {
      speakerMap.set(seg.speakerId, { label: seg.speakerLabel, count: 1 });
    }
  });

  return Array.from(speakerMap.entries()).map(([id, info], idx) => ({
    id,
    label: info.label,
    color: SPEAKER_COLORS[idx % SPEAKER_COLORS.length],
    segmentCount: info.count,
  }));
}

/**
 * Merge two speakers together (replaces sourceSpeakerId with targetSpeakerId)
 */
export function mergeSpeakersInTranscript(
  segments: TranscriptSegment[],
  targetSpeakerId: string,
  targetSpeakerLabel: string,
  sourceSpeakerId: string
): TranscriptSegment[] {
  return segments.map((seg) => {
    if (seg.speakerId === sourceSpeakerId) {
      return {
        ...seg,
        speakerId: targetSpeakerId,
        speakerLabel: targetSpeakerLabel,
        isEdited: true,
      };
    }
    return seg;
  });
}

/**
 * Reassign a single segment to a different speaker
 */
export function reassignSegmentSpeaker(
  segments: TranscriptSegment[],
  segmentId: string,
  newSpeakerId: string,
  newSpeakerLabel: string
): TranscriptSegment[] {
  return segments.map((seg) => {
    if (seg.id === segmentId) {
      return {
        ...seg,
        speakerId: newSpeakerId,
        speakerLabel: newSpeakerLabel,
        isEdited: true,
      };
    }
    return seg;
  });
}

/**
 * Helper to convert a Blob into base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string) || '';
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcribe using the Cloud Tier (Gemini 2.0 Flash server proxy)
 */
export async function transcribeWithCloud(
  audioData: Blob | Float32Array,
  language: SupportedLanguage = 'fil',
  onProgress?: TranscribeProgressCallback
): Promise<{
  segments: TranscriptSegment[];
  summary: string;
  meetingNotes: MeetingNoteItem[];
  detectedLanguage: string;
}> {
  onProgress?.({ status: 'Preparing audio payload...', percentage: 15 });

  let blob: Blob;
  if (audioData instanceof Float32Array) {
    blob = float32ArrayToWavBlob(audioData, 16000);
  } else {
    blob = audioData;
  }

  onProgress?.({ status: 'Encoding audio buffer...', percentage: 35 });
  const base64Audio = await blobToBase64(blob);

  onProgress?.({
    status: 'Transcribing with Gemini Multilingual AI...',
    percentage: 60,
    detail: 'Identifying speakers and conversational Taglish nuances...',
  });

  const response = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: base64Audio,
      mimeType: blob.type || 'audio/wav',
      language,
      action: 'transcribe',
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Cloud transcription failed (HTTP ${response.status})`);
  }

  onProgress?.({ status: 'Finalizing transcript & speaker turns...', percentage: 95 });
  const data = await response.json();

  return {
    segments: data.segments || [],
    summary: data.summary || '',
    meetingNotes: data.meetingNotes || [],
    detectedLanguage: data.detectedLanguage || language,
  };
}

/**
 * Transcribe using Browser Tier (Transformers.js Whisper pipeline)
 */
export async function transcribeWithBrowser(
  audioSamples: Float32Array,
  language: SupportedLanguage = 'fil',
  modelSize: 'tiny' | 'base' | 'small' = 'base',
  onProgress?: TranscribeProgressCallback
): Promise<{
  segments: TranscriptSegment[];
  summary: string;
  meetingNotes: MeetingNoteItem[];
  detectedLanguage: string;
}> {
  onProgress?.({ status: 'Initializing Transformers.js Whisper...', percentage: 20 });

  try {
    // Dynamic import to avoid SSR issues
    const { pipeline } = await import('@huggingface/transformers');

    const modelMap = {
      tiny: 'onnx-community/whisper-tiny',
      base: 'onnx-community/whisper-base',
      small: 'onnx-community/whisper-small',
    };

    const modelId = modelMap[modelSize] || modelMap.base;

    onProgress?.({
      status: `Loading model ${modelId} via WebGPU/WASM...`,
      percentage: 45,
      detail: 'Model is cached locally in your browser for future sessions.',
    });

    // Whisper pipeline with chunking and timestamp support
    const transcriber = await (pipeline as any)('automatic-speech-recognition', modelId);

    onProgress?.({ status: 'Transcribing speech in browser...', percentage: 70 });

    const targetLang = language === 'auto' ? undefined : language === 'fil' ? 'tl' : language;
    const output = await transcriber(audioSamples, {
      language: targetLang,
      task: 'transcribe',
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    onProgress?.({ status: 'Parsing segments & speaker turns...', percentage: 95 });

    // Format raw chunks into standard TranscriptSegment[]
    type ChunkType = { text?: string; timestamp?: [number, number | null] };
    const rawChunks: ChunkType[] = Array.isArray(output)
      ? (output[0]?.chunks as ChunkType[]) || []
      : (output.chunks as ChunkType[]) || [];

    const segments: TranscriptSegment[] = rawChunks.map((chunk, index) => {
      const startTime = chunk.timestamp?.[0] ?? index * 5;
      const endTime = chunk.timestamp?.[1] ?? (index + 1) * 5;
      return {
        id: crypto.randomUUID(),
        speakerId: 'speaker_0',
        speakerLabel: 'Speaker 1',
        text: (chunk.text || '').trim(),
        startTime,
        endTime,
        confidence: 0.9,
        language: language === 'auto' ? 'fil' : language,
        isEdited: false,
        revisionHistory: [],
      };
    });

    return {
      segments,
      summary: 'Transcription generated locally via Browser Whisper ONNX engine.',
      meetingNotes: [],
      detectedLanguage: language,
    };
  } catch (err) {
    console.warn('Browser WebGPU Whisper error, attempting cloud fallback:', err);
    throw err;
  }
}

/**
 * Generate meeting intelligence (Executive Summary + 5 structured lists)
 * using the configured tier.
 */
export async function generateNotesFromTranscript(
  segments: TranscriptSegment[],
  tier: TranscriptionTier = 'cloud'
): Promise<{
  summary: string;
  meetingNotes: MeetingNoteItem[];
}> {
  if (segments.length === 0) {
    return { summary: '', meetingNotes: [] };
  }

  // Cloud Tier generation
  if (tier === 'cloud') {
    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'notes',
        segments,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate meeting notes.');
    }

    return await response.json();
  }

  // Fallback heuristic extraction for offline / browser tier
  const textCorpus = segments.map((s) => s.text).join(' ');
  const words = textCorpus.split(/\s+/).length;

  const sampleKeyPoints: MeetingNoteItem[] = segments.slice(0, 3).map((seg) => ({
    id: crypto.randomUUID(),
    category: 'key_point',
    content: seg.text.length > 120 ? seg.text.slice(0, 117) + '...' : seg.text,
    timestamp: seg.startTime,
    isCompleted: false,
  }));

  return {
    summary: `Meeting recorded with ${segments.length} dialogue turns (${words} words total).`,
    meetingNotes: sampleKeyPoints,
  };
}

/**
 * Run a performance benchmark comparison across tiers
 */
export async function runTierBenchmark(
  sampleAudio: Float32Array,
  durationSeconds: number,
  tier: TranscriptionTier
): Promise<BenchmarkResult> {
  const startTime = performance.now();
  let wordCount = 0;
  let segmentCount = 0;
  let modelName = '';

  if (tier === 'cloud') {
    modelName = 'Gemini 2.0 Flash';
    const result = await transcribeWithCloud(sampleAudio, 'fil');
    segmentCount = result.segments.length;
    wordCount = result.segments.reduce((acc, s) => acc + s.text.split(/\s+/).length, 0);
  } else {
    modelName = 'Whisper Base (WebGPU)';
    const result = await transcribeWithBrowser(sampleAudio, 'fil', 'base');
    segmentCount = result.segments.length;
    wordCount = result.segments.reduce((acc, s) => acc + s.text.split(/\s+/).length, 0);
  }

  const elapsedSeconds = (performance.now() - startTime) / 1000;
  const realtimeFactor = durationSeconds > 0 ? elapsedSeconds / durationSeconds : 1.0;

  return {
    tier,
    modelName,
    audioDurationSeconds: durationSeconds,
    transcriptionTimeSeconds: Number(elapsedSeconds.toFixed(2)),
    realtimeFactor: Number(realtimeFactor.toFixed(2)),
    wordCount,
    segmentCount,
    timestamp: new Date().toISOString(),
  };
}
