'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import ResourceCard from '@/components/resources/ResourceCard';
import {
  MagnifyingGlass,
  Funnel,
  SquaresFour,
  ListDashes,
  Buildings,
  Tag,
  ArrowsDownUp,
  X,
  CheckCircle,
  DownloadSimple,
} from '@phosphor-icons/react';
import { mockResources, mockCategories, mockDepartments } from '@/lib/mockData';
import { Resource } from '@/types/database';

function ResourcesContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialDept = searchParams.get('dept') || 'all';
  const initialType = searchParams.get('type') || 'all';

  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDepartment, setSelectedDepartment] = useState(initialDept);
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [sortBy, setSortBy] = useState<'downloads' | 'recent' | 'title'>('downloads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter and sort logic
  const filteredResources = useMemo(() => {
    return mockResources
      .filter((res) => {
        // Query match
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const matchesTitle = res.title.toLowerCase().includes(q);
          const matchesDesc = res.description?.toLowerCase().includes(q);
          const matchesDept =
            res.department?.name.toLowerCase().includes(q) ||
            res.department?.abbreviation.toLowerCase().includes(q);
          const matchesCategory = res.category?.name.toLowerCase().includes(q);
          const matchesTag = res.tags?.some((t) => t.name.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDesc && !matchesDept && !matchesCategory && !matchesTag) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (res.category?.slug !== selectedCategory && res.category_id !== selectedCategory) {
            return false;
          }
        }

        // Department filter
        if (selectedDepartment !== 'all') {
          if (res.department?.slug !== selectedDepartment && res.department_id !== selectedDepartment) {
            return false;
          }
        }

        // Format filter
        if (selectedFormat !== 'all') {
          if (res.file_format.toLowerCase() !== selectedFormat.toLowerCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'downloads') {
          return b.download_count - a.download_count;
        } else if (sortBy === 'recent') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else {
          return a.title.localeCompare(b.title);
        }
      });
  }, [searchQuery, selectedCategory, selectedDepartment, selectedFormat, sortBy]);

  const handleDownload = (resource: Resource) => {
    setToastMessage(`Downloading "${resource.title}" (${resource.file_format})`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedFormat('all');
    setSortBy('downloads');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedDepartment !== 'all' ||
    selectedFormat !== 'all';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <Header onOpenSearch={() => setSearchPaletteOpen(true)} />
      <CommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
        resources={mockResources}
      />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)]">Resource Directory</span>
          </nav>

          {/* Page Heading & Search Filter Bar */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 md:flex-row md:items-end">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Document Repository
              </span>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                University Resources Directory
              </h1>
              <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Showing {filteredResources.length} of {mockResources.length} verified university documents and forms.
              </p>
            </div>

            {/* Quick Search Bar */}
            <div className="w-full md:w-80">
              <div className="relative flex items-center">
                <MagnifyingGlass size={18} className="absolute left-3.5 text-[var(--color-primary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter resources..."
                  className="w-full rounded-[16px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] py-2.5 pr-8 pl-10 text-xs font-semibold text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] shadow-[0_2px_8px_rgba(0,0,0,0.03)] outline-hidden focus:border-[var(--color-primary)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Layout: Sidebar Filters + Main Grid */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Sidebar Filter Panel (Apple Squircle Solid White Card) */}
            <aside className="space-y-6 lg:col-span-1">
              <div className="rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3.5">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-ink)]">
                    <Funnel size={16} className="text-[var(--color-primary)]" />
                    <span>Filter & Refine</span>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* 1. Category Filter */}
                <div className="mt-5">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Category
                  </label>
                  <div className="mt-2.5 space-y-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`flex w-full items-center justify-between rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <span>All Categories</span>
                      <span className="font-mono text-[10.5px]">{mockResources.length}</span>
                    </button>
                    {mockCategories.map((cat) => {
                      const count = mockResources.filter((r) => r.category_id === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`flex w-full items-center justify-between rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selectedCategory === cat.slug
                              ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                              : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          <span className="font-mono text-[10.5px]">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Department Filter */}
                <div className="mt-6 border-t border-[var(--color-rule-subtle)] pt-4">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Department / Office
                  </label>
                  <div className="mt-2.5 space-y-1">
                    <button
                      onClick={() => setSelectedDepartment('all')}
                      className={`flex w-full items-center justify-between rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedDepartment === 'all'
                          ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <span>All Offices</span>
                    </button>
                    {mockDepartments.map((dept) => {
                      const count = mockResources.filter((r) => r.department_id === dept.id).length;
                      return (
                        <button
                          key={dept.id}
                          onClick={() => setSelectedDepartment(dept.slug)}
                          className={`flex w-full items-center justify-between rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selectedDepartment === dept.slug
                              ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                              : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]'
                          }`}
                        >
                          <span className="truncate">
                            {dept.abbreviation} - {dept.name.split(' ')[0]}
                          </span>
                          <span className="font-mono text-[10.5px]">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Format Filter */}
                <div className="mt-6 border-t border-[var(--color-rule-subtle)] pt-4">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    File Format
                  </label>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {['all', 'pdf', 'docx', 'xlsx', 'pptx'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setSelectedFormat(fmt)}
                        className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase transition-all ${
                          selectedFormat === fmt
                            ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                            : 'border border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Sort Controls & View Mode Bar (Apple Squircle Style) */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-5 py-3 text-xs shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                {/* Sort selector */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">Sort:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSortBy('downloads')}
                      className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                        sortBy === 'downloads'
                          ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                          : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      Most Downloaded
                    </button>
                    <button
                      onClick={() => setSortBy('recent')}
                      className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                        sortBy === 'recent'
                          ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                          : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      Recently Updated
                    </button>
                    <button
                      onClick={() => setSortBy('title')}
                      className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                        sortBy === 'title'
                          ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                          : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      Title (A-Z)
                    </button>
                  </div>
                </div>

                {/* Grid / List switcher */}
                <div className="flex items-center gap-1 border-l border-[var(--color-rule-subtle)] pl-3">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-full p-1.5 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] ${
                      viewMode === 'grid' ? 'bg-[var(--color-paper-muted)] text-[var(--color-primary)]' : ''
                    }`}
                    title="Grid view"
                  >
                    <SquaresFour size={16} weight={viewMode === 'grid' ? 'fill' : 'regular'} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-full p-1.5 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] ${
                      viewMode === 'list' ? 'bg-[var(--color-paper-muted)] text-[var(--color-primary)]' : ''
                    }`}
                    title="List view"
                  >
                    <ListDashes size={16} weight={viewMode === 'list' ? 'bold' : 'regular'} />
                  </button>
                </div>
              </div>

              {/* Resource Grid / List Output */}
              {filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-12 text-center shadow-xs">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)]">
                    <MagnifyingGlass size={24} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[var(--color-ink)]">
                    No resources matched your criteria
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-[var(--color-ink-muted)]">
                    Try clearing some filters or searching with a different term.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-hover)]"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} onDownload={handleDownload} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-white font-bold text-base shadow-xs">
                          {resource.file_format === 'PDF'
                            ? 'P'
                            : resource.file_format === 'DOCX'
                            ? 'W'
                            : resource.file_format === 'XLSX'
                            ? 'X'
                            : resource.title.charAt(0)}
                        </div>

                        <div>
                          <Link
                            href={`/resources/${resource.slug}`}
                            className="text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors tracking-tight"
                          >
                            {resource.title}
                          </Link>
                          <p className="mt-1 text-xs text-[var(--color-ink-muted)] line-clamp-1">
                            {resource.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--color-ink-muted)]">
                            <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5 font-semibold text-[var(--color-ink-secondary)]">
                              {resource.department?.name}
                            </span>
                            <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5">
                              {resource.category?.name}
                            </span>
                            <span className="font-mono text-[10.5px]">v{resource.current_version}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <span className="font-mono text-[11px] text-[var(--color-ink-muted)] pr-2">
                          {resource.download_count} dl
                        </span>
                        <Link
                          href={`/resources/${resource.slug}`}
                          className="rounded-full border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDownload(resource)}
                          className="rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] shadow-2xs"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-[var(--color-rule-strong)] bg-[#0f172a] px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
          <div className="font-mono text-xs text-[var(--color-ink-muted)] animate-pulse">
            Loading university resource directory...
          </div>
        </div>
      }
    >
      <ResourcesContent />
    </Suspense>
  );
}
