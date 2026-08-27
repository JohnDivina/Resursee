'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import {
  ArrowsClockwise,
  UploadSimple,
  DownloadSimple,
  ShieldCheck,
  ArrowLeft,
  Trash,
  Sliders,
  CheckCircle,
} from '@phosphor-icons/react';

type TargetFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export default function ConvertImagePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('image/webp');
  const [quality, setQuality] = useState(0.9);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    // Initial conversion
    convertImage(url, targetFormat, quality, file.name);
  };

  const convertImage = (
    url: string,
    format: TargetFormat,
    q: number,
    fileName?: string
  ) => {
    setIsConverting(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // If converting to JPEG, fill white background for transparent pixels
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const outUrl = URL.createObjectURL(blob);
          setConvertedUrl(outUrl);
          setConvertedSize(blob.size);
          setIsConverting(false);
        },
        format,
        q
      );
    };
    img.src = url;
  };

  const handleFormatChange = (newFormat: TargetFormat) => {
    setTargetFormat(newFormat);
    if (originalUrl) {
      convertImage(originalUrl, newFormat, quality);
    }
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (originalUrl) {
      convertImage(originalUrl, targetFormat, newQuality);
    }
  };

  const handleDownload = () => {
    if (!convertedUrl || !originalFile) return;
    const link = document.createElement('a');
    link.href = convertedUrl;
    const ext =
      targetFormat === 'image/png'
        ? 'png'
        : targetFormat === 'image/jpeg'
        ? 'jpg'
        : 'webp';
    const baseName = originalFile.name.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}.${ext}`;
    link.click();
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalUrl(null);
    setConvertedUrl(null);
    setConvertedSize(null);
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
            <span className="font-semibold text-[var(--color-ink)]">Convert Image</span>
          </nav>

          {/* Heading */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule)] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  <ArrowsClockwise size={20} weight="bold" />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                  Format Conversion
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 font-mono text-[9.5px] font-bold text-emerald-700 border border-emerald-500/20">
                  <ShieldCheck size={12} weight="bold" />
                  <span>100% Client-Side</span>
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Convert Image
              </h1>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Transform images between PNG, JPG, and modern WebP in milliseconds directly in your browser.
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

          {/* Interaction Area */}
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
                  Choose an image to convert
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[var(--color-ink-muted)]">
                  Convert scanned forms, screenshots, and thesis charts to PNG, JPG, or WebP.
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
              {/* Preview */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                    <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                      Conversion Preview
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
                    {convertedUrl ? (
                      <img
                        src={convertedUrl}
                        alt="Converted Preview"
                        className="max-h-full max-w-full object-contain rounded shadow-xs"
                      />
                    ) : (
                      <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                        Converting...
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-ink-muted)] font-mono">
                    <span>
                      Original: {originalFile.type.split('/')[1]?.toUpperCase()} ({formatBytes(originalFile.size)})
                    </span>
                    <span className="font-bold text-[var(--color-primary)]">
                      Target: {targetFormat.split('/')[1]?.toUpperCase()} ({convertedSize ? formatBytes(convertedSize) : '...'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs space-y-6">
                  <div className="flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-3">
                    <Sliders size={18} className="text-[var(--color-primary)]" />
                    <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                      Target Format
                    </h3>
                  </div>

                  {/* Format Choices */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Select Output Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'PNG', format: 'image/png' as TargetFormat },
                        { label: 'JPG', format: 'image/jpeg' as TargetFormat },
                        { label: 'WebP', format: 'image/webp' as TargetFormat },
                      ].map((item) => (
                        <button
                          key={item.format}
                          type="button"
                          onClick={() => handleFormatChange(item.format)}
                          className={`rounded-lg border py-2.5 font-mono text-xs font-bold transition-all ${
                            targetFormat === item.format
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                              : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality Control for lossy formats */}
                  {targetFormat !== 'image/png' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-[var(--color-ink)]">Compression Quality</label>
                        <span className="font-mono font-bold text-[var(--color-primary)]">
                          {Math.round(quality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="1"
                        step="0.05"
                        value={quality}
                        onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                        className="w-full accent-[var(--color-primary)] cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!convertedUrl || isConverting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>
                      Download as {targetFormat.split('/')[1]?.toUpperCase()}
                    </span>
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
