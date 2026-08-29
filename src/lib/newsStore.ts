'use client';

import { NewsArticle } from '@/types/database';
import { mockNewsArticles } from '@/lib/mockData';

const NEWS_STORAGE_KEY = 'resursee_news_articles';
const DELETED_NEWS_KEY = 'resursee_deleted_news_ids';

export function getDeletedNewsIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_NEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLiveNewsArticles(): NewsArticle[] {
  if (typeof window === 'undefined') return mockNewsArticles;
  try {
    const deletedIds = getDeletedNewsIds();
    const raw = localStorage.getItem(NEWS_STORAGE_KEY);
    let list: NewsArticle[] = [];

    if (!raw) {
      list = mockNewsArticles;
      localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(mockNewsArticles));
    } else {
      list = JSON.parse(raw);
    }

    return list.filter((n) => !deletedIds.includes(n.id));
  } catch {
    return mockNewsArticles;
  }
}

export function addNewsArticle(article: NewsArticle): NewsArticle[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveNewsArticles();
  const updated = [article, ...current.filter((n) => n.id !== article.id)];
  localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(updated));

  const deletedIds = getDeletedNewsIds().filter((id) => id !== article.id);
  localStorage.setItem(DELETED_NEWS_KEY, JSON.stringify(deletedIds));

  window.dispatchEvent(new CustomEvent('resursee_news_updated'));
  return updated;
}

export function deleteNewsArticleById(id: string): NewsArticle[] {
  if (typeof window === 'undefined') return [];
  const deletedIds = getDeletedNewsIds();
  if (!deletedIds.includes(id)) {
    const updatedDeleted = [...deletedIds, id];
    localStorage.setItem(DELETED_NEWS_KEY, JSON.stringify(updatedDeleted));
  }

  const current = getLiveNewsArticles().filter((n) => n.id !== id);
  localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(current));

  window.dispatchEvent(new CustomEvent('resursee_news_updated'));
  return current;
}

export function updateNewsStatus(id: string, status: 'approved' | 'rejected', reviewerName = 'Administrator'): NewsArticle[] {
  if (typeof window === 'undefined') return [];
  const current = getLiveNewsArticles();
  const updated = current.map((n) =>
    n.id === id
      ? {
          ...n,
          status,
          reviewed_by: reviewerName,
          reviewed_at: new Date().toISOString(),
          published_at: status === 'approved' ? new Date().toISOString() : n.published_at,
        }
      : n
  );
  localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('resursee_news_updated'));
  return updated;
}
