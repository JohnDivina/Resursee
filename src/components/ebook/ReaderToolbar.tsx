'use client';

import React, { useState } from 'react';
import { ReadingSettings, ReadingTheme, FontFamily, Ebook } from '@/types/ebook';
import {
  ArrowLeft,
  List,
  TextAa,
  SpeakerHigh,
  SpeakerSlash,
  Lightning,
  ArrowsOut,
  ArrowsIn,
  Palette,
  Check,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ReaderToolbarProps {
  book: Ebook;
  currentChapterTitle: string;
  settings: ReadingSettings;
  onUpdateSettings: (newSettings: Partial<ReadingSettings>) => void;
  onOpenChapters: () => void;
  onBackToShelf: () => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const THEME_OPTIONS: { id: ReadingTheme; name: string; bg: string; text: string }[] = [
  { id: 'paper', name: 'Paper Light', bg: 'bg-[#faf9f5]', text: 'text-[#2d2b28]' },
  { id: 'sepia', name: 'Warm Sepia', bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]' },
  { id: 'dark', name: 'Obsidian OLED', bg: 'bg-[#0c0c0e]', text: 'text-[#e4e4e7]' },
  { id: 'midnight', name: 'Midnight Slate', bg: 'bg-[#0f172a]', text: 'text-[#cbd5e1]' },
];

const FONT_OPTIONS: { id: FontFamily; name: string; fontClass: string }[] = [
  { id: 'serif', name: 'Serif (Classic)', fontClass: 'font-serif' },
  { id: 'sans', name: 'Sans (Modern)', fontClass: 'font-sans' },
  { id: 'mono', name: 'Mono (Tech)', fontClass: 'font-mono' },
  { id: 'opendyslexic', name: 'OpenDyslexic', fontClass: 'font-sans tracking-wide' },
];

export default function ReaderToolbar({
  book,
  currentChapterTitle,
  settings,
  onUpdateSettings,
  onOpenChapters,
  onBackToShelf,
  isSpeaking,
  onToggleSpeech,
  isFullscreen,
  onToggleFullscreen,
}: ReaderToolbarProps) {
  const [showTypographyMenu, setShowTypographyMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-neutral-200/60 bg-white/90 px-4 backdrop-blur-md dark:border-neutral-800/80 dark:bg-[#0c0c0e]/90 transition-all">
      {/* Left: Back to Shelf & TOC */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackToShelf}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer transition shadow-2xs"
          title="Back to Bookshelf"
        >
          <ArrowLeft size={14} weight="bold" />
          <span className="hidden sm:inline">Shelf</span>
        </button>

        <button
          type="button"
          onClick={onOpenChapters}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer transition shadow-2xs"
          title="Open Table of Contents"
        >
          <List size={15} weight="bold" />
          <span className="hidden sm:inline">Chapters</span>
        </button>
      </div>

      {/* Center: Book Title & Chapter */}
      <div className="flex flex-col items-center justify-center max-w-[200px] sm:max-w-md truncate px-2 text-center">
        <span className="font-serif text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
          {book.title}
        </span>
        <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
          {currentChapterTitle}
        </span>
      </div>

      {/* Right: Typography, Theme, Bionic, TTS, Fullscreen */}
      <div className="flex items-center gap-1.5">
        {/* Bionic Reading Toggle */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ bionicReading: !settings.bionicReading })}
          className={cn(
            'flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs',
            settings.bionicReading
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
          )}
          title="Toggle Bionic speed reading (bolds letter prefixes for faster scanning)"
        >
          <Lightning size={13} weight={settings.bionicReading ? 'fill' : 'regular'} />
          <span className="hidden md:inline">Bionic</span>
        </button>

        {/* Text to Speech Narration */}
        <button
          type="button"
          onClick={onToggleSpeech}
          className={cn(
            'flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs',
            isSpeaking
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
          )}
          title={isSpeaking ? 'Pause audio narration' : 'Listen to chapter narration (Text to Speech)'}
        >
          {isSpeaking ? (
            <SpeakerHigh size={14} weight="fill" className="animate-pulse" />
          ) : (
            <SpeakerSlash size={14} />
          )}
          <span className="hidden md:inline">{isSpeaking ? 'Speaking' : 'TTS'}</span>
        </button>

        {/* Themes Palette Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowTypographyMenu(false);
            }}
            className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer transition shadow-2xs"
            title="Choose reading theme"
          >
            <Palette size={14} weight="bold" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-mono font-bold text-neutral-400 px-2 py-1">
                Reading Themes
              </div>
              <div className="space-y-1">
                {THEME_OPTIONS.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ readingTheme: th.id });
                      setShowThemeMenu(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition cursor-pointer',
                      settings.readingTheme === th.id
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('h-3.5 w-3.5 rounded-full border border-neutral-300 dark:border-neutral-600', th.bg)} />
                      <span>{th.name}</span>
                    </div>
                    {settings.readingTheme === th.id && <Check size={12} weight="bold" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Typography Settings Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTypographyMenu(!showTypographyMenu);
              setShowThemeMenu(false);
            }}
            className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer transition shadow-2xs"
            title="Adjust typography and font size"
          >
            <TextAa size={14} weight="bold" />
          </button>

          {showTypographyMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mb-1">
                  <span>Font Size</span>
                  <span className="font-bold">{settings.fontSize}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: Math.max(13, settings.fontSize - 1) })}
                    className="flex-1 rounded-lg border border-neutral-200 py-1 font-mono text-xs font-bold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: Math.min(32, settings.fontSize + 1) })}
                    className="flex-1 rounded-lg border border-neutral-200 py-1 font-mono text-xs font-bold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <div className="text-[11px] font-mono text-neutral-500 mb-1">Typeface</div>
                <div className="grid grid-cols-2 gap-1">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onUpdateSettings({ fontFamily: f.id })}
                      className={cn(
                        'rounded-lg border px-2 py-1 text-[11px] transition text-center cursor-pointer',
                        settings.fontFamily === f.id
                          ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 font-bold'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      )}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height & Margins */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-neutral-500 mb-1">Line Height</div>
                  <div className="flex gap-1">
                    {(['tight', 'normal', 'loose'] as const).map((lh) => (
                      <button
                        key={lh}
                        type="button"
                        onClick={() => onUpdateSettings({ lineHeight: lh })}
                        className={cn(
                          'flex-1 rounded-md border py-0.5 text-[10px] uppercase font-mono cursor-pointer',
                          settings.lineHeight === lh
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                            : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        )}
                      >
                        {lh[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-[10px] font-mono text-neutral-500 mb-1">Width</div>
                  <div className="flex gap-1">
                    {(['narrow', 'normal', 'wide'] as const).map((mw) => (
                      <button
                        key={mw}
                        type="button"
                        onClick={() => onUpdateSettings({ marginWidth: mw })}
                        className={cn(
                          'flex-1 rounded-md border py-0.5 text-[10px] uppercase font-mono cursor-pointer',
                          settings.marginWidth === mw
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                            : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        )}
                      >
                        {mw[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer transition shadow-2xs"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Reading Mode'}
        >
          {isFullscreen ? <ArrowsIn size={14} /> : <ArrowsOut size={14} />}
        </button>
      </div>
    </header>
  );
}
