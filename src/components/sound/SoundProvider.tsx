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

  // Sync initial sound state from localStorage (defaults to true)
  useEffect(() => {
    const initial = getSoundEnabled();
    setSoundEnabledState(initial);
    setSoundEnabled(initial);

    // Expose for testing in console if needed
    if (typeof window !== 'undefined') {
      (window as unknown as { __playThock: typeof playThock }).__playThock = playThock;
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        unlockAudioEngine();
        setTimeout(() => playThock(1, 0.4), 10);
      }
      return next;
    });
  }, []);

  // Global Interaction Unlock & Hover Audio Handler
  useEffect(() => {
    // 1. Permanent interaction listeners to unlock AudioContext
    const handleGestureUnlock = () => {
      unlockAudioEngine();
    };

    const unlockEvents = ['pointerdown', 'mousedown', 'click', 'touchstart', 'keydown', 'wheel', 'scroll'];
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

    const handlePointerOver = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find the closest interactive ancestor
      const interactiveEl = target.closest(interactiveSelector);

      if (interactiveEl) {
        if (interactiveEl !== lastHoveredElementRef.current) {
          lastHoveredElementRef.current = interactiveEl;

          const now = performance.now();
          // Rate-limit throttle to max 1 thock per 25ms
          if (now - lastPlayTimeRef.current > 25) {
            lastPlayTimeRef.current = now;

            const isCard =
              interactiveEl.matches('[data-thock="card"]') ||
              interactiveEl.classList.contains('group') ||
              interactiveEl.tagName === 'ARTICLE';

            const isPill =
              interactiveEl.matches('[data-thock="soft"]') ||
              interactiveEl.matches('kbd');

            if (isCard) {
              playDeepThock(0.42);
            } else if (isPill) {
              playSoftClick(0.28);
            } else {
              playThock(1.0, 0.38);
            }
          }
        }
      } else {
        lastHoveredElementRef.current = null;
      }
    };

    const handlePointerOut = (e: MouseEvent | PointerEvent) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (!related || !related.closest(interactiveSelector)) {
        lastHoveredElementRef.current = null;
      }
    };

    window.addEventListener('mouseover', handlePointerOver, { passive: true });
    window.addEventListener('mouseout', handlePointerOut, { passive: true });

    return () => {
      window.removeEventListener('mouseover', handlePointerOver);
      window.removeEventListener('mouseout', handlePointerOut);
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
