'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadSimple,
  FileArrowUp,
  X,
  FileText,
  FilePdf,
  FileDoc,
  FileXls,
  CheckCircle,
  HardDrive,
} from '@phosphor-icons/react';

interface FileUploadProps {
  onChange?: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({
  onChange,
  accept,
  maxSizeMB = 25,
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const validFiles = Array.from(newFiles);
    setFiles(validFiles);
    if (onChange) {
      onChange(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const removeFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (onChange) {
      onChange(updated);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={24} weight="bold" className="text-rose-500" />;
    if (ext === 'docx' || ext === 'doc') return <FileDoc size={24} weight="bold" className="text-blue-500" />;
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileXls size={24} weight="bold" className="text-emerald-500" />;
    return <FileText size={24} weight="bold" className="text-[var(--color-primary)]" />;
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`group relative flex min-h-64 sm:min-h-72 w-full flex-col items-center justify-center rounded-[28px] border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden p-6 sm:p-8 ${
        isDragOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/40 scale-[1.01] shadow-lg'
          : 'border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-surface)] shadow-2xs'
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
      />

      {/* Ambient Grid Background Dots */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none bg-[radial-gradient(var(--color-ink)_1px,transparent_1px)] [background-size:16px_16px]" />

      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center text-center z-10"
          >
            {/* Animated Floating Icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] shadow-xs group-hover:scale-110 transition-transform duration-300"
            >
              <UploadSimple size={32} weight="bold" />
            </motion.div>

            <h3 className="mt-4 text-base font-extrabold text-[var(--color-ink)]">
              Upload university document or form
            </h3>
            <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] max-w-sm leading-relaxed">
              Drag and drop your file here, or{' '}
              <span className="font-bold text-[var(--color-primary)] underline">browse files</span> from your computer
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {['PDF (.pdf)', 'Word (.docx, .doc)', 'Excel (.xlsx, .xls)', 'PowerPoint (.pptx)', 'CSV', 'ZIP'].map(
                (fmt) => (
                  <span
                    key={fmt}
                    className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-1 font-mono text-[10px] font-bold text-[var(--color-ink-secondary)]"
                  >
                    {fmt}
                  </span>
                )
              )}
            </div>

            <span className="mt-3 font-mono text-[10.5px] text-[var(--color-ink-muted)]">
              Maximum file size: {maxSizeMB}MB
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="files-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md z-10 flex flex-col items-center"
          >
            <div className="w-full space-y-3">
              {files.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--color-paper-muted)] shadow-2xs">
                      {getFileIcon(file.name)}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[var(--color-ink)] truncate max-w-[220px] sm:max-w-[260px]">
                        {file.name}
                      </h4>
                      <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-[var(--color-ink-muted)]">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle size={12} weight="fill" />
                          Ready to upload
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => removeFile(idx, e)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 transition-colors shrink-0 cursor-pointer"
                    title="Remove file"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </motion.div>
              ))}
            </div>

            <p className="mt-3.5 text-xs text-[var(--color-primary)] font-bold hover:underline">
              Click or drag another file to replace
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
