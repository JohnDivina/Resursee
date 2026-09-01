'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import imageCompression from 'browser-image-compression';
import {
  ArrowsInLineHorizontal,
  UploadSimple,
  DownloadSimple,
  ShieldCheck,
  HouseLine,
  ArrowLeft,
  CheckCircle,
  Sliders,
  Trash,
} from '@phosphor-icons/react';

export default function CompressImagePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [quality, setQuality] = useState(0.8);
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
      alert('Please upload a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalPreview(url);
    setCompressedBlob(null);
    setCompressedPreview(null);

    compressImageFile(file, maxSizeMB, quality);
  };

  const compressImageFile = async (file: File, targetMB: number, targetQuality: number) => {
    setIsProcessing(true);
    try {
      const options = {
        maxSizeMB: targetMB,
        maxWidthOrHeight: 2560,
        useWebWorker: true,
        initialQuality: targetQuality,
      };

      const compressed = await imageCompression(file, options);
      setCompressedBlob(compressed);
      const url = URL.createObjectURL(compressed);
      setCompressedPreview(url);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (originalFile) {
      compressImageFile(originalFile, maxSizeMB, newQuality);
    }
  };

  const handleMaxMBChange = (mb: number) => {
    setMaxSizeMB(mb);
    if (originalFile) {
      compressImageFile(originalFile, mb, quality);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || !originalFile) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    const ext = originalFile.name.split('.').pop();
    const baseName = originalFile.name.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}-compressed.${ext}`;
    link.click();
  };

  const handleReset = () => {
    setOriginalFile(null);
    setOriginalPreview(null);
    setCompressedBlob(null);
    setCompressedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const savingsPercent =
    originalFile && compressedBlob
      ? Math.max(0, Math.round(((originalFile.size - compressedBlob.size) / originalFile.size) * 100))
      : 0;

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
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-[var(--color-primary)]">
              Productivity Tools
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)]">Compress Image</span>
          </nav>

          {/* Tool Heading */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-blue-600 text-white shadow-xs">
                  <ArrowsInLineHorizontal size={20} weight="bold" />
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Image Utility
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-emerald-700 border border-emerald-500/20">
                  <ShieldCheck size={12} weight="bold" />
                  <span>100% Client-Side</span>
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Compress Image
              </h1>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Drastically shrink image file sizes for university portal submissions with high visual fidelity.
              </p>
            </div>

            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]"
            >
              <ArrowLeft size={14} />
              <span>Back to all tools</span>
            </Link>
          </div>

          {/* Main Interaction Area */}
          {!originalFile ? (
            /* Upload Dropzone */
            <div className="mt-8">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className="group flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-12 text-center cursor-pointer transition-all hover:border-[var(--color-rule-strong)] hover:bg-neutral-500/[0.02] shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-md transition-transform group-hover:scale-110">
                  <UploadSimple size={32} weight="bold" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-ink)]">
                  Choose an image or drop it here
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[var(--color-ink-muted)]">
                  Supports JPG, PNG, WebP, BMP, and GIF. Images are processed locally on your device with complete privacy.
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] pointer-events-none"
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
            /* Image Preview & Compression Controls */
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left 2 Cols: Side-by-side comparison */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3.5">
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      Compression Preview
                    </h3>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                    >
                      <Trash size={14} />
                      <span>Upload different image</span>
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Original */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--color-ink)]">Original Image</span>
                        <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                          {formatBytes(originalFile.size)}
                        </span>
                      </div>
                      <div className="relative flex h-60 items-center justify-center overflow-hidden rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-2">
                        {originalPreview && (
                          <img
                            src={originalPreview}
                            alt="Original"
                            className="max-h-full max-w-full object-contain rounded-[14px]"
                          />
                        )}
                      </div>
                    </div>

                    {/* Compressed */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--color-primary)]">
                          Compressed Output
                        </span>
                        <span className="font-mono text-[11px] font-bold text-emerald-600">
                          {compressedBlob ? formatBytes(compressedBlob.size) : 'Calculating...'}
                        </span>
                      </div>
                      <div className="relative flex h-60 items-center justify-center overflow-hidden rounded-[18px] border-2 border-blue-500/30 bg-[var(--color-paper-surface)] p-2">
                        {isProcessing ? (
                          <div className="flex flex-col items-center gap-2 text-xs text-[var(--color-primary)]">
                            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                            <span className="font-mono text-[11px]">Compressing...</span>
                          </div>
                        ) : compressedPreview ? (
                          <img
                            src={compressedPreview}
                            alt="Compressed"
                            className="max-h-full max-w-full object-contain rounded-[14px]"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Savings Ribbon */}
                  {savingsPercent > 0 && (
                    <div className="mt-6 flex items-center justify-between rounded-[16px] bg-emerald-500/10 p-3.5 border border-emerald-500/20 text-xs">
                      <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                        <span>Saved {savingsPercent}% in file size!</span>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                        {formatBytes(originalFile.size)} → {compressedBlob ? formatBytes(compressedBlob.size) : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Compression Settings */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
                  <div className="flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-3.5">
                    <Sliders size={18} className="text-[var(--color-primary)]" />
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      Compression Settings
                    </h3>
                  </div>

                  {/* Quality Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-[var(--color-ink)]">Quality Factor</label>
                      <span className="font-mono font-bold text-[var(--color-primary)]">
                        {Math.round(quality * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.05"
                      value={quality}
                      onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                      className="w-full accent-[var(--color-primary)] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--color-ink-muted)]">
                      <span>Smaller size</span>
                      <span>Balanced</span>
                      <span>Best clarity</span>
                    </div>
                  </div>

                  {/* Preset Max File Sizes */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Target Max Size Limit
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 1, 2].map((mb) => (
                        <button
                          key={mb}
                          type="button"
                          onClick={() => handleMaxMBChange(mb)}
                          className={`rounded-[14px] border px-2.5 py-2 font-mono text-xs font-bold transition-all ${
                            maxSizeMB === mb
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                              : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]'
                          }`}
                        >
                          {mb} MB
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download Action */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!compressedBlob || isProcessing}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>Download Compressed Image</span>
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
