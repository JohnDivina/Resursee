'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import {
  Newspaper,
  ShieldCheck,
  CalendarBlank,
  Buildings,
  ArrowSquareOut,
  MagnifyingGlass,
  CheckCircle,
} from '@phosphor-icons/react';
import { mockDepartments, mockResources } from '@/lib/mockData';
import { NewsArticle } from '@/types/database';
import { getLiveNewsArticles } from '@/lib/newsStore';

export default function NewsPage() {
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState('all');
  const [newsQuery, setNewsQuery] = useState('');
  const [liveNews, setLiveNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    setLiveNews(getLiveNewsArticles());
    const handleUpdate = () => setLiveNews(getLiveNewsArticles());
    window.addEventListener('resursee_news_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('resursee_news_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const publishedNews = liveNews.filter((article) => {
    if (article.status !== 'approved') return false;
    if (selectedDept !== 'all' && article.department?.slug !== selectedDept) return false;
    if (newsQuery.trim()) {
      const q = newsQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(q) ||
        (article.summary && article.summary.toLowerCase().includes(q)) ||
        (article.department && article.department.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)]">University News & Memos</span>
          </nav>

          {/* Page Heading */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-b border-[var(--color-rule)] pb-6 md:flex-row md:items-end">
            <div>
              <span className="font-mono text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                Official Bulletins
              </span>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                University News & Official Advisories
              </h1>
              <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                Aggregated, verified campus circulars, scholarship updates, and administrative announcements.
              </p>
            </div>

            {/* Quick search */}
            <div className="w-full md:w-72">
              <div className="relative flex items-center">
                <MagnifyingGlass size={16} className="absolute left-3 text-[var(--color-primary)]" />
                <input
                  type="text"
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] py-2 pr-4 pl-9 text-xs font-medium text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-hidden focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Department Filter Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-1.5 border-b border-[var(--color-rule-subtle)] pb-4">
            <button
              onClick={() => setSelectedDept('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedDept === 'all'
                  ? 'bg-[var(--color-primary)] font-bold text-white shadow-2xs'
                  : 'border border-[var(--color-rule)] bg-[var(--color-paper-card)] text-[var(--color-ink-secondary)] hover:border-[var(--color-primary)]'
              }`}
            >
              All Campus Offices
            </button>
            {mockDepartments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.slug)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  selectedDept === dyName(dept)
                    ? 'bg-[var(--color-primary)] font-bold text-white shadow-2xs'
                    : 'border border-[var(--color-rule)] bg-[var(--color-paper-card)] text-[var(--color-ink-secondary)] hover:border-[var(--color-primary)]'
                }`}
              >
                {dept.abbreviation}
              </button>
            ))}
          </div>

          {/* News Stream Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedNews.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-12 text-center">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  No news announcements found matching your criteria.
                </p>
              </div>
            ) : (
              publishedNews.map((article) => (
                <article
                  key={article.id}
                  className="group flex flex-col justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] overflow-hidden shadow-xs transition-all hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5"
                >
                  {article.image_url && (
                    <div className="relative h-44 w-full overflow-hidden bg-[var(--color-paper-muted)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-xs">
                          <ShieldCheck size={12} className="text-emerald-400" />
                          <span>Approved Circular</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 p-5">
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                      <div className="flex items-center gap-1 font-medium text-[var(--color-primary)]">
                        <Buildings size={13} />
                        <span>{article.department?.name || 'Central Campus'}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10.5px]">
                        <CalendarBlank size={13} />
                        <span>{formatDate(article.published_at)}</span>
                      </div>
                    </div>

                    <a
                      href={article.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 block font-display text-base font-bold leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-primary)]"
                    >
                      {article.title}
                    </a>

                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)] line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  <div className="border-t border-[var(--color-rule-subtle)] px-5 py-3 bg-[var(--color-paper-surface)]/50 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">Verified Post</span>
                    <a
                      href={article.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      <span>Read full notice</span>
                      <ArrowSquareOut size={13} />
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function dyName(dept: { slug: string; abbreviation: string }) {
  return dept.slug;
}
