'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import { jsPDF } from 'jspdf';
import {
  FileArrowUp,
  UploadSimple,
  DownloadSimple,
  ShieldCheck,
  ArrowLeft,
  Trash,
  ArrowUp,
  ArrowDown,
  Plus,
  Sliders,
} from '@phosphor-icons/react';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export default function ImageToPdfPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [margin, setMargin] = useState<number>(10);
  const [pdfName, setPdfName] = useState('merged-document');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (files: FileList | File[]) => {
    const newItems: ImageItem[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newItems.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
        });
      }
    });

    setImages((prev) => [...prev, ...newItems]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setImages(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const next = [...images];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setImages(next);
  };

  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;

    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        if (i > 0) doc.addPage();

        const imgItem = images[i];
        const imgObj = await loadImage(imgItem.previewUrl);

        const availableW = pageWidth - margin * 2;
        const availableH = pageHeight - margin * 2;

        const imgRatio = imgObj.naturalWidth / imgObj.naturalHeight;

        let finalW = availableW;
        let finalH = availableW / imgRatio;

        if (finalH > availableH) {
          finalH = availableH;
          finalW = availableH * imgRatio;
        }

        const posX = margin + (availableW - finalW) / 2;
        const posY = margin + (availableH - finalH) / 2;

        doc.addImage(imgObj, 'JPEG', posX, posY, finalW, finalH);
      }

      doc.save(`${pdfName || 'merged-document'}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
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
            <span className="font-semibold text-[var(--color-ink)]">Image to PDF</span>
          </nav>

          {/* Heading */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-sky-500 text-white shadow-xs">
                  <FileArrowUp size={20} weight="bold" />
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  PDF Utility
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-emerald-700 border border-emerald-500/20">
                  <ShieldCheck size={12} weight="bold" />
                  <span>100% Client-Side</span>
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Image to PDF
              </h1>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Merge multiple scans, clearance receipts, and ID documents into a single professional PDF.
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
          {images.length === 0 ? (
            <div className="mt-8">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFilesAdded(e.dataTransfer.files);
                  }
                }}
                className="group flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-12 text-center cursor-pointer transition-all hover:border-[var(--color-primary)] hover:bg-sky-500/[0.02] shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-sky-500 text-white shadow-md transition-transform group-hover:scale-110">
                  <UploadSimple size={32} weight="bold" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-ink)]">
                  Choose images to convert into a PDF
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[var(--color-ink-muted)]">
                  Select one or multiple photos, scanned receipts, or signed clearance slips.
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] pointer-events-none"
                >
                  Select Multiple Images
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesAdded(e.target.files);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left 2 Cols: Reorderable Page List */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3.5">
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      PDF Pages ({images.length} pages)
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
                      >
                        <Plus size={14} weight="bold" />
                        <span>Add more images</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFilesAdded(e.target.files);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Image Pages List */}
                  <div className="mt-6 space-y-3">
                    {images.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-3.5 transition-all hover:border-[var(--color-primary)]"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-paper-muted)] font-mono text-xs font-bold text-[var(--color-ink)]">
                            {index + 1}
                          </span>
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="h-12 w-12 rounded-[10px] object-cover border border-[var(--color-rule)]"
                          />
                          <div>
                            <p className="text-xs font-bold text-[var(--color-ink)] line-clamp-1">
                              {item.name}
                            </p>
                            <span className="font-mono text-[10.5px] text-[var(--color-ink-muted)]">
                              {(item.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>

                        {/* Page Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="rounded-full p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)] disabled:opacity-30"
                            title="Move Page Up"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === images.length - 1}
                            className="rounded-full p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)] disabled:opacity-30"
                            title="Move Page Down"
                          >
                            <ArrowDown size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="rounded-full p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Remove Page"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: PDF Settings */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
                  <div className="flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-3.5">
                    <Sliders size={18} className="text-[var(--color-primary)]" />
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      PDF Options
                    </h3>
                  </div>

                  {/* Document Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      File Name (.pdf)
                    </label>
                    <input
                      type="text"
                      value={pdfName}
                      onChange={(e) => setPdfName(e.target.value)}
                      placeholder="e.g. clearance-packet-2026"
                      className="w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 font-mono text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    />
                  </div>

                  {/* Orientation */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Page Orientation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Portrait', val: 'portrait' as const },
                        { label: 'Landscape', val: 'landscape' as const },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setOrientation(item.val)}
                          className={`rounded-[14px] border p-2.5 text-center text-xs font-bold transition-all ${
                            orientation === item.val
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                              : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Margins */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Page Margins
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'None', val: 0 },
                        { label: 'Small (10mm)', val: 10 },
                        { label: 'Normal (20mm)', val: 20 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setMargin(item.val)}
                          className={`rounded-[14px] border p-2 text-center text-xs font-bold transition-all ${
                            margin === item.val
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                              : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate & Download Action */}
                  <button
                    type="button"
                    onClick={handleGeneratePdf}
                    disabled={isGenerating || images.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:opacity-50"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>
                      {isGenerating ? 'Assembling PDF...' : `Download ${images.length}-Page PDF`}
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
