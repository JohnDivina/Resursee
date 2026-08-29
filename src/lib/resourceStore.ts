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

  // Combine custom published resources with base mockResources, excluding deleted items
  const combined = [...customList, ...mockResources];
  return combined.filter((r) => !deletedIds.includes(r.id));
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
  const updated = [resource, ...customList];
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(updated));

  // Ensure it's not marked as deleted
  const currentDeleted = getDeletedResourceIds().filter((id) => id !== resource.id);
  localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(currentDeleted));

  window.dispatchEvent(new CustomEvent('resursee_catalog_updated'));
  return getLiveResources();
}
