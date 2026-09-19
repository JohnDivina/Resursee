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
import { formatTimestamp, decodeAudioFile } from '@/lib/audioProcessor';
import { isTauriDesktop } from '@/lib/envDetector';

interface RecordingControlsProps {
  onRecordingComplete: (
    audioBlob: Blob,
    rawChannelData: Float32Array,
    duration: number,
    liveDraftText?: string
  ) => void;
  isProcessing?: boolean;
  language?: string;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  onRecordingComplete,
  isProcessing = false,
  language = 'fil',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isPausedRef = useRef<boolean>(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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
    const normalized = Math.min(1, average / 90);
    setAudioLevel(normalized);

    animFrameRef.current = requestAnimationFrame(updateAudioMeter);
  }, [isRecording]);

  /**
   * Resilient cross-platform media stream getter supporting macOS WKWebView and modern browsers
   */
  const requestAudioStream = async (): Promise<MediaStream> => {
    // 1. Standard modern navigator.mediaDevices
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err: any) {
        // If standard getUserMedia threw with generic or permission error, handle gracefully
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw err;
        }
      }
    }

    // 2. Fallback to WebKit / legacy getUserMedia if modern API is restricted in WKWebView
    const legacyGUM =
      (navigator as any)?.webkitGetUserMedia ||
      (navigator as any)?.mozGetUserMedia ||
      (navigator as any)?.getUserMedia;

    if (legacyGUM) {
      return new Promise<MediaStream>((resolve, reject) => {
        legacyGUM.call(navigator, { audio: true }, resolve, reject);
      });
    }

    // 3. Informative error if running in Tauri desktop vs browser
    if (isTauriDesktop()) {
      throw new Error(
        'Microphone access is restricted in the desktop app. Please verify microphone permission under System Settings > Privacy & Security > Microphone.'
      );
    }

    throw new Error('Microphone access is not supported or blocked in this browser. Please check address bar permissions.');
  };

  const startRecording = async () => {
    setErrorMessage(null);
    recordedChunksRef.current = [];
    pcmChunksRef.current = [];
    setLiveTranscript('');

    try {
      const stream = await requestAudioStream();
      streamRef.current = stream;

      // 1. Web Audio for Visual VU Meter and PCM Backup
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // ScriptProcessor with zero-gain connection to avoid feedback
      const bufferSize = 4096;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (e) => {
        if (isPausedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(inputData));
      };
      source.connect(processor);
      const zeroGain = audioCtx.createGain();
      zeroGain.gain.value = 0;
      processor.connect(zeroGain);
      zeroGain.connect(audioCtx.destination);

      // 2. MediaRecorder for Playable Container (WebM / MP4 / OGG)
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.start(250); // Flush chunks every 250ms

      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      animFrameRef.current = requestAnimationFrame(updateAudioMeter);

      if (livePreviewEnabled) {
        startLiveSpeech();
      }
    } catch (err: any) {
      console.error('Failed to start microphone:', err);
      let msg = 'Could not access microphone.';

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = isTauriDesktop()
          ? 'Microphone permission was denied. Please allow microphone access under macOS System Settings > Privacy & Security > Microphone.'
          : 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        msg = 'No microphone input device detected. Please connect a microphone or headset.';
      } else if (err?.message) {
        msg = err.message;
      }

      setErrorMessage(msg);
      cleanup();
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

      // Match recognition language to requested session language
      recognition.lang =
        language === 'fil'
          ? 'fil-PH'
          : language === 'en'
          ? 'en-US'
          : language === 'ja'
          ? 'ja-JP'
          : 'fil-PH';

      recognition.onresult = (event: any) => {
        let currentDraft = '';
        for (let i = 0; i < event.results.length; i++) {
          currentDraft += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(currentDraft);
      };

      recognition.onerror = (e: any) => {
        // SpeechRecognition warnings are non-fatal (audio capture still records)
        console.warn('SpeechRecognition notice:', e?.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Live speech recognition warning:', err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(true);
    isPausedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
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

  const stopRecording = async () => {
    if (!isRecording) return;

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.requestData();
      recorder.stop();
    }

    // Brief delay to allow final chunk to flush into recordedChunksRef
    await new Promise((r) => setTimeout(r, 120));

    const mimeType = recorder?.mimeType || 'audio/webm';
    const finalChunks = recordedChunksRef.current;
    const finalBlob = new Blob(finalChunks, { type: mimeType });

    cleanup();
    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);

    // Assemble raw Float32Array PCM samples
    let rawChannelData: Float32Array;
    let duration = elapsedSeconds;

    try {
      // Decode the native blob into 16kHz Float32Array for waveform and Whisper
      const decoded = await decodeAudioFile(finalBlob);
      rawChannelData = decoded.channelData;
      duration = Math.max(decoded.duration, elapsedSeconds);
    } catch {
      // Fallback to accumulated PCM chunks from ScriptProcessorNode
      const pcmChunks = pcmChunksRef.current;
      const totalLen = pcmChunks.reduce((acc, c) => acc + c.length, 0);
      rawChannelData = new Float32Array(totalLen);
      let offset = 0;
      for (const c of pcmChunks) {
        rawChannelData.set(c, offset);
        offset += c.length;
      }
      duration = Math.max(1, totalLen / 16000);
    }

    if (finalBlob.size === 0 && rawChannelData.length === 0) {
      setErrorMessage('No speech recorded. Please check your microphone input.');
      return;
    }

    // Send final playable audioBlob and rawChannelData
    onRecordingComplete(finalBlob, rawChannelData, duration, liveTranscript);
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

          {/* Duration Timer */}
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
