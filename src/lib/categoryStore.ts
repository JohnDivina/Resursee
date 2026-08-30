'use client';

import { Category } from '@/types/database';
import { mockCategories } from '@/lib/mockData';

const CLOUD_CATEGORIES_KEY = 'resursee_cloud_categories_cache';
let inMemoryCategories: Category[] | null = null;

export function getLiveCategories(): Category[] {
  if (typeof window === 'undefined') return mockCategories;

  if (inMemoryCategories !== null) {
    return inMemoryCategories;
  }

  try {
    const cached = localStorage.getItem(CLOUD_CATEGORIES_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        inMemoryCategories = parsed;
        return inMemoryCategories;
      }
    }
  } catch {
    // ignore
  }

  inMemoryCategories = mockCategories;
  return inMemoryCategories;
}

export async function fetchCategoriesFromCloud(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      if (data.categories && Array.isArray(data.categories)) {
        inMemoryCategories = data.categories.sort((a: Category, b: Category) => a.sort_order - b.sort_order);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CLOUD_CATEGORIES_KEY, JSON.stringify(inMemoryCategories));
          window.dispatchEvent(new CustomEvent('resursee_categories_updated'));
        }
        return inMemoryCategories || [];
      }
    }
  } catch {
    // fallback
  }
  return getLiveCategories();
}

if (typeof window !== 'undefined') {
  fetchCategoriesFromCloud();
}

export function addCategory(category: Category): Category[] {
  const current = getLiveCategories();
  inMemoryCategories = [...current.filter((c) => c.id !== category.id), category].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CATEGORIES_KEY, JSON.stringify(inMemoryCategories));
    window.dispatchEvent(new CustomEvent('resursee_categories_updated'));
  }

  fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  }).catch(() => {});

  return inMemoryCategories;
}

export function deleteCategoryById(id: string): Category[] {
  const current = getLiveCategories();
  inMemoryCategories = current.filter((c) => c.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CATEGORIES_KEY, JSON.stringify(inMemoryCategories));
    window.dispatchEvent(new CustomEvent('resursee_categories_updated'));
  }

  fetch(`/api/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  return inMemoryCategories;
}

export function updateCategory(id: string, updates: Partial<Category>): Category[] {
  const current = getLiveCategories();
  const target = current.find((c) => c.id === id);
  if (!target) return current;

  const updatedTarget: Category = {
    ...target,
    ...updates,
  };

  inMemoryCategories = current
    .map((c) => (c.id === id ? updatedTarget : c))
    .sort((a, b) => a.sort_order - b.sort_order);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_CATEGORIES_KEY, JSON.stringify(inMemoryCategories));
    window.dispatchEvent(new CustomEvent('resursee_categories_updated'));
  }

  fetch('/api/categories', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  }).catch(() => {});

  return inMemoryCategories;
}
