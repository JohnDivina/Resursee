'use client';

import React, { useState } from 'react';
import { Slide, SlideLayout, TechTheme } from '@/types/presentation';
import {
  Plus,
  Trash,
  Notebook,
  Code,
  ChartBar,
  Columns,
  ListBullets,
  Quotes,
  ClockAfternoon,
  Sparkle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SlideCanvasProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  onUpdateSlide: (slide: Slide) => void;
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

  const updateField = <K extends keyof Slide>(field: K, value: Slide[K]) => {
    onUpdateSlide({ ...slide, [field]: value });
  };

  const handleUpdateBullet = (index: number, val: string) => {
    const bullets = [...(slide.bullets || [])];
    bullets[index] = val;
    updateField('bullets', bullets);
  };

  const handleAddBullet = () => {
    const bullets = [...(slide.bullets || []), 'New key takeaway point'];
    updateField('bullets', bullets);
  };

  const handleDeleteBullet = (index: number) => {
    const bullets = (slide.bullets || []).filter((_, i) => i !== index);
    updateField('bullets', bullets);
  };

  const handleAddMetric = () => {
    const metrics = [...(slide.metrics || []), { label: 'New Metric', value: '99.9%', change: '+10%' }];
    updateField('metrics', metrics);
  };

  const handleDeleteMetric = (index: number) => {
    const metrics = (slide.metrics || []).filter((_, i) => i !== index);
    updateField('metrics', metrics);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-neutral-100 dark:bg-neutral-950 p-3 sm:p-6 lg:p-8">
      {/* 16:9 Aspect Ratio Slide Stage */}
      <div
        className={cn(
          'relative w-full max-w-5xl mx-auto aspect-[16/9] rounded-2xl shadow-2xl flex flex-col p-6 sm:p-10 transition-colors border duration-200 overflow-hidden select-text',
          theme.bgClass,
          theme.borderClass,
          theme.fontFamily
        )}
      >
        {/* Slide Top Navigation Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-500/20">
          <div className="flex items-center gap-2">
            <span className={cn('font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded', theme.accentBadgeClass)}>
              {slide.tag || `SLIDE ${slideIndex + 1}`}
            </span>
            <input
              type="text"
              value={slide.tag || `SLIDE ${slideIndex + 1}`}
              onChange={(e) => updateField('tag', e.target.value)}
              className={cn(
                'font-mono text-[11px] font-bold tracking-wider uppercase bg-transparent px-1 rounded border-b border-transparent focus:border-neutral-500 focus:outline-none',
                theme.mutedTextClass
              )}
              placeholder="CATEGORY TAG"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Slide Layout Switcher Dropdown */}
            <select
              value={slide.layout}
              onChange={(e) => updateField('layout', e.target.value as SlideLayout)}
              className={cn(
                'text-[11px] font-mono font-bold rounded-md px-2 py-0.5 cursor-pointer focus:outline-none border shadow-2xs',
                theme.isDark
                  ? 'bg-neutral-900 text-neutral-200 border-neutral-700'
                  : 'bg-white text-neutral-900 border-neutral-300'
              )}
            >
              <option value="bullets-points">Bullet List</option>
              <option value="split-columns">Split Columns</option>
              <option value="stats-metrics">Stats & Metrics</option>
              <option value="code-architecture">Code Architecture</option>
              <option value="timeline-roadmap">Timeline Roadmap</option>
              <option value="quote-highlight">Quote & Highlight</option>
              <option value="title-cover">Title Cover</option>
            </select>

            <span className={cn('font-mono text-xs font-bold', theme.mutedTextClass)}>
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
                    <span className={cn('h-2 w-2 rounded-full mt-2 shrink-0 transition-colors', theme.dotClass)} />
                    <textarea
                      rows={1}
                      value={bullet}
                      onChange={(e) => handleUpdateBullet(bIdx, e.target.value)}
                      className={cn(
                        'flex-1 bg-transparent text-xs sm:text-sm resize-none focus:outline-none border-b border-transparent focus:border-neutral-500 transition-colors',
                        theme.bodyTextClass
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
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-mono font-bold pt-2 cursor-pointer transition-colors',
                    theme.mutedTextClass,
                    'hover:opacity-100'
                  )}
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
                      className={cn('font-bold text-sm sm:text-base bg-transparent focus:outline-none mb-3 border-b border-transparent focus:border-neutral-500', theme.textClass)}
                    />
                    <div className="space-y-2">
                      {col.content.map((item, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-2">
                          <span className={cn('h-1.5 w-1.5 rounded-full mt-1.5 shrink-0', theme.dotClass)} />
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
                            className={cn('w-full bg-transparent text-xs focus:outline-none', theme.bodyTextClass)}
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
                        <Trash size={12} />
                      </button>
                      <div>
                        <input
                          type="text"
                          value={m.value}
                          onChange={(e) => {
                            const newM = [...(slide.metrics || [])];
                            newM[mIdx] = { ...m, value: e.target.value };
                            updateField('metrics', newM);
                          }}
                          className={cn('font-extrabold text-xl sm:text-2xl bg-transparent focus:outline-none w-full', theme.textClass)}
                        />
                        <input
                          type="text"
                          value={m.label}
                          onChange={(e) => {
                            const newM = [...(slide.metrics || [])];
                            newM[mIdx] = { ...m, label: e.target.value };
                            updateField('metrics', newM);
                          }}
                          className={cn('text-xs font-medium bg-transparent focus:outline-none w-full mt-0.5', theme.subtextClass)}
                        />
                      </div>
                      <input
                        type="text"
                        value={m.change || ''}
                        onChange={(e) => {
                          const newM = [...(slide.metrics || [])];
                          newM[mIdx] = { ...m, change: e.target.value };
                          updateField('metrics', newM);
                        }}
                        className={cn('text-[10px] font-mono font-bold bg-transparent focus:outline-none mt-1', theme.mutedTextClass)}
                      />
                    </div>
                  ))}
                  {(slide.metrics || []).length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddMetric}
                      className={cn(
                        'rounded-xl border border-dashed flex flex-col items-center justify-center p-3 cursor-pointer transition-colors',
                        theme.borderClass,
                        theme.mutedTextClass,
                        'hover:opacity-100'
                      )}
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
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', theme.dotClass)} />
                        <span className={theme.bodyTextClass}>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Code Architecture */}
            {slide.layout === 'code-architecture' && (
              <div className={cn('h-full flex flex-col rounded-xl overflow-hidden border', theme.isDark ? 'border-neutral-800 bg-[#0c0d12]' : 'border-neutral-300 bg-neutral-900 text-neutral-100')}>
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
                      className="bg-transparent focus:outline-none font-bold uppercase text-neutral-200"
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
                    className="bg-transparent focus:outline-none text-right text-neutral-400"
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
                      className={cn('font-mono text-[10px] font-bold bg-transparent focus:outline-none', theme.mutedTextClass)}
                    />
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => {
                        const newT = [...(slide.timeline || [])];
                        newT[idx] = { ...t, title: e.target.value };
                        updateField('timeline', newT);
                      }}
                      className={cn('font-bold text-xs sm:text-sm bg-transparent focus:outline-none my-1', theme.textClass)}
                    />
                    <textarea
                      rows={3}
                      value={t.description}
                      onChange={(e) => {
                        const newT = [...(slide.timeline || [])];
                        newT[idx] = { ...t, description: e.target.value };
                        updateField('timeline', newT);
                      }}
                      className={cn('text-[11px] bg-transparent focus:outline-none resize-none', theme.bodyTextClass)}
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
                    className={cn('w-full bg-transparent text-base sm:text-xl italic font-bold focus:outline-none resize-none leading-relaxed', theme.textClass)}
                  />
                  <div className="mt-4 flex items-center gap-3 pt-3 border-t border-neutral-500/30">
                    <input
                      type="text"
                      value={slide.quote?.author || ''}
                      onChange={(e) => {
                        const current = slide.quote || { text: '' };
                        updateField('quote', { ...current, author: e.target.value });
                      }}
                      placeholder="Author Name"
                      className={cn('font-bold text-xs bg-transparent focus:outline-none', theme.textClass)}
                    />
                    <span className={theme.mutedTextClass}>•</span>
                    <input
                      type="text"
                      value={slide.quote?.role || ''}
                      onChange={(e) => {
                        const current = slide.quote || { text: '' };
                        updateField('quote', { ...current, role: e.target.value });
                      }}
                      placeholder="Title / Organization"
                      className={cn('text-xs bg-transparent focus:outline-none flex-1', theme.subtextClass)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. Title Cover */}
            {slide.layout === 'title-cover' && (
              <div className="mt-8 flex flex-col items-center justify-center text-center">
                <div className={cn('rounded-xl border p-4 max-w-md w-full', theme.surfaceClass)}>
                  <span className={cn('font-mono text-[10px] font-bold uppercase tracking-wider', theme.mutedTextClass)}>
                    Resursee Presentation Studio
                  </span>
                  <p className={cn('text-xs mt-1', theme.bodyTextClass)}>
                    Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono text-[10px]">Present</kbd> in top right to launch fullscreen theater mode
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slide Bottom Bar: Speaker Notes Drawer Toggle */}
        <div className="pt-2 border-t border-neutral-500/20 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={cn(
              'flex items-center gap-1.5 font-mono text-[11px] font-bold transition-colors cursor-pointer',
              theme.mutedTextClass,
              'hover:opacity-100'
            )}
          >
            <Notebook size={14} />
            <span>Speaker Notes {slide.notes ? '(1)' : '(Empty)'}</span>
          </button>
          <span className={cn('font-mono text-[10px]', theme.mutedTextClass)}>
            {theme.name} • 16:9 HD Stage
          </span>
        </div>
      </div>

      {/* Collapsible Speaker Notes Drawer */}
      {showNotesDrawer && (
        <div className="w-full max-w-5xl mx-auto mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-md animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Notebook size={16} className="text-neutral-500" />
              <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                Presenter Notes for Slide #{slideIndex + 1}
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              Only visible to you during rehearsal &amp; Presenter Mode (Shortcut: N)
            </span>
          </div>
          <textarea
            rows={3}
            value={slide.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Type cue cards, talking points, timing checkpoints, or audience QA references..."
            className="w-full bg-neutral-50 dark:bg-black/50 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 resize-none font-sans"
          />
        </div>
      )}
    </div>
  );
}
