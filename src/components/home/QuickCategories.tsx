import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Layout,
  ShieldCheck,
  Megaphone,
  GraduationCap,
  Flask,
  ArrowRight,
} from '@phosphor-icons/react';
import { Category } from '@/types/database';
import { mockCategories, mockResources } from '@/lib/mockData';

interface QuickCategoriesProps {
  categories?: Category[];
}

export default function QuickCategories({ categories = mockCategories }: QuickCategoriesProps) {
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'forms':
        return <FileText size={24} className="text-[var(--color-primary)]" />;
      case 'templates':
        return <Layout size={24} className="text-indigo-600" />;
      case 'policies-guidelines':
        return <ShieldCheck size={24} className="text-emerald-600" />;
      case 'memorandums':
        return <Megaphone size={24} className="text-amber-600" />;
      case 'academic':
        return <GraduationCap size={24} className="text-sky-600" />;
      case 'research':
        return <Flask size={24} className="text-rose-600" />;
      default:
        return <FileText size={24} className="text-[var(--color-primary)]" />;
    }
  };

  const getCategoryCount = (categoryId: string) => {
    return mockResources.filter((r) => r.category_id === categoryId).length;
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider">
              Explore by Category
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Organized for quick academic discovery
            </h2>
          </div>
          <Link
            href="/resources"
            className="group flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            <span>View all document categories</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const count = getCategoryCount(cat.id);
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative flex flex-col justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 shadow-xs transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-paper-surface)] hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-surface)] shadow-2xs group-hover:border-[var(--color-primary-subtle)] group-hover:bg-[var(--color-paper-card)]">
                      {getCategoryIcon(cat.slug)}
                    </div>
                    <span className="rounded-full bg-[var(--color-paper-muted)] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[var(--color-ink-muted)] group-hover:bg-[var(--color-primary-subtle)] group-hover:text-[var(--color-primary)]">
                      {count} items
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors">
                    {cat.name}
                  </h3>

                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-muted)] line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-3 text-[11px] font-medium text-[var(--color-ink-secondary)]">
                  <span>Browse catalog</span>
                  <ArrowRight size={13} className="text-[var(--color-primary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
