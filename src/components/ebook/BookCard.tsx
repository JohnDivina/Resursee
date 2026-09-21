'use client';

import React from 'react';
import { Ebook } from '@/types/ebook';
import { BookOpen, DownloadSimple, Check, Trash, Bookmarks } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Ebook;
  onRead: (book: Ebook) => void;
  onDownload?: (book: Ebook) => void;
  onRemoveOffline?: (bookId: string) => void;
  isDownloading?: boolean;
}

export default function BookCard({
  book,
  onRead,
  onDownload,
  onRemoveOffline,
  isDownloading = false,
}: BookCardProps) {
  const currentChapter = book.chapters[book.currentChapterIndex]?.title || 'Chapter 1';
  const progressPercent = Math.round(
    ((book.currentChapterIndex + (book.currentScrollProgress || 0) / 100) / Math.max(1, book.totalChapters)) * 100
  );

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-neutral-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-neutral-700">
      <div>
        {/* Cover & Badges */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 shadow-inner flex items-center justify-center">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Bookmarks size={36} className="text-neutral-400 dark:text-neutral-500 mb-2" />
              <span className="font-serif text-sm font-bold text-neutral-700 dark:text-neutral-300 line-clamp-2">
                {book.title}
              </span>
            </div>
          )}

          {/* Top Status Badges */}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 z-10">
            {book.isOffline ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-900/90 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-xs backdrop-blur-md dark:border-neutral-700 dark:bg-black/90">
                <Check size={10} weight="bold" />
                <span>Offline</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white/90 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-800 shadow-xs backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-200">
                Online
              </span>
            )}
          </div>

          {/* Chapters Count Badge */}
          <div className="absolute right-2.5 bottom-2.5 z-10">
            <span className="rounded-md bg-neutral-900/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-md dark:bg-neutral-800/90">
              {book.totalChapters} {book.totalChapters === 1 ? 'part' : 'chapters'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3.5 space-y-1">
          <h3
            onClick={() => onRead(book)}
            className="cursor-pointer font-serif text-base font-bold text-neutral-900 transition-colors line-clamp-2 hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
            {book.author}
          </p>
        </div>

        {/* Subjects / Tags */}
        {book.subjects && book.subjects.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {book.subjects.slice(0, 2).map((s, idx) => (
              <span
                key={idx}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[9px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400 truncate max-w-[150px]"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Reading Progress bar if started */}
        {book.lastReadAt && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
              <span className="truncate max-w-[140px]">{currentChapter}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full bg-neutral-900 dark:bg-white transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
        <button
          type="button"
          onClick={() => onRead(book)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-[0.98] dark:bg-white dark:text-neutral-900 cursor-pointer"
        >
          <BookOpen size={14} weight="bold" />
          <span>{book.lastReadAt ? 'Continue' : 'Read'}</span>
        </button>

        {!book.isOffline && onDownload && (
          <button
            type="button"
            onClick={() => onDownload(book)}
            disabled={isDownloading}
            className="flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 cursor-pointer transition"
            title="Download for 100% offline reading"
          >
            <DownloadSimple size={15} weight="bold" className={cn(isDownloading && 'animate-bounce')} />
          </button>
        )}

        {book.isOffline && onRemoveOffline && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove "${book.title}" from offline storage?`)) {
                onRemoveOffline(book.id);
              }
            }}
            className="flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-neutral-400 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:text-white cursor-pointer transition"
            title="Remove from offline storage"
          >
            <Trash size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
