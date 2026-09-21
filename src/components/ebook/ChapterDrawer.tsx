'use client';

import React from 'react';
import { EbookChapter } from '@/types/ebook';
import { X, Check, Bookmarks } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChapterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: EbookChapter[];
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  bookTitle: string;
}

export default function ChapterDrawer({
  isOpen,
  onClose,
  chapters,
  currentChapterIndex,
  onSelectChapter,
  bookTitle,
}: ChapterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col border-r border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-[#111114]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center gap-2 min-w-0">
                <Bookmarks size={20} className="text-neutral-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-serif text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {bookTitle}
                  </h3>
                  <p className="font-mono text-[11px] text-neutral-400">
                    Table of Contents ({chapters.length} chapters)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {chapters.map((ch, idx) => {
                const isActive = idx === currentChapterIndex;
                const readingMinutes = Math.max(1, Math.round(ch.wordCount / 220));

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      onSelectChapter(idx);
                      onClose();
                    }}
                    className={cn(
                      'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all cursor-pointer text-xs',
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[11px]',
                          isActive
                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900 font-bold'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{ch.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={cn(
                          'font-mono text-[10px]',
                          isActive ? 'opacity-80' : 'text-neutral-400'
                        )}
                      >
                        ~{readingMinutes}m
                      </span>
                      {isActive && <Check size={14} weight="bold" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
