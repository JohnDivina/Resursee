'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import ResourceCard from '@/components/resources/ResourceCard';
import {
  MagnifyingGlass,
  Funnel,
  SquaresFour,
  ListBullets,
  ArrowsDownUp,
  X,
  Buildings,
  CheckCircle,
  CaretUp,
} from '@phosphor-icons/react';
import { mockResources } from '@/lib/mockData';
import { Resource, Category, Department } from '@/types/database';
import { useRealtimeDownloadCount } from '@/lib/downloadStore';
import { getLiveResources } from '@/lib/resourceStore';
import { getLiveCategories } from '@/lib/categoryStore';
import { getLiveDepartments } from '@/lib/departmentStore';

function ListRowItem({ resource }: { resource: Resource }) {
  const realtimeDownloads = useRealtimeDownloadCount(resource.id, resource.download_count);
  const officeName = resource.department?.name || resource.source_name || 'Academic Office';

  return (
    <Link
      href={`/resources/${resource.slug}`}
      data-thock="card"
      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[22px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-white font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
          {resource.file_format === 'PDF'
            ? 'P'
            : resource.file_format === 'DOCX'
            ? 'W'
            : resource.file_format === 'XLSX'
            ? 'X'
            : resource.title.charAt(0)}
        </div>

        <div>
          <h3 className="text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
            {resource.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--color-ink-muted)]">
            <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5 font-semibold text-[var(--color-ink-secondary)]">
              {resource.category?.name}
            </span>
            <span className="font-mono text-[10.5px]">v{resource.current_version}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--color-ink-muted)] group-hover:text-[var(--color-primary)] transition-colors">
          <Buildings size={14} className="shrink-0 text-[var(--color-primary)]" />
          <span>{officeName}</span>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-[var(--color-paper-muted)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--color-ink)]">
          <CaretUp size={13} weight="fill" className="text-emerald-600" />
          <span>{realtimeDownloads}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ResourcesDirectoryPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [sortBy, setSortBy] = useState<'downloads' | 'recent' | 'alphabetical'>('downloads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveResources, setLiveResources] = useState<Resource[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);

  const refreshLiveStores = () => {
    setLiveResources(getLiveResources());
    setCategoriesList(getLiveCategories());
    setDepartmentsList(getLiveDepartments());
  };

  useEffect(() => {
    refreshLiveStores();

    const handleCatalogUpdate = () => setLiveResources(getLiveResources());
    const handleCategoryUpdate = () => setCategoriesList(getLiveCategories());
    const handleDeptUpdate = () => setDepartmentsList(getLiveDepartments());

    window.addEventListener('resursee_catalog_updated', handleCatalogUpdate);
    window.addEventListener('resursee_categories_updated', handleCategoryUpdate);
    window.addEventListener('resursee_departments_updated', handleDeptUpdate);
    window.addEventListener('storage', refreshLiveStores);

    return () => {
      window.removeEventListener('resursee_catalog_updated', handleCatalogUpdate);
      window.removeEventListener('resursee_categories_updated', handleCategoryUpdate);
      window.removeEventListener('resursee_departments_updated', handleDeptUpdate);
      window.removeEventListener('storage', refreshLiveStores);
    };
  }, []);

  // Filtered and Sorted Resources
  const filteredResources = useMemo(() => {
    return liveResources
      .filter((res) => {
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = res.title.toLowerCase().includes(q);
          const matchDesc = res.description?.toLowerCase().includes(q);
          const matchDept = res.department?.name.toLowerCase().includes(q);
          const matchCat = res.category?.name.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchDept && !matchCat) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && res.category_id !== selectedCategory) {
          return false;
        }

        // Department filter
        if (selectedDepartment !== 'all' && res.department_id !== selectedDepartment) {
          return false;
        }

        // Format filter
        if (selectedFormat !== 'all' && res.file_format !== selectedFormat) {
          return false;
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
  }, [liveResources, searchQuery, selectedCategory, selectedDepartment, selectedFormat, sortBy]);

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
            <span className="font-semibold text-[var(--color-ink)]">Resources Directory</span>
          </nav>

          {/* Page Heading & Search Filter Bar */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule-subtle)] pb-6 md:flex-row md:items-end">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Document Repository
              </span>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                Resources Directory
              </h1>
              <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Showing {filteredResources.length} of {liveResources.length} documents and forms.
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

          {/* Main Grid with Filter Sidebar + Results Area */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Filter Sidebar */}
            <aside className="space-y-6 lg:col-span-1">
              <div className="rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <Funnel size={16} className="text-[var(--color-primary)]" />
                    <h2 className="text-sm font-bold text-[var(--color-ink)]">
                      Filters
                    </h2>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[11px] font-bold text-[var(--color-primary)] hover:underline"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="mt-5">
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    Category
                  </label>
                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-xs font-medium transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-[var(--color-primary-subtle)] font-bold text-[var(--color-primary)]'
                          : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]'
                      }`}
                    >
                      <span>All Categories</span>
                      <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                        {liveResources.length}
                      </span>
                    </button>

                    {categoriesList.map((cat) => {
                      const count = liveResources.filter((r) => r.category_id === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-xs font-medium transition-colors ${
                            selectedCategory === cat.id
                              ? 'bg-[var(--color-primary-subtle)] font-bold text-[var(--color-primary)]'
                              : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Departments */}
                <div className="mt-6 border-t border-[var(--color-rule-subtle)] pt-5">
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    Department / Office
                  </label>
                  <div className="mt-2">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full rounded-[14px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                    >
                      <option value="all">All Offices ({departmentsList.length})</option>
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.abbreviation} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Format Filter */}
                <div className="mt-6 border-t border-[var(--color-rule-subtle)] pt-5">
                  <label className="block text-xs font-bold text-[var(--color-ink)]">
                    File Format
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {['all', 'PDF', 'DOCX', 'XLSX'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setSelectedFormat(fmt)}
                        className={`rounded-[12px] border p-2 text-center text-xs font-mono font-bold transition-all ${
                          selectedFormat === fmt
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                            : 'border-[var(--color-rule)] bg-[var(--color-paper-surface)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-paper-muted)]'
                        }`}
                      >
                        {fmt === 'all' ? 'All' : fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Results Grid / List Area */}
            <div className="space-y-6 lg:col-span-3">
              {/* Controls Bar: Sort By + View Toggle (Grid / List) */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                {/* Sort dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <ArrowsDownUp size={15} className="text-[var(--color-ink-muted)]" />
                  <span className="font-semibold text-[var(--color-ink-secondary)]">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-[10px] border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)] outline-hidden focus:border-[var(--color-primary)]"
                  >
                    <option value="downloads">Most Popular</option>
                    <option value="recent">Recently Added</option>
                    <option value="alphabetical">Alphabetical (A-Z)</option>
                  </select>
                </div>

                {/* View Mode Toggle: Grid vs List */}
                <div className="flex items-center gap-1 rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-surface)] p-1 text-xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-full p-1.5 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                    }`}
                    title="Grid View"
                  >
                    <SquaresFour size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-full p-1.5 transition-colors ${
                      viewMode === 'list'
                        ? 'bg-[var(--color-primary)] text-white shadow-2xs'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                    }`}
                    title="List View"
                  >
                    <ListBullets size={16} />
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
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredResources.map((resource) => (
                    <ListRowItem key={resource.id} resource={resource} />
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
