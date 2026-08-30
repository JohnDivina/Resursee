'use client';

import { Department } from '@/types/database';
import { mockDepartments } from '@/lib/mockData';

const CLOUD_DEPARTMENTS_KEY = 'resursee_cloud_departments_cache';
let inMemoryDepartments: Department[] = [];
let hasFetchedDepartments = false;

export function getLiveDepartments(): Department[] {
  if (typeof window === 'undefined') return mockDepartments;

  if (inMemoryDepartments.length > 0) {
    return inMemoryDepartments;
  }

  try {
    const cached = localStorage.getItem(CLOUD_DEPARTMENTS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryDepartments = parsed;
        return inMemoryDepartments;
      }
    }
  } catch {
    // ignore
  }

  return mockDepartments;
}

export async function fetchDepartmentsFromCloud(): Promise<Department[]> {
  try {
    const res = await fetch('/api/departments');
    if (res.ok) {
      const data = await res.json();
      if (data.departments && Array.isArray(data.departments)) {
        inMemoryDepartments = data.departments.sort((a: Department, b: Department) =>
          a.name.localeCompare(b.name)
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(CLOUD_DEPARTMENTS_KEY, JSON.stringify(inMemoryDepartments));
          window.dispatchEvent(new CustomEvent('resursee_departments_updated'));
        }
        hasFetchedDepartments = true;
        return inMemoryDepartments;
      }
    }
  } catch {
    // fallback
  }
  return getLiveDepartments();
}

if (typeof window !== 'undefined' && !hasFetchedDepartments) {
  fetchDepartmentsFromCloud();
}

export function addDepartment(department: Department): Department[] {
  inMemoryDepartments = [...inMemoryDepartments.filter((d) => d.id !== department.id), department].sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_DEPARTMENTS_KEY, JSON.stringify(inMemoryDepartments));
    window.dispatchEvent(new CustomEvent('resursee_departments_updated'));
  }

  fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(department),
  }).catch(() => {});

  return inMemoryDepartments;
}

export function deleteDepartmentById(id: string): Department[] {
  inMemoryDepartments = inMemoryDepartments.filter((d) => d.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_DEPARTMENTS_KEY, JSON.stringify(inMemoryDepartments));
    window.dispatchEvent(new CustomEvent('resursee_departments_updated'));
  }

  fetch(`/api/departments?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  return inMemoryDepartments;
}

export function updateDepartment(id: string, updates: Partial<Department>): Department[] {
  const current = getLiveDepartments();
  const target = current.find((d) => d.id === id);
  if (!target) return current;

  const updatedTarget: Department = {
    ...target,
    ...updates,
  };

  inMemoryDepartments = inMemoryDepartments
    .map((d) => (d.id === id ? updatedTarget : d))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_DEPARTMENTS_KEY, JSON.stringify(inMemoryDepartments));
    window.dispatchEvent(new CustomEvent('resursee_departments_updated'));
  }

  fetch('/api/departments', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  }).catch(() => {});

  return inMemoryDepartments;
}
