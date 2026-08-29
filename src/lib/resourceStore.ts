'use client';

import { Resource } from '@/types/database';
import { mockResources } from '@/lib/mockData';

const DELETED_STORAGE_KEY = 'resursee_deleted_resource_ids';
const CUSTOM_STORAGE_KEY = 'resursee_custom_resources';

export function getDeletedResourceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCustomResources(): Resource[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLiveResources(): Resource[] {
  const deletedIds = getDeletedResourceIds();
  const customList = getCustomResources();

  const map = new Map<string, Resource>();

  // 1. Put base mock resources first
  mockResources.forEach((r) => {
    if (!deletedIds.includes(r.id)) {
      map.set(r.id, r);
    }
  });

  // 2. Custom resources & revisions override base resources with identical IDs
  customList.forEach((r) => {
    if (!deletedIds.includes(r.id)) {
      map.set(r.id, r);
    }
  });

  return Array.from(map.values());
}

export function deleteResourceById(id: string): Resource[] {
  if (typeof window === 'undefined') return [];
  const currentDeleted = getDeletedResourceIds();
  if (!currentDeleted.includes(id)) {
    const updated = [...currentDeleted, id];
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(updated));
  }

  // Also remove from custom resources if present
  const customList = getCustomResources().filter((r) => r.id !== id);
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customList));

  // Dispatch real-time update event
  window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  return getLiveResources();
}

export function addCustomResource(resource: Resource): Resource[] {
  if (typeof window === 'undefined') return [];
  const customList = getCustomResources();
  // Deduplicate by ID to prevent duplicate items when updating revisions
  const updated = [resource, ...customList.filter((r) => r.id !== resource.id)];
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(updated));

  // Ensure it's not marked as deleted
  const currentDeleted = getDeletedResourceIds().filter((id) => id !== resource.id);
  localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(currentDeleted));

  window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  return getLiveResources();
}

export function updateExistingResource(
  resourceId: string,
  updates: Partial<Resource>
): Resource[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveResources();
  const target = current.find((r) => r.id === resourceId);
  if (!target) return current;

  const updatedTarget: Resource = {
    ...target,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  return addCustomResource(updatedTarget);
}
