'use client';

import { Resource } from '@/types/database';
import { mockResources } from '@/lib/mockData';

const CLOUD_CACHE_KEY = 'resursee_cloud_resources_cache';
const DELETED_STORAGE_KEY = 'resursee_deleted_resource_ids';

let inMemoryResources: Resource[] = [];
let hasFetchedFromCloud = false;

export function getLiveResources(): Resource[] {
  if (typeof window === 'undefined') return mockResources;

  if (inMemoryResources.length > 0) {
    return inMemoryResources;
  }

  try {
    const cached = localStorage.getItem(CLOUD_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryResources = parsed;
        return inMemoryResources;
      }
    }
  } catch {
    // ignore
  }

  return mockResources;
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
        hasFetchedFromCloud = true;
        return data.resources;
      }
    }
  } catch {
    // fallback to cache
  }
  return getLiveResources();
}

// Auto-trigger cloud fetch in browser
if (typeof window !== 'undefined' && !hasFetchedFromCloud) {
  fetchResourcesFromCloud();
}

export function deleteResourceById(id: string): Resource[] {
  // 1. Optimistic local update
  inMemoryResources = inMemoryResources.filter((r) => r.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(inMemoryResources));
    window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  }

  // 2. Cloud delete
  fetch(`/api/resources?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  return inMemoryResources;
}

export function addCustomResource(resource: Resource): Resource[] {
  inMemoryResources = [resource, ...inMemoryResources.filter((r) => r.id !== resource.id)];
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(inMemoryResources));
    window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  }

  // Cloud create
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

  inMemoryResources = inMemoryResources.map((r) => (r.id === resourceId ? updatedTarget : r));
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(inMemoryResources));
    window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  }

  // Cloud update
  fetch('/api/resources', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: resourceId, ...updates }),
  }).catch(() => {});

  return inMemoryResources;
}
