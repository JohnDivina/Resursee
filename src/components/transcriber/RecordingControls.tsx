'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Microphone,
  Pause,
  Play,
  Stop,
  SlidersHorizontal,
  WarningCircle,
  ArrowsClockwise,
  SpeakerHigh,
  SpeakerSimpleSlash,
} from '@phosphor-icons/react';
import { formatTimestamp, decodeAudioFile, float32ArrayToWavBlob } from '@/lib/audioProcessor';
import { isTauriDesktop } from '@/lib/envDetector';

interface AudioDeviceOption {
  deviceId: string;
  label: string;
}

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

  // Audio Device Selection & Live Testing States
  const [availableDevices, setAvailableDevices] = useState<AudioDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isTestingMic, setIsTestingMic] = useState(false);

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

  // Test Mic Audio Nodes & Voice Loopback (Discord-Style Sidetone)
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAudioCtxRef = useRef<AudioContext | null>(null);
  const testAnalyserRef = useRef<AnalyserNode | null>(null);
  const testMonitorGainRef = useRef<GainNode | null>(null);
  const [hearVoiceFeedback, setHearVoiceFeedback] = useState<boolean>(true);
  const [feedbackVolume, setFeedbackVolume] = useState<number>(0.85);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Dynamically update real-time voice feedback volume
  useEffect(() => {
    if (testMonitorGainRef.current && testAudioCtxRef.current) {
      try {
        testMonitorGainRef.current.gain.value = hearVoiceFeedback ? feedbackVolume : 0;
      } catch {}
    }
  }, [hearVoiceFeedback, feedbackVolume]);

  const stopMicTest = useCallback(() => {
    if (testMonitorGainRef.current) {
      try {
        testMonitorGainRef.current.gain.value = 0;
        testMonitorGainRef.current.disconnect();
      } catch {}
      testMonitorGainRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    if (testAudioCtxRef.current && testAudioCtxRef.current.state !== 'closed') {
      testAudioCtxRef.current.close().catch(() => {});
      testAudioCtxRef.current = null;
    }
    testAnalyserRef.current = null;
    setIsTestingMic(false);
    setAudioLevel(0);
  }, []);

  const cleanup = useCallback(() => {
    stopMicTest();
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
  }, [stopMicTest]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  /**
   * Resilient cross-platform media stream getter supporting deviceId selection, macOS WKWebView, and modern browsers
   */
  const requestAudioStream = async (deviceIdOverride?: string): Promise<MediaStream> => {
    const deviceIdToUse = deviceIdOverride || selectedDeviceId;
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    if (deviceIdToUse && deviceIdToUse !== 'default') {
      audioConstraints.deviceId = { ideal: deviceIdToUse };
    }

    // 1. Standard modern navigator.mediaDevices
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
        return stream;
      } catch (err: any) {
        if (err.name === 'OverconstrainedError' && deviceIdToUse) {
          console.warn('Selected device overconstrained, retrying with default microphone:', err);
          return await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        }
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw err;
        }
        throw err;
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

  /**
   * Enumerate available microphone devices and unlock labels
   */
  const loadAudioDevices = useCallback(async (requestPermission = false) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      if (requestPermission && navigator.mediaDevices.getUserMedia) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach((t) => t.stop());
        } catch (permErr) {
          console.warn('Microphone permission query note:', permErr);
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => {
          let label = d.label ? d.label.trim() : '';
          if (!label) {
            label = `Microphone ${index + 1}${d.deviceId ? ` (${d.deviceId.slice(0, 6)}...)` : ''}`;
          }
          return {
            deviceId: d.deviceId,
            label,
          };
        });

      setAvailableDevices(audioInputs);

      let savedMic = '';
      try {
        savedMic = localStorage.getItem('resursee_preferred_mic') || '';
      } catch {}

      setSelectedDeviceId((prev) => {
        if (prev && audioInputs.some((d) => d.deviceId === prev)) {
          return prev;
        }
        if (savedMic && audioInputs.some((d) => d.deviceId === savedMic)) {
          return savedMic;
        }
        return audioInputs[0]?.deviceId || 'default';
      });
    } catch (err) {
      console.warn('Could not enumerate audio devices:', err);
    }
  }, []);

  // Listen to system audio device changes (e.g. plugging in USB mic or connecting AirPods)
  useEffect(() => {
    loadAudioDevices(false);

    const handleDeviceChange = () => {
      loadAudioDevices(false);
    };

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [loadAudioDevices]);

  /**
   * Start live microphone audio level preview for testing voice input
   */
  const startMicTestWithDevice = async (deviceIdToTest?: string) => {
    setErrorMessage(null);
    if (isRecording) return;

    try {
      const stream = await requestAudioStream(deviceIdToTest || selectedDeviceId);
      testStreamRef.current = stream;

      // Refresh devices list so human-readable labels populate if initially empty
      loadAudioDevices(false);

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      testAudioCtxRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      testAnalyserRef.current = analyser;

      // Real-time audio feedback loopback (Discord-style voice sidetone)
      const monitorGain = audioCtx.createGain();
      monitorGain.gain.value = hearVoiceFeedback ? feedbackVolume : 0;
      source.connect(monitorGain);
      monitorGain.connect(audioCtx.destination);
      testMonitorGainRef.current = monitorGain;

      setIsTestingMic(true);

      const runTestMeter = () => {
        if (!testAnalyserRef.current) return;
        const dataArray = new Uint8Array(testAnalyserRef.current.frequencyBinCount);
        testAnalyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(1, average / 90);
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(runTestMeter);
      };

      runTestMeter();
    } catch (err: any) {
      console.error('Failed to test microphone:', err);
      let msg = 'Could not test microphone.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = isTauriDesktop()
          ? 'Microphone permission was denied. Please allow microphone access under macOS System Settings > Privacy & Security > Microphone.'
          : 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
      } else if (err?.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      stopMicTest();
    }
  };

  const handleSelectDevice = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    try {
      localStorage.setItem('resursee_preferred_mic', newDeviceId);
    } catch {}

    if (isTestingMic) {
      stopMicTest();
      setTimeout(() => {
        startMicTestWithDevice(newDeviceId);
      }, 150);
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

  const startRecording = async () => {
    if (isTestingMic) {
      stopMicTest();
    }
    setErrorMessage(null);
    recordedChunksRef.current = [];
    pcmChunksRef.current = [];
    setLiveTranscript('');

    try {
      const stream = await requestAudioStream(selectedDeviceId);
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

    // Generate universal uncompressed 16kHz PCM WAV blob guaranteed to play across all platforms
    const playableWavBlob =
      rawChannelData.length > 0
        ? float32ArrayToWavBlob(rawChannelData, 16000)
        : finalBlob;

    if (playableWavBlob.size === 0 && rawChannelData.length === 0) {
      setErrorMessage('No speech recorded. Please check your microphone input.');
      return;
    }

    // Send final playable audioBlob and rawChannelData
    onRecordingComplete(playableWavBlob, rawChannelData, duration, liveTranscript);
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
                  : isTestingMic
                  ? 'bg-neutral-800 dark:bg-neutral-200 animate-pulse'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              {isRecording
                ? isPaused
                  ? 'Paused'
                  : 'Recording Live'
                : isTestingMic
                ? 'Testing Mic (Speak Now)'
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
            const isActive =
              ((isRecording && !isPaused) || isTestingMic) && audioLevel >= threshold;
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

      {/* Audio Input Device Selector & Testing Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 shrink-0">
          <Microphone size={15} weight="bold" />
          <span className="font-semibold">Input Device:</span>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <select
            value={selectedDeviceId}
            disabled={isRecording || isProcessing}
            onChange={(e) => handleSelectDevice(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400 disabled:opacity-50 truncate cursor-pointer"
          >
            {availableDevices.length === 0 ? (
              <option value="default">Default System Microphone</option>
            ) : (
              availableDevices.map((dev) => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={() => loadAudioDevices(true)}
            disabled={isRecording || isProcessing}
            title="Scan & detect connected audio devices"
            className="shrink-0 rounded-lg border border-neutral-300 bg-neutral-100 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowsClockwise size={13} weight="bold" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={isTestingMic ? stopMicTest : () => startMicTestWithDevice()}
            disabled={isRecording || isProcessing}
            title={isTestingMic ? 'Stop microphone test' : 'Test voice levels before recording'}
            className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              isTestingMic
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <SlidersHorizontal size={13} weight="bold" />
            <span>{isTestingMic ? 'Stop Test' : 'Test Mic'}</span>
          </button>
        </div>
      </div>

      {/* Discord-Style Voice Audio Loopback Panel (Active while testing mic) */}
      {isTestingMic && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-neutral-300 bg-neutral-100/90 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800/80 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setHearVoiceFeedback((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                hearVoiceFeedback
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
              }`}
              title={hearVoiceFeedback ? 'Mute voice feedback' : 'Enable voice feedback to hear yourself'}
            >
              {hearVoiceFeedback ? (
                <SpeakerHigh size={14} weight="bold" />
              ) : (
                <SpeakerSimpleSlash size={14} weight="bold" />
              )}
              <span>Hear Yourself: {hearVoiceFeedback ? 'On' : 'Muted'}</span>
            </button>
            <span className="hidden sm:inline text-neutral-400 dark:text-neutral-500">•</span>
            <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
              Real-time voice feedback (headphones recommended)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0">
              Volume:
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={hearVoiceFeedback ? feedbackVolume : 0}
              disabled={!hearVoiceFeedback}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFeedbackVolume(val);
                if (!hearVoiceFeedback && val > 0) {
                  setHearVoiceFeedback(true);
                }
              }}
              className="h-1.5 w-24 accent-neutral-900 dark:accent-white cursor-pointer"
            />
            <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-300 w-8 text-right">
              {Math.round((hearVoiceFeedback ? feedbackVolume : 0) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Active Transcription Processing Feedback */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-300 bg-neutral-100/90 p-5 text-center dark:border-neutral-700 dark:bg-neutral-800/80 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm shrink-0">
              <ArrowsClockwise size={16} weight="bold" className="animate-spin" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                  AI Model is Transcribing Your Audio...
                </span>
                <span className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  Processing
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Decoding audio track, detecting spoken dialogue, and identifying speakers. Please hold on.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
            <span>Active neural inference in progress • Website is not frozen</span>
          </div>
        </div>
      )}

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
            <span>{isProcessing ? 'Transcribing Recording...' : 'Start Recording'}</span>
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
