'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  ArrowCounterClockwise,
  ArrowClockwise,
  BookmarkSimple,
  SpeakerHigh,
  SpeakerSlash,
} from '@phosphor-icons/react';
import { formatTimestamp } from '@/lib/audioProcessor';

interface AudioPlayerProps {
  audioUrl?: string;
  duration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  onAddBookmark?: (time: number) => void;
  waveformPeaks?: number[];
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  duration,
  currentTime,
  onTimeUpdate,
  onSeek,
  onAddBookmark,
  waveformPeaks = [],
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Sync external seek actions with HTML5 audio element
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Reload audio source when new recording or file is loaded
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
      setIsPlaying(false);
    }
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Audio playback error:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      onTimeUpdate(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
    onSeek(targetTime);
  };

  const skipSeconds = (delta: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = target;
    onSeek(target);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-[#121212] ${className}`}
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          preload="metadata"
        />
      )}

      {/* Waveform Visualization Bar */}
      <div
        className="group relative mb-4 flex h-14 w-full cursor-pointer items-center justify-between gap-[2px] rounded-xl bg-neutral-100 px-3 transition-colors hover:bg-neutral-200/70 dark:bg-neutral-900/80 dark:hover:bg-neutral-900"
        onClick={handleSeek}
      >
        {/* Scrubber Progress Overlay */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 top-0 rounded-l-xl bg-neutral-900/10 transition-all dark:bg-white/10"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Current scrubber needle */}
        <div
          className="pointer-events-none absolute bottom-1 top-1 w-[2px] rounded-full bg-neutral-900 shadow transition-all dark:bg-white"
          style={{ left: `${progressPercent}%` }}
        />

        {/* Waveform Bars */}
        {(waveformPeaks.length > 0 ? waveformPeaks : new Array(60).fill(0.15)).map(
          (peak, idx) => {
            const barProgress = (idx / (waveformPeaks.length || 60)) * 100;
            const isPlayed = barProgress <= progressPercent;

            return (
              <div
                key={idx}
                className="flex h-full flex-1 items-center justify-center"
              >
                <div
                  className={`w-full rounded-full transition-all duration-75 ${
                    isPlayed
                      ? 'bg-neutral-900 dark:bg-white'
                      : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                  style={{
                    height: `${Math.max(12, Math.min(100, peak * 100))}%`,
                  }}
                />
              </div>
            );
          }
        )}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Time and skip */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => skipSeconds(-5)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title="Rewind 5s"
          >
            <ArrowCounterClockwise size={16} weight="bold" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={!audioUrl}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white shadow transition hover:bg-neutral-800 active:scale-95 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={18} weight="fill" />
            ) : (
              <Play size={18} weight="fill" className="ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipSeconds(5)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title="Forward 5s"
          >
            <ArrowClockwise size={16} weight="bold" />
          </button>

          <div className="ml-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            <span>{formatTimestamp(currentTime)}</span>
            <span className="mx-1 text-neutral-400">/</span>
            <span>{formatTimestamp(duration)}</span>
          </div>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-xs font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            title="Playback Speed"
          >
            {playbackRate}×
          </button>

          {/* Bookmark Button */}
          {onAddBookmark && (
            <button
              type="button"
              onClick={() => onAddBookmark(currentTime)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              title="Add Bookmark at current time"
            >
              <BookmarkSimple size={14} weight="bold" />
              <span className="hidden sm:inline">Bookmark</span>
            </button>
          )}

          {/* Mute toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <SpeakerSlash size={15} weight="bold" />
            ) : (
              <SpeakerHigh size={15} weight="bold" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
