'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Ebook, EbookChapter, ReadingSettings, EbookHighlight } from '@/types/ebook';
import { CaretLeft, CaretRight, BookmarkSimple, Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ReaderCanvasProps {
  book: Ebook;
  chapter: EbookChapter;
  chapterIndex: number;
  totalChapters: number;
  settings: ReadingSettings;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  onSaveHighlight: (highlight: EbookHighlight) => void;
  onScrollProgress: (progress: number) => void;
}

export default function ReaderCanvas({
  book,
  chapter,
  chapterIndex,
  totalChapters,
  settings,
  onNextChapter,
  onPrevChapter,
  onSaveHighlight,
  onScrollProgress,
}: ReaderCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);

  // Scroll to top on chapter change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [chapterIndex]);

  // Track scroll progress
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
    onScrollProgress(progress);
  };

  // Text selection handler for highlights
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 3) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectedText(text);
        setTooltipPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      }
    } else {
      if (!showNoteField) {
        setSelectedText('');
        setTooltipPos(null);
      }
    }
  };

  const handleAddHighlight = () => {
    if (!selectedText) return;
    const newHl: EbookHighlight = {
      id: `hl_${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      chapterIndex,
      chapterTitle: chapter.title,
      text: selectedText,
      note: noteInput.trim() || undefined,
      createdAt: Date.now(),
      color: '#eab308', // Amber yellow highlight
    };
    onSaveHighlight(newHl);
    setSelectedText('');
    setTooltipPos(null);
    setShowNoteField(false);
    setNoteInput('');
    window.getSelection()?.removeAllRanges();
  };

  // Transform content for Bionic reading if enabled
  const renderContent = () => {
    if (!settings.bionicReading) {
      return <div dangerouslySetInnerHTML={{ __html: chapter.content }} />;
    }

    // Split paragraphs and apply bionic formatting to words
    const parser = new DOMParser();
    const doc = parser.parseFromString(chapter.content, 'text/html');
    const paragraphs = doc.querySelectorAll('p');

    const bionicParagraphs = Array.from(paragraphs).map((p, pIdx) => {
      const text = p.textContent || '';
      const bionicWords = text.split(' ').map((word, wIdx) => {
        if (!word) return '';
        const half = Math.ceil(word.length / 2);
        const boldPart = word.slice(0, half);
        const rest = word.slice(half);
        return `<span key="${wIdx}"><strong>${boldPart}</strong>${rest}</span>`;
      });
      return `<p key="${pIdx}">${bionicWords.join(' ')}</p>`;
    });

    return <div dangerouslySetInnerHTML={{ __html: bionicParagraphs.join('') }} />;
  };

  // Theme-specific styles
  const themeClasses = {
    paper: 'bg-[#faf9f5] text-[#2d2b28] selection:bg-[#e2dfd2]',
    sepia: 'bg-[#f4ecd8] text-[#5b4636] selection:bg-[#e4d6b6]',
    dark: 'bg-[#0c0c0e] text-[#d4d4d8] selection:bg-[#27272a]',
    midnight: 'bg-[#0f172a] text-[#cbd5e1] selection:bg-[#1e293b]',
  }[settings.readingTheme];

  const fontClass = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
    opendyslexic: 'font-sans tracking-wide',
  }[settings.fontFamily];

  const lineHeightClass = {
    tight: 'leading-relaxed',
    normal: 'leading-loose',
    loose: 'leading-[2.2]',
  }[settings.lineHeight];

  const marginWidthClass = {
    narrow: 'max-w-xl px-4 sm:px-6',
    normal: 'max-w-2xl px-6 sm:px-8',
    wide: 'max-w-4xl px-8 sm:px-12',
  }[settings.marginWidth];

  const readingMinutesLeft = Math.max(1, Math.round(chapter.wordCount / 220));

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onMouseUp={handleMouseUp}
      className={cn('relative flex-1 overflow-y-auto transition-colors duration-200', themeClasses)}
    >
      {/* Floating Highlight / Note Tooltip */}
      {tooltipPos && selectedText && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white p-2 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAddHighlight}
              className="flex items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-90 dark:bg-white dark:text-neutral-900 cursor-pointer"
            >
              <BookmarkSimple size={13} weight="fill" />
              <span>Save Highlight</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNoteField(!showNoteField)}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <Plus size={12} />
              <span>Note</span>
            </button>
          </div>

          {showNoteField && (
            <div className="mt-1">
              <input
                type="text"
                placeholder="Add private thought or annotation..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddHighlight();
                }}
                className="w-48 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                autoFocus
              />
            </div>
          )}
        </div>
      )}

      {/* Reader Content Column */}
      <article className={cn('mx-auto py-12 sm:py-20', marginWidthClass, fontClass)}>
        {/* Chapter Header */}
        <header className="mb-10 text-center border-b pb-8 border-current/10">
          <span className="font-mono text-xs uppercase tracking-widest opacity-60">
            Chapter {chapterIndex + 1} of {totalChapters}
          </span>
          <h1 className="mt-2 text-2xl sm:text-4xl font-black tracking-tight">
            {chapter.title}
          </h1>
          <div className="mt-2 font-mono text-[11px] opacity-50 flex items-center justify-center gap-3">
            <span>{chapter.wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>~{readingMinutesLeft} min read</span>
          </div>
        </header>

        {/* Prose Chapter Body */}
        <div
          style={{ fontSize: `${settings.fontSize}px` }}
          className={cn(
            'prose max-w-none space-y-6',
            lineHeightClass,
            settings.textAlign === 'justify' ? 'text-justify' : 'text-left'
          )}
        >
          {renderContent()}
        </div>

        {/* Bottom Chapter Navigation Bar */}
        <footer className="mt-16 flex items-center justify-between border-t border-current/10 pt-8">
          <button
            type="button"
            disabled={chapterIndex === 0}
            onClick={onPrevChapter}
            className="flex items-center gap-2 rounded-xl border border-current/20 px-4 py-2 text-xs font-bold transition hover:bg-current/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <CaretLeft size={16} weight="bold" />
            <span>Previous Chapter</span>
          </button>

          <span className="font-mono text-xs opacity-60">
            {chapterIndex + 1} / {totalChapters}
          </span>

          <button
            type="button"
            disabled={chapterIndex >= totalChapters - 1}
            onClick={onNextChapter}
            className="flex items-center gap-2 rounded-xl bg-current/10 px-4 py-2 text-xs font-bold transition hover:bg-current/20 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <span>Next Chapter</span>
            <CaretRight size={16} weight="bold" />
          </button>
        </footer>
      </article>
    </div>
  );
}
