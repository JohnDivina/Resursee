'use client';

import React, { useState } from 'react';
import {
  TranscriptSegment,
  MeetingNoteItem,
  Bookmark,
} from '@/types/transcriber';
import { formatTimestamp } from '@/lib/audioProcessor';
import { MagnifyingGlass, Play, BookmarkSimple, Sparkle } from '@phosphor-icons/react';

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
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search transcript, notes, bookmarks..."
          className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
        />
      </div>

      {/* Search Results */}
      {query && (
        <div className="text-[11px] font-medium text-neutral-500">
          Found {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
        </div>
      )}

      <div className="space-y-3 overflow-y-auto">
        {/* Matching Transcript Turns */}
        {matchingSegments.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Transcript Turns ({matchingSegments.length})
            </div>
            <div className="space-y-1">
              {matchingSegments.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => onSeek(seg.startTime)}
                  className="flex w-full flex-col items-start rounded-lg border border-neutral-200 bg-white p-2 text-left transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-800"
                >
                  <div className="flex w-full items-center justify-between text-[10px] text-neutral-400">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {seg.speakerLabel}
                    </span>
                    <span className="font-mono">{formatTimestamp(seg.startTime)}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-800 line-clamp-2 dark:text-neutral-200">
                    {seg.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Matching Notes */}
        {matchingNotes.length > 0 && (
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Meeting Notes ({matchingNotes.length})
            </div>
            <div className="space-y-1">
              {matchingNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSeek(note.timestamp)}
                  className="flex w-full items-start gap-2 rounded-lg border border-neutral-200 bg-white p-2 text-left transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-800"
                >
                  <Sparkle size={13} className="mt-0.5 text-neutral-500" />
                  <div className="flex-1 text-xs text-neutral-800 dark:text-neutral-200">
                    {note.content}
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
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Bookmarks ({matchingBookmarks.length})
            </div>
            <div className="space-y-1">
              {matchingBookmarks.map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => onSeek(bm.timestamp)}
                  className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white p-2 text-left transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-[#141414] dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-1.5 text-xs text-neutral-800 dark:text-neutral-200">
                    <BookmarkSimple size={13} weight="bold" />
                    <span>{bm.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400">
                    {formatTimestamp(bm.timestamp)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {query && totalMatches === 0 && (
          <div className="py-6 text-center text-xs text-neutral-400">
            No matching dialogue or notes found for "{query}".
          </div>
        )}
      </div>
    </div>
  );
};
