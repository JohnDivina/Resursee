'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  playThock,
  playDeepThock,
  playSoftClick,
  setSoundEnabled,
  getSoundEnabled,
  getAudioContext,
  unlockAudioEngine,
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

  // Sync initial sound state
  useEffect(() => {
    const initial = getSoundEnabled();
    setSoundEnabledState(initial);
    setSoundEnabled(initial);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        unlockAudioEngine();
        setTimeout(() => playThock(1, 0.32), 20);
      }
      return next;
    });
  }, []);

  // Global Interaction Unlock & Hover Audio Handler
  useEffect(() => {
    // 1. Unlock browser audio hardware on first user gesture (pointerdown, click, touch, keydown)
    const unlockEvents = ['pointerdown', 'mousedown', 'click', 'touchstart', 'keydown'];
    const handleGestureUnlock = () => {
      unlockAudioEngine();
    };

    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, handleGestureUnlock, { capture: true, passive: true });
    });

    if (!soundEnabled) {
      return () => {
        unlockEvents.forEach((evt) => {
          window.removeEventListener(evt, handleGestureUnlock, { capture: true });
        });
      };
    }

    const interactiveSelector =
      'a, button, [role="button"], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], select, [data-thock], .hover-thock, summary, [tabindex="0"]';

    const handlePointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Eagerly wake up AudioContext if it was suspended
      getAudioContext();

      // Find the closest interactive ancestor
      const interactiveEl = target.closest(interactiveSelector);

      if (interactiveEl) {
        // If entering a new distinct interactive target
        if (interactiveEl !== lastHoveredElementRef.current) {
          lastHoveredElementRef.current = interactiveEl;

          const now = performance.now();
          // Rate-limit throttle to max 1 thock per 28ms to prevent audio spam on high-DPI mouse sweeps
          if (now - lastPlayTimeRef.current > 28) {
            lastPlayTimeRef.current = now;

            // Pitch & depth scaling based on element type
            const isCard =
              interactiveEl.matches('[data-thock="card"]') ||
              interactiveEl.classList.contains('group') ||
              interactiveEl.tagName === 'ARTICLE';

            const isPill =
              interactiveEl.matches('[data-thock="soft"]') ||
              interactiveEl.matches('kbd');

            if (isCard) {
              playDeepThock(0.32);
            } else if (isPill) {
              playSoftClick(0.22);
            } else {
              playThock(1.0, 0.28);
            }
          }
        }
      } else {
        // Pointer is on whitespace or non-interactive background
        lastHoveredElementRef.current = null;
      }
    };

    const handlePointerOut = (e: PointerEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !related.closest(interactiveSelector)) {
        lastHoveredElementRef.current = null;
      }
    };

    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    window.addEventListener('pointerout', handlePointerOut, { passive: true });

    return () => {
      window.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('pointerout', handlePointerOut);
      unlockEvents.forEach((evt) => {
        window.removeEventListener(evt, handleGestureUnlock, { capture: true });
      });
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
