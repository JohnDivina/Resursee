'use client';

import { Department } from '@/types/database';
import { mockDepartments } from '@/lib/mockData';

const CUSTOM_DEPARTMENTS_KEY = 'resursee_custom_departments';
const DELETED_DEPARTMENTS_KEY = 'resursee_deleted_departments';

export function getDeletedDepartmentIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_DEPARTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCustomDepartments(): Department[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_DEPARTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLiveDepartments(): Department[] {
  const deletedIds = getDeletedDepartmentIds();
  const customList = getCustomDepartments();

  const map = new Map<string, Department>();

  mockDepartments.forEach((d) => {
    if (!deletedIds.includes(d.id)) {
      map.set(d.id, d);
    }
  });

  customList.forEach((d) => {
    if (!deletedIds.includes(d.id)) {
      map.set(d.id, d);
    }
  });

  return Array.from(map.values());
}

export function addDepartment(department: Department): Department[] {
  if (typeof window === 'undefined') return [];
  const customList = getCustomDepartments();
  const updated = [...customList.filter((d) => d.id !== department.id), department];
  localStorage.setItem(CUSTOM_DEPARTMENTS_KEY, JSON.stringify(updated));

  const deletedIds = getDeletedDepartmentIds().filter((id) => id !== department.id);
  localStorage.setItem(DELETED_DEPARTMENTS_KEY, JSON.stringify(deletedIds));

  window.dispatchEvent(new CustomEvent('resursee_departments_updated'));
  return getLiveDepartments();
}

export function deleteDepartmentById(id: string): Department[] {
  if (typeof window === 'undefined') return [];
  const deletedIds = getDeletedDepartmentIds();
  if (!deletedIds.includes(id)) {
    const updated = [...deletedIds, id];
    localStorage.setItem(DELETED_DEPARTMENTS_KEY, JSON.stringify(updated));
  }

  const customList = getCustomDepartments().filter((d) => d.id !== id);
  localStorage.setItem(CUSTOM_DEPARTMENTS_KEY, JSON.stringify(customList));

  window.dispatchEvent(new CustomEvent('resursee_departments_updated'));
  return getLiveDepartments();
}

export function updateDepartment(id: string, updates: Partial<Department>): Department[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveDepartments();
  const target = current.find((d) => d.id === id);
  if (!target) return current;

  const updatedTarget: Department = {
    ...target,
    ...updates,
  };

  return addDepartment(updatedTarget);
}
