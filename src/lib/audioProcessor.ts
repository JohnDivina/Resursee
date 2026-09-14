/**
 * Audio processing utilities for Resursee Transcriber.
 * Handles decoding, resampling to 16kHz mono, waveform peak extraction,
 * and timestamp formatting.
 */

export interface DecodedAudio {
  channelData: Float32Array; // 16kHz mono samples
  sampleRate: number;        // 16000
  duration: number;          // in seconds
  audioBuffer: AudioBuffer;
}

/**
 * Formats a duration in seconds into MM:SS or HH:MM:SS
 */
export function formatTimestamp(seconds: number, includeHours = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0 || includeHours) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds into SRT subtitle timestamp (HH:MM:SS,mmm)
 */
export function formatSrtTimestamp(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSecs = Math.floor(totalMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Formats seconds into WebVTT timestamp (HH:MM:SS.mmm)
 */
export function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(',', '.');
}

/**
 * Parses a string like "01:23" or "01:23:45" to seconds.
 */
export function parseTimestamp(timeStr: string): number {
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

/**
 * Resamples an AudioBuffer to 16kHz mono Float32Array
 * (required input format for Whisper models)
 */
export async function resampleTo16kHzMono(audioBuffer: AudioBuffer): Promise<Float32Array> {
  const targetSampleRate = 16000;
  const numberOfChannels = 1;
  const duration = audioBuffer.duration;
  const targetLength = Math.ceil(duration * targetSampleRate);

  // Use OfflineAudioContext to perform high-quality native resampling
  const offlineCtx = new (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext)(
    numberOfChannels,
    targetLength,
    targetSampleRate
  );

  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = audioBuffer;

  // If stereo or multi-channel, blend down to mono
  if (audioBuffer.numberOfChannels > 1) {
    const merger = offlineCtx.createChannelMerger(1);
    bufferSource.connect(merger, 0, 0);
    merger.connect(offlineCtx.destination);
  } else {
    bufferSource.connect(offlineCtx.destination);
  }

  bufferSource.start(0);
  const renderedBuffer = await offlineCtx.startRendering();
  return renderedBuffer.getChannelData(0);
}

/**
 * Decodes any audio or video file (MP3, WAV, M4A, AIFF, MP4, MOV) into 16kHz mono Float32Array
 */
export async function decodeAudioFile(file: File | Blob): Promise<DecodedAudio> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();

  try {
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const mono16kData = await resampleTo16kHzMono(decodedBuffer);

    return {
      channelData: mono16kData,
      sampleRate: 16000,
      duration: decodedBuffer.duration,
      audioBuffer: decodedBuffer,
    };
  } finally {
    if (audioCtx.state !== 'closed') {
      await audioCtx.close();
    }
  }
}

/**
 * Generates an array of normalized peak levels [0..1] for waveform visual rendering
 */
export function getAudioWaveform(
  channelData: Float32Array,
  barCount: number = 100
): number[] {
  if (!channelData || channelData.length === 0) {
    return new Array(barCount).fill(0.05);
  }

  const blockSize = Math.floor(channelData.length / barCount);
  const waveform: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    let sumSquares = 0;
    let peak = 0;

    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > peak) peak = abs;
      sumSquares += abs * abs;
    }

    const rms = Math.sqrt(sumSquares / (end - start || 1));
    // Blend peak and RMS for natural aesthetic
    const value = Math.max(0.05, Math.min(1.0, peak * 0.7 + rms * 0.5));
    waveform.push(Number(value.toFixed(3)));
  }

  return waveform;
}

/**
 * Slices a chunk of audio for re-transcribing a specific segment
 */
export async function sliceAudioChunk(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): Promise<Float32Array> {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startTime * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.ceil(endTime * sampleRate));
  const length = Math.max(1, endSample - startSample);

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  const sliced = ctx.createBuffer(1, length, sampleRate);
  const rawData = audioBuffer.getChannelData(0);
  sliced.copyToChannel(rawData.slice(startSample, endSample), 0);
  await ctx.close();

  return await resampleTo16kHzMono(sliced);
}

/**
 * Converts a Float32Array to 16-bit PCM WAV Blob for export or API transmission
 */
export function float32ArrayToWavBlob(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
