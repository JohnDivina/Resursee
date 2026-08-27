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
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        getAudioContext();
        setTimeout(() => playThock(1, 0.28), 30);
      }
      return next;
    });
  }, []);

  // Global hover sound listener + early gesture unlock
  useEffect(() => {
    // Eagerly unlock AudioContext on ANY early user interaction (moving mouse, scrolling, touching)
    const earlyUnlockEvents = ['pointermove', 'mousemove', 'wheel', 'scroll', 'touchstart', 'pointerdown', 'keydown'];

    const handleEarlyUnlock = () => {
      getAudioContext();
    };

    earlyUnlockEvents.forEach((evt) => {
      window.addEventListener(evt, handleEarlyUnlock, { passive: true, once: true });
    });

    if (!soundEnabled) {
      return () => {
        earlyUnlockEvents.forEach((evt) => {
          window.removeEventListener(evt, handleEarlyUnlock);
        });
      };
    }

    const interactiveSelector =
      'a, button, [role="button"], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], select, [data-thock], .hover-thock, summary, [tabindex="0"]';

    const handlePointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest interactive element
      const interactiveEl = target.closest(interactiveSelector);

      if (interactiveEl) {
        // If we entered a new distinct interactive element
        if (interactiveEl !== lastHoveredElementRef.current) {
          lastHoveredElementRef.current = interactiveEl;

          const now = performance.now();
          // Rate-limit to max 1 sound per 35ms for silky-smooth rapid swipes
          if (now - lastPlayTimeRef.current > 35) {
            lastPlayTimeRef.current = now;

            // Pitch & depth scaling based on element importance
            const isCard = interactiveEl.matches('[data-thock="card"], .group') || interactiveEl.classList.contains('group');
            const isPill = interactiveEl.matches('span, kbd, [data-thock="soft"]');

            if (isCard) {
              playDeepThock(0.28);
            } else if (isPill) {
              playSoftClick(0.18);
            } else {
              playThock(1.0, 0.24);
            }
          }
        }
      } else {
        lastHoveredElementRef.current = null;
      }
    };

    window.addEventListener('pointerover', handlePointerOver, { passive: true });

    return () => {
      window.removeEventListener('pointerover', handlePointerOver);
      earlyUnlockEvents.forEach((evt) => {
        window.removeEventListener(evt, handleEarlyUnlock);
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
