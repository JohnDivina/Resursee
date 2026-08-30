'use client';

import { NewsArticle } from '@/types/database';
import { mockNewsArticles } from '@/lib/mockData';

const CLOUD_NEWS_KEY = 'resursee_cloud_news_cache';
let inMemoryNews: NewsArticle[] | null = null;

export function getLiveNewsArticles(): NewsArticle[] {
  if (typeof window === 'undefined') return mockNewsArticles;

  if (inMemoryNews !== null) {
    return inMemoryNews;
  }

  try {
    const cached = localStorage.getItem(CLOUD_NEWS_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        inMemoryNews = parsed;
        return inMemoryNews;
      }
    }
  } catch {
    // ignore
  }

  inMemoryNews = mockNewsArticles;
  return inMemoryNews;
}

export async function fetchNewsFromCloud(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('/api/news');
    if (res.ok) {
      const data = await res.json();
      if (data.news && Array.isArray(data.news)) {
        inMemoryNews = data.news;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CLOUD_NEWS_KEY, JSON.stringify(inMemoryNews));
          window.dispatchEvent(new CustomEvent('resursee_news_updated'));
        }
        return inMemoryNews || [];
      }
    }
  } catch {
    // fallback
  }
  return getLiveNewsArticles();
}

if (typeof window !== 'undefined') {
  fetchNewsFromCloud();
}

export function addNewsArticle(article: NewsArticle): NewsArticle[] {
  const current = getLiveNewsArticles();
  inMemoryNews = [article, ...current.filter((n) => n.id !== article.id)];

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_NEWS_KEY, JSON.stringify(inMemoryNews));
    window.dispatchEvent(new CustomEvent('resursee_news_updated'));
  }

  fetch('/api/news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article),
  }).catch(() => {});

  return inMemoryNews;
}

export function deleteNewsArticleById(id: string): NewsArticle[] {
  const current = getLiveNewsArticles();
  inMemoryNews = current.filter((n) => n.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_NEWS_KEY, JSON.stringify(inMemoryNews));
    window.dispatchEvent(new CustomEvent('resursee_news_updated'));
  }

  fetch(`/api/news?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  return inMemoryNews;
}

export function updateNewsStatus(
  id: string,
  status: 'approved' | 'rejected',
  reviewerName = 'Administrator'
): NewsArticle[] {
  const current = getLiveNewsArticles();
  const updates = {
    status,
    reviewed_by: reviewerName,
    reviewed_at: new Date().toISOString(),
    published_at: status === 'approved' ? new Date().toISOString() : null,
  };

  inMemoryNews = current.map((n) => (n.id === id ? { ...n, ...updates } : n));

  if (typeof window !== 'undefined') {
    localStorage.setItem(CLOUD_NEWS_KEY, JSON.stringify(inMemoryNews));
    window.dispatchEvent(new CustomEvent('resursee_news_updated'));
  }

  fetch('/api/news', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  }).catch(() => {});

  return inMemoryNews;
}
