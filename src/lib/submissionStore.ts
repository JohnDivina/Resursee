'use client';

import { ResourceSubmission } from '@/types/database';
import { mockSubmissions } from '@/lib/mockData';

const CLOUD_SUBMISSIONS_KEY = 'resursee_cloud_submissions_cache';
let inMemorySubmissions: ResourceSubmission[] = [];
let hasFetchedSubmissions = false;

export function getLiveSubmissions(): ResourceSubmission[] {
  if (typeof window === 'undefined') return mockSubmissions;

  if (inMemorySubmissions.length > 0) {
    return inMemorySubmissions;
  }

  try {
    const cached = localStorage.getItem(CLOUD_SUBMISSIONS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemorySubmissions = parsed;
        return inMemorySubmissions;
      }
    }
  } catch {
    // ignore
  }

  return mockSubmissions;
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
        hasFetchedSubmissions = true;
        return inMemorySubmissions;
      }
    }
  } catch {
    // fallback
  }
  return getLiveSubmissions();
}

if (typeof window !== 'undefined' && !hasFetchedSubmissions) {
  fetchSubmissionsFromCloud();
}

export function addSubmission(submission: ResourceSubmission): ResourceSubmission[] {
  inMemorySubmissions = [submission, ...inMemorySubmissions.filter((s) => s.id !== submission.id)];

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
  const updates = {
    status,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
  };

  inMemorySubmissions = inMemorySubmissions.map((s) => (s.id === id ? { ...s, ...updates } : s));

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
  inMemorySubmissions = inMemorySubmissions.filter((s) => s.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_SUBMISSIONS_KEY, JSON.stringify(inMemorySubmissions));
    window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  }

  fetch(`/api/submissions?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  return inMemorySubmissions;
}

export function clearReviewedSubmissions(): ResourceSubmission[] {
  const toDelete = inMemorySubmissions.filter((s) => s.status !== 'pending');
  inMemorySubmissions = inMemorySubmissions.filter((s) => s.status === 'pending');

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_SUBMISSIONS_KEY, JSON.stringify(inMemorySubmissions));
    window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  }

  toDelete.forEach((s) => {
    fetch(`/api/submissions?id=${encodeURIComponent(s.id)}`, { method: 'DELETE' }).catch(() => {});
  });

  return inMemorySubmissions;
}
