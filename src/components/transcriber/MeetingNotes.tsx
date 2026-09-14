'use client';

import React, { useState } from 'react';
import {
  MeetingNoteItem,
  NoteCategory,
} from '@/types/transcriber';
import { formatTimestamp } from '@/lib/audioProcessor';
import {
  Sparkle,
  CheckSquare,
  Square,
  ChatCircleText,
  Clock,
  ArrowsClockwise,
  Plus,
  Trash,
} from '@phosphor-icons/react';

interface MeetingNotesProps {
  summary: string;
  meetingNotes: MeetingNoteItem[];
  userNotes: string;
  onUpdateUserNotes: (notes: string) => void;
  onToggleActionItem: (id: string) => void;
  onSeek: (time: number) => void;
  onGenerateNotes: () => void;
  isGenerating?: boolean;
}

export const MeetingNotes: React.FC<MeetingNotesProps> = ({
  summary,
  meetingNotes,
  userNotes,
  onUpdateUserNotes,
  onToggleActionItem,
  onSeek,
  onGenerateNotes,
  isGenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'user'>('ai');

  const keyPoints = meetingNotes.filter((n) => n.category === 'key_point');
  const decisions = meetingNotes.filter((n) => n.category === 'decision');
  const actionItems = meetingNotes.filter((n) => n.category === 'action_item');
  const questions = meetingNotes.filter((n) => n.category === 'question');
  const followUps = meetingNotes.filter((n) => n.category === 'follow_up');

  return (
    <div className="flex h-full flex-col">
      {/* Sub-tab Switcher: AI Intelligence vs Manual User Notes */}
      <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
              activeTab === 'ai'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            AI Meeting Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('user')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
              activeTab === 'user'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            My Notes
          </button>
        </div>

        {activeTab === 'ai' && (
          <button
            type="button"
            onClick={onGenerateNotes}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-[#181818] dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <Sparkle
              size={13}
              weight="bold"
              className={isGenerating ? 'animate-spin' : ''}
            />
            <span>{isGenerating ? 'Analyzing...' : 'Generate'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: AI Structured Notes */}
      {activeTab === 'ai' && (
        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {/* Executive Summary */}
          {summary ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-[#161616]">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                <Sparkle size={13} weight="bold" />
                <span>Executive Summary</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                {summary}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-center dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Click "Generate" to synthesize meeting summary and structured takeaways.
              </p>
            </div>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Action Items ({actionItems.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-white p-2.5 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#141414] dark:hover:border-neutral-700"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleActionItem(item.id)}
                      className="mt-0.5 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                    >
                      {item.isCompleted ? (
                        <CheckSquare size={16} weight="fill" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                    <div className="flex-1 text-xs">
                      <p
                        className={
                          item.isCompleted
                            ? 'text-neutral-400 line-through dark:text-neutral-500'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }
                      >
                        {item.content}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {item.assignee && (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            @{item.assignee}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onSeek(item.timestamp)}
                          className="font-mono text-[10px] text-neutral-400 hover:text-neutral-700 hover:underline dark:hover:text-neutral-200"
                        >
                          {formatTimestamp(item.timestamp)}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Points */}
          {keyPoints.length > 0 && (
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Key Points
              </span>
              <ul className="space-y-1.5">
                {keyPoints.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white p-2.5 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-[#141414] dark:text-neutral-200"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                    <span className="flex-1">{item.content}</span>
                    <button
                      type="button"
                      onClick={() => onSeek(item.timestamp)}
                      className="font-mono text-[10px] text-neutral-400 hover:text-neutral-700 hover:underline dark:hover:text-neutral-200"
                    >
                      {formatTimestamp(item.timestamp)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decisions */}
          {decisions.length > 0 && (
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Decisions Made
              </span>
              <ul className="space-y-1.5">
                {decisions.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white p-2.5 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-[#141414] dark:text-neutral-200"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                    <span className="flex-1">{item.content}</span>
                    <button
                      type="button"
                      onClick={() => onSeek(item.timestamp)}
                      className="font-mono text-[10px] text-neutral-400 hover:text-neutral-700 hover:underline dark:hover:text-neutral-200"
                    >
                      {formatTimestamp(item.timestamp)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions */}
          {questions.length > 0 && (
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Questions & Inquiries
              </span>
              <ul className="space-y-1.5">
                {questions.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white p-2.5 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-[#141414] dark:text-neutral-200"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                    <span className="flex-1">{item.content}</span>
                    <button
                      type="button"
                      onClick={() => onSeek(item.timestamp)}
                      className="font-mono text-[10px] text-neutral-400 hover:text-neutral-700 hover:underline dark:hover:text-neutral-200"
                    >
                      {formatTimestamp(item.timestamp)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-ups */}
          {followUps.length > 0 && (
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Follow-ups
              </span>
              <ul className="space-y-1.5">
                {followUps.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white p-2.5 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-[#141414] dark:text-neutral-200"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                    <span className="flex-1">{item.content}</span>
                    <button
                      type="button"
                      onClick={() => onSeek(item.timestamp)}
                      className="font-mono text-[10px] text-neutral-400 hover:text-neutral-700 hover:underline dark:hover:text-neutral-200"
                    >
                      {formatTimestamp(item.timestamp)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Freeform User Notes */}
      {activeTab === 'user' && (
        <div className="flex flex-1 flex-col">
          <textarea
            value={userNotes}
            onChange={(e) => onUpdateUserNotes(e.target.value)}
            placeholder="Type your notes here during or after the meeting... Markdown supported."
            className="flex-1 resize-none rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-[#141414] dark:text-white dark:focus:border-white"
          />
        </div>
      )}
    </div>
  );
};
