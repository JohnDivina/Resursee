'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  playThock,
  playDeepThock,
  playSoftClick,
  setSoundEnabled,
  getSoundEnabled,
  unlockAudioEngine,
  setSpatialPan,
  calculatePanFromClientX,
  calculatePanFromElement,
} from '@/lib/soundEffects';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playThock: (pitch?: number, volume?: number, pan?: number) => boolean | void;
  playDeepThock: (volume?: number, pan?: number) => boolean | void;
  playSoftClick: (volume?: number, pan?: number) => boolean | void;
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

  // Global Interaction Unlock & Tactile 3D Spatial Audio Handler
  useEffect(() => {
    // 1. If navigator has active user activation, immediately unlock AudioContext
    if (
      typeof navigator !== 'undefined' &&
      (navigator as unknown as { userActivation?: { hasBeenActive?: boolean } }).userActivation?.hasBeenActive
    ) {
      unlockAudioEngine();
    }

    // 2. Eager interaction listeners to unlock AudioContext on the very first cursor movement or interaction
    const handleGestureUnlock = () => {
      unlockAudioEngine();
    };

    // 3. Continuous 3D Spatial Stereo tracking based on mouse X position (DomoDomo style)
    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      if (e.clientX > 0) {
        setSpatialPan(calculatePanFromClientX(e.clientX));
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true, capture: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true, capture: true });

    const unlockEvents = [
      'pointermove',
      'mousemove',
      'pointerover',
      'mouseover',
      'pointerdown',
      'mousedown',
      'touchstart',
      'keydown',
      'wheel',
      'scroll',
      'click',
    ];
    unlockEvents.forEach((evt) => {
      window.addEventListener(evt, handleGestureUnlock, { capture: true, passive: true });
    });

    // 4. Tab visibility and focus recovery
    const handleVisibilityRecovery = () => {
      if (document.visibilityState === 'visible') {
        unlockAudioEngine();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityRecovery);
    window.addEventListener('focus', handleVisibilityRecovery);

    if (!soundEnabled) {
      return () => {
        window.removeEventListener('mousemove', handlePointerMove, { capture: true });
        window.removeEventListener('pointermove', handlePointerMove, { capture: true });
        unlockEvents.forEach((evt) => {
          window.removeEventListener(evt, handleGestureUnlock, { capture: true });
        });
        document.removeEventListener('visibilitychange', handleVisibilityRecovery);
        window.removeEventListener('focus', handleVisibilityRecovery);
      };
    }

    const interactiveSelector =
      'button, a, input, textarea, select, .cursor-pointer, [role="button"], [role="tab"], [role="link"], [data-thock], .tool-card, .glass-card, .category-pill, nav a, header button, header a, .btn-primary, .btn-secondary, label, summary, [tabindex="0"]';

    // Hover 3D Spatial Haptic Handler
    const handlePointerOver = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest(interactiveSelector);

      if (interactiveEl) {
        if (interactiveEl !== lastHoveredElementRef.current) {
          lastHoveredElementRef.current = interactiveEl;

          const now = performance.now();
          // Rate-limit throttle to max 1 thock per 25ms
          if (now - lastPlayTimeRef.current > 25) {
            lastPlayTimeRef.current = now;

            // Calculate precise earphone spatial pan from element and cursor
            const pan = calculatePanFromElement(interactiveEl, e.clientX);

            const isCard =
              interactiveEl.matches('[data-thock="card"]') ||
              interactiveEl.classList.contains('group') ||
              interactiveEl.tagName === 'ARTICLE';

            const isPill =
              interactiveEl.matches('[data-thock="soft"]') ||
              interactiveEl.matches('kbd');

            if (isCard) {
              playDeepThock(0.42, pan);
            } else if (isPill) {
              playSoftClick(0.28, pan);
            } else {
              playThock(1.0, 0.36, pan);
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

    // Tactile Click / Tap Feedback (Works on Desktop & Touch/Mobile with 3D Spatial Position)
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      unlockAudioEngine();

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveEl = target.closest(interactiveSelector);
      if (interactiveEl) {
        const now = performance.now();
        // Short debounce (50ms) so hover + click don't double-fire harsh transient
        if (now - lastPlayTimeRef.current > 50) {
          lastPlayTimeRef.current = now;

          const pan = calculatePanFromElement(interactiveEl, e.clientX);

          const isCard =
            interactiveEl.matches('[data-thock="card"]') ||
            interactiveEl.classList.contains('group') ||
            interactiveEl.tagName === 'ARTICLE';

          if (isCard) {
            playDeepThock(0.40, pan);
          } else {
            playThock(1.15, 0.35, pan);
          }
        }
      }
    };

    window.addEventListener('mouseover', handlePointerOver, { passive: true });
    window.addEventListener('mouseout', handlePointerOut, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove, { capture: true });
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
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
