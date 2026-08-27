import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <section className="border-t border-[var(--color-rule)] bg-[var(--color-paper-surface)] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider">
              <Newspaper size={14} />
              <span>Campus Updates</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Latest University News & Advisories
            </h2>
          </div>
          <Link
            href="/news"
            className="group flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            <span>View all news & advisories</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 3-column news grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {publishedNews.map((article) => (
            <article
              key={article.id}
              className="group flex flex-col justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] overflow-hidden shadow-xs transition-all hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Image banner if available */}
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
                      <span>Verified Notice</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 p-5">
                {/* Meta: Department + Date */}
                <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                  <div className="flex items-center gap-1 font-medium text-[var(--color-primary)]">
                    <Buildings size={13} />
                    <span>{article.department?.abbreviation || 'Campus'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10.5px]">
                    <CalendarBlank size={13} />
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                </div>

                {/* Title */}
                <a
                  href={article.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 block font-display text-base font-bold leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-primary)]"
                >
                  {article.title}
                </a>

                {/* Summary */}
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)] line-clamp-3">
                  {article.summary}
                </p>
              </div>

              {/* Read Source Link */}
              <div className="border-t border-[var(--color-rule-subtle)] px-5 py-3 bg-[var(--color-paper-surface)]/50 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">Official Notice</span>
                <a
                  href={article.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline"
                >
                  <span>Read full announcement</span>
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
