'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlass,
  FileText,
  ArrowRight,
  DownloadSimple,
  Buildings,
  Tag,
  X,
  Command,
} from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { mockResources, mockCategories, mockDepartments } from '@/lib/mockData';
import { getLiveResources } from '@/lib/resourceStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  resources?: Resource[];
}

export default function CommandPalette({
  isOpen,
  onClose,
  resources: initialResources,
}: CommandPaletteProps) {
  const [liveResources, setLiveResources] = useState<Resource[]>(initialResources || mockResources);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLiveResources(getLiveResources());
    const handleUpdate = () => setLiveResources(getLiveResources());
    window.addEventListener('resursee_catalog_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('resursee_catalog_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const resources = liveResources;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard shortcut global toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items matching query
  const filteredResources = resources.filter((res) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      res.title.toLowerCase().includes(q) ||
      (res.description && res.description.toLowerCase().includes(q)) ||
      res.file_format.toLowerCase().includes(q) ||
      (res.department && res.department.name.toLowerCase().includes(q)) ||
      (res.category && res.category.name.toLowerCase().includes(q)) ||
      res.tags?.some((t) => t.name.toLowerCase().includes(q))
    );
  });

  const handleSelect = (resource: Resource) => {
    onClose();
    router.push(`/resources/${resource.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResources.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResources.length - 1));
    } else if (e.key === 'Enter' && filteredResources[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredResources[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 sm:pt-24 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Palette Container */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] shadow-2xl transition-all">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-[var(--color-rule)] px-4 py-3.5">
          <MagnifyingGlass size={20} className="text-[var(--color-primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a form title, department (e.g. Registrar), or keyword..."
            className="ml-3 flex-1 bg-transparent text-sm font-medium text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="mr-2 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredResources.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)]">
                <MagnifyingGlass size={20} />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">
                No documents found for &quot;{query}&quot;
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                Try searching for general keywords like &quot;transcript&quot;, &quot;leave&quot;, &quot;template&quot;, or browse by department.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Matching Resources ({filteredResources.length})
              </div>
              {filteredResources.map((resource, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={resource.id}
                    onClick={() => handleSelect(resource)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group flex cursor-pointer items-center justify-between rounded-lg p-3 text-xs transition-all ${
                      isSelected
                        ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                        : 'text-[var(--color-ink)] hover:bg-[var(--color-paper-surface)]'
                    }`}
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      {/* Format Badge */}
                      <span
                        className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          resource.file_format === 'PDF'
                            ? 'badge-pdf'
                            : resource.file_format === 'DOCX'
                            ? 'badge-docx'
                            : resource.file_format === 'XLSX'
                            ? 'badge-xlsx'
                            : 'badge-pptx'
                        }`}
                      >
                        {resource.file_format}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">
                            {resource.title}
                          </p>
                          {resource.is_featured && (
                            <span className="shrink-0 rounded-full bg-[var(--color-accent-amber-subtle)] px-1.5 py-0.2 font-mono text-[9px] font-semibold text-amber-700">
                              ★ Featured
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--color-ink-muted)]">
                          <span>{resource.category?.name || 'Document'}</span>
                          <span>·</span>
                          <span>{resource.department?.abbreviation || 'University'}</span>
                          <span>·</span>
                          <span className="font-mono">{resource.current_version}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-3">
                      <span className="hidden font-mono text-[10px] text-[var(--color-ink-muted)] sm:inline">
                        {resource.download_count} dl
                      </span>
                      <ArrowRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-[var(--color-rule)] bg-[var(--color-paper-muted)]/50 px-4 py-2 text-[11px] text-[var(--color-ink-muted)]">
          <div className="flex items-center gap-3 font-mono">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-sans">Resursee Live Index</span>
        </div>
      </div>
    </div>
  );
}
