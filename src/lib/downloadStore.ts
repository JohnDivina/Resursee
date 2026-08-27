'use client';

import { useState, useEffect } from 'react';
import { mockResources } from './mockData';

const DOWNLOAD_STORAGE_KEY = 'resursee-downloads-map';
const DOWNLOAD_EVENT_NAME = 'resursee-download-updated';

// Get map of { [resourceId: string]: number }
export function getStoredDownloads(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DOWNLOAD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Calculate the total real-time downloads across the entire catalog
export function calculateTotalDownloads(): number {
  const map = getStoredDownloads();
  return mockResources.reduce((acc, res) => {
    const count = map[res.id] !== undefined ? map[res.id] : res.download_count;
    return acc + count;
  }, 0);
}

// Increment download count for a given resource ID and broadcast in real-time
export function recordDownload(resourceId: string, baseCount = 0): number {
  if (typeof window === 'undefined') return baseCount + 1;
  try {
    const map = getStoredDownloads();
    const current = map[resourceId] !== undefined ? map[resourceId] : baseCount;
    const next = current + 1;
    map[resourceId] = next;
    localStorage.setItem(DOWNLOAD_STORAGE_KEY, JSON.stringify(map));

    // Dispatch global custom event for instant cross-component updates
    window.dispatchEvent(
      new CustomEvent(DOWNLOAD_EVENT_NAME, {
        detail: { resourceId, count: next },
      })
    );

    return next;
  } catch {
    return baseCount + 1;
  }
}

// React hook to access real-time download count for a specific resource
export function useRealtimeDownloadCount(resourceId: string, initialCount = 0): number {
  const [count, setCount] = useState<number>(() => {
    if (typeof window === 'undefined') return initialCount;
    const map = getStoredDownloads();
    return map[resourceId] !== undefined ? map[resourceId] : initialCount;
  });

  useEffect(() => {
    const map = getStoredDownloads();
    if (map[resourceId] !== undefined) {
      setCount(map[resourceId]);
    }

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ resourceId: string; count: number }>;
      if (customEvent.detail && customEvent.detail.resourceId === resourceId) {
        setCount(customEvent.detail.count);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === DOWNLOAD_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed[resourceId] !== undefined) {
            setCount(parsed[resourceId]);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener(DOWNLOAD_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(DOWNLOAD_EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [resourceId]);

  return count;
}

// React hook to access real-time total platform downloads/usage
export function useRealtimeTotalDownloads(): number {
  const [total, setTotal] = useState<number>(() => {
    if (typeof window === 'undefined') {
      return mockResources.reduce((acc, r) => acc + r.download_count, 0);
    }
    return calculateTotalDownloads();
  });

  useEffect(() => {
    setTotal(calculateTotalDownloads());

    const handleUpdate = () => {
      setTotal(calculateTotalDownloads());
    };

    window.addEventListener(DOWNLOAD_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(DOWNLOAD_EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return total;
}
