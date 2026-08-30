import React from 'react';
import Link from 'next/link';
import { Newspaper, ArrowRight, ArrowSquareOut, Buildings, CalendarBlank, ShieldCheck } from '@phosphor-icons/react';
import { NewsArticle } from '@/types/database';
import { mockNewsArticles } from '@/lib/mockData';

interface LatestNewsProps {
  articles?: NewsArticle[];
}

export default function LatestNews({ articles = mockNewsArticles }: LatestNewsProps) {
  // Only show approved articles on public home, up to 3 items
  const publishedNews = articles.filter((a) => a.status === 'approved').slice(0, 3);

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
    <section className="border-t border-[var(--color-rule-subtle)] bg-transparent py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Latest University News & Advisories
            </h2>
          </div>
          <Link
            href="/news"
            className="group flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline"
          >
            <span>View all news & advisories</span>
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3-column news grid (Apple Squircle Solid White Cards with Smooth Hover) */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {publishedNews.map((article) => (
            <article
              key={article.id}
              data-thock="card"
              className="group flex min-h-[240px] flex-col justify-between rounded-[26px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2 hover:border-[var(--color-primary)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            >
              {/* Image banner if available */}
              {article.image_url && (
                <div className="relative h-48 w-full overflow-hidden bg-[var(--color-paper-muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-3.5 left-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 font-mono text-[10px] font-semibold text-white backdrop-blur-xs">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span>Verified Notice</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 p-6 sm:p-7">
                {/* Meta: Department + Date */}
                <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                  <div className="flex items-center gap-1 font-semibold text-[var(--color-primary)]">
                    <Buildings size={14} />
                    <span>{article.department?.abbreviation || 'Campus'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10.5px]">
                    <CalendarBlank size={14} />
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                </div>

                {/* Title */}
                <a
                  href={article.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3.5 block text-lg font-bold leading-snug text-[var(--color-ink)] transition-colors duration-200 group-hover:text-[var(--color-primary)] tracking-tight"
                >
                  {article.title}
                </a>

                {/* Summary */}
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--color-ink-muted)] line-clamp-3">
                  {article.summary}
                </p>
              </div>

              {/* Read Source Link */}
              <div className="border-t border-[var(--color-rule-subtle)] px-6 sm:px-7 py-4 bg-[var(--color-paper-muted)]/40 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">Campus Bulletin</span>
                <a
                  href={article.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[var(--color-primary)] hover:underline"
                >
                  <span>Read announcement</span>
                  <ArrowSquareOut size={13} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
