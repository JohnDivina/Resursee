export type ReadingTheme = 'paper' | 'sepia' | 'dark' | 'midnight';
export type FontFamily = 'serif' | 'sans' | 'mono' | 'opendyslexic';
export type LineHeight = 'tight' | 'normal' | 'loose';
export type MarginWidth = 'narrow' | 'normal' | 'wide';
export type TextAlign = 'left' | 'justify';

export interface EbookChapter {
  id: string;
  title: string;
  content: string; // Cleaned HTML / formatted text paragraphs
  order: number;
  wordCount: number;
}

export interface Ebook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  language?: string;
  subjects?: string[];
  downloadCount?: number;
  isOffline: boolean;
  downloadedAt?: number;
  lastReadAt?: number;
  currentChapterIndex: number;
  currentScrollProgress: number; // 0 to 100
  totalChapters: number;
  chapters: EbookChapter[];
  sourceUrl?: string;
  fileSize?: string;
}

export interface ReadingSettings {
  fontFamily: FontFamily;
  fontSize: number; // in pixels, e.g. 18
  lineHeight: LineHeight;
  marginWidth: MarginWidth;
  textAlign: TextAlign;
  readingTheme: ReadingTheme;
  bionicReading: boolean;
  ttsSpeed: number; // 0.75, 1.0, 1.25, 1.5, 2.0
  ttsVoiceName?: string;
}

export interface EbookHighlight {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterIndex: number;
  chapterTitle: string;
  text: string;
  note?: string;
  createdAt: number;
  color: string;
}

export interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  translators: { name: string }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: Record<string, string>;
  download_count: number;
}

export interface GutendexResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}
