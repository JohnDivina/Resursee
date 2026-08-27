'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  playThock,
  playDeepThock,
  playSoftClick,
  setSoundEnabled,
  getSoundEnabled,
  getAudioContext,
} from '@/lib/soundEffects';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playThock: (pitch?: number, volume?: number) => void;
  playDeepThock: (volume?: number) => void;
  playSoftClick: (volume?: number) => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: true,
  toggleSound: () => {},
  playThock: () => {},
  playDeepThock: () => {},
  playSoftClick: () => {},
});

export const useSound = () => useContext(SoundContext);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const lastHoveredElementRef = useRef<Element | null>(null);
  const lastPlayTimeRef = useRef<number>(0);

  useEffect(() => {
    const initial = getSoundEnabled();
    setSoundEnabledState(initial);
    setSoundEnabled(initial);

    // Eagerly pre-warm audio context and synthesize memory buffers
    getAudioContext();
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        getAudioContext();
        setTimeout(() => playThock(1, 0.12), 10);
      }
      return next;
    });
  }, []);

  // 1. Immediate Autoplay Auto-Unlock on any initial pointer or keyboard movement
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };

    // Listen to any initial user interaction (including mere mouse cursor movement or scrolling)
    window.addEventListener('mousemove', unlockAudio, { once: true, passive: true });
    window.addEventListener('pointermove', unlockAudio, { once: true, passive: true });
    window.addEventListener('wheel', unlockAudio, { once: true, passive: true });
    window.addEventListener('scroll', unlockAudio, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true, passive: true });

    return () => {
      window.removeEventListener('mousemove', unlockAudio);
      window.removeEventListener('pointermove', unlockAudio);
      window.removeEventListener('wheel', unlockAudio);
      window.removeEventListener('scroll', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // 2. High-Performance, Zero-Latency Hover Detection
  useEffect(() => {
    if (!soundEnabled) return;

    const interactiveSelector =
      'a, button, [role="button"], input, select, textarea, [data-thock], .hover-thock, summary, [tabindex="0"]';

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest interactive parent
      const interactiveEl = target.closest(interactiveSelector);

      if (interactiveEl) {
        if (interactiveEl !== lastHoveredElementRef.current) {
          lastHoveredElementRef.current = interactiveEl;

          const now = performance.now();
          // Rate-limit to max 1 sound per 25ms to prevent audio clipping during rapid swipes
          if (now - lastPlayTimeRef.current > 25) {
            lastPlayTimeRef.current = now;

            // Differentiate sound based on element type
            const isCard =
              interactiveEl.matches('[data-thock="card"]') ||
              interactiveEl.classList.contains('group') ||
              interactiveEl.tagName === 'ARTICLE';

            const isPill =
              interactiveEl.matches('span, kbd, [data-thock="soft"]') ||
              interactiveEl.classList.contains('rounded-full');

            if (isCard) {
              playDeepThock(0.13);
            } else if (isPill) {
              playSoftClick(0.09);
            } else {
              playThock(1.0, 0.11);
            }
          }
        }
      } else {
        lastHoveredElementRef.current = null;
      }
    };

    // Use capturing mouseover for the fastest possible event delivery
    document.addEventListener('mouseover', handleMouseOver, { capture: true, passive: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, { capture: true });
    };
  }, [soundEnabled]);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playThock,
        playDeepThock,
        playSoftClick,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}
