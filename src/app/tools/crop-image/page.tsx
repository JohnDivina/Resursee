'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import { mockResources } from '@/lib/mockData';
import {
  Crop,
  UploadSimple,
  DownloadSimple,
  ShieldCheck,
  ArrowLeft,
  Trash,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CheckCircle,
  Sliders,
} from '@phosphor-icons/react';

type AspectPreset = '1:1' | '2:3' | '4:3' | '16:9' | 'free';

export default function CropImagePage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspect, setAspect] = useState<AspectPreset>('1:1');
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropResultUrl, setCropResultUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);

    const img = new Image();
    img.onload = () => {
      imageObjRef.current = img;
      renderCropPreview(img, 1, 0, 0, aspect);
    };
    img.src = url;
  };

  const getAspectDimensions = (preset: AspectPreset, containerWidth = 400) => {
    switch (preset) {
      case '1:1':
        return { w: 320, h: 320 };
      case '2:3':
        return { w: 240, h: 360 };
      case '4:3':
        return { w: 320, h: 240 };
      case '16:9':
        return { w: 360, h: 202 };
      case 'free':
      default:
        return { w: 340, h: 280 };
    }
  };

  const renderCropPreview = (
    img: HTMLImageElement,
    currentZoom: number,
    offX: number,
    offY: number,
    currentAspect: AspectPreset
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w: cropW, h: cropH } = getAspectDimensions(currentAspect);
    canvas.width = cropW;
    canvas.height = cropH;

    ctx.clearRect(0, 0, cropW, cropH);

    // Calculate scaled dimensions
    const scale = (cropW / img.naturalWidth) * currentZoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    const drawX = (cropW - drawW) / 2 + offX;
    const drawY = (cropH - drawH) / 2 + offY;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (imageObjRef.current) {
      renderCropPreview(imageObjRef.current, newZoom, offsetX, offsetY, aspect);
    }
  };

  const handleAspectChange = (newAspect: AspectPreset) => {
    setAspect(newAspect);
    setOffsetX(0);
    setOffsetY(0);
    if (imageObjRef.current) {
      renderCropPreview(imageObjRef.current, zoom, 0, 0, newAspect);
    }
  };

  // Canvas Mouse Dragging for Pan / Repositioning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageObjRef.current) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffsetX(newX);
    setOffsetY(newY);
    renderCropPreview(imageObjRef.current, zoom, newX, newY, aspect);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageFile) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const baseName = imageFile.name.replace(/\.[^/.]+$/, '');
      link.download = `${baseName}-cropped.png`;
      link.click();
    }, 'image/png');
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    imageObjRef.current = null;
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
            <span className="font-semibold text-[var(--color-ink)]">Crop Image</span>
          </nav>

          {/* Heading */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule)] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  <Crop size={20} weight="bold" />
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
                Crop Image
              </h1>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Precision frame and crop ID photos, application attachments, and signature clearances.
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
          {!imageFile ? (
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
                  Choose an image to crop
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[var(--color-ink-muted)]">
                  Interactive frame controls for 1:1 ID photos, 2:3 passport photos, and 16:9 thesis slides.
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
              {/* Left 2 Cols: Interactive Canvas Frame */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                    <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                      Interactive Crop Canvas (Drag to pan)
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

                  {/* Interactive Canvas */}
                  <div
                    className="relative mt-6 flex h-96 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-surface)] select-none cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <canvas
                      ref={canvasRef}
                      className="rounded-lg shadow-lg ring-2 ring-[var(--color-primary)]"
                    />

                    {/* Drag helper hint */}
                    <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] text-white backdrop-blur-xs">
                      Drag image to reposition · Use zoom slider below
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Aspect Ratio & Zoom Controls */}
              <div className="space-y-6 lg:col-span-1">
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-xs space-y-6">
                  <div className="flex items-center gap-2 border-b border-[var(--color-rule-subtle)] pb-3">
                    <Sliders size={18} className="text-[var(--color-primary)]" />
                    <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                      Crop Frame Settings
                    </h3>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--color-ink)]">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '1:1 Square', preset: '1:1' as AspectPreset },
                        { label: '2:3 ID', preset: '2:3' as AspectPreset },
                        { label: '4:3 Standard', preset: '4:3' as AspectPreset },
                        { label: '16:9 Banner', preset: '16:9' as AspectPreset },
                        { label: 'Freeform', preset: 'free' as AspectPreset },
                      ].map((item) => (
                        <button
                          key={item.preset}
                          type="button"
                          onClick={() => handleAspectChange(item.preset)}
                          className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                            aspect === item.preset
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                              : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-[var(--color-ink)]">Scale & Zoom</label>
                      <span className="font-mono font-bold text-[var(--color-primary)]">
                        {zoom.toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MagnifyingGlassMinus size={16} className="text-[var(--color-ink-muted)]" />
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-full accent-[var(--color-primary)] cursor-pointer"
                      />
                      <MagnifyingGlassPlus size={16} className="text-[var(--color-ink-muted)]" />
                    </div>
                  </div>

                  {/* Download Action */}
                  <button
                    type="button"
                    onClick={handleExport}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] active:scale-95"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>Download Cropped Image</span>
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
