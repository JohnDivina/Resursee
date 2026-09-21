import { get, set, del, keys, entries } from 'idb-keyval';
import { Ebook, EbookHighlight, ReadingSettings } from '@/types/ebook';

const SETTINGS_KEY = 'resursee_reader_settings';
const HIGHLIGHTS_KEY = 'resursee_reader_highlights';
const IDB_BOOK_PREFIX = 'ebook_';

export const DEFAULT_READING_SETTINGS: ReadingSettings = {
  fontFamily: 'serif',
  fontSize: 18,
  lineHeight: 'normal',
  marginWidth: 'normal',
  textAlign: 'left',
  readingTheme: 'paper',
  bionicReading: false,
  ttsSpeed: 1.0,
};

/**
 * Retrieves all offline downloaded/imported books stored in IndexedDB.
 */
export async function getOfflineBooks(): Promise<Ebook[]> {
  try {
    const allEntries = await entries();
    const books: Ebook[] = [];
    for (const [key, value] of allEntries) {
      if (typeof key === 'string' && key.startsWith(IDB_BOOK_PREFIX)) {
        if (value && typeof value === 'object') {
          books.push(value as Ebook);
        }
      }
    }
    // Sort by last read, then by downloaded date
    return books.sort((a, b) => (b.lastReadAt || b.downloadedAt || 0) - (a.lastReadAt || a.downloadedAt || 0));
  } catch (err) {
    console.error('Failed to load offline books from IndexedDB:', err);
    return [];
  }
}

/**
 * Retrieves a single book by ID from IndexedDB.
 */
export async function getOfflineBook(bookId: string): Promise<Ebook | null> {
  try {
    const book = await get(`${IDB_BOOK_PREFIX}${bookId}`);
    return book ? (book as Ebook) : null;
  } catch (err) {
    console.error(`Failed to load book ${bookId} from IndexedDB:`, err);
    return null;
  }
}

/**
 * Saves a book into IndexedDB for 100% offline availability.
 */
export async function saveBookOffline(book: Ebook): Promise<void> {
  try {
    const updatedBook: Ebook = {
      ...book,
      isOffline: true,
      downloadedAt: book.downloadedAt || Date.now(),
    };
    await set(`${IDB_BOOK_PREFIX}${book.id}`, updatedBook);
  } catch (err) {
    console.error(`Failed to save book ${book.id} to IndexedDB:`, err);
    throw err;
  }
}

/**
 * Deletes a book from offline IndexedDB storage.
 */
export async function removeBookOffline(bookId: string): Promise<void> {
  try {
    await del(`${IDB_BOOK_PREFIX}${bookId}`);
  } catch (err) {
    console.error(`Failed to delete book ${bookId} from IndexedDB:`, err);
  }
}

/**
 * Updates reading progress for an active book.
 */
export async function updateReadingProgress(
  bookId: string,
  chapterIndex: number,
  scrollProgress: number
): Promise<void> {
  try {
    const book = await getOfflineBook(bookId);
    if (book) {
      const updated: Ebook = {
        ...book,
        currentChapterIndex: chapterIndex,
        currentScrollProgress: scrollProgress,
        lastReadAt: Date.now(),
      };
      await set(`${IDB_BOOK_PREFIX}${bookId}`, updated);
    }
  } catch (err) {
    console.error(`Failed to update reading progress for ${bookId}:`, err);
  }
}

/**
 * Loads reading preferences from localStorage.
 */
export function getReadingSettings(): ReadingSettings {
  if (typeof window === 'undefined') return DEFAULT_READING_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_READING_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_READING_SETTINGS;
}

/**
 * Persists reading preferences to localStorage.
 */
export function saveReadingSettings(settings: ReadingSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

/**
 * Retrieves all saved highlights.
 */
export function getSavedHighlights(bookId?: string): EbookHighlight[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(HIGHLIGHTS_KEY);
    if (saved) {
      const parsed: EbookHighlight[] = JSON.parse(saved);
      if (bookId) {
        return parsed.filter((h) => h.bookId === bookId);
      }
      return parsed;
    }
  } catch {}
  return [];
}

/**
 * Saves a new highlight or note.
 */
export function saveHighlight(highlight: EbookHighlight): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedHighlights();
    const updated = [highlight, ...existing.filter((h) => h.id !== highlight.id)];
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Deletes a highlight.
 */
export function deleteHighlight(highlightId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedHighlights();
    const updated = existing.filter((h) => h.id !== highlightId);
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Calculates total storage used by offline books in IndexedDB.
 */
export async function getStorageEstimate(): Promise<{ bookCount: number; estimatedSizeMb: string }> {
  try {
    const books = await getOfflineBooks();
    const totalChars = books.reduce((acc, b) => {
      const chapterChars = b.chapters.reduce((cAcc, c) => cAcc + c.content.length, 0);
      return acc + chapterChars;
    }, 0);
    // Approximate 1 char ~ 2 bytes in UTF-16
    const megabytes = (totalChars * 2) / (1024 * 1024);
    return {
      bookCount: books.length,
      estimatedSizeMb: megabytes.toFixed(2),
    };
  } catch {
    return { bookCount: 0, estimatedSizeMb: '0.00' };
  }
}
