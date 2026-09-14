'use client';

import React, { useState } from 'react';
import {
  TranscriptSegment,
  Speaker,
} from '@/types/transcriber';
import { formatTimestamp } from '@/lib/audioProcessor';
import {
  ArrowUUpLeft,
  User,
  ArrowsMerge,
  PencilSimple,
  Check,
  Play,
} from '@phosphor-icons/react';

interface TranscriptEditorProps {
  segments: TranscriptSegment[];
  speakers: Speaker[];
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateSegment: (segmentId: string, newText: string) => void;
  onRevertSegment: (segmentId: string) => void;
  onReassignSpeaker: (segmentId: string, newSpeakerId: string, newSpeakerLabel: string) => void;
  onMergeWithPrevious?: (segmentIndex: number) => void;
  searchQuery?: string;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  segments,
  speakers,
  currentTime,
  onSeek,
  onUpdateSegment,
  onRevertSegment,
  onReassignSpeaker,
  onMergeWithPrevious,
  searchQuery = '',
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>('');
  const [speakerPickerId, setSpeakerPickerId] = useState<string | null>(null);

  const startEditing = (seg: TranscriptSegment) => {
    setEditingId(seg.id);
    setDraftText(seg.text);
  };

  const saveEdit = (seg: TranscriptSegment) => {
    if (draftText.trim() !== seg.text) {
      onUpdateSegment(seg.id, draftText.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Check if a segment is actively playing
  const isSegmentActive = (seg: TranscriptSegment) => {
    return currentTime >= seg.startTime && currentTime <= seg.endTime;
  };

  // Highlight search matches
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark
              key={i}
              className="rounded bg-neutral-900 px-1 py-0.5 font-semibold text-white dark:bg-white dark:text-neutral-900"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-800">
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          No transcript available yet.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Record speech from your mic or import an audio/video file to start.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {segments.map((seg, idx) => {
        const active = isSegmentActive(seg);
        const isEditing = editingId === seg.id;

        return (
          <div
            key={seg.id}
            className={`group relative rounded-xl border p-4 transition-all ${
              active
                ? 'border-neutral-900 bg-neutral-50 shadow-sm dark:border-neutral-400 dark:bg-[#161616]'
                : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#121212] dark:hover:border-neutral-700'
            }`}
          >
            {/* Header: Speaker & Timestamps */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Speaker Badge (Solid Grey Bubble, Anti-Slop Directive) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setSpeakerPickerId(speakerPickerId === seg.id ? null : seg.id)
                    }
                    className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-200 dark:border-neutral-700 dark:bg-[#1f1f1f] dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <User size={13} weight="bold" />
                    <span>{seg.speakerLabel}</span>
                  </button>

                  {/* Speaker Reassignment Dropdown */}
                  {speakerPickerId === seg.id && (
                    <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Assign Speaker
                      </div>
                      {speakers.map((spk) => (
                        <button
                          key={spk.id}
                          type="button"
                          onClick={() => {
                            onReassignSpeaker(seg.id, spk.id, spk.label);
                            setSpeakerPickerId(null);
                          }}
                          className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs text-left transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                            seg.speakerId === spk.id
                              ? 'font-bold text-neutral-900 dark:text-white'
                              : 'text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          <span>{spk.label}</span>
                          {seg.speakerId === spk.id && <Check size={12} weight="bold" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clickable timestamp button */}
                <button
                  type="button"
                  onClick={() => onSeek(seg.startTime)}
                  className="flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-0.5 font-mono text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  title="Play from this turn"
                >
                  <Play size={10} weight="fill" />
                  <span>{formatTimestamp(seg.startTime)}</span>
                  <span className="text-neutral-300 dark:text-neutral-600">-</span>
                  <span>{formatTimestamp(seg.endTime)}</span>
                </button>

                {/* Edited badge if modified */}
                {seg.isEdited && (
                  <span className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.2 font-mono text-[10px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
                    edited
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                {/* Revert edit button */}
                {seg.isEdited && (
                  <button
                    type="button"
                    onClick={() => onRevertSegment(seg.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    title="Undo edits to this turn"
                  >
                    <ArrowUUpLeft size={13} weight="bold" />
                  </button>
                )}

                {/* Merge with previous */}
                {idx > 0 && onMergeWithPrevious && (
                  <button
                    type="button"
                    onClick={() => onMergeWithPrevious(idx)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    title="Merge with previous turn"
                  >
                    <ArrowsMerge size={13} weight="bold" />
                  </button>
                )}

                {/* Edit inline button */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEditing(seg)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    title="Edit turn"
                  >
                    <PencilSimple size={13} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            {/* Transcript text / Edit box */}
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEdit(seg)}
                    className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => startEditing(seg)}
                className="cursor-text text-sm leading-relaxed text-neutral-800 dark:text-neutral-200"
              >
                {renderHighlightedText(seg.text)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
