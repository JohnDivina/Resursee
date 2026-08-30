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

function safeSetLocalStorage(key: string, data: Resource[]) {
  if (typeof window === 'undefined') return;
  try {
    // Strip heavy base64 data to stay far below the 5MB browser localStorage quota
    const sanitized = data.map((item) => {
      if (item && item.file_data && item.file_data.length > 5000) {
        const { file_data, ...lightweight } = item;
        return lightweight as Resource;
      }
      return item;
    });
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch {
    try {
      const ultraLight = data.map(({ file_data, ...rest }: any) => rest);
      localStorage.setItem(key, JSON.stringify(ultraLight));
    } catch {
      // Gracefully ignore if storage full
    }
  }
}

export async function fetchResourcesFromCloud(): Promise<Resource[]> {
  try {
    const res = await fetch('/api/resources');
    if (res.ok) {
      const data = await res.json();
      if (data.resources && Array.isArray(data.resources)) {
        inMemoryResources = data.resources;
        safeSetLocalStorage(CLOUD_CACHE_KEY, data.resources);
        if (typeof window !== 'undefined') {
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

  safeSetLocalStorage(CLOUD_CACHE_KEY, inMemoryResources);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  }

  // Cloud delete
  fetch(`/api/resources?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  return inMemoryResources;
}

export function addCustomResource(resource: Resource): Resource[] {
  const current = getLiveResources();
  inMemoryResources = [resource, ...current.filter((r) => r.id !== resource.id)];

  safeSetLocalStorage(CLOUD_CACHE_KEY, inMemoryResources);
  if (typeof window !== 'undefined') {
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

  safeSetLocalStorage(CLOUD_CACHE_KEY, inMemoryResources);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  }

  fetch('/api/resources', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: resourceId, ...updates }),
  }).catch(() => {});

  return inMemoryResources;
}
