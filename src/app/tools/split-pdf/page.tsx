'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import { FileUpload } from '@/components/ui/file-upload';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import {
  Scissors,
  FilePdf,
  Files,
  DownloadSimple,
  UploadSimple,
  Trash,
  CheckCircle,
  WarningCircle,
  Eye,
  MagnifyingGlassPlus,
  ArrowsSplit,
  HouseLine,
  ShieldCheck,
  Check,
  Square,
  CheckSquareOffset,
  SquaresFour,
  X,
  Sliders,
  ArrowRight,
  Info,
} from '@phosphor-icons/react';

type SplitMode = 'selected' | 'every-page' | 'ranges' | 'chunks';

interface PageItem {
  pageNumber: number; // 1-indexed
  thumbnailUrl: string | null;
  width: number;
  height: number;
  selected: boolean;
}

interface SplitResultFile {
  name: string;
  blob: Blob;
  url: string;
  sizeBytes: number;
  pageCount: number;
  pageSummary: string;
}

export default function SplitPdfPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);

  // Document state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isRenderingThumbs, setIsRenderingThumbs] = useState(false);
  const [thumbProgress, setThumbProgress] = useState({ current: 0, total: 0 });

  // Split Configuration State
  const [mode, setMode] = useState<SplitMode>('selected');
  const [outputPrefix, setOutputPrefix] = useState<string>('split-document');
  const [customRangeInput, setCustomRangeInput] = useState<string>('1-2, 3-4');
  const [chunkSize, setChunkSize] = useState<number>(2);
  const [separateFilesForRanges, setSeparateFilesForRanges] = useState(true);

  // Execution state
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitProgress, setSplitProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [splitResults, setSplitResults] = useState<SplitResultFile[]>([]);
  const [zipBlobUrl, setZipBlobUrl] = useState<string | null>(null);
  const [zipSize, setZipSize] = useState<number>(0);

  // Preview Modal State
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set document title
  useEffect(() => {
    document.title = 'Split PDF Document • Productivity Tools | Resursee';
  }, []);

  // Cleanup object URLs on unmount or reset
  const cleanupResults = () => {
    splitResults.forEach((res) => {
      if (res.url) URL.revokeObjectURL(res.url);
    });
    if (zipBlobUrl) URL.revokeObjectURL(zipBlobUrl);
    setSplitResults([]);
    setZipBlobUrl(null);
    setZipSize(0);
  };

  useEffect(() => {
    return () => {
      cleanupResults();
    };
  }, []);

  // Format file size helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Thumbnail generator using pdfjs-dist
  const generateThumbnails = async (arrayBuffer: ArrayBuffer, totalPages: number) => {
    setIsRenderingThumbs(true);
    setThumbProgress({ current: 0, total: totalPages });

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;

      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx as any, viewport }).promise;
            const thumbUrl = canvas.toDataURL('image/jpeg', 0.82);

            setPages((prev) =>
              prev.map((p) =>
                p.pageNumber === i
                  ? {
                      ...p,
                      thumbnailUrl: thumbUrl,
                      width: viewport.width,
                      height: viewport.height,
                    }
                  : p
              )
            );
          }
        } catch (pageErr) {
          console.warn(`Could not render thumbnail for page ${i}`, pageErr);
        }

        setThumbProgress({ current: i, total: totalPages });
      }
    } catch (err) {
      console.warn('PDF.js thumbnail renderer error:', err);
    } finally {
      setIsRenderingThumbs(false);
    }
  };

  // Handle PDF file upload
  const handlePdfUpload = async (file: File) => {
    setErrorMessage(null);
    cleanupResults();

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a valid PDF document (.pdf).');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
      const total = pdfDoc.getPageCount();

      if (total === 0) {
        setErrorMessage('This PDF document has 0 pages.');
        return;
      }

      setPdfFile(file);
      setPdfArrayBuffer(buffer);
      setPageCount(total);

      // Sanitize base file name for output prefix
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[\s_]+/g, '-');
      setOutputPrefix(`${cleanName}-split`);

      // Initialize pages list
      const initialPages: PageItem[] = Array.from({ length: total }, (_, idx) => ({
        pageNumber: idx + 1,
        thumbnailUrl: null,
        width: 150,
        height: 200,
        selected: true, // Selected by default
      }));
      setPages(initialPages);

      // Default reasonable range input
      if (total >= 4) {
        const mid = Math.ceil(total / 2);
        setCustomRangeInput(`1-${mid}, ${mid + 1}-${total}`);
      } else if (total > 1) {
        setCustomRangeInput(Array.from({ length: total }, (_, i) => `${i + 1}`).join(', '));
      } else {
        setCustomRangeInput('1');
      }

      // Generate thumbnails asynchronously
      generateThumbnails(buffer, total);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      if (err.message && err.message.toLowerCase().includes('password')) {
        setErrorMessage('This PDF is encrypted with a password. Please remove the password protection before splitting.');
      } else {
        setErrorMessage('Could not load this PDF document. Please verify the file is not corrupted.');
      }
    }
  };

  // Selection actions
  const togglePageSelection = (pageNumber: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const selectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: true })));
  };

  const deselectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
  };

  const invertSelection = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: !p.selected })));
  };

  const selectOddPages = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: p.pageNumber % 2 !== 0 })));
  };

  const selectEvenPages = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: p.pageNumber % 2 === 0 })));
  };

  const selectedPagesCount = useMemo(() => {
    return pages.filter((p) => p.selected).length;
  }, [pages]);

  // Parse custom range input (e.g. "1-3, 5, 7-10")
  const parseRangeGroups = (input: string, maxPages: number): { pages: number[]; label: string }[] => {
    if (!input.trim()) return [];

    const segments = input.split(',').map((s) => s.trim()).filter(Boolean);
    const groups: { pages: number[]; label: string }[] = [];

    for (const segment of segments) {
      if (segment.includes('-')) {
        const parts = segment.split('-').map((p) => parseInt(p.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const start = Math.max(1, Math.min(parts[0], maxPages));
          const end = Math.max(1, Math.min(parts[1], maxPages));
          const rangePages: number[] = [];
          if (start <= end) {
            for (let i = start; i <= end; i++) rangePages.push(i);
          } else {
            for (let i = start; i >= end; i--) rangePages.push(i);
          }
          if (rangePages.length > 0) {
            groups.push({
              pages: rangePages,
              label: `Pages ${start}-${end}`,
            });
          }
        }
      } else {
        const single = parseInt(segment, 10);
        if (!isNaN(single) && single >= 1 && single <= maxPages) {
          groups.push({
            pages: [single],
            label: `Page ${single}`,
          });
        }
      }
    }

    return groups;
  };

  // Perform PDF Splitting
  const handleSplitPdf = async () => {
    if (!pdfArrayBuffer || !pdfFile || pageCount === 0) return;

    setErrorMessage(null);
    setIsSplitting(true);
    setSplitProgress(10);
    cleanupResults();

    try {
      const srcDoc = await PDFDocument.load(pdfArrayBuffer.slice(0), { ignoreEncryption: true });
      const generatedFiles: SplitResultFile[] = [];
      const zip = new JSZip();
      const safePrefix = outputPrefix.trim() || 'split-document';

      // =========================================================================
      // MODE 1: Extract Selected Pages into a single PDF
      // =========================================================================
      if (mode === 'selected') {
        const selectedIndices = pages
          .filter((p) => p.selected)
          .map((p) => p.pageNumber - 1);

        if (selectedIndices.length === 0) {
          throw new Error('Please select at least one page to extract.');
        }

        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(srcDoc, selectedIndices);
        copiedPages.forEach((p) => newDoc.addPage(p));

        setSplitProgress(70);
        const pdfBytes = await newDoc.save();
        const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const fileName = `${safePrefix}-extracted.pdf`;

        generatedFiles.push({
          name: fileName,
          blob,
          url,
          sizeBytes: blob.size,
          pageCount: selectedIndices.length,
          pageSummary: `${selectedIndices.length} selected pages`,
        });

        // Also add to zip for unified download
        zip.file(fileName, blob);
      }

      // =========================================================================
      // MODE 2: Split Every Page (individual PDFs)
      // =========================================================================
      else if (mode === 'every-page') {
        const total = pageCount;
        for (let i = 0; i < total; i++) {
          const newDoc = await PDFDocument.create();
          const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(copiedPage);

          const pdfBytes = await newDoc.save();
          const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const fileName = `${safePrefix}-page-${i + 1}.pdf`;

          generatedFiles.push({
            name: fileName,
            blob,
            url,
            sizeBytes: blob.size,
            pageCount: 1,
            pageSummary: `Page ${i + 1}`,
          });

          zip.file(fileName, blob);
          setSplitProgress(Math.round(10 + (i / total) * 75));
        }
      }

      // =========================================================================
      // MODE 3: Custom Ranges (e.g. 1-3, 4-6, 8)
      // =========================================================================
      else if (mode === 'ranges') {
        const groups = parseRangeGroups(customRangeInput, pageCount);
        if (groups.length === 0) {
          throw new Error('Please enter at least one valid page range (e.g., "1-3, 4-5").');
        }

        if (separateFilesForRanges) {
          for (let g = 0; g < groups.length; g++) {
            const group = groups[g];
            const newDoc = await PDFDocument.create();
            const indices = group.pages.map((p) => p - 1);
            const copiedPages = await newDoc.copyPages(srcDoc, indices);
            copiedPages.forEach((p) => newDoc.addPage(p));

            const pdfBytes = await newDoc.save();
            const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const fileName = `${safePrefix}-part-${g + 1}.pdf`;

            generatedFiles.push({
              name: fileName,
              blob,
              url,
              sizeBytes: blob.size,
              pageCount: indices.length,
              pageSummary: group.label,
            });

            zip.file(fileName, blob);
            setSplitProgress(Math.round(15 + (g / groups.length) * 70));
          }
        } else {
          // Combined into one custom document with specified ranges
          const newDoc = await PDFDocument.create();
          const allIndices = groups.flatMap((g) => g.pages.map((p) => p - 1));
          const copiedPages = await newDoc.copyPages(srcDoc, allIndices);
          copiedPages.forEach((p) => newDoc.addPage(p));

          const pdfBytes = await newDoc.save();
          const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const fileName = `${safePrefix}-ranges-combined.pdf`;

          generatedFiles.push({
            name: fileName,
            blob,
            url,
            sizeBytes: blob.size,
            pageCount: allIndices.length,
            pageSummary: groups.map((g) => g.label).join(', '),
          });

          zip.file(fileName, blob);
        }
      }

      // =========================================================================
      // MODE 4: Split into Chunks of N Pages
      // =========================================================================
      else if (mode === 'chunks') {
        const size = Math.max(1, chunkSize);
        const totalChunks = Math.ceil(pageCount / size);

        for (let c = 0; c < totalChunks; c++) {
          const start = c * size;
          const end = Math.min(start + size, pageCount);
          const indices: number[] = [];
          for (let idx = start; idx < end; idx++) indices.push(idx);

          const newDoc = await PDFDocument.create();
          const copiedPages = await newDoc.copyPages(srcDoc, indices);
          copiedPages.forEach((p) => newDoc.addPage(p));

          const pdfBytes = await newDoc.save();
          const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const fileName = `${safePrefix}-chunk-${c + 1}.pdf`;

          generatedFiles.push({
            name: fileName,
            blob,
            url,
            sizeBytes: blob.size,
            pageCount: indices.length,
            pageSummary: `Pages ${start + 1} to ${end}`,
          });

          zip.file(fileName, blob);
          setSplitProgress(Math.round(15 + (c / totalChunks) * 70));
        }
      }

      setSplitProgress(90);

      // Generate Zip for all files
      if (generatedFiles.length > 1) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        setZipBlobUrl(zipUrl);
        setZipSize(zipBlob.size);
      }

      setSplitResults(generatedFiles);
      setSplitProgress(100);
    } catch (err: any) {
      console.error('Error splitting PDF:', err);
      setErrorMessage(err.message || 'An error occurred while splitting the PDF.');
    } finally {
      setIsSplitting(false);
    }
  };

  // Download helpers
  const handleDownloadFile = (file: SplitResultFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadZip = () => {
    if (!zipBlobUrl) return;
    const link = document.createElement('a');
    link.href = zipBlobUrl;
    link.download = `${outputPrefix || 'split-documents'}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetDocument = () => {
    cleanupResults();
    setPdfFile(null);
    setPdfArrayBuffer(null);
    setPageCount(0);
    setPages([]);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      {/* 1. Global Navigation Header */}
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />

      {/* 2. Global Search Command Palette */}
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        resources={mockResources}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)] mb-4">
            <Link href="/" className="flex items-center gap-1 hover:text-[var(--color-primary)]">
              <HouseLine size={14} />
              <span>Home</span>
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-[var(--color-primary)]">
              Productivity Tools
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)]">Split PDF</span>
          </nav>

          {/* Tool Header & Badge */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-ink)] flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
                    <Scissors size={22} weight="bold" />
                  </span>
                  <span>Split PDF Document</span>
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[var(--color-ink-muted)] max-w-2xl leading-relaxed">
                  Extract selected pages, separate documents into individual files, or split by custom page ranges. Completely client-side and offline on your device.
                </p>
              </div>

              {/* Discrete Solid Grey Bubble Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white" />
                  100% Client-Side Private
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                  <ShieldCheck size={14} weight="bold" />
                  Zero-Server Upload
                </span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 p-4 text-xs font-medium text-neutral-900 dark:text-neutral-100 shadow-2xs">
              <WarningCircle size={20} weight="fill" className="text-neutral-900 dark:text-white shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: UPLOAD STATE (When no document is loaded)                         */}
          {/* ========================================================================= */}
          {!pdfFile && (
            <div className="rounded-[26px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-10 shadow-sm">
              <FileUpload
                onChange={(files) => {
                  if (files && files.length > 0) handlePdfUpload(files[0]);
                }}
                accept="application/pdf,.pdf"
                multiple={false}
                title="Drop PDF file here to split"
                description="Select a multi-page PDF document to extract or separate pages"
                acceptedTypesLabel={['.pdf document']}
              />

              {/* Feature Highlights Grid */}
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 pt-6 border-t border-[var(--color-rule-subtle)] text-xs text-[var(--color-ink-muted)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-[11px]">
                    01
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-ink)]">Visual Page Picker</h4>
                    <p className="mt-0.5 leading-relaxed">Click interactive page thumbnails to extract exactly the pages you need into a new PDF.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-[11px]">
                    02
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-ink)]">Every Page to ZIP</h4>
                    <p className="mt-0.5 leading-relaxed">Decompile the entire PDF into individual single-page documents and bundle them into a ZIP archive.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-[11px]">
                    03
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-ink)]">Custom Page Ranges</h4>
                    <p className="mt-0.5 leading-relaxed">Specify exact ranges like 1-4, 5-8, 12 to split chapters or lecture units into discrete files.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: ACTIVE SPLIT WORKSPACE (When PDF is loaded)                       */}
          {/* ========================================================================= */}
          {pdfFile && (
            <div className="space-y-8">
              {/* Top Document Summary Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
                    <FilePdf size={24} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-sm sm:text-base text-[var(--color-ink)]">
                      {pdfFile.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                      <span>{formatBytes(pdfFile.size)}</span>
                      <span>•</span>
                      <span className="font-semibold text-[var(--color-ink)]">{pageCount} Pages</span>
                      {isRenderingThumbs && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--color-ink-secondary)]">
                            Rendering previews ({thumbProgress.current}/{thumbProgress.total})...
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetDocument}
                    className="flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <Trash size={14} weight="bold" />
                    <span>Change File</span>
                  </button>
                </div>
              </div>

              {/* Split Mode Selector Tabs */}
              <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
                    <Sliders size={18} weight="bold" />
                    <span>Choose Splitting Method</span>
                  </h3>
                  <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                    Mode: {mode.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Mode 1: Extract Selected */}
                  <button
                    type="button"
                    onClick={() => setMode('selected')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      mode === 'selected'
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--color-ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <CheckSquareOffset size={16} weight="bold" />
                      <span>Extract Selected</span>
                    </div>
                    <p className={`mt-1 text-[11px] leading-tight ${mode === 'selected' ? 'opacity-85' : 'text-[var(--color-ink-muted)]'}`}>
                      Select pages visually from grid into one new PDF document.
                    </p>
                  </button>

                  {/* Mode 2: Split Every Page */}
                  <button
                    type="button"
                    onClick={() => setMode('every-page')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      mode === 'every-page'
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--color-ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <SquaresFour size={16} weight="bold" />
                      <span>Split Every Page</span>
                    </div>
                    <p className={`mt-1 text-[11px] leading-tight ${mode === 'every-page' ? 'opacity-85' : 'text-[var(--color-ink-muted)]'}`}>
                      Separate each single page into a standalone PDF file.
                    </p>
                  </button>

                  {/* Mode 3: Custom Ranges */}
                  <button
                    type="button"
                    onClick={() => setMode('ranges')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      mode === 'ranges'
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--color-ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <ArrowsSplit size={16} weight="bold" />
                      <span>Custom Ranges</span>
                    </div>
                    <p className={`mt-1 text-[11px] leading-tight ${mode === 'ranges' ? 'opacity-85' : 'text-[var(--color-ink-muted)]'}`}>
                      Split by specific page intervals like 1-3, 4-6, or chapters.
                    </p>
                  </button>

                  {/* Mode 4: Fixed Chunks */}
                  <button
                    type="button"
                    onClick={() => setMode('chunks')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      mode === 'chunks'
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--color-ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Files size={16} weight="bold" />
                      <span>Split in Chunks</span>
                    </div>
                    <p className={`mt-1 text-[11px] leading-tight ${mode === 'chunks' ? 'opacity-85' : 'text-[var(--color-ink-muted)]'}`}>
                      Partition the PDF evenly into files every N pages.
                    </p>
                  </button>
                </div>

                {/* Mode Specific Custom Controls */}
                {mode === 'ranges' && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-rule-subtle)] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label htmlFor="range-input" className="font-semibold text-xs text-[var(--color-ink)]">
                        Page Ranges Specification (Comma-separated):
                      </label>
                      <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                        Total document has {pageCount} pages
                      </span>
                    </div>
                    <input
                      id="range-input"
                      type="text"
                      value={customRangeInput}
                      onChange={(e) => setCustomRangeInput(e.target.value)}
                      placeholder="e.g. 1-3, 4-6, 7"
                      className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-4 py-2.5 font-mono text-xs text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--color-ink-muted)]">
                      <span>Example: <code className="font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">1-2, 3-4, 5</code> creates 3 separate files.</span>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--color-ink)]">
                        <input
                          type="checkbox"
                          checked={separateFilesForRanges}
                          onChange={(e) => setSeparateFilesForRanges(e.target.checked)}
                          className="rounded border-neutral-300 dark:border-neutral-700"
                        />
                        <span>Export each range into a separate PDF file</span>
                      </label>
                    </div>
                  </div>
                )}

                {mode === 'chunks' && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-rule-subtle)] flex flex-wrap items-center gap-4">
                    <label htmlFor="chunk-size" className="font-semibold text-xs text-[var(--color-ink)]">
                      Split every N pages:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="chunk-size"
                        type="number"
                        min={1}
                        max={pageCount}
                        value={chunkSize}
                        onChange={(e) => setChunkSize(Math.max(1, parseInt(e.target.value || '1', 10)))}
                        className="w-20 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-3 py-1.5 font-mono text-xs text-center text-[var(--color-ink)] focus:outline-none"
                      />
                      <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                        Will generate approximately {Math.ceil(pageCount / Math.max(1, chunkSize))} files
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Page Grid (When in Extract Selected or Preview Mode) */}
              <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-ink)]">
                      {mode === 'selected' ? 'Select Pages to Extract' : 'Document Page Overview'}
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                      {mode === 'selected'
                        ? 'Click any page to toggle selection for the extracted document.'
                        : 'Overview of all pages in this document.'}
                    </p>
                  </div>

                  {/* Batch Selection Controls */}
                  {mode === 'selected' && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={selectAll}
                        className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAll}
                        className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      >
                        None
                      </button>
                      <button
                        type="button"
                        onClick={invertSelection}
                        className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      >
                        Invert
                      </button>
                      <button
                        type="button"
                        onClick={selectOddPages}
                        className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      >
                        Odd
                      </button>
                      <button
                        type="button"
                        onClick={selectEvenPages}
                        className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      >
                        Even
                      </button>

                      <span className="ml-2 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs">
                        {selectedPagesCount} / {pageCount} Selected
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnails Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 max-h-[460px] overflow-y-auto p-1 rounded-xl">
                  {pages.map((p, idx) => (
                    <div
                      key={p.pageNumber}
                      onClick={() => {
                        if (mode === 'selected') togglePageSelection(p.pageNumber);
                        else setPreviewPageIndex(idx);
                      }}
                      className={`group relative flex flex-col rounded-xl border transition-all cursor-pointer overflow-hidden ${
                        mode === 'selected' && p.selected
                          ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/20 dark:ring-white/20 bg-neutral-100/70 dark:bg-neutral-800/80'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 opacity-90'
                      }`}
                    >
                      {/* Top Page Header Tag */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-inherit font-mono text-[11px]">
                        <span className="font-bold text-[var(--color-ink)]">
                          P.{p.pageNumber}
                        </span>
                        {mode === 'selected' && (
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
                              p.selected
                                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900'
                                : 'border-neutral-400 dark:border-neutral-600 bg-transparent'
                            }`}
                          >
                            {p.selected && <Check size={11} weight="bold" />}
                          </span>
                        )}
                      </div>

                      {/* Thumbnail Preview Image or Skeleton */}
                      <div className="relative aspect-3/4 w-full flex items-center justify-center bg-white dark:bg-neutral-950 p-2">
                        {p.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbnailUrl}
                            alt={`Page ${p.pageNumber}`}
                            className="max-h-full max-w-full object-contain shadow-2xs"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 space-y-1">
                            <FilePdf size={28} weight="duotone" />
                            <span className="font-mono text-[10px]">Loading...</span>
                          </div>
                        )}

                        {/* Quick Magnify Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPageIndex(idx);
                          }}
                          title="Inspect page"
                          className="absolute bottom-2 right-2 rounded-md bg-neutral-900/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-900 dark:bg-white/80 dark:text-neutral-900 dark:hover:bg-white"
                        >
                          <MagnifyingGlassPlus size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs">
                {/* Custom Output File Name Prefix */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label htmlFor="output-prefix" className="font-semibold text-xs text-[var(--color-ink)] shrink-0">
                    Filename Prefix:
                  </label>
                  <input
                    id="output-prefix"
                    type="text"
                    value={outputPrefix}
                    onChange={(e) => setOutputPrefix(e.target.value)}
                    placeholder="e.g. syllabus-split"
                    className="w-full sm:w-56 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink)] focus:outline-none"
                  />
                </div>

                {/* Main Split Action Button */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleSplitPdf}
                    disabled={isSplitting || (mode === 'selected' && selectedPagesCount === 0)}
                    className="group flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-md"
                  >
                    <Scissors size={16} weight="bold" className="transition-transform group-hover:rotate-12" />
                    <span>
                      {isSplitting
                        ? `Processing (${splitProgress}%)...`
                        : mode === 'selected'
                        ? `Extract ${selectedPagesCount} Pages`
                        : mode === 'every-page'
                        ? `Split All ${pageCount} Pages`
                        : mode === 'ranges'
                        ? 'Split by Ranges'
                        : `Split Every ${chunkSize} Pages`}
                    </span>
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* STEP 3: RESULTS & DOWNLOADS SECTION                                       */}
              {/* ========================================================================= */}
              {splitResults.length > 0 && (
                <div className="rounded-[24px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--color-rule-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
                        <CheckCircle size={22} weight="fill" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-[var(--color-ink)]">
                          Split Completed Successfully!
                        </h3>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          Generated {splitResults.length} {splitResults.length === 1 ? 'file' : 'files'} directly on your local device.
                        </p>
                      </div>
                    </div>

                    {/* Download All as ZIP Button (if multiple files) */}
                    {splitResults.length > 1 && zipBlobUrl && (
                      <button
                        type="button"
                        onClick={handleDownloadZip}
                        className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:scale-95 shadow-md transition-all cursor-pointer"
                      >
                        <DownloadSimple size={16} weight="bold" />
                        <span>Download All as ZIP ({formatBytes(zipSize)})</span>
                      </button>
                    )}
                  </div>

                  {/* Generated Split Files Table / Cards */}
                  <div className="space-y-2.5">
                    <h4 className="font-mono text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">
                      Generated Documents ({splitResults.length})
                    </h4>

                    <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto p-1">
                      {splitResults.map((resFile, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-3.5 shadow-2xs hover:border-[var(--color-rule-strong)] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                              <FilePdf size={18} weight="fill" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-xs text-[var(--color-ink)]">
                                {resFile.name}
                              </p>
                              <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--color-ink-muted)]">
                                <span>{resFile.pageSummary}</span>
                                <span>•</span>
                                <span>{formatBytes(resFile.sizeBytes)}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadFile(resFile)}
                            className="flex items-center gap-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <DownloadSimple size={14} weight="bold" />
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* FULL-PAGE INSPECTION MODAL                                                */}
      {/* ========================================================================= */}
      {previewPageIndex !== null && pages[previewPageIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] max-w-2xl w-full rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--color-ink)]">
                <FilePdf size={18} weight="fill" />
                <span>Page {pages[previewPageIndex].pageNumber} of {pageCount}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPageIndex(null)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center py-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl my-3">
              {pages[previewPageIndex].thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pages[previewPageIndex].thumbnailUrl!}
                  alt={`Full preview Page ${pages[previewPageIndex].pageNumber}`}
                  className="max-h-[65vh] object-contain shadow-md rounded border border-neutral-200 dark:border-neutral-800"
                />
              ) : (
                <p className="font-mono text-xs text-neutral-400">Rendering preview...</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={previewPageIndex <= 0}
                onClick={() => setPreviewPageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                className="rounded-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold disabled:opacity-40"
              >
                Previous Page
              </button>

              {mode === 'selected' && (
                <button
                  type="button"
                  onClick={() => {
                    togglePageSelection(pages[previewPageIndex].pageNumber);
                  }}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${
                    pages[previewPageIndex].selected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'border border-neutral-400 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <Check size={14} weight="bold" />
                  <span>{pages[previewPageIndex].selected ? 'Selected for Extraction' : 'Click to Select'}</span>
                </button>
              )}

              <button
                type="button"
                disabled={previewPageIndex >= pages.length - 1}
                onClick={() => setPreviewPageIndex((prev) => (prev !== null && prev < pages.length - 1 ? prev + 1 : prev))}
                className="rounded-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold disabled:opacity-40"
              >
                Next Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Global Footer */}
      <Footer />
    </div>
  );
}
