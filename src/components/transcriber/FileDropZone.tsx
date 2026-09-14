'use client';

import React, { useState, useRef } from 'react';
import { UploadSimple, FileAudio, WarningCircle } from '@phosphor-icons/react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
}

const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aiff', '.mp4', '.mov'];

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFileSelect,
  isProcessing = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSelect = (file: File) => {
    setError(null);
    const fileName = file.name.toLowerCase();
    const isSupported = SUPPORTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (!isSupported) {
      setError(
        `Unsupported format. Please upload MP3, WAV, M4A, AIFF, MP4, or MOV.`
      );
      return;
    }

    // Limit to ~200MB in browser
    if (file.size > 200 * 1024 * 1024) {
      setError('File size exceeds 200MB limit.');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-neutral-900 bg-neutral-100/80 dark:border-white dark:bg-neutral-850'
            : 'border-neutral-300 bg-neutral-50/60 hover:border-neutral-400 hover:bg-neutral-100/50 dark:border-neutral-800 dark:bg-neutral-900/30 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/60'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.aiff,.mp4,.mov,audio/*,video/mp4,video/quicktime"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-[#181818] dark:text-neutral-200">
          <UploadSimple size={24} weight="bold" />
        </div>

        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
          Drop your audio or video file here
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Or click to browse from your computer
        </p>

        {/* Supported Format Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {SUPPORTED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {ext.toUpperCase().replace('.', '')}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-neutral-100 p-3 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          <WarningCircle size={16} weight="bold" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
