'use client';

import React, { useState } from 'react';
import { Slide, SlideLayout, TechTheme } from '@/types/presentation';
import {
  Plus,
  Trash,
  Copy,
  ArrowUp,
  ArrowDown,
  Layout,
  Check,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SlideRailProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: (layout: SlideLayout) => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (fromIndex: number, toIndex: number) => void;
  theme: TechTheme;
}

const LAYOUT_OPTIONS: { id: SlideLayout; name: string; desc: string }[] = [
  { id: 'bullets-points', name: 'Bullet List', desc: 'Standard header with structured points' },
  { id: 'split-columns', name: 'Split Columns', desc: 'Side-by-side comparison or pillars' },
  { id: 'stats-metrics', name: 'Stats & KPIs', desc: 'Large numeric indicators with trends' },
  { id: 'code-architecture', name: 'Code Snippet', desc: 'Syntax-highlighted code block' },
  { id: 'timeline-roadmap', name: 'Timeline Roadmap', desc: 'Phased sequential execution steps' },
  { id: 'quote-highlight', name: 'Quote / Highlight', desc: 'High-impact takeaway or testimonial' },
  { id: 'title-cover', name: 'Title Cover', desc: 'Hero introduction slide' },
];

export default function SlideRail({
  slides,
  currentSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  theme,
}: SlideRailProps) {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  return (
    <aside className="w-56 sm:w-64 shrink-0 flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#0c0c0e]/90 select-none h-full overflow-hidden">
      {/* Rail Top Action Bar */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Slides
          </span>
          <span className="rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2 py-0.5 font-mono text-[10px] font-bold">
            {slides.length}
          </span>
        </div>

        {/* Add Slide Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2.5 py-1 text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
            title="Add New Slide"
          >
            <Plus size={14} weight="bold" />
            <span>Add</span>
          </button>

          {/* Layout Picker Dropdown */}
          {showLayoutMenu && (
            <div className="absolute left-0 sm:left-auto right-0 top-full mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase text-neutral-400">
                Choose Slide Layout
              </div>
              <div className="space-y-0.5">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onAddSlide(opt.id);
                      setShowLayoutMenu(false);
                    }}
                    className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <Layout size={15} className="shrink-0 mt-0.5 text-neutral-400" />
                    <div>
                      <div className="font-semibold">{opt.name}</div>
                      <div className="text-[10px] text-neutral-400">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;

          return (
            <div
              key={slide.id}
              className={cn(
                'group relative rounded-xl border p-2.5 transition-all cursor-pointer',
                isActive
                  ? 'border-neutral-900 bg-white dark:border-white dark:bg-neutral-900/90 shadow-md ring-1 ring-neutral-900/10 dark:ring-white/20'
                  : 'border-neutral-200 bg-white/60 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:border-neutral-700'
              )}
              onClick={() => onSelectSlide(idx)}
            >
              {/* Header: Slide Number & Tag */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                  #{idx + 1}
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {slide.layout.replace('-', ' ')}
                </span>
              </div>

              {/* Miniature Preview Card */}
              <div className="aspect-video w-full rounded-md bg-neutral-100 dark:bg-neutral-950 p-2 border border-neutral-200/50 dark:border-neutral-800/80 flex flex-col justify-between overflow-hidden">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 truncate leading-tight">
                    {slide.title || 'Untitled Slide'}
                  </div>
                  {slide.subtitle && (
                    <div className="text-[8px] text-neutral-400 truncate leading-none">
                      {slide.subtitle}
                    </div>
                  )}
                </div>

                {/* Miniature content hint */}
                <div className="flex items-center gap-1 opacity-60">
                  {slide.bullets && (
                    <div className="h-1 w-8 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  )}
                  {slide.metrics && (
                    <div className="h-1 w-6 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                  )}
                  {slide.codeSnippet && (
                    <div className="h-1 w-10 rounded-full bg-neutral-500 dark:bg-neutral-500" />
                  )}
                </div>
              </div>

              {/* Hover Quick Actions Rail */}
              <div className="mt-2 flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/60 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Move Up / Down */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(idx, idx - 1);
                    }}
                    className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Move Slide Up"
                  >
                    <ArrowUp size={12} weight="bold" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(idx, idx + 1);
                    }}
                    className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Move Slide Down"
                  >
                    <ArrowDown size={12} weight="bold" />
                  </button>
                </div>

                {/* Duplicate & Delete */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(idx);
                    }}
                    className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    title="Duplicate Slide"
                  >
                    <Copy size={12} weight="bold" />
                  </button>
                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(idx);
                      }}
                      className="p-1 rounded text-neutral-500 hover:text-red-500 cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash size={12} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
