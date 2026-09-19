'use client';

import React from 'react';
import {
  TranscriptSegment,
  MeetingNoteItem,
  Bookmark,
} from '@/types/transcriber';
import { formatTimestamp } from '@/lib/audioProcessor';
import { MagnifyingGlass, BookmarkSimple, Sparkle, X } from '@phosphor-icons/react';

interface TranscriberSearchProps {
  segments: TranscriptSegment[];
  meetingNotes: MeetingNoteItem[];
  bookmarks: Bookmark[];
  onSeek: (time: number) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const TranscriberSearch: React.FC<TranscriberSearchProps> = ({
  segments,
  meetingNotes,
  bookmarks,
  onSeek,
  searchQuery,
  onSearchQueryChange,
}) => {
  const query = searchQuery.trim().toLowerCase();

  const matchingSegments = query
    ? segments.filter((s) => s.text.toLowerCase().includes(query))
    : [];

  const matchingNotes = query
    ? meetingNotes.filter((n) => n.content.toLowerCase().includes(query))
    : [];

  const matchingBookmarks = query
    ? bookmarks.filter((b) => b.label.toLowerCase().includes(query))
    : [];

  const totalMatches =
    matchingSegments.length + matchingNotes.length + matchingBookmarks.length;

  return (
    <div className="flex h-full flex-col space-y-3 min-w-0">
      {/* Responsive Search Input Bar */}
      <div className="relative flex items-center min-w-0">
        <MagnifyingGlass
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 shrink-0"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search transcript, notes, marks..."
          className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-8 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchQueryChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
            title="Clear search"
          >
            <X size={13} weight="bold" />
          </button>
        )}
      </div>

      {/* Result Count Status */}
      {query && (
        <div className="px-0.5 text-[11px] font-medium text-neutral-500 truncate">
          Found {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} for &quot;{query}&quot;
        </div>
      )}

      {/* Results List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 min-w-0">
        {/* Matching Transcript Turns */}
        {matchingSegments.length > 0 && (
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Transcript Turns ({matchingSegments.length})
            </div>
            <div className="space-y-1.5 min-w-0">
              {matchingSegments.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => onSeek(seg.startTime)}
                  className="flex w-full flex-col items-start rounded-lg border border-neutral-200 bg-white p-2.5 text-left transition hover:border-neutral-300 hover:bg-neutral-50 min-w-0 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-800"
                >
                  <div className="flex w-full items-center justify-between text-[10px] text-neutral-400">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {seg.speakerLabel}
                    </span>
                    <span className="font-mono shrink-0 ml-2">{formatTimestamp(seg.startTime)}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-800 line-clamp-2 break-words dark:text-neutral-200">
                    {seg.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Matching Notes */}
        {matchingNotes.length > 0 && (
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Meeting Notes ({matchingNotes.length})
            </div>
            <div className="space-y-1.5 min-w-0">
              {matchingNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSeek(note.timestamp)}
                  className="flex w-full items-start gap-2 rounded-lg border border-neutral-200 bg-white p-2.5 text-left transition hover:border-neutral-300 hover:bg-neutral-50 min-w-0 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-800"
                >
                  <Sparkle size={13} className="mt-0.5 text-neutral-500 shrink-0" />
                  <div className="flex-1 text-xs text-neutral-800 min-w-0 dark:text-neutral-200">
                    <p className="break-words">{note.content}</p>
                    <div className="mt-0.5 font-mono text-[10px] text-neutral-400">
                      {formatTimestamp(note.timestamp)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Matching Bookmarks */}
        {matchingBookmarks.length > 0 && (
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Bookmarks ({matchingBookmarks.length})
            </div>
            <div className="space-y-1.5 min-w-0">
              {matchingBookmarks.map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => onSeek(bm.timestamp)}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white p-2.5 text-left transition hover:border-neutral-300 hover:bg-neutral-50 min-w-0 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-1.5 text-xs text-neutral-800 min-w-0 truncate dark:text-neutral-200">
                    <BookmarkSimple size={13} weight="bold" className="shrink-0" />
                    <span className="truncate">{bm.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400 shrink-0 ml-2">
                    {formatTimestamp(bm.timestamp)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {query && totalMatches === 0 && (
          <div className="py-8 text-center text-xs text-neutral-400">
            No dialogue or notes match &quot;{query}&quot;.
          </div>
        )}
      </div>
    </div>
  );
};
