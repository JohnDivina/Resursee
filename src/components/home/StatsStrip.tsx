'use client';

import React, { useState, useEffect } from 'react';
import { Resource, Department } from '@/types/database';
import { mockResources, mockDepartments } from '@/lib/mockData';
import { getLiveResources } from '@/lib/resourceStore';

interface StatsStripProps {
  resources?: Resource[];
  departments?: Department[];
}

export default function StatsStrip({
  resources: initialResources,
  departments = mockDepartments,
}: StatsStripProps) {
  const [liveResources, setLiveResources] = useState<Resource[]>(initialResources || mockResources);

  useEffect(() => {
    setLiveResources(getLiveResources());
    const handleUpdate = () => setLiveResources(getLiveResources());
    window.addEventListener('resursee_catalog_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('resursee_catalog_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const resources = liveResources;

  // 1. Dynamic Verified Percentage (active items / total items)
  const activeResources = resources.filter((r) => r.status === 'active');
  const verifiedPercentage =
    resources.length > 0
      ? Math.round((activeResources.length / resources.length) * 100)
      : 100;

  // 2. Dynamic Campus Offices Count (Unique offices/departments with active documents)
  const uniqueOffices = new Set(
    activeResources
      .map((r) => r.department_id || r.department?.name || r.source_name)
      .filter(Boolean)
  );
  const activeOfficesCount = uniqueOffices.size;

  // 3. Dynamic Latest Document Revision Year
  const latestRevisionYear =
    resources.length > 0
      ? Math.max(
          ...resources.map((r) => new Date(r.updated_at || r.created_at).getFullYear())
        )
      : new Date().getFullYear();

  // 4. Dynamic Available Document Count
  const activeDocumentCount = activeResources.length;

  const stats = [
    { value: `${verifiedPercentage}%`, label: 'Official & Verified' },
    { value: activeOfficesCount, label: 'Campus Offices' },
    { value: latestRevisionYear, label: 'Current Revisions' },
    { value: activeDocumentCount, label: 'Active Documents' },
  ];

  return (
    <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center rounded-[20px] border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-transform hover:scale-[1.02]"
        >
          <span className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-3xl">
            {stat.value}
          </span>
          <span className="mt-1 text-xs font-medium text-[var(--color-ink-muted)]">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
