import JSZip from 'jszip';
import { Slide, PresentationDeck, TechThemeId } from '@/types/presentation';

/**
 * Parses an uploaded .pptx (Microsoft PowerPoint) file directly in the browser using JSZip.
 * Extracts slides, titles, subtitles, and bullet points.
 */
export async function parsePPTXFile(
  file: File,
  themeId: TechThemeId = 'obsidian'
): Promise<PresentationDeck> {
  const zip = await JSZip.loadAsync(file);

  // Find all slide XML files in ppt/slides/
  const slidePaths: string[] = [];
  zip.forEach((relativePath) => {
    if (/^ppt\/slides\/slide\d+\.xml$/i.test(relativePath)) {
      slidePaths.push(relativePath);
    }
  });

  // Sort slide paths numerically (slide1.xml, slide2.xml, ...)
  slidePaths.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
    return numA - numB;
  });

  if (slidePaths.length === 0) {
    throw new Error('No slide contents found in the uploaded PowerPoint file.');
  }

  const slides: Slide[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const path = slidePaths[i];
    const xmlContent = await zip.file(path)?.async('text');
    if (!xmlContent) continue;

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    // Extract all paragraphs (<a:p>)
    const paragraphs = doc.getElementsByTagName('a:p');
    const lines: string[] = [];

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const p = paragraphs[pIdx];
      const textNodes = p.getElementsByTagName('a:t');
      let pText = '';
      for (let tIdx = 0; tIdx < textNodes.length; tIdx++) {
        pText += textNodes[tIdx].textContent || '';
      }
      const trimmed = pText.trim();
      if (trimmed) {
        lines.push(trimmed);
      }
    }

    const title = lines[0] || `Slide ${i + 1}`;
    let subtitle: string | undefined = undefined;
    let bullets: string[] = [];

    if (lines.length === 2 && lines[1].length < 120) {
      subtitle = lines[1];
    } else if (lines.length > 1) {
      if (lines[1].length < 80 && lines.length > 2) {
        subtitle = lines[1];
        bullets = lines.slice(2);
      } else {
        bullets = lines.slice(1);
      }
    }

    const isCover = i === 0 && (!bullets || bullets.length === 0);

    slides.push({
      id: `imported_slide_${i + 1}_${Date.now()}`,
      layout: isCover ? 'title-cover' : 'bullets-points',
      title,
      subtitle,
      bullets: bullets.length > 0 ? bullets : isCover ? undefined : ['Key takeaway point from presentation'],
      tag: isCover ? 'OVERVIEW' : `SECTION ${i + 1}`,
    });
  }

  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  return {
    id: `deck_pptx_${Date.now()}`,
    title: cleanName || 'Imported PowerPoint Deck',
    description: `Converted from ${file.name} to Resursee Presentation Studio.`,
    author: 'Local Author',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    themeId,
    transition: 'slide-horizontal',
    slides,
  };
}

/**
 * Parses markdown or structured text into a PresentationDeck
 */
export function parseMarkdownToDeck(
  text: string,
  fileName: string = 'Imported Deck',
  themeId: TechThemeId = 'obsidian'
): PresentationDeck {
  const sections = text.split(/\n(?=# )/);
  const slides: Slide[] = [];

  sections.forEach((sec, idx) => {
    const lines = sec.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const title = lines[0].replace(/^#+\s*/, '') || `Slide ${idx + 1}`;
    let subtitle: string | undefined = undefined;
    const bullets: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ') && !subtitle) {
        subtitle = line.replace(/^##+\s*/, '');
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        bullets.push(line.replace(/^[-*]\s*/, ''));
      } else if (line.length > 0) {
        bullets.push(line);
      }
    }

    slides.push({
      id: `slide_md_${idx + 1}_${Date.now()}`,
      layout: idx === 0 ? 'title-cover' : 'bullets-points',
      title,
      subtitle,
      bullets: bullets.length > 0 ? bullets : ['Key insight'],
      tag: idx === 0 ? 'INTRO' : `PART ${idx + 1}`,
    });
  });

  return {
    id: `deck_md_${Date.now()}`,
    title: fileName.replace(/\.[^/.]+$/, ''),
    description: 'Converted from text document to Resursee Presentation Studio',
    author: 'Local Author',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    themeId,
    transition: 'fade',
    slides: slides.length > 0 ? slides : [
      {
        id: `slide_empty_${Date.now()}`,
        layout: 'title-cover',
        title: fileName,
        subtitle: 'Empty presentation document',
      },
    ],
  };
}
