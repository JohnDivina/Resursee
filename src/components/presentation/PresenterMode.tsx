'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PresentationDeck, TechTheme } from '@/types/presentation';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CaretLeft,
  CaretRight,
  ArrowsIn,
  ArrowsOut,
  Notebook,
  Moon,
  Play,
  Pause,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface PresenterModeProps {
  deck: PresentationDeck;
  initialSlideIndex?: number;
  theme: TechTheme;
  onExit: () => void;
}

export default function PresenterMode({
  deck,
  initialSlideIndex = 0,
  theme,
  onExit,
}: PresenterModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialSlideIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);

  // Presenter Rehearsal Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleNext = useCallback(() => {
    if (currentIndex < deck.slides.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, deck.slides.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        onExit();
      } else if (e.key === 'b' || e.key === 'B') {
        setIsBlackout((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        setShowNotes((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onExit]);

  const currentSlide = deck.slides[currentIndex] || deck.slides[0];

  // Transition variants
  const getTransitionVariants = () => {
    switch (deck.transition) {
      case 'slide-horizontal':
        return {
          initial: { x: direction * 80, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: direction * -80, opacity: 0 },
        };
      case 'slide-vertical':
        return {
          initial: { y: direction * 60, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: direction * -60, opacity: 0 },
        };
      case 'zoom':
        return {
          initial: { scale: 0.92, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.05, opacity: 0 },
        };
      case 'flip':
        return {
          initial: { rotateY: direction * 40, opacity: 0 },
          animate: { rotateY: 0, opacity: 1 },
          exit: { rotateY: direction * -40, opacity: 0 },
        };
      case 'morph':
        return {
          initial: { filter: 'blur(8px)', opacity: 0 },
          animate: { filter: 'blur(0px)', opacity: 1 },
          exit: { filter: 'blur(8px)', opacity: 0 },
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variants = getTransitionVariants();

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Blackout Curtain (Toggled via 'B' key or HUD) */}
      {isBlackout && (
        <div
          onClick={() => setIsBlackout(false)}
          className="absolute inset-0 bg-black z-60 flex items-center justify-center cursor-pointer"
        >
          <div className="text-center">
            <span className="font-mono text-xs text-neutral-600 uppercase tracking-widest">
              Stage Blackout Active • Press &apos;B&apos; or Click to Resume
            </span>
          </div>
        </div>
      )}

      {/* Main Slide Stage Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-10 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide.id}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className={cn(
              'w-full max-w-6xl aspect-video rounded-3xl p-8 sm:p-14 flex flex-col justify-between shadow-2xl relative border',
              theme.bgClass,
              theme.borderClass,
              theme.fontFamily
            )}
          >
            {/* Slide Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-500/20">
              <span className={cn('font-mono text-xs font-bold uppercase tracking-wider', theme.mutedTextClass)}>
                {currentSlide.tag || `SLIDE ${currentIndex + 1}`}
              </span>
              <span className={cn('font-mono text-xs font-bold', theme.mutedTextClass)}>
                {currentIndex + 1} / {deck.slides.length}
              </span>
            </div>

            {/* Slide Titles */}
            <div className="my-auto py-4">
              <h1
                className={cn(
                  'font-black tracking-tight leading-tight',
                  currentSlide.layout === 'title-cover'
                    ? 'text-3xl sm:text-5xl text-center'
                    : 'text-2xl sm:text-4xl text-left',
                  theme.textClass
                )}
              >
                {currentSlide.title}
              </h1>

              {currentSlide.subtitle && (
                <p
                  className={cn(
                    'text-sm sm:text-lg mt-3 leading-relaxed',
                    currentSlide.layout === 'title-cover' ? 'text-center' : 'text-left',
                    theme.subtextClass
                  )}
                >
                  {currentSlide.subtitle}
                </p>
              )}

              {/* Layout Content */}
              <div className="mt-8">
                {/* 1. Bullet Points */}
                {currentSlide.layout === 'bullets-points' && currentSlide.bullets && (
                  <ul className="space-y-4">
                    {currentSlide.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-4 text-base sm:text-xl">
                        <span className={cn('h-2.5 w-2.5 rounded-full mt-2 shrink-0', theme.dotClass)} />
                        <span className={theme.bodyTextClass}>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 2. Split Columns */}
                {currentSlide.layout === 'split-columns' && currentSlide.columns && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {currentSlide.columns.map((col, cIdx) => (
                      <div key={cIdx} className={cn('rounded-2xl p-6 border', theme.surfaceClass)}>
                        <h3 className={cn('font-bold text-lg mb-3', theme.textClass)}>{col.heading}</h3>
                        <ul className="space-y-2.5">
                          {col.content.map((item, iIdx) => (
                            <li key={iIdx} className="flex items-start gap-2.5 text-sm">
                              <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', theme.dotClass)} />
                              <span className={theme.bodyTextClass}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Stats & Metrics */}
                {currentSlide.layout === 'stats-metrics' && currentSlide.metrics && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {currentSlide.metrics.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className={cn('rounded-2xl p-5 text-center border', theme.surfaceClass)}
                        >
                          <div className={cn('text-3xl sm:text-4xl font-black', theme.textClass)}>{m.value}</div>
                          <div className={cn('text-xs font-mono mt-2', theme.subtextClass)}>{m.label}</div>
                          {m.change && (
                            <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                              {m.change}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {currentSlide.bullets && (
                      <ul className="space-y-2 pt-2">
                        {currentSlide.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-center gap-2 text-sm">
                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', theme.dotClass)} />
                            <span className={theme.bodyTextClass}>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* 4. Code Architecture */}
                {currentSlide.layout === 'code-architecture' && currentSlide.codeSnippet && (
                  <div className={cn('rounded-2xl overflow-hidden border', theme.isDark ? 'border-neutral-800 bg-[#0c0d12]' : 'border-neutral-300 bg-neutral-900 text-neutral-100')}>
                    <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 font-mono text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-neutral-600" />
                        <span className="font-bold uppercase text-neutral-200">{currentSlide.codeSnippet.language}</span>
                      </div>
                      <span>{currentSlide.codeSnippet.caption || ''}</span>
                    </div>
                    <pre className="p-5 font-mono text-xs sm:text-sm text-neutral-200 overflow-x-auto">
                      <code>{currentSlide.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}

                {/* 5. Timeline Roadmap */}
                {currentSlide.layout === 'timeline-roadmap' && currentSlide.timeline && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {currentSlide.timeline.map((t, idx) => (
                      <div key={idx} className={cn('rounded-2xl p-5 border', theme.surfaceClass)}>
                        <div className={cn('font-mono text-xs font-bold', theme.mutedTextClass)}>{t.step}</div>
                        <div className={cn('font-bold text-base my-2', theme.textClass)}>{t.title}</div>
                        <p className={cn('text-xs leading-relaxed', theme.bodyTextClass)}>{t.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. Quote / Highlight */}
                {currentSlide.layout === 'quote-highlight' && currentSlide.quote && (
                  <div className={cn('rounded-3xl p-8 sm:p-12 border', theme.surfaceClass)}>
                    <blockquote className={cn('text-xl sm:text-3xl font-serif italic font-bold leading-relaxed', theme.textClass)}>
                      “{currentSlide.quote.text}”
                    </blockquote>
                    <div className="mt-6 font-mono text-sm flex items-center gap-2">
                      <span className={cn('font-bold', theme.textClass)}>— {currentSlide.quote.author || ''}</span>
                      {currentSlide.quote.role && (
                        <span className={theme.mutedTextClass}>• {currentSlide.quote.role}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Slide Footer */}
            <div className="pt-3 border-t border-neutral-500/20 flex items-center justify-between text-xs">
              <span className={cn('font-mono', theme.mutedTextClass)}>{deck.title}</span>
              <span className={cn('font-mono', theme.mutedTextClass)}>{theme.name}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Speaker Notes Drawer (Toggled via 'N' or Notes Button) */}
      {showNotes && (
        <div className="absolute top-6 left-6 max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-md z-50 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="font-mono text-xs font-bold text-neutral-300">
              Speaker Notes (Private)
            </span>
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              className="text-neutral-500 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <p className="mt-2 text-xs font-mono text-neutral-300 leading-relaxed">
            {currentSlide.notes || 'No speaker notes recorded for this slide.'}
          </p>
        </div>
      )}

      {/* Presenter HUD Control Bar */}
      <div className="h-16 px-6 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between shrink-0 z-40 backdrop-blur-md">
        {/* Left: Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-300 bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-700">
            <span className="font-bold">{formatTimer(timerSeconds)}</span>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 hover:text-white cursor-pointer"
              title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
            >
              {isTimerRunning ? <Pause size={12} weight="bold" /> : <Play size={12} weight="bold" />}
            </button>
            <button
              type="button"
              onClick={() => setTimerSeconds(0)}
              className="p-1 hover:text-white cursor-pointer"
              title="Reset timer"
            >
              <ArrowCounterClockwise size={12} weight="bold" />
            </button>
          </div>
        </div>

        {/* Center: Slide Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 disabled:opacity-30 cursor-pointer transition-colors"
            title="Previous Slide (Arrow Left)"
          >
            <CaretLeft size={16} weight="bold" />
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
            <span className="font-bold text-white">{currentIndex + 1}</span>
            <span>/</span>
            <span>{deck.slides.length}</span>
          </div>

          <button
            type="button"
            disabled={currentIndex === deck.slides.length - 1}
            onClick={handleNext}
            className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 disabled:opacity-30 cursor-pointer transition-colors"
            title="Next Slide (Arrow Right)"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={cn(
              'p-2 rounded-xl border transition-colors cursor-pointer',
              showNotes
                ? 'bg-white text-black border-white'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            )}
            title="Toggle Speaker Notes (N)"
          >
            <Notebook size={16} weight="bold" />
          </button>

          <button
            type="button"
            onClick={() => setIsBlackout(!isBlackout)}
            className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 cursor-pointer transition-colors"
            title="Blackout Screen (B)"
          >
            <Moon size={16} weight="bold" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 cursor-pointer transition-colors"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <ArrowsIn size={16} weight="bold" /> : <ArrowsOut size={16} weight="bold" />}
          </button>

          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono font-bold text-neutral-300 hover:bg-red-950/40 hover:text-red-300 hover:border-red-900 cursor-pointer transition-colors ml-2"
          >
            <X size={14} weight="bold" />
            <span>Exit (Esc)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
