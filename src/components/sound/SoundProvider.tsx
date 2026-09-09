'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  playThock,
  playDeepThock,
  playSoftClick,
  setSoundEnabled,
  getSoundEnabled,
  unlockAudioEngine,
} from '@/lib/soundEffects';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playThock: (pitch?: number, volume?: number) => boolean | void;
  playDeepThock: (volume?: number) => boolean | void;
  playSoftClick: (volume?: number) => boolean | void;
  unlockAudioEngine: () => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: true,
  toggleSound: () => {},
  playThock: () => false,
  playDeepThock: () => false,
  playSoftClick: () => false,
  unlockAudioEngine: () => {},
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

    // Expose for debugging/testing if needed
    if (typeof window !== 'undefined') {
      (window as unknown as { __playThock: typeof playThock }).__playThock = playThock;
      (window as unknown as { __unlockAudio: typeof unlockAudioEngine }).__unlockAudio = unlockAudioEngine;
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

  // Global Interaction Unlock & Tactile Audio Handler
  useEffect(() => {
    // 1. If navigator has active user activation, immediately unlock AudioContext
    if (
      typeof navigator !== 'undefined' &&
      (navigator as unknown as { userActivation?: { hasBeenActive?: boolean } }).userActivation?.hasBeenActive
    ) {
      unlockAudioEngine();
    }

    // 2. Permanent interaction listeners to unlock AudioContext on user gestures
    const handleGestureUnlock = () => {
      unlockAudioEngine();
    };

    const unlockEvents = ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'click'];
    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, handleGestureUnlock, { capture: true, passive: true });
    });

    // 3. Tab visibility and focus recovery
    const handleVisibilityRecovery = () => {
      if (document.visibilityState === 'visible') {
        unlockAudioEngine();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityRecovery);
    window.addEventListener('focus', handleVisibilityRecovery);

    if (!soundEnabled) {
      return () => {
        unlockEvents.forEach((evt) => {
          window.removeEventListener(evt, handleGestureUnlock, { capture: true });
        });
        document.removeEventListener('visibilitychange', handleVisibilityRecovery);
        window.removeEventListener('focus', handleVisibilityRecovery);
      };
    }

    const interactiveSelector =
      'a, button, [role="button"], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], select, [data-thock], .hover-thock, summary, [tabindex="0"]';

    // Hover Haptic Handler
    const handlePointerOver = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest(interactiveSelector);

      if (interactiveEl) {
        if (interactiveEl !== lastHoveredElementRef.current) {
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

            let played = false;
            if (isCard) {
              played = playDeepThock(0.42);
            } else if (isPill) {
              played = playSoftClick(0.28);
            } else {
              played = playThock(1.0, 0.38);
            }

            if (played) {
              lastHoveredElementRef.current = interactiveEl;
            } else {
              // Sound was blocked by browser autoplay or pending user gesture!
              // Clear ref so that when audio unlocks, this element isn't locked out
              lastHoveredElementRef.current = null;
              unlockAudioEngine();
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

    // Tactile Click / Tap Feedback (Works on Desktop & Touch/Mobile)
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      unlockAudioEngine();

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest(interactiveSelector);
      if (interactiveEl) {
        const now = performance.now();
        // Short debounce (55ms) so hover + click don't double-fire harsh transient
        if (now - lastPlayTimeRef.current > 55) {
          lastPlayTimeRef.current = now;

          const isCard =
            interactiveEl.matches('[data-thock="card"]') ||
            interactiveEl.classList.contains('group') ||
            interactiveEl.tagName === 'ARTICLE';

          if (isCard) {
            playDeepThock(0.35);
          } else {
            playThock(1.15, 0.30);
          }
        }
      }
    };

    window.addEventListener('mouseover', handlePointerOver, { passive: true });
    window.addEventListener('mouseout', handlePointerOut, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });

    return () => {
      window.removeEventListener('mouseover', handlePointerOver);
      window.removeEventListener('mouseout', handlePointerOut);
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      unlockEvents.forEach((evt) => {
        window.removeEventListener(evt, handleGestureUnlock, { capture: true });
      });
      document.removeEventListener('visibilitychange', handleVisibilityRecovery);
      window.removeEventListener('focus', handleVisibilityRecovery);
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
        unlockAudioEngine,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}
