'use client';

import React, { useState } from 'react';
import { Speaker } from '@/types/transcriber';
import { User, PencilSimple, ArrowsMerge, Check } from '@phosphor-icons/react';

interface SpeakerManagerProps {
  speakers: Speaker[];
  onRenameSpeaker: (speakerId: string, newLabel: string) => void;
  onMergeSpeakers: (targetSpeakerId: string, sourceSpeakerId: string) => void;
}

export const SpeakerManager: React.FC<SpeakerManagerProps> = ({
  speakers,
  onRenameSpeaker,
  onMergeSpeakers,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);

  const startEditing = (speaker: Speaker) => {
    setEditingId(speaker.id);
    setEditLabel(speaker.label);
  };

  const saveRename = (speakerId: string) => {
    if (editLabel.trim()) {
      onRenameSpeaker(speakerId, editLabel.trim());
    }
    setEditingId(null);
  };

  const handleMerge = (targetSpeakerId: string) => {
    if (mergeSourceId && mergeSourceId !== targetSpeakerId) {
      onMergeSpeakers(targetSpeakerId, mergeSourceId);
      setMergeSourceId(null);
    }
  };

  if (speakers.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-neutral-400">
        No speakers detected yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
          Detected Speakers ({speakers.length})
        </span>
        {mergeSourceId && (
          <button
            type="button"
            onClick={() => setMergeSourceId(null)}
            className="text-[11px] text-neutral-500 hover:underline"
          >
            Cancel merge
          </button>
        )}
      </div>

      {mergeSourceId && (
        <div className="rounded-lg border border-neutral-300 bg-neutral-100 p-2.5 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          Click the target speaker below to merge into.
        </div>
      )}

      <div className="space-y-2">
        {speakers.map((spk) => {
          const isSelectedForMerge = mergeSourceId === spk.id;
          const isEditing = editingId === spk.id;

          return (
            <div
              key={spk.id}
              className={`flex items-center justify-between rounded-xl border p-3 transition ${
                isSelectedForMerge
                  ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800'
                  : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#141414]'
              }`}
            >
              {/* Left: Speaker icon & name */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-[#1f1f1f] dark:text-neutral-200">
                  <User size={16} weight="bold" />
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-7 rounded border border-neutral-300 bg-white px-2 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveRename(spk.id)}
                      className="flex h-7 w-7 items-center justify-center rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    >
                      <Check size={12} weight="bold" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                      {spk.label}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {spk.segmentCount} {spk.segmentCount === 1 ? 'turn' : 'turns'}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEditing(spk)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    title="Rename"
                  >
                    <PencilSimple size={12} weight="bold" />
                  </button>
                )}

                {mergeSourceId && mergeSourceId !== spk.id ? (
                  <button
                    type="button"
                    onClick={() => handleMerge(spk.id)}
                    className="rounded-md bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                  >
                    Merge Here
                  </button>
                ) : (
                  speakers.length > 1 &&
                  !mergeSourceId && (
                    <button
                      type="button"
                      onClick={() => setMergeSourceId(spk.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      title="Merge with another speaker"
                    >
                      <ArrowsMerge size={12} weight="bold" />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
