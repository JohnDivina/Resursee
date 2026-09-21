import JSZip from 'jszip';
import { Ebook, EbookChapter } from '@/types/ebook';

/**
 * Parses an EPUB (.epub) archive directly in the browser.
 * Extracts title, author, cover image, and chapters in reading order.
 */
export async function parseEpubFile(file: File): Promise<Ebook> {
  const zip = await JSZip.loadAsync(file);

  // 1. Read container.xml to locate the OPF package rootfile
  const containerXml = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXml) {
    throw new Error('Invalid EPUB file: META-INF/container.xml is missing.');
  }

  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, 'application/xml');
  const rootfile = containerDoc.getElementsByTagName('rootfile')[0];
  const opfPath = rootfile?.getAttribute('full-path');

  if (!opfPath) {
    throw new Error('Invalid EPUB file: No OPF rootfile found in container.');
  }

  // 2. Read OPF file
  const opfXml = await zip.file(opfPath)?.async('text');
  if (!opfXml) {
    throw new Error(`Failed to read OPF file at: ${opfPath}`);
  }

  const opfDoc = parser.parseFromString(opfXml, 'application/xml');
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // Extract Metadata
  const title = opfDoc.getElementsByTagName('dc:title')[0]?.textContent?.trim() || file.name.replace(/\.[^/.]+$/, '');
  const author = opfDoc.getElementsByTagName('dc:creator')[0]?.textContent?.trim() || 'Unknown Author';
  const description = opfDoc.getElementsByTagName('dc:description')[0]?.textContent?.trim() || 'Imported EPUB book';
  const language = opfDoc.getElementsByTagName('dc:language')[0]?.textContent?.trim() || 'en';

  // Extract Manifest Items
  const manifestItems = opfDoc.getElementsByTagName('item');
  const manifestMap: Record<string, { href: string; mediaType: string }> = {};
  let coverHref: string | null = null;

  for (let i = 0; i < manifestItems.length; i++) {
    const item = manifestItems[i];
    const id = item.getAttribute('id') || '';
    const href = item.getAttribute('href') || '';
    const mediaType = item.getAttribute('media-type') || '';
    const properties = item.getAttribute('properties') || '';

    manifestMap[id] = { href, mediaType };

    if (properties.includes('cover-image') || id.toLowerCase().includes('cover') || href.toLowerCase().includes('cover')) {
      if (mediaType.startsWith('image/')) {
        coverHref = href;
      }
    }
  }

  // Extract Cover Image if found
  let coverUrl: string | undefined = undefined;
  if (coverHref) {
    const coverPath = opfDir + coverHref;
    const coverFile = zip.file(coverPath) || zip.file(coverHref);
    if (coverFile) {
      try {
        const coverBase64 = await coverFile.async('base64');
        const mime = manifestMap[coverHref]?.mediaType || 'image/jpeg';
        coverUrl = `data:${mime};base64,${coverBase64}`;
      } catch {
        // ignore cover error
      }
    }
  }

  // 3. Extract Spine Items in Reading Order
  const spineItems = opfDoc.getElementsByTagName('itemref');
  const chapterHrefs: string[] = [];

  for (let i = 0; i < spineItems.length; i++) {
    const idref = spineItems[i].getAttribute('idref');
    if (idref && manifestMap[idref]) {
      chapterHrefs.push(manifestMap[idref].href);
    }
  }

  if (chapterHrefs.length === 0) {
    throw new Error('No readable chapters found in the EPUB spine.');
  }

  // 4. Parse Each Chapter
  const chapters: EbookChapter[] = [];
  let chapterIndex = 1;

  for (const href of chapterHrefs) {
    const fullPath = opfDir + href;
    const chapterFile = zip.file(fullPath) || zip.file(href);
    if (!chapterFile) continue;

    const chapterHtml = await chapterFile.async('text');
    if (!chapterHtml) continue;

    const chapterDoc = parser.parseFromString(chapterHtml, 'text/html');

    // Extract Chapter Title
    const h1 = chapterDoc.querySelector('h1, h2, h3, title');
    let chapterTitle = h1?.textContent?.trim() || `Chapter ${chapterIndex}`;
    if (chapterTitle.length > 80) {
      chapterTitle = `Chapter ${chapterIndex}`;
    }

    // Clean body content
    const body = chapterDoc.body;
    if (!body) continue;

    // Remove scripts, styles, iframes
    body.querySelectorAll('script, style, iframe, noscript').forEach((el) => el.remove());

    // Extract formatted paragraphs
    const paragraphs: string[] = [];
    const blockElements = body.querySelectorAll('p, blockquote, pre, li');

    if (blockElements.length > 0) {
      blockElements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          paragraphs.push(`<p>${escapeHtml(text)}</p>`);
        }
      });
    } else {
      // Fallback: raw body text split by double newlines
      const rawText = body.textContent || '';
      const lines = rawText.split(/\n\s*\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          paragraphs.push(`<p>${escapeHtml(trimmed)}</p>`);
        }
      }
    }

    const cleanedContent = paragraphs.join('\n');
    const wordCount = cleanedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

    // Skip empty dummy title pages with fewer than 5 words unless it's the only page
    if (wordCount > 15 || chapters.length === 0) {
      chapters.push({
        id: `ch_${chapterIndex}_${Date.now()}`,
        title: chapterTitle,
        content: cleanedContent,
        order: chapterIndex,
        wordCount,
      });
      chapterIndex++;
    }
  }

  const cleanBookId = `book_epub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

  return {
    id: cleanBookId,
    title,
    author,
    coverUrl,
    description,
    language,
    isOffline: true,
    downloadedAt: Date.now(),
    lastReadAt: Date.now(),
    currentChapterIndex: 0,
    currentScrollProgress: 0,
    totalChapters: chapters.length,
    chapters,
    fileSize: fileSizeMb,
  };
}

/**
 * Parses a plain text (.txt) book file into structured chapters.
 */
export async function parseTxtFile(file: File): Promise<Ebook> {
  const text = await file.text();
  const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  // Split on common chapter headings: Chapter 1, CHAPTER I, Part 1, Book 1, Act 1, Prologue
  const chapterRegex = /(?=(?:^|\n)\s*(?:CHAPTER|Chapter|PART|Part|BOOK|Book|ACT|Act|PROLOGUE|Prologue|EPILOGUE|Epilogue)\s+[0-9IVXLCDM]+.*)/i;
  let rawSections = text.split(chapterRegex);

  if (rawSections.length <= 1) {
    // Fallback: chunk by word count ~2,500 words per chapter
    const words = text.split(/\s+/);
    const chunkSize = 2500;
    rawSections = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      rawSections.push(words.slice(i, i + chunkSize).join(' '));
    }
  }

  const chapters: EbookChapter[] = [];
  let order = 1;

  for (const sec of rawSections) {
    const trimmed = sec.trim();
    if (!trimmed || trimmed.length < 50) continue;

    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    const titleLine = lines[0] || `Chapter ${order}`;
    const chapterTitle = titleLine.length < 70 ? titleLine : `Chapter ${order}`;

    const bodyParagraphs = (titleLine === chapterTitle ? lines.slice(1) : lines)
      .map((l) => `<p>${escapeHtml(l)}</p>`)
      .join('\n');

    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

    chapters.push({
      id: `ch_txt_${order}_${Date.now()}`,
      title: chapterTitle,
      content: bodyParagraphs,
      order,
      wordCount,
    });
    order++;
  }

  return {
    id: `book_txt_${Date.now()}`,
    title: cleanTitle,
    author: 'Imported Text',
    description: `Imported text document (${chapters.length} chapters).`,
    language: 'en',
    isOffline: true,
    downloadedAt: Date.now(),
    lastReadAt: Date.now(),
    currentChapterIndex: 0,
    currentScrollProgress: 0,
    totalChapters: chapters.length,
    chapters,
    fileSize: (file.size / 1024).toFixed(0) + ' KB',
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
