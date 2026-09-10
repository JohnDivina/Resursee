'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PublicApiCard from '@/components/resources/PublicApiCard';
import PublicApiRow from '@/components/resources/PublicApiRow';
import { PublicApi, ViewMode, AuthFilterType, CorsFilterType, SortOption } from '@/types/publicApi';
import publicApisRaw from '@/data/public-apis.json';
import {
  MagnifyingGlass,
  SquaresFour,
  ListBullets,
  Funnel,
  ArrowSquareOut,
  GithubLogo,
  Star,
  ArrowsDownUp,
  X,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  Sparkle,
  Check,
  Database,
  Globe,
  Lock,
} from '@phosphor-icons/react';

const publicApis = publicApisRaw as PublicApi[];
const ITEMS_PER_PAGE = 36;

export default function PublicApisDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAuth, setSelectedAuth] = useState<AuthFilterType>('all');
  const [selectedCors, setSelectedCors] = useState<CorsFilterType>('all');
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const resultsAnchorRef = useRef<HTMLDivElement>(null);

  // Restore preferred view mode from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('resursee_api_view_mode') as ViewMode | null;
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('resursee_api_view_mode', mode);
    } catch {
      // Ignore
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Distinct categories sorted alphabetically
  const categories = useMemo(() => {
    const set = new Set<string>();
    publicApis.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  // Compute directory overview metrics
  const stats = useMemo(() => {
    const total = publicApis.length;
    const noAuthCount = publicApis.filter(
      (a) => a.auth.toLowerCase() === 'no' || a.auth === ''
    ).length;
    const httpsCount = publicApis.filter((a) => a.https).length;
    const corsCount = publicApis.filter((a) => a.cors.toLowerCase() === 'yes').length;
    return {
      total,
      categoriesCount: categories.length,
      noAuthCount,
      httpsCount,
      corsCount,
    };
  }, [categories]);

  // Filtered & Sorted APIs
  const filteredApis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return publicApis
      .filter((api) => {
        // Search query filter (matches name, description, category, auth)
        if (q) {
          const matchName = api.name.toLowerCase().includes(q);
          const matchDesc = api.description.toLowerCase().includes(q);
          const matchCat = api.category.toLowerCase().includes(q);
          const matchAuth = api.auth.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat && !matchAuth) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && api.category !== selectedCategory) {
          return false;
        }

        // Auth filter
        if (selectedAuth !== 'all') {
          const authLower = api.auth.toLowerCase();
          if (selectedAuth === 'none') {
            if (authLower !== 'no' && authLower !== '') return false;
          } else if (selectedAuth === 'apiKey') {
            if (!authLower.includes('apikey')) return false;
          } else if (selectedAuth === 'OAuth') {
            if (!authLower.includes('oauth')) return false;
          }
        }

        // CORS filter
        if (selectedCors !== 'all') {
          const corsLower = api.cors.toLowerCase();
          if (selectedCors === 'yes' && corsLower !== 'yes') return false;
          if (selectedCors === 'no' && corsLower !== 'no') return false;
          if (selectedCors === 'unknown' && corsLower !== 'unknown') return false;
        }

        // HTTPS filter
        if (httpsOnly && !api.https) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name-desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortBy === 'category') {
          const catComp = a.category.localeCompare(b.category);
          return catComp !== 0 ? catComp : a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [searchQuery, selectedCategory, selectedAuth, selectedCors, httpsOnly, sortBy]);

  // Reset page when any filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedAuth, selectedCors, httpsOnly, sortBy]);

  // Total pages
  const totalPages = Math.ceil(filteredApis.length / ITEMS_PER_PAGE) || 1;

  // Paginated slice
  const paginatedApis = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredApis.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApis, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (resultsAnchorRef.current) {
        resultsAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAuth('all');
    setSelectedCors('all');
    setHttpsOnly(false);
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedAuth !== 'all' ||
    selectedCors !== 'all' ||
    httpsOnly ||
    sortBy !== 'name-asc';

  // Popular quick categories for the pill bar
  const quickCategories = [
    'all',
    'Development',
    'Cryptocurrency',
    'Machine Learning',
    'Finance',
    'Security',
    'Weather',
    'Games & Comics',
    'Open Data',
    'Music',
    'Science & Math',
  ];

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex flex-col selection:bg-neutral-800 selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Header />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-neutral-700 bg-[#121212] px-4 py-3 text-sm text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Hero Section */}
        <section className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] border border-[var(--color-rule)] mb-4">
            <Sparkle size={13} className="text-emerald-500" />
            <span>Developer Public API Directory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-ink)] font-display">
            Explore Public APIs
          </h1>

          <p className="mt-3 text-base sm:text-lg text-[var(--color-ink-muted)] max-w-3xl leading-relaxed">
            A comprehensive, searchable directory of over {stats.total.toLocaleString()} usable public APIs across {stats.categoriesCount} categories for web apps, automation, machine learning, and rapid prototyping.
          </p>

          {/* Quick Metrics Cards */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
            <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4 text-center sm:text-left">
              <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider">
                Total APIs
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                {stats.total.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4 text-center sm:text-left">
              <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider">
                Categories
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                {stats.categoriesCount}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4 text-center sm:text-left">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                <ShieldCheck size={13} />
                No Auth Required
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                {stats.noAuthCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4 text-center sm:text-left">
              <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                <Lock size={13} />
                HTTPS Secured
              </span>
              <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                {stats.httpsCount.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Anchor for Smooth Scrolling on Page Change */}
        <div ref={resultsAnchorRef} className="-mt-4 pt-4" />

        {/* Filter & Controls Panel */}
        <section className="mb-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-xs">
          {/* Top Search Bar & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlass
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search APIs by name, keyword, category, or auth..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] focus:outline-hidden focus:border-neutral-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-0.5"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-paper-muted)] border border-[var(--color-rule)] shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleSetViewMode('grid')}
                data-thock="button"
                aria-label="Grid View"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                <SquaresFour size={16} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
                <span>Grid</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                data-thock="button"
                aria-label="List View"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                <ListBullets size={16} weight={viewMode === 'list' ? 'bold' : 'regular'} />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* Quick Categories Pills */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[var(--color-ink-muted)] font-mono text-[11px] uppercase mr-1 shrink-0">
              Popular:
            </span>
            {quickCategories.map((cat) => {
              const isSelected = selectedCategory === (cat === 'all' ? 'all' : cat);
              return (
                <button
                  key={cat}
                  type="button"
                  data-thock="button"
                  onClick={() => setSelectedCategory(cat === 'all' ? 'all' : cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] dark:bg-white dark:text-black font-semibold'
                      : 'bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-rule-subtle)]'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              );
            })}
          </div>

          {/* Detailed Filter Dropdowns */}
          <div className="mt-4 pt-3.5 border-t border-[var(--color-rule-subtle)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* All Categories Dropdown */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                Category ({categories.length})
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-hidden text-xs"
              >
                <option value="all">All Categories ({stats.total})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Authentication Filter */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                Authentication
              </label>
              <select
                value={selectedAuth}
                onChange={(e) => setSelectedAuth(e.target.value as AuthFilterType)}
                className="w-full py-2 px-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-hidden text-xs"
              >
                <option value="all">All Authentication Types</option>
                <option value="none">No Auth (Free / Open)</option>
                <option value="apiKey">API Key Required</option>
                <option value="OAuth">OAuth Required</option>
              </select>
            </div>

            {/* CORS Filter */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                CORS Support
              </label>
              <select
                value={selectedCors}
                onChange={(e) => setSelectedCors(e.target.value as CorsFilterType)}
                className="w-full py-2 px-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-hidden text-xs"
              >
                <option value="all">All CORS Types</option>
                <option value="yes">CORS: Yes (Client-side OK)</option>
                <option value="no">CORS: No (Proxy needed)</option>
                <option value="unknown">CORS: Unknown</option>
              </select>
            </div>

            {/* Sorting & HTTPS Check */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                Sort Order
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full py-2 px-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-hidden text-xs"
                >
                  <option value="name-asc">Name (A → Z)</option>
                  <option value="name-desc">Name (Z → A)</option>
                  <option value="category">By Category</option>
                </select>

                <label
                  title="Only show HTTPS enabled APIs"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] cursor-pointer select-none shrink-0"
                >
                  <input
                    type="checkbox"
                    checked={httpsOnly}
                    onChange={(e) => setHttpsOnly(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span className="font-mono text-[11px]">HTTPS</span>
                </label>
              </div>
            </div>
          </div>

          {/* Active Filter Summary Bar */}
          {hasActiveFilters && (
            <div className="mt-3.5 pt-3 border-t border-[var(--color-rule-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-[var(--color-ink-muted)]">
                <span>Filtering by:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                    Query: &quot;{searchQuery}&quot;
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                    Category: {selectedCategory}
                  </span>
                )}
                {selectedAuth !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                    Auth: {selectedAuth}
                  </span>
                )}
                {selectedCors !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                    CORS: {selectedCors}
                  </span>
                )}
                {httpsOnly && (
                  <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono text-emerald-500">
                    HTTPS Only
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                data-thock="button"
                className="text-xs font-medium text-rose-500 hover:text-rose-600 underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}
        </section>

        {/* Results Header Count */}
        <div className="mb-4 flex items-center justify-between text-xs text-[var(--color-ink-muted)] font-mono">
          <span>
            Showing <strong className="text-[var(--color-ink)] font-bold">{filteredApis.length.toLocaleString()}</strong> APIs
            {filteredApis.length < stats.total && ` (filtered from ${stats.total.toLocaleString()})`}
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Directory Listings: Grid or List */}
        {paginatedApis.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {paginatedApis.map((api) => (
                <PublicApiCard key={api.id} api={api} onCopyNotice={showToast} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {paginatedApis.map((api) => (
                <PublicApiRow key={api.id} api={api} onCopyNotice={showToast} />
              ))}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-12 text-center my-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)]">
              <Database size={28} />
            </div>
            <h3 className="mt-4 text-base font-bold text-[var(--color-ink)]">
              No public APIs found
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)] max-w-sm mx-auto">
              We couldn&apos;t find any APIs matching your search and filter criteria. Try adjusting keywords or resetting filters.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleResetFilters}
                data-thock="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-ink)] text-[var(--color-paper-card)] dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-rule)] pt-6"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                data-thock="button"
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-paper-muted)] transition-colors"
              >
                <CaretLeft size={14} weight="bold" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                data-thock="button"
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-paper-muted)] transition-colors"
              >
                <span>Next</span>
                <CaretRight size={14} weight="bold" />
              </button>
            </div>

            {/* Page number indicators */}
            <div className="flex items-center gap-1 text-xs font-mono">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let p = idx + 1;
                if (totalPages > 5 && currentPage > 3) {
                  p = currentPage - 3 + idx;
                  if (p > totalPages) p = totalPages - (4 - idx);
                }
                if (p <= 0 || p > totalPages) return null;

                const isCurrent = p === currentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    data-thock="button"
                    className={`h-8 w-8 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper-card)] dark:bg-white dark:text-black'
                        : 'bg-[var(--color-paper-card)] border border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-1 text-[var(--color-ink-muted)]">...</span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages)}
                    data-thock="button"
                    className="h-8 w-8 rounded-lg font-semibold flex items-center justify-center bg-[var(--color-paper-card)] border border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
          </nav>
        )}

        {/* GitHub Repository Credit & Attribution Section (As requested by USER) */}
        <section className="mt-16 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
                <GithubLogo size={16} weight="fill" />
                <span>Open Source Attribution</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] tracking-tight">
                Curated from the public-apis Community Repository
              </h2>

              <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed">
                This public API directory is powered by and derived from the collective open-source work of the{' '}
                <strong className="text-[var(--color-ink)]">public-apis/public-apis</strong> repository, created by Todd Motto, Dave Machado, and maintained by hundreds of software engineering contributors worldwide.
              </p>

              <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
                Want to suggest a new API, fix a broken link, or contribute? Check out the upstream repository on GitHub.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <a
                href="https://github.com/public-apis/public-apis"
                target="_blank"
                rel="noopener noreferrer"
                data-thock="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-ink)] text-[var(--color-paper-card)] dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-sm"
              >
                <GithubLogo size={18} weight="fill" />
                <span>View public-apis on GitHub</span>
                <ArrowSquareOut size={15} weight="bold" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
