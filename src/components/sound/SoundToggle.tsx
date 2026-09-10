'use client';

import React from 'react';
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { useSound } from '@/components/sound/SoundProvider';

interface SoundToggleProps {
  className?: string;
}

export default function SoundToggle({ className = '' }: SoundToggleProps) {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={soundEnabled ? 'Mute 3D spatial thock sounds' : 'Enable 3D spatial thock sounds'}
      title={soundEnabled ? '3D Spatial Sounds: ON (Click to mute)' : '3D Spatial Sounds: OFF (Click to enable)'}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-lg border transition-transform duration-160 active:scale-[0.92] ${
        soundEnabled
          ? 'border-[var(--color-rule-strong)] text-[var(--color-ink)] bg-[var(--color-paper-card)] dark:bg-[#1a1a1a] shadow-xs'
          : 'border-[var(--color-rule-strong)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-card)]'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
        {soundEnabled ? (
          <SpeakerHigh
            size={16}
            weight="bold"
            className="text-[var(--color-ink)] transition-transform duration-200"
          />
        ) : (
          <SpeakerSlash
            size={16}
            weight="regular"
            className="text-[var(--color-ink-muted)] opacity-60 transition-transform duration-200"
          />
        )}
      </div>

      {/* 3D Spatial Status Dot */}
      <span
        className={`pointer-events-none absolute top-1 right-1 h-1.5 w-1.5 rounded-full transition-colors ${
          soundEnabled ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-400/60 dark:bg-neutral-600'
        }`}
      />
    </button>
  );
}
