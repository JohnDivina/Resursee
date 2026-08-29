'use client';

import { Category } from '@/types/database';
import { mockCategories } from '@/lib/mockData';

const CUSTOM_CATEGORIES_KEY = 'resursee_custom_categories';
const DELETED_CATEGORIES_KEY = 'resursee_deleted_categories';

export function getDeletedCategoryIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCustomCategories(): Category[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLiveCategories(): Category[] {
  const deletedIds = getDeletedCategoryIds();
  const customList = getCustomCategories();

  const map = new Map<string, Category>();

  mockCategories.forEach((c) => {
    if (!deletedIds.includes(c.id)) {
      map.set(c.id, c);
    }
  });

  customList.forEach((c) => {
    if (!deletedIds.includes(c.id)) {
      map.set(c.id, c);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.sort_order - b.sort_order);
}

export function addCategory(category: Category): Category[] {
  if (typeof window === 'undefined') return [];
  const customList = getCustomCategories();
  const updated = [...customList.filter((c) => c.id !== category.id), category];
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));

  const deletedIds = getDeletedCategoryIds().filter((id) => id !== category.id);
  localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deletedIds));

  window.dispatchEvent(new CustomEvent('resursee_categories_updated'));
  return getLiveCategories();
}

export function deleteCategoryById(id: string): Category[] {
  if (typeof window === 'undefined') return [];
  const deletedIds = getDeletedCategoryIds();
  if (!deletedIds.includes(id)) {
    const updated = [...deletedIds, id];
    localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(updated));
  }

  const customList = getCustomCategories().filter((c) => c.id !== id);
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customList));

  window.dispatchEvent(new CustomEvent('resursee_categories_updated'));
  return getLiveCategories();
}

export function updateCategory(id: string, updates: Partial<Category>): Category[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveCategories();
  const target = current.find((c) => c.id === id);
  if (!target) return current;

  const updatedTarget: Category = {
    ...target,
    ...updates,
  };

  return addCategory(updatedTarget);
}
