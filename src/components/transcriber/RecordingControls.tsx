'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Microphone,
  Pause,
  Play,
  Stop,
  SlidersHorizontal,
  FileAudio,
} from '@phosphor-icons/react';
import { formatTimestamp } from '@/lib/audioProcessor';

interface RecordingControlsProps {
  onRecordingComplete: (audioBlob: Blob, liveDraftText?: string) => void;
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Web Speech API for live transcription preview (optional, off by default)
  const recognitionRef = useRef<any>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const updateAudioMeter = useCallback(() => {
    if (!analyserRef.current || !isRecording || isPaused) {
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
    const normalized = Math.min(1, average / 128);
    setAudioLevel(normalized);

    animFrameRef.current = requestAnimationFrame(updateAudioMeter);
  }, [isRecording, isPaused]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // AudioContext & Analyser for real-time audio meter
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setIsRecording(false);
        setIsPaused(false);
        setAudioLevel(0);
        onRecordingComplete(finalBlob, liveTranscript);
      };

      recorder.start(1000); // chunk every 1 second
      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Start audio meter loop
      animFrameRef.current = requestAnimationFrame(updateAudioMeter);

      // Optional Live Speech Recognition
      if (livePreviewEnabled) {
        initLiveSpeech();
      }
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Could not access microphone. Please check browser permissions.');
    }
  };

  const initLiveSpeech = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fil-PH'; // Tagalog/Filipino default, accepts English words

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
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
    mediaRecorderRef.current.pause();
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') return;
    mediaRecorderRef.current.resume();
    setIsPaused(false);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    animFrameRef.current = requestAnimationFrame(updateAudioMeter);

    if (livePreviewEnabled) {
      initLiveSpeech();
    }
  };

  // Stop recording and process
  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Status & Live Meter */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-center gap-3">
          {/* Status Dot */}
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
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
                : 'Ready'}
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
            className="flex items-center gap-2.5 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
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
                className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                <Play size={16} weight="fill" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseRecording}
                className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                <Pause size={16} weight="fill" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Stop size={16} weight="fill" />
              <span>Finish & Transcribe</span>
            </button>
          </>
        )}
      </div>

      {/* Live Text Preview Toggle (Optional & Off by Default) */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
          <SlidersHorizontal size={15} />
          <span>Live text preview while speaking (draft preview)</span>
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
