'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommandPalette from '@/components/search/CommandPalette';
import ResourceCard from '@/components/resources/ResourceCard';
import {
  FileText,
  Layout,
  ShieldCheck,
  Megaphone,
  GraduationCap,
  Flask,
  ArrowLeft,
  CheckCircle,
} from '@phosphor-icons/react';
import { mockCategories, mockResources } from '@/lib/mockData';
import { Resource } from '@/types/database';
import { getLiveResources, fetchResourcesFromCloud } from '@/lib/resourceStore';

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveResources, setLiveResources] = useState<Resource[]>([]);

  useEffect(() => {
    setLiveResources(getLiveResources());
    fetchResourcesFromCloud().then((cloudData) => {
      if (cloudData && cloudData.length > 0) {
        setLiveResources(cloudData);
      }
    });

    const handleUpdate = () => setLiveResources(getLiveResources());
    window.addEventListener('resursee_catalog_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('resursee_catalog_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const category = mockCategories.find((c) => c.slug === slug);

  if (!category) {
    return notFound();
  }

  const categoryResources = liveResources.filter((r) => r.category_id === category.id);

  const handleDownload = (resource: Resource) => {
    setToastMessage(`Downloading "${resource.title}" (${resource.file_format})`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'forms':
        return <FileText size={32} className="text-[var(--color-primary)]" />;
      case 'templates':
        return <Layout size={32} className="text-indigo-600" />;
      case 'policies-guidelines':
        return <ShieldCheck size={32} className="text-emerald-600" />;
      case 'memorandums':
        return <Megaphone size={32} className="text-amber-600" />;
      case 'academic':
        return <GraduationCap size={32} className="text-sky-600" />;
      case 'research':
        return <Flask size={32} className="text-rose-600" />;
      default:
        return <FileText size={32} className="text-[var(--color-primary)]" />;
    }
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
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <Link href="/resources" className="hover:text-[var(--color-primary)]">
              Categories
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--color-ink)]">{category.name}</span>
          </nav>

          {/* Category Header Banner */}
          <div className="mt-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-surface)] shadow-xs">
                  {getCategoryIcon(category.slug)}
                </div>
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                    University Category Hub
                  </span>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                    {category.name}
                  </h1>
                  <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[var(--color-ink-muted)] sm:text-sm">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="self-start rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-surface)] px-4 py-2 text-center sm:self-center">
                <span className="font-display text-xl font-bold text-[var(--color-primary)] sm:text-2xl">
                  {categoryResources.length}
                </span>
                <p className="font-mono text-[10.5px] uppercase text-[var(--color-ink-muted)]">
                  Documents
                </p>
              </div>
            </div>
          </div>

          {/* Resources in this Category */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
                Available {category.name}
              </h2>
              <Link
                href="/resources"
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                View all categories
              </Link>
            </div>

            {categoryResources.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-12 text-center">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  No documents have been uploaded to this category yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categoryResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} onDownload={handleDownload} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-dark-surface)] px-4 py-3 text-xs font-medium text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
