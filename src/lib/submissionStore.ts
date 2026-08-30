'use client';

import { ResourceSubmission } from '@/types/database';
import { mockSubmissions } from '@/lib/mockData';

const CLOUD_SUBMISSIONS_KEY = 'resursee_cloud_submissions_cache';
let inMemorySubmissions: ResourceSubmission[] | null = null;

export function getLiveSubmissions(): ResourceSubmission[] {
  if (typeof window === 'undefined') return mockSubmissions;

  if (inMemorySubmissions !== null) {
    return inMemorySubmissions;
  }

  try {
    const cached = localStorage.getItem(CLOUD_SUBMISSIONS_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        inMemorySubmissions = parsed;
        return inMemorySubmissions;
      }
    }
  } catch {
    // ignore
  }

  inMemorySubmissions = mockSubmissions;
  return inMemorySubmissions;
}

export async function fetchSubmissionsFromCloud(): Promise<ResourceSubmission[]> {
  try {
    const res = await fetch('/api/submissions');
    if (res.ok) {
      const data = await res.json();
      if (data.submissions && Array.isArray(data.submissions)) {
        inMemorySubmissions = data.submissions;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CLOUD_SUBMISSIONS_KEY, JSON.stringify(inMemorySubmissions));
          window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
        }
        return inMemorySubmissions || [];
      }
    }
  } catch {
    // fallback
  }
  return getLiveSubmissions();
}

if (typeof window !== 'undefined') {
  fetchSubmissionsFromCloud();
}

export function addSubmission(submission: ResourceSubmission): ResourceSubmission[] {
  const current = getLiveSubmissions();
  inMemorySubmissions = [submission, ...current.filter((s) => s.id !== submission.id)];

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_SUBMISSIONS_KEY, JSON.stringify(inMemorySubmissions));
    window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  }

  fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  }).catch(() => {});

  return inMemorySubmissions;
}

export function updateSubmissionStatus(
  id: string,
  status: 'approved' | 'rejected',
  reviewedBy: string
): ResourceSubmission[] {
  const current = getLiveSubmissions();
  const updates = {
    status,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
  };

  inMemorySubmissions = current.map((s) => (s.id === id ? { ...s, ...updates } : s));

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_SUBMISSIONS_KEY, JSON.stringify(inMemorySubmissions));
    window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  }

  fetch('/api/submissions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  }).catch(() => {});

  return inMemorySubmissions;
}

export function deleteSubmissionById(id: string): ResourceSubmission[] {
  const current = getLiveSubmissions();
  inMemorySubmissions = current.filter((s) => s.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_SUBMISSIONS_KEY, JSON.stringify(inMemorySubmissions));
    window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  }

  fetch(`/api/submissions?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  return inMemorySubmissions;
}

export function clearReviewedSubmissions(): ResourceSubmission[] {
  const current = getLiveSubmissions();
  const toDelete = current.filter((s) => s.status !== 'pending');
  inMemorySubmissions = current.filter((s) => s.status === 'pending');

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_SUBMISSIONS_KEY, JSON.stringify(inMemorySubmissions));
    window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  }

  toDelete.forEach((s) => {
    fetch(`/api/submissions?id=${encodeURIComponent(s.id)}`, { method: 'DELETE' }).catch(() => {});
  });

  return inMemorySubmissions;
}
