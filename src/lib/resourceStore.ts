'use client';

import { Resource } from '@/types/database';
import { mockResources } from '@/lib/mockData';

const CLOUD_CACHE_KEY = 'resursee_cloud_resources_cache';
let inMemoryResources: Resource[] | null = null;

export function getLiveResources(): Resource[] {
  if (typeof window === 'undefined') return mockResources;

  if (inMemoryResources !== null) {
    return inMemoryResources;
  }

  try {
    const cached = localStorage.getItem(CLOUD_CACHE_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        inMemoryResources = parsed;
        return inMemoryResources;
      }
    }
  } catch {
    // ignore
  }

  inMemoryResources = mockResources;
  return inMemoryResources;
}

export async function fetchResourcesFromCloud(): Promise<Resource[]> {
  try {
    const res = await fetch('/api/resources');
    if (res.ok) {
      const data = await res.json();
      if (data.resources && Array.isArray(data.resources)) {
        inMemoryResources = data.resources;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(data.resources));
          window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
        }
        return data.resources;
      }
    }
  } catch {
    // fallback
  }
  return getLiveResources();
}

if (typeof window !== 'undefined') {
  fetchResourcesFromCloud();
}

export function deleteResourceById(id: string): Resource[] {
  const current = getLiveResources();
  inMemoryResources = current.filter((r) => r.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(inMemoryResources));
    window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  }

  // Cloud delete
  fetch(`/api/resources?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  return inMemoryResources;
}

export function addCustomResource(resource: Resource): Resource[] {
  const current = getLiveResources();
  inMemoryResources = [resource, ...current.filter((r) => r.id !== resource.id)];

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(inMemoryResources));
    window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  }

  fetch('/api/resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resource),
  }).catch(() => {});

  return inMemoryResources;
}

export function updateExistingResource(
  resourceId: string,
  updates: Partial<Resource>
): Resource[] {
  const current = getLiveResources();
  const target = current.find((r) => r.id === resourceId);
  if (!target) return current;

  const updatedTarget: Resource = {
    ...target,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  inMemoryResources = current.map((r) => (r.id === resourceId ? updatedTarget : r));

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(inMemoryResources));
    window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  }

  fetch('/api/resources', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: resourceId, ...updates }),
  }).catch(() => {});

  return inMemoryResources;
}
