'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PublicApiCard from '@/components/resources/PublicApiCard';
import PublicApiRow from '@/components/resources/PublicApiRow';
import StarredRepoCard from '@/components/resources/StarredRepoCard';
import StarredRepoRow from '@/components/resources/StarredRepoRow';
import { PublicApi, ViewMode, AuthFilterType, CorsFilterType, SortOption } from '@/types/publicApi';
import { StarredRepo, RepoSortOption } from '@/types/starredRepo';
import publicApisRaw from '@/data/public-apis.json';
import starredReposRaw from '@/data/github_starred_repos.json';
import {
  MagnifyingGlass,
  SquaresFour,
  ListBullets,
  ArrowSquareOut,
  GithubLogo,
  Star,
  X,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  Check,
  Database,
  Globe,
  Lock,
  Code,
  Tag,
} from '@phosphor-icons/react';

const publicApis = publicApisRaw as PublicApi[];
const starredRepos = starredReposRaw as StarredRepo[];
const APIS_PER_PAGE = 36;
const REPOS_PER_PAGE = 24;

type ResourceTab = 'apis' | 'repos';

function ResourcesDirectoryInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Primary active tab
  const initialTab = searchParams.get('tab') === 'repos' ? 'repos' : 'apis';
  const [activeTab, setActiveTab] = useState<ResourceTab>(initialTab);

  // Common View Mode (Grid vs List)
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Public APIs State ---
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAuth, setSelectedAuth] = useState<AuthFilterType>('all');
  const [selectedCors, setSelectedCors] = useState<CorsFilterType>('all');
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [apiSortBy, setApiSortBy] = useState<SortOption>('name-asc');
  const [apiPage, setApiPage] = useState(1);

  // --- GitHub Starred Repos State ---
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [repoSortBy, setRepoSortBy] = useState<RepoSortOption>('stars');
  const [repoPage, setRepoPage] = useState(1);

  const resultsAnchorRef = useRef<HTMLDivElement>(null);

  // Restore preferred view mode from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('resursee_api_view_mode') as ViewMode | null;
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'repos' && activeTab !== 'repos') {
      setActiveTab('repos');
    } else if (tabParam === 'apis' && activeTab !== 'apis') {
      setActiveTab('apis');
    }
  }, [searchParams]);

  const handleTabChange = (tab: ResourceTab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', tab);
    router.replace(`/resources?${newParams.toString()}`, { scroll: false });
  };

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

  // -------------------------------------------------------------
  // Public APIs Computations
  // -------------------------------------------------------------
  const categories = useMemo(() => {
    const set = new Set<string>();
    publicApis.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  const apiStats = useMemo(() => {
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

  const filteredApis = useMemo(() => {
    const q = apiSearchQuery.trim().toLowerCase();

    return publicApis
      .filter((api) => {
        if (q) {
          const matchName = api.name.toLowerCase().includes(q);
          const matchDesc = api.description.toLowerCase().includes(q);
          const matchCat = api.category.toLowerCase().includes(q);
          const matchAuth = api.auth.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat && !matchAuth) return false;
        }

        if (selectedCategory !== 'all' && api.category !== selectedCategory) return false;

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

        if (selectedCors !== 'all') {
          const corsLower = api.cors.toLowerCase();
          if (selectedCors === 'yes' && corsLower !== 'yes') return false;
          if (selectedCors === 'no' && corsLower !== 'no') return false;
          if (selectedCors === 'unknown' && corsLower !== 'unknown') return false;
        }

        if (httpsOnly && !api.https) return false;

        return true;
      })
      .sort((a, b) => {
        if (apiSortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (apiSortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (apiSortBy === 'category') {
          const catComp = a.category.localeCompare(b.category);
          return catComp !== 0 ? catComp : a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [apiSearchQuery, selectedCategory, selectedAuth, selectedCors, httpsOnly, apiSortBy]);

  useEffect(() => {
    setApiPage(1);
  }, [apiSearchQuery, selectedCategory, selectedAuth, selectedCors, httpsOnly, apiSortBy]);

  const totalApiPages = Math.ceil(filteredApis.length / APIS_PER_PAGE) || 1;
  const paginatedApis = useMemo(() => {
    const start = (apiPage - 1) * APIS_PER_PAGE;
    return filteredApis.slice(start, start + APIS_PER_PAGE);
  }, [filteredApis, apiPage]);

  // -------------------------------------------------------------
  // GitHub Starred Repos Computations
  // -------------------------------------------------------------
  const languages = useMemo(() => {
    const set = new Set<string>();
    starredRepos.forEach((r) => {
      if (r.language) set.add(r.language);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  const popularTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    starredRepos.forEach((r) => {
      (r.topics || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
  }, []);

  const repoStats = useMemo(() => {
    const total = starredRepos.length;
    const totalStars = starredRepos.reduce((acc, r) => acc + (r.stargazersCount || 0), 0);
    const languagesCount = languages.length;
    return {
      total,
      totalStars,
      languagesCount,
    };
  }, [languages]);

  const filteredRepos = useMemo(() => {
    const q = repoSearchQuery.trim().toLowerCase();

    return starredRepos
      .filter((repo) => {
        if (q) {
          const matchName = repo.name.toLowerCase().includes(q);
          const matchFullName = repo.fullName.toLowerCase().includes(q);
          const matchDesc = repo.description.toLowerCase().includes(q);
          const matchTopics = (repo.topics || []).some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchFullName && !matchDesc && !matchTopics) return false;
        }

        if (selectedLanguage !== 'all' && repo.language !== selectedLanguage) return false;

        if (selectedTopic !== 'all' && !(repo.topics || []).includes(selectedTopic)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (repoSortBy === 'stars') {
          return b.stargazersCount - a.stargazersCount;
        }
        if (repoSortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (repoSortBy === 'updated') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        return 0;
      });
  }, [repoSearchQuery, selectedLanguage, selectedTopic, repoSortBy]);

  useEffect(() => {
    setRepoPage(1);
  }, [repoSearchQuery, selectedLanguage, selectedTopic, repoSortBy]);

  const totalRepoPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE) || 1;
  const paginatedRepos = useMemo(() => {
    const start = (repoPage - 1) * REPOS_PER_PAGE;
    return filteredRepos.slice(start, start + REPOS_PER_PAGE);
  }, [filteredRepos, repoPage]);

  const handleApiPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalApiPages) {
      setApiPage(newPage);
      if (resultsAnchorRef.current) {
        resultsAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleRepoPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalRepoPages) {
      setRepoPage(newPage);
      if (resultsAnchorRef.current) {
        resultsAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleResetApiFilters = () => {
    setApiSearchQuery('');
    setSelectedCategory('all');
    setSelectedAuth('all');
    setSelectedCors('all');
    setHttpsOnly(false);
    setApiSortBy('name-asc');
    setApiPage(1);
  };

  const handleResetRepoFilters = () => {
    setRepoSearchQuery('');
    setSelectedLanguage('all');
    setSelectedTopic('all');
    setRepoSortBy('stars');
    setRepoPage(1);
  };

  const hasActiveApiFilters =
    apiSearchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedAuth !== 'all' ||
    selectedCors !== 'all' ||
    httpsOnly ||
    apiSortBy !== 'name-asc';

  const hasActiveRepoFilters =
    repoSearchQuery !== '' ||
    selectedLanguage !== 'all' ||
    selectedTopic !== 'all' ||
    repoSortBy !== 'stars';

  const quickApiCategories = [
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
    <div className="min-h-screen bg-transparent text-[var(--color-ink)] flex flex-col selection:bg-neutral-800 selection:text-white dark:selection:bg-white dark:selection:text-black">
      <Header />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-neutral-700 bg-[#121212] px-4 py-3 text-sm text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={16} className="text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Navigation Tabs Header */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-rule)] pb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-ink)] font-display">
                Resources Directory
              </h1>
            </div>

            {/* Primary Tab Switcher (Responsive 2-Col on Mobile) */}
            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-2xl bg-[var(--color-paper-muted)] border border-[var(--color-rule)] shadow-xs">
              <button
                type="button"
                onClick={() => handleTabChange('apis')}
                data-thock="button"
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all truncate ${
                  activeTab === 'apis'
                    ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                <Globe size={15} weight={activeTab === 'apis' ? 'bold' : 'regular'} className="shrink-0" />
                <span className="truncate">Public APIs</span>
                <span className="font-mono text-[10.5px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-[var(--color-paper-surface)] dark:bg-[#1a1a1a] text-[var(--color-ink-muted)] shrink-0">
                  {apiStats.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('repos')}
                data-thock="button"
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all truncate ${
                  activeTab === 'repos'
                    ? 'bg-[var(--color-paper-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                <Star
                  size={15}
                  weight={activeTab === 'repos' ? 'fill' : 'regular'}
                  className={activeTab === 'repos' ? 'text-[var(--color-ink)] shrink-0' : 'shrink-0'}
                />
                <span className="truncate">Repositories</span>
                <span className="font-mono text-[10.5px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-[var(--color-paper-surface)] dark:bg-[#1a1a1a] text-[var(--color-ink-muted)] shrink-0">
                  {repoStats.total}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* TAB 1: PUBLIC APIS DIRECTORY                                   */}
        {/* ============================================================= */}
        {activeTab === 'apis' && (
          <div>
            {/* APIs Sub-Hero & Metrics */}
            <div className="mb-8">
              <p className="text-base sm:text-lg text-[var(--color-ink-muted)] max-w-3xl leading-relaxed">
                Explore {apiStats.total.toLocaleString()} usable, developer-tested public APIs across {apiStats.categoriesCount} categories for web applications, automation, machine learning, and rapid prototyping.
              </p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4">
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider">
                    Total APIs
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                    {apiStats.total.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4">
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider">
                    Categories
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                    {apiStats.categoriesCount}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4">
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={13} />
                    No Auth Required
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                    {apiStats.noAuthCount.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4">
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider flex items-center gap-1">
                    <Lock size={13} />
                    HTTPS Secured
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                    {apiStats.httpsCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Anchor for Smooth Scrolling on Page Change */}
            <div ref={resultsAnchorRef} className="-mt-4 pt-4" />

            {/* APIs Filter & Controls Panel */}
            <section className="mb-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlass
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                  />
                  <input
                    type="text"
                    value={apiSearchQuery}
                    onChange={(e) => setApiSearchQuery(e.target.value)}
                    placeholder="Search APIs by name, keyword, category, or auth..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] focus:outline-hidden focus:border-neutral-500 transition-colors"
                  />
                  {apiSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setApiSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-0.5"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* View Mode Switcher */}
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
                {quickApiCategories.map((cat) => {
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
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                    Category ({categories.length})
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-hidden text-xs"
                  >
                    <option value="all">All Categories ({apiStats.total})</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

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

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                    Sort Order
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={apiSortBy}
                      onChange={(e) => setApiSortBy(e.target.value as SortOption)}
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
                        className="accent-neutral-900 dark:accent-neutral-100 rounded"
                      />
                      <span className="font-mono text-[11px]">HTTPS</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Active Filter Summary Bar */}
              {hasActiveApiFilters && (
                <div className="mt-3.5 pt-3 border-t border-[var(--color-rule-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-[var(--color-ink-muted)]">
                    <span>Filtering by:</span>
                    {apiSearchQuery && (
                      <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                        Query: &quot;{apiSearchQuery}&quot;
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
                      <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono text-[var(--color-ink)]">
                        HTTPS Only
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetApiFilters}
                    data-thock="button"
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
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
                {filteredApis.length < apiStats.total && ` (filtered from ${apiStats.total.toLocaleString()})`}
              </span>
              <span>
                Page {apiPage} of {totalApiPages}
              </span>
            </div>

            {/* Listings: Grid or List */}
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
                    onClick={handleResetApiFilters}
                    data-thock="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-ink)] text-[var(--color-paper-card)] dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalApiPages > 1 && (
              <nav
                aria-label="APIs Pagination"
                className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-rule)] pt-6"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApiPageChange(apiPage - 1)}
                    disabled={apiPage === 1}
                    data-thock="button"
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-paper-muted)] transition-colors"
                  >
                    <CaretLeft size={14} weight="bold" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApiPageChange(apiPage + 1)}
                    disabled={apiPage === totalApiPages}
                    data-thock="button"
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-paper-muted)] transition-colors"
                  >
                    <span>Next</span>
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-xs font-mono">
                  {Array.from({ length: Math.min(5, totalApiPages) }, (_, idx) => {
                    let p = idx + 1;
                    if (totalApiPages > 5 && apiPage > 3) {
                      p = apiPage - 3 + idx;
                      if (p > totalApiPages) p = totalApiPages - (4 - idx);
                    }
                    if (p <= 0 || p > totalApiPages) return null;

                    const isCurrent = p === apiPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleApiPageChange(p)}
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

                  {totalApiPages > 5 && apiPage < totalApiPages - 2 && (
                    <>
                      <span className="px-1 text-[var(--color-ink-muted)]">...</span>
                      <button
                        type="button"
                        onClick={() => handleApiPageChange(totalApiPages)}
                        data-thock="button"
                        className="h-8 w-8 rounded-lg font-semibold flex items-center justify-center bg-[var(--color-paper-card)] border border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                      >
                        {totalApiPages}
                      </button>
                    </>
                  )}
                </div>
              </nav>
            )}

            {/* Credit & Attribution Banner */}
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
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: GITHUB REPOSITORIES (STARRED REPOS)                      */}
        {/* ============================================================= */}
        {activeTab === 'repos' && (
          <div>
            {/* Repos Sub-Hero & Metrics */}
            <div className="mb-8">
              <p className="text-base sm:text-lg text-[var(--color-ink-muted)] max-w-3xl leading-relaxed">
                Handpicked, starred open-source tools, autonomous AI agent frameworks, developer productivity utilities, and systems engineering libraries curated by{' '}
                <a
                  href="https://github.com/JohnDivina"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--color-ink)] underline hover:text-[var(--color-primary)] dark:hover:text-white"
                >
                  John Rey (@JohnDivina)
                </a>
                .
              </p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4">
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider">
                    Starred Repos
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                    {repoStats.total}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4">
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider">
                    Languages
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                    {repoStats.languagesCount}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4">
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider flex items-center gap-1">
                    <Star size={13} weight="fill" className="text-neutral-500 dark:text-neutral-400" />
                    Combined Stars
                  </span>
                  <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-mono">
                    {(repoStats.totalStars / 1000000).toFixed(2)}M+
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-3 sm:p-4">
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono uppercase tracking-wider flex items-center gap-1">
                    <GithubLogo size={13} weight="fill" />
                    Curator Profile
                  </span>
                  <a
                    href="https://github.com/JohnDivina?tab=stars"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm font-semibold text-[var(--color-primary)] dark:text-white hover:underline flex items-center gap-1"
                  >
                    <span>@JohnDivina</span>
                    <ArrowSquareOut size={12} weight="bold" />
                  </a>
                </div>
              </div>
            </div>

            {/* Anchor for Smooth Scrolling on Page Change */}
            <div ref={resultsAnchorRef} className="-mt-4 pt-4" />

            {/* Repos Filter & Controls Panel */}
            <section className="mb-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlass
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                  />
                  <input
                    type="text"
                    value={repoSearchQuery}
                    onChange={(e) => setRepoSearchQuery(e.target.value)}
                    placeholder="Search starred repositories by name, owner, description, or topic..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] focus:outline-hidden focus:border-neutral-500 transition-colors"
                  />
                  {repoSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setRepoSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-0.5"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* View Mode Switcher */}
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

              {/* Popular Topics Pills */}
              <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[var(--color-ink-muted)] font-mono text-[11px] uppercase mr-1 shrink-0">
                  Topics:
                </span>
                <button
                  type="button"
                  data-thock="button"
                  onClick={() => setSelectedTopic('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    selectedTopic === 'all'
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] dark:bg-white dark:text-black font-semibold'
                      : 'bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-rule-subtle)]'
                  }`}
                >
                  All Topics
                </button>
                {popularTopics.map((topic) => {
                  const isSelected = selectedTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      data-thock="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[var(--color-ink)] text-[var(--color-paper)] dark:bg-white dark:text-black font-semibold'
                          : 'bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] border border-[var(--color-rule-subtle)]'
                      }`}
                    >
                      #{topic}
                    </button>
                  );
                })}
              </div>

              {/* Dropdown Filters */}
              <div className="mt-4 pt-3.5 border-t border-[var(--color-rule-subtle)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                    Language ({languages.length})
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-hidden text-xs"
                  >
                    <option value="all">All Languages ({repoStats.total})</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                    Sort Repositories
                  </label>
                  <select
                    value={repoSortBy}
                    onChange={(e) => setRepoSortBy(e.target.value as RepoSortOption)}
                    className="w-full py-2 px-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-hidden text-xs"
                  >
                    <option value="stars">Most Stars (High → Low)</option>
                    <option value="name-asc">Name (A → Z)</option>
                    <option value="updated">Recently Updated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--color-ink-muted)] mb-1">
                    Selected Topic
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full py-2 px-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink)] focus:outline-hidden text-xs"
                  >
                    <option value="all">All Topics</option>
                    {popularTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        #{topic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filter Summary Bar */}
              {hasActiveRepoFilters && (
                <div className="mt-3.5 pt-3 border-t border-[var(--color-rule-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-[var(--color-ink-muted)]">
                    <span>Filtering by:</span>
                    {repoSearchQuery && (
                      <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                        Query: &quot;{repoSearchQuery}&quot;
                      </span>
                    )}
                    {selectedLanguage !== 'all' && (
                      <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                        Language: {selectedLanguage}
                      </span>
                    )}
                    {selectedTopic !== 'all' && (
                      <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                        Topic: #{selectedTopic}
                      </span>
                    )}
                    {repoSortBy !== 'stars' && (
                      <span className="inline-flex items-center gap-1 bg-[var(--color-paper-muted)] px-2 py-0.5 rounded text-[11px] font-mono">
                        Sort: {repoSortBy}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetRepoFilters}
                    data-thock="button"
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </section>

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between text-xs text-[var(--color-ink-muted)] font-mono">
              <span>
                Showing <strong className="text-[var(--color-ink)] font-bold">{filteredRepos.length}</strong> Repositories
                {filteredRepos.length < repoStats.total && ` (filtered from ${repoStats.total})`}
              </span>
              <span>
                Page {repoPage} of {totalRepoPages}
              </span>
            </div>

            {/* Listings: Grid or List */}
            {paginatedRepos.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {paginatedRepos.map((repo) => (
                    <StarredRepoCard
                      key={repo.id}
                      repo={repo}
                      onSelectTopic={(t) => setSelectedTopic(t)}
                      onCopyNotice={showToast}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {paginatedRepos.map((repo) => (
                    <StarredRepoRow
                      key={repo.id}
                      repo={repo}
                      onSelectTopic={(t) => setSelectedTopic(t)}
                      onCopyNotice={showToast}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-12 text-center my-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)]">
                  <GithubLogo size={28} />
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--color-ink)]">
                  No repositories found
                </h3>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)] max-w-sm mx-auto">
                  We couldn&apos;t find any starred repositories matching your search criteria.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleResetRepoFilters}
                    data-thock="button"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-ink)] text-[var(--color-paper-card)] dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalRepoPages > 1 && (
              <nav
                aria-label="Repos Pagination"
                className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--color-rule)] pt-6"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRepoPageChange(repoPage - 1)}
                    disabled={repoPage === 1}
                    data-thock="button"
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-paper-muted)] transition-colors"
                  >
                    <CaretLeft size={14} weight="bold" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRepoPageChange(repoPage + 1)}
                    disabled={repoPage === totalRepoPages}
                    data-thock="button"
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-paper-muted)] transition-colors"
                  >
                    <span>Next</span>
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-xs font-mono">
                  {Array.from({ length: totalRepoPages }, (_, idx) => {
                    const p = idx + 1;
                    const isCurrent = p === repoPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleRepoPageChange(p)}
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
                </div>
              </nav>
            )}

            {/* GitHub Stars Profile Banner */}
            <section className="mt-16 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
                    <Star size={16} weight="fill" className="text-neutral-500 dark:text-neutral-400" />
                    <span>Curated GitHub Collection</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-ink)] tracking-tight">
                    Starred Repositories by John Rey (@JohnDivina)
                  </h2>

                  <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed">
                    This directory tracks open-source repositories personally starred and monitored for excellence in developer experience, AI agents, systems architecture, and engineering craftsmanship.
                  </p>

                  <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
                    Directly synced with the live GitHub API for <strong className="text-[var(--color-ink)]">@JohnDivina</strong>.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <a
                    href="https://github.com/JohnDivina?tab=stars"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-thock="button"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--color-ink)] text-[var(--color-paper-card)] dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Star size={18} weight="fill" className="text-neutral-900 dark:text-black" />
                    <span>View All Stars on GitHub</span>
                    <ArrowSquareOut size={15} weight="bold" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ResourcesDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent text-[var(--color-ink)] flex items-center justify-center font-mono text-xs">
          Loading Resources Directory...
        </div>
      }
    >
      <ResourcesDirectoryInner />
    </Suspense>
  );
}
