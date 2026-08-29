'use client';

import { ResourceSubmission } from '@/types/database';
import { mockSubmissions } from '@/lib/mockData';

const SUBMISSIONS_STORAGE_KEY = 'resursee_contributed_submissions';
const DELETED_SUBMISSIONS_KEY = 'resursee_deleted_submission_ids';

export function getDeletedSubmissionIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLiveSubmissions(): ResourceSubmission[] {
  if (typeof window === 'undefined') return mockSubmissions;
  try {
    const deletedIds = getDeletedSubmissionIds();
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    let list: ResourceSubmission[] = [];

    if (!raw) {
      list = mockSubmissions;
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(mockSubmissions));
    } else {
      list = JSON.parse(raw);
    }

    return list.filter((s) => !deletedIds.includes(s.id));
  } catch {
    return mockSubmissions;
  }
}

export function addSubmission(submission: ResourceSubmission): ResourceSubmission[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveSubmissions();
  const updated = [submission, ...current.filter((s) => s.id !== submission.id)];
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));

  // Ensure it's not in deleted IDs
  const deletedIds = getDeletedSubmissionIds().filter((id) => id !== submission.id);
  localStorage.setItem(DELETED_SUBMISSIONS_KEY, JSON.stringify(deletedIds));

  // Async sync to server
  try {
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...submission }),
    }).catch(() => {});
  } catch {
    // ignore
  }

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

  // Async sync to server
  try {
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', id, status, reviewed_by: reviewedBy }),
    }).catch(() => {});
  } catch {
    // ignore
  }

  window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  return updated;
}

export function deleteSubmissionById(id: string): ResourceSubmission[] {
  if (typeof window === 'undefined') return [];
  const deletedIds = getDeletedSubmissionIds();
  if (!deletedIds.includes(id)) {
    const updatedDeleted = [...deletedIds, id];
    localStorage.setItem(DELETED_SUBMISSIONS_KEY, JSON.stringify(updatedDeleted));
  }

  const current = getLiveSubmissions().filter((s) => s.id !== id);
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(current));

  // Async sync to server
  try {
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    }).catch(() => {});
  } catch {
    // ignore
  }

  window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  return current;
}

export function clearReviewedSubmissions(): ResourceSubmission[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveSubmissions();
  const reviewedIds = current.filter((s) => s.status !== 'pending').map((s) => s.id);

  const deletedIds = getDeletedSubmissionIds();
  const newDeletedIds = Array.from(new Set([...deletedIds, ...reviewedIds]));
  localStorage.setItem(DELETED_SUBMISSIONS_KEY, JSON.stringify(newDeletedIds));

  const remaining = current.filter((s) => s.status === 'pending');
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(remaining));

  // Async sync to server
  try {
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_reviewed' }),
    }).catch(() => {});
  } catch {
    // ignore
  }

  window.dispatchEvent(new CustomEvent('resursee_submissions_updated'));
  return remaining;
}
