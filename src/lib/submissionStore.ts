'use client';

import { ResourceSubmission } from '@/types/database';
import { mockSubmissions } from '@/lib/mockData';

const SUBMISSIONS_STORAGE_KEY = 'resursee_contributed_submissions';

export function getLiveSubmissions(): ResourceSubmission[] {
  if (typeof window === 'undefined') return mockSubmissions;
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(mockSubmissions));
      return mockSubmissions;
    }
    const custom: ResourceSubmission[] = JSON.parse(raw);
    // Combine custom with mockSubmissions ensuring uniqueness by id
    const map = new Map<string, ResourceSubmission>();
    [...custom, ...mockSubmissions].forEach((s) => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    return Array.from(map.values());
  } catch {
    return mockSubmissions;
  }
}

export function addSubmission(submission: ResourceSubmission): ResourceSubmission[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveSubmissions();
  const updated = [submission, ...current.filter((s) => s.id !== submission.id)];
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  return updated;
}

export function updateSubmissionStatus(
  id: string,
  status: 'approved' | 'rejected',
  reviewedBy: string
): ResourceSubmission[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveSubmissions();
  const updated = current.map((s) =>
    s.id === id
      ? {
          ...s,
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        }
      : s
  );
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  return updated;
}
