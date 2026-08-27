'use client';

import React from 'react';
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { useSound } from '@/components/sound/SoundProvider';

export default function SoundToggle() {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={`group flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)] shadow-2xs transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-ink)] active:scale-95 ${
        soundEnabled ? 'text-[var(--color-primary)]' : 'opacity-60'
      }`}
      aria-label={soundEnabled ? 'Disable mechanical sound effects' : 'Enable mechanical sound effects'}
      title={soundEnabled ? 'Thocky sound effects: ON' : 'Thocky sound effects: MUTED'}
    >
      {soundEnabled ? (
        <SpeakerHigh size={17} weight="bold" className="transition-transform group-hover:scale-110 text-[var(--color-primary)]" />
      ) : (
        <SpeakerSlash size={17} weight="regular" className="transition-transform group-hover:scale-110" />
      )}
    </button>
  );
}
