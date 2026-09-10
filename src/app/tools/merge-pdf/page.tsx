'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import { FileUpload } from '@/components/ui/file-upload';
import { PDFDocument } from 'pdf-lib';
import {
  Files,
  UploadSimple,
  DownloadSimple,
  ShieldCheck,
  ArrowLeft,
  Trash,
  ArrowUp,
  ArrowDown,
  Plus,
  Sliders,
  FilePdf,
  CheckCircle,
  WarningCircle,
  Stack,
  Info,
} from '@phosphor-icons/react';

interface PdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnailUrl: string | null;
  pageRangeInput: string;
}

export default function MergePdfPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [pdfItems, setPdfItems] = useState<PdfItem[]>([]);
  const [pdfName, setPdfName] = useState('merged-document');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeStatus, setMergeStatus] = useState<string>('');
  const [mergeSuccess, setMergeSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract first page thumbnail
  const extractThumbnail = async (file: File): Promise<string | null> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      if (pdf.numPages < 1) return null;

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.45 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      await page.render({ canvasContext: ctx as any, viewport }).promise;
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      console.warn('Thumbnail generation skipped:', err);
      return null;
    }
  };

  // Handle newly added files
  const handleFilesAdded = async (files: FileList | File[]) => {
    setErrorMessage(null);
    setMergeSuccess(false);

    const validFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      setErrorMessage('Please select valid PDF documents (.pdf).');
      return;
    }

    const newItems: PdfItem[] = [];

    for (const file of validFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const count = pdfDoc.getPageCount();

        // Generate thumbnail in background
        const thumb = await extractThumbnail(file);

        newItems.push({
          id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          pageCount: count,
          thumbnailUrl: thumb,
          pageRangeInput: 'All',
        });
      } catch (err: any) {
        console.error('Error loading PDF file:', err);
        setErrorMessage(
          `Could not read "${file.name}". Please ensure it is not password-encrypted or damaged.`
        );
      }
    }

    setPdfItems((prev) => [...prev, ...newItems]);
  };

  // Reordering handlers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setPdfItems((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    setPdfItems((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRemove = (id: string) => {
    setPdfItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setPdfItems([]);
    setErrorMessage(null);
    setMergeSuccess(false);
  };

  const handlePageRangeChange = (id: string, value: string) => {
    setPdfItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pageRangeInput: value } : item))
    );
  };

  // Parse page range string (e.g. "1-3, 5") to 0-indexed page indices
  const parsePageIndices = (rangeStr: string, totalPages: number): number[] => {
    const trimmed = rangeStr.trim();
    if (!trimmed || trimmed.toLowerCase() === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const indices = new Set<number>();
    const parts = trimmed.split(',');

    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;

      if (p.includes('-')) {
        const [startStr, endStr] = p.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(totalPages, Math.max(start, end));
          for (let i = min; i <= max; i++) {
            indices.add(i - 1);
          }
        }
      } else {
        const pageNum = parseInt(p, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          indices.add(pageNum - 1);
        }
      }
    }

    const sorted = Array.from(indices).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : Array.from({ length: totalPages }, (_, i) => i);
  };

  // Compute total output pages based on current selections
  const calculateTotalOutputPages = () => {
    return pdfItems.reduce((acc, item) => {
      const indices = parsePageIndices(item.pageRangeInput, item.pageCount);
      return acc + indices.length;
    }, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Core PDF Merge Logic using pdf-lib (100% Client-Side)
  const handleMergePdfs = async () => {
    if (pdfItems.length < 2) {
      setErrorMessage('Please add at least 2 PDF documents to merge.');
      return;
    }

    setIsMerging(true);
    setErrorMessage(null);
    setMergeSuccess(false);
    setMergeStatus('Initializing PDF document...');

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfItems.length; i++) {
        const item = pdfItems[i];
        setMergeStatus(`Processing ${i + 1} of ${pdfItems.length}: ${item.name}...`);

        const arrayBuffer = await item.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

        const pageIndices = parsePageIndices(item.pageRangeInput, item.pageCount);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      setMergeStatus('Finalizing merged document...');
      const mergedPdfBytes = await mergedPdf.save();

      // Trigger instantaneous browser download
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanFileName = (pdfName.trim() || 'merged-document').replace(/\.pdf$/i, '');
      link.download = `${cleanFileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMergeSuccess(true);
    } catch (err: any) {
      console.error('PDF Merge Error:', err);
      setErrorMessage(
        err?.message || 'An unexpected error occurred while merging your PDF documents.'
      );
    } finally {
      setIsMerging(false);
      setMergeStatus('');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {/* Universal Header */}
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />

      {/* Command Palette */}
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
            <span className="font-semibold text-[var(--color-ink)]">Merge PDF</span>
          </nav>

          {/* Clean Page Heading */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Merge PDF Files
              </h1>
              <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] sm:text-sm leading-relaxed">
                Combine multiple PDFs, clearance forms, transcripts, or syllabi into a single document with custom ordering.
              </p>

              {/* Verified Client-Side Privacy Notice */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-[var(--color-ink-muted)]">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                  Client-side processing only
                </span>
                <span className="text-[var(--color-rule-strong)] hidden sm:inline">•</span>
                <span>Your files never leave your browser and no data is stored or saved.</span>
              </div>
            </div>

            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-4 py-2 text-xs font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)] transition-colors shadow-2xs shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Back to all tools</span>
            </Link>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 text-xs font-medium text-[var(--color-ink)]">
              <WarningCircle size={18} weight="bold" className="shrink-0 mt-0.5 text-[var(--color-ink)]" />
              <div>
                <p className="font-bold">Error merging PDFs</p>
                <p className="mt-0.5 text-[var(--color-ink-muted)]">{errorMessage}</p>
              </div>
            </div>
          )}

          {mergeSuccess && (
            <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 text-xs font-medium text-[var(--color-ink)]">
              <CheckCircle size={18} weight="bold" className="shrink-0 mt-0.5 text-[var(--color-ink)]" />
              <div>
                <p className="font-bold">PDF Successfully Merged!</p>
                <p className="mt-0.5 text-[var(--color-ink-muted)]">
                  Your merged PDF has been created and downloaded to your device.
                </p>
              </div>
            </div>
          )}

          {/* Main Interaction Area */}
          {pdfItems.length === 0 ? (
            <div className="mt-8">
              <FileUpload
                accept="application/pdf,.pdf"
                multiple={true}
                maxSizeMB={100}
                title="Choose PDF files to merge"
                description="Select two or more PDF documents, clearance forms, or certificates to combine into one."
                acceptedTypesLabel={['PDF (.pdf)']}
                onChange={(files) => {
                  if (files && files.length > 0) {
                    const dataTransfer = new DataTransfer();
                    files.forEach((f) => dataTransfer.items.add(f));
                    handleFilesAdded(dataTransfer.files);
                  }
                }}
              />
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left Column (2 Cols): Reorderable Document List */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-rule-subtle)] pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <Stack size={16} className="text-[var(--color-ink)]" />
                        <span>Documents to Merge</span>
                        <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--color-ink-muted)]">
                          {pdfItems.length} files
                        </span>
                      </h3>
                      <p className="text-[11.5px] text-[var(--color-ink-muted)] mt-0.5">
                        Drag or use the arrows to set the merge order from top to bottom.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-paper-muted)] transition-colors cursor-pointer"
                      >
                        <Plus size={14} weight="bold" />
                        <span>Add PDFs</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Clear all uploaded documents"
                      >
                        <Trash size={14} />
                        <span className="hidden sm:inline">Clear all</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="application/pdf,.pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFilesAdded(e.target.files);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Document Cards List */}
                  <div className="mt-5 space-y-3">
                    {pdfItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-4 transition-all hover:border-[var(--color-rule-strong)] hover:shadow-2xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Order Position Badge */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-muted)] font-mono text-xs font-extrabold text-[var(--color-ink)] group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                            {index + 1}
                          </div>

                          {/* Visual Thumbnail or PDF Icon */}
                          <div className="relative flex h-14 w-11 shrink-0 items-center justify-center rounded-[10px] overflow-hidden border border-[var(--color-rule-strong)] bg-[var(--color-paper-muted)] shadow-2xs">
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FilePdf size={24} weight="bold" className="text-[var(--color-ink)]" />
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--color-ink)] truncate max-w-[220px] sm:max-w-[280px]">
                              {item.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-[var(--color-ink-muted)]">
                              <span className="rounded-md bg-[var(--color-paper-muted)] px-1.5 py-0.5 font-semibold text-[var(--color-ink)]">
                                {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(item.size)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Page Range Filter & Reorder Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-rule-subtle)]">
                          {/* Page Range Input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                              Pages:
                            </span>
                            <input
                              type="text"
                              value={item.pageRangeInput}
                              onChange={(e) => handlePageRangeChange(item.id, e.target.value)}
                              placeholder={`1-${item.pageCount} or All`}
                              className="w-20 rounded-[10px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] px-2 py-1 font-mono text-[11px] text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)] text-center"
                              title="Specify page range, e.g. 1-3, 5 or All"
                            />
                          </div>

                          {/* Up, Down, Delete Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)] disabled:opacity-20 transition-all cursor-pointer"
                              title="Move Document Up"
                            >
                              <ArrowUp size={15} weight="bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === pdfItems.length - 1}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)] disabled:opacity-20 transition-all cursor-pointer"
                              title="Move Document Down"
                            >
                              <ArrowDown size={15} weight="bold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-[var(--color-ink)] transition-all cursor-pointer"
                              title="Remove Document"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (1 Col): Merge Settings & Action Sidebar */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
                  <div className="flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-3.5">
                    <Sliders size={18} className="text-[var(--color-ink)]" />
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">Merge Options</h3>
                  </div>

                  {/* Document Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-ink)]">
                      Output File Name
                    </label>
                    <div className="flex items-center rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2">
                      <input
                        type="text"
                        value={pdfName}
                        onChange={(e) => setPdfName(e.target.value)}
                        placeholder="merged-document"
                        className="w-full bg-transparent font-mono text-xs text-[var(--color-ink)] outline-hidden"
                      />
                      <span className="font-mono text-xs text-[var(--color-ink-muted)]">.pdf</span>
                    </div>
                  </div>

                  {/* Summary Breakdown Card */}
                  <div className="space-y-2 rounded-[18px] border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5">
                    <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Summary
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                        <span>Total Documents:</span>
                        <span className="font-mono font-bold text-[var(--color-ink)]">
                          {pdfItems.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                        <span>Total Merged Pages:</span>
                        <span className="font-mono font-bold text-[var(--color-ink)]">
                          {calculateTotalOutputPages()} pages
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                        <span>Total Source Size:</span>
                        <span className="font-mono font-bold text-[var(--color-ink)]">
                          {formatFileSize(pdfItems.reduce((acc, item) => acc + item.size, 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Guarantee */}
                  <div className="flex items-start gap-2.5 rounded-[16px] bg-[var(--color-paper-muted)] p-3 text-[11px] text-[var(--color-ink-muted)]">
                    <ShieldCheck size={16} weight="bold" className="shrink-0 text-[var(--color-ink-muted)] mt-0.5" />
                    <p>
                      Files are processed 100% in your browser. No files are uploaded to any server.
                    </p>
                  </div>

                  {/* Merge & Download Action */}
                  <button
                    type="button"
                    onClick={handleMergePdfs}
                    disabled={isMerging || pdfItems.length < 2}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-3.5 text-xs font-bold shadow-md transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>
                      {isMerging
                        ? mergeStatus || 'Merging PDFs...'
                        : pdfItems.length < 2
                        ? 'Add at least 2 PDFs to merge'
                        : `Merge & Download (${calculateTotalOutputPages()} Pages)`}
                    </span>
                  </button>

                  {/* Page Range Syntax Helper */}
                  <div className="border-t border-[var(--color-rule-subtle)] pt-3 text-[10.5px] text-[var(--color-ink-muted)] space-y-1">
                    <p className="font-bold text-[var(--color-ink)] flex items-center gap-1">
                      <Info size={13} />
                      <span>Page Range Tips:</span>
                    </p>
                    <p>
                      Enter <code className="rounded bg-[var(--color-paper-muted)] px-1">All</code> for entire document, or ranges like{' '}
                      <code className="rounded bg-[var(--color-paper-muted)] px-1">1-3, 5</code> to select specific pages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Universal Footer */}
      <Footer />
    </div>
  );
}
