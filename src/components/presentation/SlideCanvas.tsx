'use client';

import React, { useState } from 'react';
import { Slide, SlideLayout, TechTheme } from '@/types/presentation';
import {
  Layout,
  Plus,
  Trash,
  Notebook,
  Code,
  ChartBar,
  ListBullets,
  Columns,
  Clock,
  Quotes,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SlideCanvasProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  onUpdateSlide: (updatedSlide: Slide) => void;
  theme: TechTheme;
}

export default function SlideCanvas({
  slide,
  slideIndex,
  totalSlides,
  onUpdateSlide,
  theme,
}: SlideCanvasProps) {
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);

  // Helper updaters
  const updateField = <K extends keyof Slide>(field: K, value: Slide[K]) => {
    onUpdateSlide({ ...slide, [field]: value });
  };

  const handleAddBullet = () => {
    const current = slide.bullets || [];
    updateField('bullets', [...current, 'New key takeaway or technical specification point']);
  };

  const handleUpdateBullet = (index: number, val: string) => {
    const current = [...(slide.bullets || [])];
    current[index] = val;
    updateField('bullets', current);
  };

  const handleDeleteBullet = (index: number) => {
    const current = [...(slide.bullets || [])];
    current.splice(index, 1);
    updateField('bullets', current);
  };

  const handleAddMetric = () => {
    const current = slide.metrics || [];
    updateField('metrics', [
      ...current,
      { label: 'New Metric KPI', value: '99.9%', change: '+12% Target' },
    ]);
  };

  const handleUpdateMetric = (index: number, field: 'label' | 'value' | 'change', val: string) => {
    const current = [...(slide.metrics || [])];
    current[index] = { ...current[index], [field]: val };
    updateField('metrics', current);
  };

  const handleDeleteMetric = (index: number) => {
    const current = [...(slide.metrics || [])];
    current.splice(index, 1);
    updateField('metrics', current);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto bg-neutral-100/70 dark:bg-black/80">
      {/* 16:9 Presentation Slide Canvas */}
      <div
        className={cn(
          'w-full max-w-5xl aspect-video rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-2xl relative transition-all duration-200 border',
          theme.bgClass,
          theme.borderClass,
          theme.fontFamily
        )}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Slide Top Metadata Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200/20 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={slide.tag || `SLIDE ${slideIndex + 1}`}
              onChange={(e) => updateField('tag', e.target.value)}
              className="font-mono text-[11px] font-bold tracking-wider uppercase bg-transparent text-neutral-400 focus:text-white focus:outline-none px-1 rounded border-b border-transparent focus:border-neutral-500"
              placeholder="CATEGORY TAG"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Slide Layout Switcher Dropdown */}
            <select
              value={slide.layout}
              onChange={(e) => updateField('layout', e.target.value as SlideLayout)}
              className="bg-neutral-800/80 text-neutral-200 border border-neutral-700 text-[11px] font-mono font-bold rounded-md px-2 py-0.5 cursor-pointer focus:outline-none"
            >
              <option value="bullets-points">Bullet List</option>
              <option value="split-columns">Split Columns</option>
              <option value="stats-metrics">Stats & Metrics</option>
              <option value="code-architecture">Code Architecture</option>
              <option value="timeline-roadmap">Timeline Roadmap</option>
              <option value="quote-highlight">Quote & Highlight</option>
              <option value="title-cover">Title Cover</option>
            </select>

            <span className="font-mono text-xs font-bold text-neutral-400">
              {slideIndex + 1} / {totalSlides}
            </span>
          </div>
        </div>

        {/* Center Content Section */}
        <div className="flex-1 flex flex-col justify-center py-4 min-h-0">
          {/* Slide Title Input */}
          <textarea
            rows={1}
            value={slide.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Click to add presentation slide title..."
            className={cn(
              'w-full bg-transparent font-extrabold tracking-tight resize-none focus:outline-none border-b border-transparent focus:border-neutral-500/50 transition-colors leading-tight',
              slide.layout === 'title-cover' ? 'text-2xl sm:text-4xl text-center' : 'text-xl sm:text-3xl text-left',
              theme.textClass
            )}
          />

          {/* Subtitle Input */}
          <input
            type="text"
            value={slide.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
            placeholder="Add descriptive subtitle or thesis statement..."
            className={cn(
              'w-full bg-transparent text-xs sm:text-base mt-2 focus:outline-none border-b border-transparent focus:border-neutral-500/50 transition-colors',
              slide.layout === 'title-cover' ? 'text-center' : 'text-left',
              theme.subtextClass
            )}
          />

          {/* Layout Dependent Body Elements */}
          <div className="mt-6 flex-1 overflow-y-auto no-scrollbar">
            {/* 1. Bullet Points */}
            {slide.layout === 'bullets-points' && (
              <div className="space-y-2.5">
                {(slide.bullets || []).map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-3 group">
                    <span className="h-2 w-2 rounded-full bg-neutral-400 mt-2 shrink-0 group-hover:bg-white transition-colors" />
                    <textarea
                      rows={1}
                      value={bullet}
                      onChange={(e) => handleUpdateBullet(bIdx, e.target.value)}
                      className={cn(
                        'flex-1 bg-transparent text-xs sm:text-sm resize-none focus:outline-none border-b border-transparent focus:border-neutral-500 transition-colors',
                        theme.textClass
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteBullet(bIdx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 cursor-pointer transition-opacity"
                      title="Remove bullet"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddBullet}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-400 hover:text-white pt-2 cursor-pointer transition-colors"
                >
                  <Plus size={14} weight="bold" />
                  <span>Add Bullet Point</span>
                </button>
              </div>
            )}

            {/* 2. Split Columns */}
            {slide.layout === 'split-columns' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                {(slide.columns || [
                  { heading: 'Left Pillar', content: ['Key point A', 'Key point B'] },
                  { heading: 'Right Pillar', content: ['Comparison point 1', 'Comparison point 2'] },
                ]).map((col, cIdx) => (
                  <div
                    key={cIdx}
                    className={cn('rounded-xl p-4 flex flex-col justify-start', theme.surfaceClass)}
                  >
                    <input
                      type="text"
                      value={col.heading}
                      onChange={(e) => {
                        const newCols = [...(slide.columns || [])];
                        newCols[cIdx] = { ...col, heading: e.target.value };
                        updateField('columns', newCols);
                      }}
                      className="font-bold text-sm sm:text-base bg-transparent focus:outline-none mb-3 border-b border-transparent focus:border-neutral-500"
                    />
                    <div className="space-y-2">
                      {col.content.map((item, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newCols = [...(slide.columns || [])];
                              const newContent = [...col.content];
                              newContent[iIdx] = e.target.value;
                              newCols[cIdx] = { ...col, content: newContent };
                              updateField('columns', newCols);
                            }}
                            className="w-full bg-transparent text-xs text-neutral-300 focus:text-white focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Stats & Metrics */}
            {slide.layout === 'stats-metrics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(slide.metrics || []).map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className={cn('rounded-xl p-3 flex flex-col justify-between relative group', theme.surfaceClass)}
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteMetric(mIdx)}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                        title="Delete Metric"
                      >
                        <Trash size={11} />
                      </button>
                      <input
                        type="text"
                        value={m.value}
                        onChange={(e) => handleUpdateMetric(mIdx, 'value', e.target.value)}
                        className="text-lg sm:text-2xl font-black bg-transparent tracking-tight focus:outline-none"
                      />
                      <input
                        type="text"
                        value={m.label}
                        onChange={(e) => handleUpdateMetric(mIdx, 'label', e.target.value)}
                        className="text-[11px] font-mono text-neutral-400 bg-transparent focus:outline-none mt-1"
                      />
                      <input
                        type="text"
                        value={m.change || ''}
                        onChange={(e) => handleUpdateMetric(mIdx, 'change', e.target.value)}
                        className="text-[10px] font-mono font-bold text-emerald-400 bg-transparent focus:outline-none mt-0.5"
                      />
                    </div>
                  ))}
                  {(slide.metrics || []).length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddMetric}
                      className="rounded-xl border border-dashed border-neutral-700 flex flex-col items-center justify-center p-3 text-neutral-400 hover:text-white hover:border-neutral-500 cursor-pointer transition-colors"
                    >
                      <Plus size={16} weight="bold" />
                      <span className="text-[10px] font-mono font-bold mt-1">Add Metric</span>
                    </button>
                  )}
                </div>

                {/* Bullets under metrics */}
                {slide.bullets && (
                  <div className="space-y-1.5 pt-2">
                    {slide.bullets.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Code Architecture */}
            {slide.layout === 'code-architecture' && (
              <div className="h-full flex flex-col rounded-xl overflow-hidden border border-neutral-800 bg-[#0c0d12]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[10px] font-mono text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-neutral-600" />
                    <input
                      type="text"
                      value={slide.codeSnippet?.language || 'typescript'}
                      onChange={(e) => {
                        const current = slide.codeSnippet || { code: '', language: 'typescript' };
                        updateField('codeSnippet', { ...current, language: e.target.value });
                      }}
                      className="bg-transparent focus:outline-none font-bold uppercase"
                    />
                  </div>
                  <input
                    type="text"
                    value={slide.codeSnippet?.caption || ''}
                    onChange={(e) => {
                      const current = slide.codeSnippet || { code: '', language: 'typescript' };
                      updateField('codeSnippet', { ...current, caption: e.target.value });
                    }}
                    placeholder="Optional caption..."
                    className="bg-transparent focus:outline-none text-right"
                  />
                </div>
                <textarea
                  value={slide.codeSnippet?.code || ''}
                  onChange={(e) => {
                    const current = slide.codeSnippet || { code: '', language: 'typescript' };
                    updateField('codeSnippet', { ...current, code: e.target.value });
                  }}
                  rows={8}
                  placeholder="// Paste executable or architectural source code here..."
                  className="w-full flex-1 p-3 bg-transparent font-mono text-xs text-neutral-200 focus:outline-none resize-none"
                />
              </div>
            )}

            {/* 5. Timeline Roadmap */}
            {slide.layout === 'timeline-roadmap' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {(slide.timeline || []).map((t, idx) => (
                  <div
                    key={idx}
                    className={cn('rounded-xl p-3 flex flex-col justify-start border', theme.surfaceClass)}
                  >
                    <input
                      type="text"
                      value={t.step}
                      onChange={(e) => {
                        const newT = [...(slide.timeline || [])];
                        newT[idx] = { ...t, step: e.target.value };
                        updateField('timeline', newT);
                      }}
                      className="font-mono text-[10px] font-bold text-neutral-400 bg-transparent focus:outline-none"
                    />
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => {
                        const newT = [...(slide.timeline || [])];
                        newT[idx] = { ...t, title: e.target.value };
                        updateField('timeline', newT);
                      }}
                      className="font-bold text-xs sm:text-sm text-white bg-transparent focus:outline-none my-1"
                    />
                    <textarea
                      rows={3}
                      value={t.description}
                      onChange={(e) => {
                        const newT = [...(slide.timeline || [])];
                        newT[idx] = { ...t, description: e.target.value };
                        updateField('timeline', newT);
                      }}
                      className="text-[11px] text-neutral-400 bg-transparent focus:outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 6. Quote / Highlight */}
            {slide.layout === 'quote-highlight' && (
              <div className="space-y-4">
                <div className={cn('rounded-2xl p-6 sm:p-8 border', theme.surfaceClass)}>
                  <textarea
                    rows={3}
                    value={slide.quote?.text || ''}
                    onChange={(e) => {
                      const current = slide.quote || { text: '' };
                      updateField('quote', { ...current, text: e.target.value });
                    }}
                    placeholder="Enter inspiring quote or bold technical conclusion..."
                    className="w-full bg-transparent text-base sm:text-xl italic font-bold focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="mt-4 flex items-center gap-3 pt-3 border-t border-neutral-700/60">
                    <input
                      type="text"
                      value={slide.quote?.author || ''}
                      onChange={(e) => {
                        const current = slide.quote || { text: '' };
                        updateField('quote', { ...current, author: e.target.value });
                      }}
                      placeholder="Author Name"
                      className="font-bold text-xs bg-transparent focus:outline-none"
                    />
                    <span className="text-neutral-500">•</span>
                    <input
                      type="text"
                      value={slide.quote?.role || ''}
                      onChange={(e) => {
                        const current = slide.quote || { text: '' };
                        updateField('quote', { ...current, role: e.target.value });
                      }}
                      placeholder="Title / Organization"
                      className="text-xs text-neutral-400 bg-transparent focus:outline-none flex-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. Title Cover */}
            {slide.layout === 'title-cover' && (
              <div className="mt-8 flex flex-col items-center justify-center text-center">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 max-w-md w-full">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Resursee Presentation Studio
                  </span>
                  <p className="text-xs text-neutral-300 mt-1">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[10px]">Present</kbd> in top right to launch fullscreen theater mode
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slide Bottom Bar: Speaker Notes Drawer Toggle */}
        <div className="pt-2 border-t border-neutral-200/20 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
          <button
            type="button"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <Notebook size={14} />
            <span>Speaker Notes {slide.notes ? '(1)' : '(Empty)'}</span>
          </button>
          <span className="font-mono text-[10px] text-neutral-500">
            {theme.name} • 16:9 Aspect Ratio
          </span>
        </div>
      </div>

      {/* Expandable Speaker Notes Drawer */}
      {showNotesDrawer && (
        <div className="w-full max-w-5xl mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
              Speaker Notes (Visible only during Presenter Mode)
            </span>
            <button
              type="button"
              onClick={() => setShowNotesDrawer(false)}
              className="font-mono text-[10px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          <textarea
            rows={2}
            value={slide.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Add talking points, prompts, or rehearsal cues for this slide..."
            className="w-full bg-transparent text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none resize-none font-mono"
          />
        </div>
      )}
    </div>
  );
}
