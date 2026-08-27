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
      aria-label={soundEnabled ? 'Mute thocky hover sounds' : 'Enable thocky hover sounds'}
      title={soundEnabled ? 'Thocky Sounds: ON (Click to mute)' : 'Thocky Sounds: OFF (Click to enable)'}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-[var(--color-ink)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-card)] active:scale-95 ${className}`}
    >
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
        {soundEnabled ? (
          <SpeakerHigh
            size={18}
            weight="bold"
            className="text-[var(--color-primary)] transition-transform duration-200"
          />
        ) : (
          <SpeakerSlash
            size={18}
            weight="regular"
            className="text-[var(--color-ink-muted)] opacity-60 transition-transform duration-200"
          />
        )}
      </div>

      {/* Tiny Status Indicator Dot */}
      <span
        className={`pointer-events-none absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full transition-colors ${
          soundEnabled ? 'bg-emerald-500' : 'bg-rose-400 opacity-70'
        }`}
      />
    </button>
  );
}
