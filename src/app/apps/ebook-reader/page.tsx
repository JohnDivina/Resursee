'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Ebook, ReadingSettings, EbookHighlight, GutendexBook } from '@/types/ebook';
import {
  getOfflineBooks,
  saveBookOffline,
  removeBookOffline,
  updateReadingProgress,
  getReadingSettings,
  saveReadingSettings,
  getSavedHighlights,
  saveHighlight,
  deleteHighlight,
  getStorageEstimate,
} from '@/lib/ebookStorage';
import {
  CURATED_OFFLINE_BOOKS,
  searchOnlineCatalog,
  downloadOnlineBook,
} from '@/lib/curatedBooks';
import { Sidebar, SidebarBody, SidebarLink, Links } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme/ThemeToggle';
import BookCard from '@/components/ebook/BookCard';
import ReaderToolbar from '@/components/ebook/ReaderToolbar';
import ReaderCanvas from '@/components/ebook/ReaderCanvas';
import ChapterDrawer from '@/components/ebook/ChapterDrawer';
import ImportBookModal from '@/components/ebook/ImportBookModal';
import {
  Compass,
  Bookmarks,
  BookOpen,
  BookmarkSimple,
  Gear,
  MagnifyingGlass,
  UploadSimple,
  ArrowLeft,
  Trash,
  DownloadSimple,
  HardDrives,
  CheckCircle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

type Tab = 'discover' | 'library' | 'reader' | 'highlights' | 'settings';

export default function EbookReaderPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('discover');

  // Offline Bookshelf State
  const [offlineBooks, setOfflineBooks] = useState<Ebook[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  // Active Reader State
  const [activeBook, setActiveBook] = useState<Ebook | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>(getReadingSettings());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Online Discover & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GutendexBook[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [downloadingBookId, setDownloadingBookId] = useState<string | number | null>(null);

  // Highlights State
  const [highlights, setHighlights] = useState<EbookHighlight[]>([]);

  // Modals & Storage Stats
  const [showImportModal, setShowImportModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ bookCount: number; estimatedSizeMb: string }>({
    bookCount: 0,
    estimatedSizeMb: '0.00',
  });

  // Text to Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Library & Preload Default Books
  const refreshLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const stored = await getOfflineBooks();
      if (stored.length === 0) {
        // Pre-save initial curated books into IndexedDB so user can test offline immediately
        for (const book of CURATED_OFFLINE_BOOKS) {
          await saveBookOffline(book);
        }
        setOfflineBooks(CURATED_OFFLINE_BOOKS);
      } else {
        setOfflineBooks(stored);
      }
      const estimate = await getStorageEstimate();
      setStorageInfo(estimate);
    } catch (err) {
      console.error('Error refreshing library:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    refreshLibrary();
    setHighlights(getSavedHighlights());
    // Initial catalog fetch
    handleSearch('');
  }, []);

  // Sync active reading progress
  useEffect(() => {
    if (activeBook) {
      updateReadingProgress(activeBook.id, activeChapterIndex, activeBook.currentScrollProgress || 0);
    }
  }, [activeBook, activeChapterIndex]);

  // Catalog search handler
  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const books = await searchOnlineCatalog(query);
      setSearchResults(books);
    } catch (err) {
      console.error('Catalog search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Launch Reader for a Book
  const handleOpenBook = (book: Ebook) => {
    setActiveBook(book);
    setActiveChapterIndex(book.currentChapterIndex || 0);
    setActiveTab('reader');
  };

  // Download Online Book to Offline IndexedDB
  const handleDownloadBook = async (book: GutendexBook | Ebook) => {
    setDownloadingBookId(book.id);
    try {
      let fullEbook: Ebook;
      if ('chapters' in book) {
        fullEbook = { ...book, isOffline: true, downloadedAt: Date.now() };
      } else {
        fullEbook = await downloadOnlineBook(book);
      }
      await saveBookOffline(fullEbook);
      await refreshLibrary();
    } catch (err) {
      alert('Failed to download book for offline reading.');
      console.error(err);
    } finally {
      setDownloadingBookId(null);
    }
  };

  // Delete Book from Offline
  const handleRemoveOffline = async (bookId: string) => {
    await removeBookOffline(bookId);
    if (activeBook?.id === bookId) {
      setActiveBook(null);
      if (activeTab === 'reader') setActiveTab('library');
    }
    await refreshLibrary();
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<ReadingSettings>) => {
    setReadingSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveReadingSettings(updated);
      return updated;
    });
  };

  // Highlights handlers
  const handleSaveHighlight = (hl: EbookHighlight) => {
    saveHighlight(hl);
    setHighlights(getSavedHighlights());
  };

  const handleDeleteHighlight = (hlId: string) => {
    deleteHighlight(hlId);
    setHighlights(getSavedHighlights());
  };

  // TTS Speech Control
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser environment.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!activeBook || !activeBook.chapters[activeChapterIndex]) return;

    const currentChapter = activeBook.chapters[activeChapterIndex];
    const plainText = currentChapter.content.replace(/<[^>]*>/g, ' ');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = readingSettings.ttsSpeed || 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Sidebar Links
  const sidebarLinks: Links[] = [
    {
      label: 'Discover Catalog',
      icon: <Compass size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'discover',
      onClick: () => setActiveTab('discover'),
    },
    {
      label: 'My Bookshelf',
      icon: <Bookmarks size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'library',
      onClick: () => {
        refreshLibrary();
        setActiveTab('library');
      },
    },
    {
      label: 'Now Reading',
      icon: <BookOpen size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'reader',
      onClick: () => {
        if (!activeBook && offlineBooks.length > 0) {
          setActiveBook(offlineBooks[0]);
          setActiveChapterIndex(offlineBooks[0].currentChapterIndex || 0);
        }
        setActiveTab('reader');
      },
    },
    {
      label: 'Highlights & Notes',
      icon: <BookmarkSimple size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'highlights',
      onClick: () => setActiveTab('highlights'),
    },
    {
      label: 'Reader Settings',
      icon: <Gear size={18} weight="bold" className="shrink-0 text-neutral-700 dark:text-neutral-200" />,
      isActive: activeTab === 'settings',
      onClick: () => setActiveTab('settings'),
    },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#0c0c0e] font-sans antialiased text-neutral-900 dark:text-neutral-100">
      {/* Collapsible Sidebar matching system architecture */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="flex flex-col justify-between h-full border-r border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-[#111114]/90 backdrop-blur-md">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {/* Top-Left Back Button */}
            <div className="mb-4 pt-1">
              <SidebarLink
                link={{
                  label: 'Back to Hub',
                  href: '/#apps',
                  icon: <ArrowLeft size={18} weight="bold" className="text-neutral-600 dark:text-neutral-400" />,
                }}
              />
            </div>

            {/* Brand Header */}
            <div className="mb-6 px-1">
              <div className="flex items-center gap-2.5 py-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs font-black">
                  B
                </div>
                <motion.div
                  animate={{
                    display: sidebarOpen ? 'flex' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="flex flex-col truncate min-w-0"
                >
                  <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                    Ebook Sanctuary
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400 truncate">
                    Modern Offline Reader
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>

            {/* Import Local Book Shortcut in Sidebar */}
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer text-xs font-bold',
                  sidebarOpen ? 'px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800/60' : 'justify-center py-2'
                )}
                title="Import local .epub or .txt ebook"
              >
                <UploadSimple size={18} className="shrink-0" />
                {sidebarOpen && <span>Import Ebook</span>}
              </button>
            </div>
          </div>

          {/* Bottom Sidebar Controls with ThemeToggle */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col gap-2">
            <div
              className={cn(
                'flex items-center px-1 pt-1',
                sidebarOpen ? 'justify-between' : 'justify-center'
              )}
            >
              <ThemeToggle />
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500"
              >
                Dark / Light
              </motion.span>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-neutral-50/50 dark:bg-[#0c0c0e]">
        {/* TAB 1: DISCOVER & CATALOG */}
        {activeTab === 'discover' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            {/* Hero / Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/60 pb-6 dark:border-neutral-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-neutral-900 dark:text-white">
                  Discover &amp; Download Ebooks
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Explore thousands of public domain masterpieces, fantasy epics, and classic literature. Download with 1-click for 100% offline reading.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition"
                >
                  <UploadSimple size={15} weight="bold" />
                  <span>Import .epub / .txt</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(searchQuery);
                }}
                placeholder="Search by title, author, or genre (e.g. ice and fire, Dracula, Shakespeare, strategy)..."
                className="w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-24 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleSearch(searchQuery)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 dark:bg-white dark:text-neutral-900 cursor-pointer transition"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Genre Quick Filters */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                'All',
                'Fantasy & Lore',
                'Classic Literature',
                'Gothic & Horror',
                'Science Fiction',
                'Philosophy & Strategy',
              ].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setSelectedGenre(g);
                    if (g === 'All') handleSearch('');
                    else if (g === 'Fantasy & Lore') handleSearch('ice fire fantasy');
                    else if (g === 'Classic Literature') handleSearch('Shakespeare');
                    else if (g === 'Gothic & Horror') handleSearch('Dracula');
                    else if (g === 'Science Fiction') handleSearch('Frankenstein time');
                    else if (g === 'Philosophy & Strategy') handleSearch('war philosophy');
                  }}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer',
                    selectedGenre === g
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-2xs'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Preloaded Curated Spotlight: A Song of Ice and Fire Lore */}
            {selectedGenre === 'All' && !searchQuery && (
              <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 text-white shadow-md dark:border-neutral-800">
                <div className="relative z-10 max-w-xl space-y-3">
                  <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                    Offline Fantasy Spotlight
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-white">
                    A Song of Ice and Fire: The World &amp; Lore Chronicles
                  </h2>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Explore the ancient history of Westeros, the Doom of Valyria, the dragons of Aegon, the Kings of Winter, and the Long Night. Fully pre-loaded and ready for instant offline reading.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenBook(CURATED_OFFLINE_BOOKS[0])}
                      className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-neutral-950 shadow-xs hover:bg-neutral-100 cursor-pointer transition"
                    >
                      <BookOpen size={15} weight="bold" />
                      <span>Start Reading Lore</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Books Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {searchQuery ? `Search Results (${searchResults.length})` : 'Popular Offline & Online Books'}
                </h3>
                <span className="font-mono text-xs text-neutral-400">
                  {offlineBooks.length} saved offline
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {searchResults.map((book) => {
                  const isOffline = offlineBooks.some(
                    (ob) => ob.title.toLowerCase() === book.title.toLowerCase() || ob.id === `gutenberg_${book.id}`
                  );
                  const matchedOffline = offlineBooks.find(
                    (ob) => ob.title.toLowerCase() === book.title.toLowerCase() || ob.id === `gutenberg_${book.id}`
                  );

                  // Map to Ebook format for BookCard
                  const displayBook: Ebook = matchedOffline || {
                    id: String(book.id),
                    title: book.title,
                    author: book.authors[0]?.name || 'Unknown Author',
                    coverUrl: book.formats['image/jpeg'],
                    subjects: book.subjects,
                    downloadCount: book.download_count,
                    isOffline,
                    currentChapterIndex: 0,
                    currentScrollProgress: 0,
                    totalChapters: 1,
                    chapters: [],
                  };

                  return (
                    <BookCard
                      key={book.id}
                      book={displayBook}
                      onRead={async (b) => {
                        if (matchedOffline) {
                          handleOpenBook(matchedOffline);
                        } else {
                          await handleDownloadBook(book);
                          const fresh = await getOfflineBooks();
                          const found = fresh.find((f) => f.title.toLowerCase() === book.title.toLowerCase());
                          if (found) handleOpenBook(found);
                        }
                      }}
                      onDownload={() => handleDownloadBook(book)}
                      onRemoveOffline={handleRemoveOffline}
                      isDownloading={downloadingBookId === book.id}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY BOOKSHELF */}
        {activeTab === 'library' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/60 pb-6 dark:border-neutral-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-neutral-900 dark:text-white">
                  My Offline Bookshelf
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  All books downloaded or imported into local IndexedDB storage. Read completely offline anytime.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-bold text-white shadow-2xs hover:opacity-90 dark:bg-white dark:text-neutral-900 cursor-pointer transition"
                >
                  <UploadSimple size={15} weight="bold" />
                  <span>Import Local Book</span>
                </button>
              </div>
            </div>

            {/* Offline Shelf Grid */}
            {offlineBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 py-16 text-center">
                <Bookmarks size={40} className="text-neutral-400 mb-3" />
                <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                  Your Bookshelf is Empty
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Discover classic titles from our catalog or import your own .epub / .txt files for instant offline reading.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('discover')}
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:opacity-90 dark:bg-white dark:text-neutral-900 cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 cursor-pointer"
                  >
                    Import .epub
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {offlineBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onRead={handleOpenBook}
                    onRemoveOffline={handleRemoveOffline}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOW READING (Canvas + Toolbar + Chapter Drawer) */}
        {activeTab === 'reader' && activeBook && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <ReaderToolbar
              book={activeBook}
              currentChapterTitle={activeBook.chapters[activeChapterIndex]?.title || 'Chapter'}
              settings={readingSettings}
              onUpdateSettings={handleUpdateSettings}
              onOpenChapters={() => setShowChaptersDrawer(true)}
              onBackToShelf={() => setActiveTab('library')}
              isSpeaking={isSpeaking}
              onToggleSpeech={handleToggleSpeech}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />

            {activeBook.chapters[activeChapterIndex] ? (
              <ReaderCanvas
                book={activeBook}
                chapter={activeBook.chapters[activeChapterIndex]}
                chapterIndex={activeChapterIndex}
                totalChapters={activeBook.chapters.length}
                settings={readingSettings}
                onNextChapter={() => {
                  if (activeChapterIndex < activeBook.chapters.length - 1) {
                    setActiveChapterIndex((prev) => prev + 1);
                  }
                }}
                onPrevChapter={() => {
                  if (activeChapterIndex > 0) {
                    setActiveChapterIndex((prev) => prev - 1);
                  }
                }}
                onSaveHighlight={handleSaveHighlight}
                onScrollProgress={(prog) => {
                  setActiveBook((prev) => (prev ? { ...prev, currentScrollProgress: prog } : null));
                }}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-neutral-500">
                Chapter content unavailable.
              </div>
            )}

            <ChapterDrawer
              isOpen={showChaptersDrawer}
              onClose={() => setShowChaptersDrawer(false)}
              chapters={activeBook.chapters}
              currentChapterIndex={activeChapterIndex}
              onSelectChapter={(idx) => setActiveChapterIndex(idx)}
              bookTitle={activeBook.title}
            />
          </div>
        )}

        {/* Fallback if user clicks Now Reading without an active book */}
        {activeTab === 'reader' && !activeBook && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <BookOpen size={48} className="text-neutral-400 mb-3" />
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              No Book Currently Open
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Pick a title from your bookshelf or browse the catalog to start reading.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:opacity-90 dark:bg-white dark:text-neutral-900 cursor-pointer"
            >
              Go to Bookshelf
            </button>
          </div>
        )}

        {/* TAB 4: HIGHLIGHTS & NOTES */}
        {activeTab === 'highlights' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-6 dark:border-neutral-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-neutral-900 dark:text-white">
                  Highlights &amp; Annotations
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Quotes and notes captured during your reading sessions.
                </p>
              </div>

              {highlights.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const md = highlights
                      .map(
                        (h) =>
                          `### ${h.bookTitle} — ${h.chapterTitle}\n> "${h.text}"\n\n${h.note ? `*Note:* ${h.note}\n` : ''}`
                      )
                      .join('\n---\n\n');
                    const blob = new Blob([md], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `resursee_reading_highlights_${Date.now()}.md`;
                    a.click();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 cursor-pointer"
                >
                  <DownloadSimple size={15} weight="bold" />
                  <span>Export to Markdown</span>
                </button>
              )}
            </div>

            {highlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 py-16 text-center">
                <BookmarkSimple size={40} className="text-neutral-400 mb-3" />
                <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                  No Saved Highlights Yet
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Highlight any passage in the reader to save quotes and add personal annotations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {highlights.map((hl) => (
                  <div
                    key={hl.id}
                    className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mb-2">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {hl.bookTitle}
                      </span>
                      <span>{hl.chapterTitle}</span>
                    </div>

                    <blockquote className="border-l-2 border-amber-400 pl-3.5 italic text-neutral-800 dark:text-neutral-200 font-serif text-sm">
                      "{hl.text}"
                    </blockquote>

                    {hl.note && (
                      <div className="mt-3 rounded-xl bg-neutral-50 p-2.5 text-xs text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-300">
                        <span className="font-bold mr-1.5">Note:</span>
                        {hl.note}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800/80">
                      <span className="font-mono text-[10px] text-neutral-400">
                        Saved on {new Date(hl.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteHighlight(hl.id)}
                        className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                        title="Delete highlight"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: READER SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl">
            <div className="border-b border-neutral-200/60 pb-6 dark:border-neutral-800">
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-neutral-900 dark:text-white">
                Reader Preferences &amp; Offline Storage
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Configure your reading comfort, typography defaults, and view device storage metrics.
              </p>
            </div>

            {/* Offline Storage Metrics Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60 space-y-4">
              <div className="flex items-center gap-2">
                <HardDrives size={20} className="text-neutral-700 dark:text-neutral-300" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Local IndexedDB Storage
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <span className="font-mono text-[10px] text-neutral-500 uppercase">Offline Books</span>
                  <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
                    {storageInfo.bookCount}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <span className="font-mono text-[10px] text-neutral-500 uppercase">Disk Usage</span>
                  <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
                    ~{storageInfo.estimatedSizeMb} MB
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <span className="font-mono text-[10px] text-neutral-500 uppercase">Status</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    <CheckCircle size={14} weight="fill" />
                    <span>100% Offline Ready</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-neutral-500">
                  All downloaded books are saved locally in your browser and will load even without Wi-Fi.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Clear all offline books and restore default catalog?')) {
                      for (const b of offlineBooks) {
                        await removeBookOffline(b.id);
                      }
                      await refreshLibrary();
                    }
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 cursor-pointer"
                >
                  Clear Storage Cache
                </button>
              </div>
            </div>

            {/* Typography Defaults */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60 space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                Reading Comfort Defaults
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                  <div>
                    <div className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                      Bionic Reading Mode
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Artificially emphasizes word prefixes so the brain guides reading smoothly and rapidly.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={readingSettings.bionicReading}
                    onChange={(e) => handleUpdateSettings({ bionicReading: e.target.checked })}
                    className="h-4 w-4 rounded-md border-neutral-300 text-neutral-900 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
                  <div>
                    <div className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                      Text Narration Speed (TTS)
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Speed rate for reading chapter contents out loud.
                    </div>
                  </div>
                  <select
                    value={readingSettings.ttsSpeed}
                    onChange={(e) => handleUpdateSettings({ ttsSpeed: parseFloat(e.target.value) })}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-mono dark:border-neutral-800 dark:bg-neutral-800 cursor-pointer"
                  >
                    <option value={0.75}>0.75x (Relaxed)</option>
                    <option value={1.0}>1.0x (Standard)</option>
                    <option value={1.25}>1.25x (Brisk)</option>
                    <option value={1.5}>1.5x (Fast)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Import Book Modal */}
      <ImportBookModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onBookImported={(newBook) => {
          refreshLibrary();
          handleOpenBook(newBook);
        }}
      />
    </div>
  );
}
