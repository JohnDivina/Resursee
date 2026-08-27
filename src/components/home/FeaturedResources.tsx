import React from 'react';
import Link from 'next/link';
import { ArrowRight, Star, Sparkle } from '@phosphor-icons/react';
import { Resource } from '@/types/database';
import { mockResources } from '@/lib/mockData';
import ResourceCard from '@/components/resources/ResourceCard';

interface FeaturedResourcesProps {
  resources?: Resource[];
  onDownload?: (resource: Resource) => void;
}

export default function FeaturedResources({
  resources = mockResources,
  onDownload,
}: FeaturedResourcesProps) {
  // Show featured items first, up to 4 items
  const featured = resources.filter((r) => r.is_featured).slice(0, 4);

  return (
    <section className="border-t border-[var(--color-rule)] bg-[var(--color-paper)] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              <Star size={14} weight="fill" />
              <span>Frequently Used Documents</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              Featured University Resources
            </h2>
          </div>
          <Link
            href="/resources"
            className="group flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            <span>Browse all resources ({resources.length})</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 4-column responsive grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onDownload={onDownload} />
          ))}
        </div>
      </div>
    </section>
  );
}
