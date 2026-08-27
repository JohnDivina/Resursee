'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import {
  CornersOut,
  UploadSimple,
  DownloadSimple,
  ShieldCheck,
  ArrowLeft,
  LockKey,
  LockKeyOpen,
  Trash,
  CheckCircle,
  Sliders,
} from '@phosphor-icons/react';

interface Preset {
  name: string;
  width: number;
  height: number;
  label: string;
}

const PRESETS: Preset[] = [
  { name: '2x2 in (ID Photo)', width: 600, height: 600, label: 'Standard 2x2' },
  { name: '1x1 in (ID Photo)', width: 300, height: 300, label: 'Standard 1x1' },
  { name: 'Passport Size', width: 413, height: 531, label: '35x45 mm' },
  { name: 'Full HD', width: 1920, height: 1080, label: '1080p' },
  { name: 'HD', width: 1280, height: 720, label: '720p' },
  { name: 'VGA Document', width: 800, height: 600, label: '800x600' },
];

export default function ResizeImagePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [targetWidth, setTargetWidth] = useState(600);
  const [targetHeight, setTargetHeight] = useState(600);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    const img = new Image();
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
    };
    img.src = url;
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockAspectRatio && naturalWidth > 0) {
      const ratio = naturalHeight / naturalWidth;
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockAspectRatio && naturalHeight > 0) {
      const ratio = naturalWidth / naturalHeight;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  const applyPreset = (preset: Preset) => {
    setTargetWidth(preset.width);
    setTargetHeight(preset.height);
  };

  const handleDownload = () => {
    if (!originalUrl || !originalFile) return;

    setIsResizing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // High-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const baseName = originalFile.name.replace(/\.[^/.]+$/, '');
        link.download = `${baseName}-${targetWidth}x${targetHeight}.png`;
        link.click();
        setIsResizing(false);
      }, 'image/png');
    };
    img.src = originalUrl;
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setNaturalWidth(0);
    setNaturalHeight(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        resources={mockResources}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-[var(--color-primary)]">
              Productivity Tools
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)]">Resize Image</span>
          </nav>

          {/* Heading */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule)] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  <CornersOut size={20} weight="bold" />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                  Image Utility
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 font-mono text-[9.5px] font-bold text-emerald-700 border border-emerald-500/20">
                  <ShieldCheck size={12} weight="bold" />
                  <span>100% Client-Side</span>
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Resize Image
              </h1>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Scale dimensions to 2x2 ID photos, standard clearance sizes, or custom pixel limits.
              </p>
            </div>

            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]"
            >
              <ArrowLeft size={14} />
              <span>Back to all tools</span>
            </Link>
          </div>

          {/* Main Interaction */}
          {!originalFile ? (
            <div className="mt-8">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-12 text-center cursor-pointer transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]/20 shadow-xs"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] shadow-xs transition-transform group-hover:scale-110">
                  <UploadSimple size={32} weight="bold" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-[var(--color-ink)]">
                  Choose an image to resize
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[var(--color-ink-muted)]">
                  Scale photos for university ID cards, admissions portfolios, and student clearances.
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] pointer-events-none"
                >
                  Select Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Preview Box */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                    <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                      Preview ({targetWidth} × {targetHeight} px)
                    </h3>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
                    >
                      <Trash size={14} />
                      <span>Upload different image</span>
                    </button>
                  </div>

                  <div className="mt-6 flex h-80 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-4">
                    {originalUrl && (
                      <img
                        src={originalUrl}
                        alt="Resize preview"
                        style={{
                          aspectRatio: `${targetWidth} / ${targetHeight}`,
                          objectFit: 'contain',
                        }}
                        className="max-h-full max-w-full rounded shadow-xs transition-all"
                      />
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-ink-muted)] font-mono">
                    <span>Original: {naturalWidth} × {naturalHeight} px</span>
                    <span className="font-bold text-[var(--color-primary)]">
                      Output: {targetWidth} × {targetHeight} px
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs space-y-6">
                  <div className="flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-3">
                    <Sliders size={18} className="text-[var(--color-primary)]" />
                    <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                      Dimension Controls
                    </h3>
                  </div>

                  {/* Width & Height */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-ink)]">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="8000"
                        value={targetWidth}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                        className="mt-1 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 font-mono text-xs font-bold text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-ink)]">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="8000"
                        value={targetHeight}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                        className="mt-1 w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 font-mono text-xs font-bold text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                      />
                    </div>

                    {/* Aspect Ratio Lock Toggle */}
                    <button
                      type="button"
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg border p-2 text-xs font-semibold transition-colors ${
                        lockAspectRatio
                          ? 'border-[var(--color-primary-subtle)] bg-[var(--color-primary-subtle)]/60 text-[var(--color-primary)]'
                          : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink-muted)]'
                      }`}
                    >
                      {lockAspectRatio ? <LockKey size={15} weight="bold" /> : <LockKeyOpen size={15} />}
                      <span>{lockAspectRatio ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}</span>
                    </button>
                  </div>

                  {/* Quick Presets */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Standard Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-2 text-left hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-muted)] transition-colors"
                        >
                          <span className="block text-xs font-bold text-[var(--color-ink)]">
                            {preset.label}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">
                            {preset.width}×{preset.height}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isResizing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>Download Resized Image</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
