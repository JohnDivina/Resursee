'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import {
  FileArrowDown,
  UploadSimple,
  DownloadSimple,
  ShieldCheck,
  ArrowLeft,
  Trash,
  FilePdf,
  Sliders,
} from '@phosphor-icons/react';

interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export default function PdfToImagePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg'>('png');
  const [scale] = useState<number>(2.0); // High res 2x
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }

    setPdfFile(file);
    setRenderedPages([]);
    setIsRendering(true);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: RenderedPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx as any, viewport }).promise;
          const mime = outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
          const dataUrl = canvas.toDataURL(mime, 0.95);
          pages.push({
            pageNumber: i,
            dataUrl,
            width: viewport.width,
            height: viewport.height,
          });
        }
      }

      setRenderedPages(pages);
    } catch (error) {
      console.error('Error rendering PDF:', error);
      alert('Could not render PDF. Please ensure the file is not password-protected.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadSingle = (page: RenderedPage) => {
    const link = document.createElement('a');
    link.href = page.dataUrl;
    const baseName = pdfFile ? pdfFile.name.replace(/\.[^/.]+$/, '') : 'document';
    link.download = `${baseName}-page-${page.pageNumber}.${outputFormat === 'jpeg' ? 'jpg' : 'png'}`;
    link.click();
  };

  const handleDownloadAll = () => {
    renderedPages.forEach((page) => {
      handleDownloadSingle(page);
    });
  };

  const handleReset = () => {
    setPdfFile(null);
    setRenderedPages([]);
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
            <span className="font-semibold text-[var(--color-ink)]">PDF to Image</span>
          </nav>

          {/* Heading */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-black/[0.05] dark:border-white/[0.08] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-rose-500 text-white shadow-xs">
                  <FileArrowDown size={20} weight="bold" />
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
                PDF to Image
              </h1>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Extract high-resolution PNG or JPG pages directly from PDF documents with zero data uploads.
              </p>
            </div>

            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#131b2e] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-black/[0.03]"
            >
              <ArrowLeft size={14} />
              <span>Back to all tools</span>
            </Link>
          </div>

          {/* Main Interaction Area */}
          {!pdfFile ? (
            <div className="mt-8">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handlePdfUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="group flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#131b2e] p-12 text-center cursor-pointer transition-all hover:border-[var(--color-primary)] hover:bg-rose-500/[0.02] shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-rose-500 text-white shadow-md transition-transform group-hover:scale-110">
                  <FilePdf size={32} weight="bold" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-ink)]">
                  Choose a PDF document to extract images
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[var(--color-ink-muted)]">
                  Extract single pages or entire multi-page documents as high-resolution PNG or JPG images.
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)] pointer-events-none"
                >
                  Select PDF File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePdfUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          ) : isRendering ? (
            <div className="mt-12 flex flex-col items-center justify-center p-12 text-center">
              <span className="h-10 w-10 animate-spin rounded-full border-3 border-[var(--color-primary)] border-t-transparent" />
              <h3 className="mt-4 text-base font-bold text-[var(--color-ink)]">
                Rendering PDF Pages...
              </h3>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                Processing document vector layers directly in your browser.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left 2 Cols: Extracted Pages Grid */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#131b2e] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                  <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3.5">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-ink)]">
                        Extracted Pages ({renderedPages.length} pages)
                      </h3>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">{pdfFile.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                    >
                      <Trash size={14} />
                      <span>Upload different PDF</span>
                    </button>
                  </div>

                  {/* Pages Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {renderedPages.map((page) => (
                      <div
                        key={page.pageNumber}
                        className="group relative flex flex-col justify-between rounded-[18px] border border-black/[0.06] dark:border-white/[0.08] bg-[var(--color-paper-surface)] p-3 transition-all hover:border-[var(--color-primary)] hover:shadow-md"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] border border-black/[0.06] bg-white shadow-2xs">
                          <img
                            src={page.dataUrl}
                            alt={`Page ${page.pageNumber}`}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[var(--color-ink)]">
                            Page {page.pageNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(page)}
                            className="flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[var(--color-primary-hover)] active:scale-95"
                          >
                            <DownloadSimple size={12} weight="bold" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Extraction Settings */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#131b2e] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] space-y-6">
                  <div className="flex items-center gap-2 border-b border-black/[0.04] dark:border-white/[0.06] pb-3.5">
                    <Sliders size={18} className="text-[var(--color-primary)]" />
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      Export Format
                    </h3>
                  </div>

                  {/* Format Choice */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Output Image Format
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'PNG (Sharp)', val: 'png' as const },
                        { label: 'JPG (Compact)', val: 'jpeg' as const },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setOutputFormat(item.val)}
                          className={`rounded-[14px] border p-2.5 text-center text-xs font-bold transition-all ${
                            outputFormat === item.val
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                              : 'border-black/[0.08] dark:border-white/[0.12] bg-[var(--color-paper-surface)] text-[var(--color-ink-secondary)] hover:bg-black/[0.03]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download All Pages Action */}
                  <button
                    type="button"
                    onClick={handleDownloadAll}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>Download All {renderedPages.length} Pages</span>
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
