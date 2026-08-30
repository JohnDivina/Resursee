'use client';

import { NewsArticle } from '@/types/database';
import { mockNewsArticles } from '@/lib/mockData';

const CLOUD_NEWS_KEY = 'resursee_cloud_news_cache';
let inMemoryNews: NewsArticle[] = [];
let hasFetchedNews = false;

export function getLiveNewsArticles(): NewsArticle[] {
  if (typeof window === 'undefined') return mockNewsArticles;

  if (inMemoryNews.length > 0) {
    return inMemoryNews;
  }

  try {
    const cached = localStorage.getItem(CLOUD_NEWS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryNews = parsed;
        return inMemoryNews;
      }
    }
  } catch {
    // ignore
  }

  return mockNewsArticles;
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
        hasFetchedNews = true;
        return inMemoryNews;
      }
    }
  } catch {
    // fallback
  }
  return getLiveNewsArticles();
}

if (typeof window !== 'undefined' && !hasFetchedNews) {
  fetchNewsFromCloud();
}

export function addNewsArticle(article: NewsArticle): NewsArticle[] {
  inMemoryNews = [article, ...inMemoryNews.filter((n) => n.id !== article.id)];

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
  inMemoryNews = inMemoryNews.filter((n) => n.id !== id);

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
  const updates = {
    status,
    reviewed_by: reviewerName,
    reviewed_at: new Date().toISOString(),
    published_at: status === 'approved' ? new Date().toISOString() : null,
  };

  inMemoryNews = inMemoryNews.map((n) => (n.id === id ? { ...n, ...updates } : n));

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
