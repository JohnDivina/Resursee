'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Microphone,
  Pause,
  Play,
  Stop,
  SlidersHorizontal,
  WarningCircle,
} from '@phosphor-icons/react';
import { formatTimestamp, float32ArrayToWavBlob } from '@/lib/audioProcessor';

interface RecordingControlsProps {
  onRecordingComplete: (audioBlob: Blob, rawChannelData: Float32Array, liveDraftText?: string) => void;
  isProcessing?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  onRecordingComplete,
  isProcessing = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync ref
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioGraph();
    };
  }, []);

  const cleanupAudioGraph = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const updateAudioMeter = useCallback(() => {
    if (!analyserRef.current || !isRecording || isPausedRef.current) {
      setAudioLevel(0);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const normalized = Math.min(1, average / 100);
    setAudioLevel(normalized);

    animFrameRef.current = requestAnimationFrame(updateAudioMeter);
  }, [isRecording]);

  // Start recording using direct Web Audio PCM capture
  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      // Prefer 16kHz context if supported by browser, else system sample rate
      let audioCtx: AudioContext;
      try {
        audioCtx = new AudioCtx({ sampleRate: 16000 });
      } catch {
        audioCtx = new AudioCtx();
      }
      audioContextRef.current = audioCtx;

      // Essential for macOS / Safari: user gesture resume
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Analyser Node for real-time VU meter
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      // ScriptProcessorNode for lossless PCM sample capture
      const bufferSize = 4096;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isPausedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Clone samples into storage buffer
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      // ScriptProcessor must be connected to destination in some browsers to trigger events
      processor.connect(audioCtx.destination);

      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Start audio meter animation loop
      animFrameRef.current = requestAnimationFrame(updateAudioMeter);

      // Optional Live Speech Recognition
      if (livePreviewEnabled) {
        startLiveSpeech();
      }
    } catch (err: unknown) {
      console.error('Failed to start mic recording:', err);
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : err instanceof Error
          ? err.message
          : 'Could not access microphone.';
      setErrorMessage(msg);
      cleanupAudioGraph();
      setIsRecording(false);
    }
  };

  const startLiveSpeech = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fil-PH';

      recognition.onresult = (event: any) => {
        let currentDraft = '';
        for (let i = 0; i < event.results.length; i++) {
          currentDraft += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(currentDraft);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Live Speech API could not start:', err);
    }
  };

  // Pause recording (Requirement: "Pause and resume a recording. The break is not in the file.")
  const pauseRecording = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  // Resume recording
  const resumeRecording = () => {
    setIsPaused(false);
    isPausedRef.current = false;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    animFrameRef.current = requestAnimationFrame(updateAudioMeter);

    if (livePreviewEnabled) {
      startLiveSpeech();
    }
  };

  // Stop recording and assemble PCM WAV
  const stopRecording = async () => {
    if (!isRecording) return;

    const currentCtx = audioContextRef.current;
    const sampleRate = currentCtx ? currentCtx.sampleRate : 16000;
    const chunks = audioChunksRef.current;

    // Disconnect audio nodes
    cleanupAudioGraph();
    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);

    if (chunks.length === 0) {
      setErrorMessage('No audio data recorded. Please speak into the microphone.');
      return;
    }

    // Merge Float32Array chunks
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const mergedPcm = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      mergedPcm.set(chunk, offset);
      offset += chunk.length;
    }

    // Resample down to 16kHz mono if context was at 44.1kHz or 48kHz
    let final16kPcm = mergedPcm;
    if (sampleRate !== 16000) {
      const OfflineCtx =
        window.OfflineAudioContext ||
        (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
          .webkitOfflineAudioContext;

      const duration = totalLength / sampleRate;
      const targetLength = Math.ceil(duration * 16000);
      const offline = new OfflineCtx(1, targetLength, 16000);

      const buffer = offline.createBuffer(1, totalLength, sampleRate);
      buffer.copyToChannel(mergedPcm, 0);

      const source = offline.createBufferSource();
      source.buffer = buffer;
      source.connect(offline.destination);
      source.start(0);

      const rendered = await offline.startRendering();
      final16kPcm = rendered.getChannelData(0);
    }

    // Create standard PCM WAV blob
    const wavBlob = float32ArrayToWavBlob(final16kPcm, 16000);

    // Trigger complete
    onRecordingComplete(wavBlob, final16kPcm, liveTranscript);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Status & Live Meter */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-center gap-3">
          {/* Status Dot */}
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isRecording && !isPaused
                  ? 'bg-neutral-900 animate-pulse dark:bg-white'
                  : isPaused
                    ? 'bg-neutral-400 dark:bg-neutral-600'
                    : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              {isRecording
                ? isPaused
                  ? 'Paused'
                  : 'Recording Live'
                : 'Mic Standby'}
            </span>
          </div>

          {/* Timer */}
          <div className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
            {formatTimestamp(elapsedSeconds)}
          </div>
        </div>

        {/* Audio VU Level Meter */}
        <div className="flex items-center gap-1">
          {new Array(12).fill(0).map((_, i) => {
            const threshold = (i + 1) / 12;
            const isActive = isRecording && !isPaused && audioLevel >= threshold;
            return (
              <div
                key={i}
                className={`h-4 w-1.5 rounded-full transition-all duration-75 ${
                  isActive
                    ? 'bg-neutral-900 dark:bg-white'
                    : 'bg-neutral-200 dark:bg-neutral-800'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Main Recording Action Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isProcessing}
            className="flex items-center gap-2.5 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 cursor-pointer"
          >
            <Microphone size={18} weight="bold" />
            <span>Start Recording</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                type="button"
                onClick={resumeRecording}
                className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 cursor-pointer"
              >
                <Play size={16} weight="fill" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseRecording}
                className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 cursor-pointer"
              >
                <Pause size={16} weight="fill" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 cursor-pointer"
            >
              <Stop size={16} weight="fill" />
              <span>Finish & Transcribe</span>
            </button>
          </>
        )}
      </div>

      {/* Error alert if mic access fails */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-neutral-100 p-3 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          <WarningCircle size={16} weight="bold" className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Text Preview Toggle (Optional & Off by Default) */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
          <SlidersHorizontal size={15} />
          <span>Live text preview while speaking (browser dictation draft)</span>
        </div>
        <button
          type="button"
          onClick={() => setLivePreviewEnabled(!livePreviewEnabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            livePreviewEnabled
              ? 'bg-neutral-900 dark:bg-white'
              : 'bg-neutral-200 dark:bg-neutral-800'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform dark:bg-neutral-900 ${
              livePreviewEnabled ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Live Preview Text Output */}
      {livePreviewEnabled && isRecording && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Live Speech Stream
          </div>
          {liveTranscript || 'Listening for speech...'}
        </div>
      )}
    </div>
  );
};
