'use client';

import React, { useState, useRef } from 'react';
import { Ebook } from '@/types/ebook';
import { parseEpubFile, parseTxtFile } from '@/lib/epubParser';
import { saveBookOffline } from '@/lib/ebookStorage';
import { X, UploadSimple, BookOpen, FileText } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

interface ImportBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookImported: (book: Ebook) => void;
}

export default function ImportBookModal({
  isOpen,
  onClose,
  onBookImported,
}: ImportBookModalProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setError(null);
    setIsParsing(true);
    try {
      let book: Ebook;
      if (file.name.toLowerCase().endsWith('.epub')) {
        book = await parseEpubFile(file);
      } else if (file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md')) {
        book = await parseTxtFile(file);
      } else {
        throw new Error('Unsupported format. Please upload an .epub or .txt ebook.');
      }

      await saveBookOffline(book);
      onBookImported(book);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse ebook file.';
      setError(msg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-[#111114]"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-neutral-700 dark:text-neutral-300" />
                <h3 className="font-serif text-base font-bold text-neutral-900 dark:text-white">
                  Import Local Book
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Upload personal .epub or .txt files. Books are parsed in-browser and stored 100% offline in IndexedDB.
            </p>

            {/* Drag & Drop Target */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                dragActive
                  ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900'
                  : 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".epub,.txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProcessFile(file);
                }}
                className="hidden"
              />

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 mb-3">
                <UploadSimple size={24} weight="bold" />
              </div>

              {isParsing ? (
                <div className="space-y-1">
                  <div className="font-bold text-xs text-neutral-900 dark:text-white animate-pulse">
                    Extracting chapters &amp; formatting...
                  </div>
                  <div className="font-mono text-[10px] text-neutral-400">
                    Parsing spine and typography
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Click to browse or drag &amp; drop
                  </div>
                  <div className="font-mono text-[11px] text-neutral-400">
                    Supports .epub and .txt ebooks
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <FileText size={13} />
                <span>Zero Server Uploads</span>
              </span>
              <span>100% Private &amp; Offline</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
