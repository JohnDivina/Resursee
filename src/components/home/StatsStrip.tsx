'use client';

import React from 'react';
import { Resource, Department } from '@/types/database';
import { mockResources, mockDepartments } from '@/lib/mockData';

interface StatsStripProps {
  resources?: Resource[];
  departments?: Department[];
}

export default function StatsStrip({
  resources = mockResources,
  departments = mockDepartments,
}: StatsStripProps) {
  // 1. Dynamic Verified Percentage (active items / total items)
  const activeResources = resources.filter((r) => r.status === 'active');
  const verifiedPercentage =
    resources.length > 0
      ? Math.round((activeResources.length / resources.length) * 100)
      : 100;

  // 2. Dynamic Active Campus Offices Count
  const activeOfficesCount = departments.filter((d) => d.is_active).length;

  // 3. Dynamic Latest Document Revision Year (derived from resource metadata dates)
  const latestRevisionYear =
    resources.length > 0
      ? Math.max(
          ...resources.map((r) => new Date(r.updated_at || r.created_at).getFullYear())
        )
      : new Date().getFullYear();

  // 4. Dynamic Available Document Count
  const activeDocumentCount = activeResources.length;

  return (
    <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 border-t border-[var(--color-rule-subtle)] pt-8 sm:grid-cols-4">
      {/* Metric 1: Verified */}
      <div className="flex flex-col items-center justify-center p-2 text-center">
        <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          {verifiedPercentage}%
        </span>
        <span className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
          Official & Verified
        </span>
      </div>

      {/* Metric 2: Campus Offices */}
      <div className="flex flex-col items-center justify-center p-2 text-center">
        <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          {activeOfficesCount}
        </span>
        <span className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
          Campus Offices
        </span>
      </div>

      {/* Metric 3: Revision Year */}
      <div className="flex flex-col items-center justify-center p-2 text-center">
        <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          {latestRevisionYear}
        </span>
        <span className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
          Current Revisions
        </span>
      </div>

      {/* Metric 4: Active Resources */}
      <div className="flex flex-col items-center justify-center p-2 text-center">
        <span className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          {activeDocumentCount}
        </span>
        <span className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
          Active Documents
        </span>
      </div>
    </div>
  );
}
