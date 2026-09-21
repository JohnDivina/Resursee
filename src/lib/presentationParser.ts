import JSZip from 'jszip';
import { Slide, SlideLayout, PresentationDeck, TechThemeId } from '@/types/presentation';

interface ExtractedShape {
  title?: string;
  isTitle: boolean;
  isSubtitle: boolean;
  paragraphs: {
    text: string;
    level: number;
    isBullet: boolean;
  }[];
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Parses an uploaded .pptx (Microsoft PowerPoint) file directly in the browser using JSZip and XML DOM parsing.
 * Preserves shape positions, multi-column layouts, hierarchical bullet indentation, and applies the selected theme.
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

    // Parse slide shapes (<p:sp>)
    const shapeNodes = doc.getElementsByTagName('p:sp');
    const shapes: ExtractedShape[] = [];

    for (let sIdx = 0; sIdx < shapeNodes.length; sIdx++) {
      const sp = shapeNodes[sIdx];

      // Check placeholder type (<p:ph type="title" | "ctrTitle" | "subTitle" | "body" />)
      const ph = sp.getElementsByTagName('p:ph')[0];
      const phType = ph ? ph.getAttribute('type') || 'body' : null;
      const isTitle = phType === 'title' || phType === 'ctrTitle';
      const isSubtitle = phType === 'subTitle';

      // Check spatial coordinates (<a:off x=".." y=".."/> <a:ext cx=".." cy=".."/>)
      const off = sp.getElementsByTagName('a:off')[0];
      const ext = sp.getElementsByTagName('a:ext')[0];
      const x = off ? parseInt(off.getAttribute('x') || '0', 10) : 0;
      const y = off ? parseInt(off.getAttribute('y') || '0', 10) : 0;
      const width = ext ? parseInt(ext.getAttribute('cx') || '0', 10) : 0;
      const height = ext ? parseInt(ext.getAttribute('cy') || '0', 10) : 0;

      // Extract paragraphs within this shape
      const paragraphs: { text: string; level: number; isBullet: boolean }[] = [];
      const pNodes = sp.getElementsByTagName('a:p');

      for (let pIdx = 0; pIdx < pNodes.length; pIdx++) {
        const p = pNodes[pIdx];
        const textNodes = p.getElementsByTagName('a:t');
        let fullPText = '';
        for (let tIdx = 0; tIdx < textNodes.length; tIdx++) {
          fullPText += textNodes[tIdx].textContent || '';
        }
        const trimmed = fullPText.trim();
        if (!trimmed) continue;

        // Check indentation level (<a:pPr lvl="1">)
        const pPr = p.getElementsByTagName('a:pPr')[0];
        const lvl = pPr ? parseInt(pPr.getAttribute('lvl') || '0', 10) : 0;
        const buChar = pPr?.getElementsByTagName('a:buChar')[0];
        const buAuto = pPr?.getElementsByTagName('a:buAutoNum')[0];
        const isBullet = Boolean(buChar || buAuto || lvl > 0);

        paragraphs.push({ text: trimmed, level: lvl, isBullet });
      }

      if (paragraphs.length > 0) {
        shapes.push({
          isTitle,
          isSubtitle,
          paragraphs,
          x,
          y,
          width,
          height,
        });
      }
    }

    // Try to extract speaker notes if available for this slide
    let speakerNotes: string | undefined = undefined;
    const slideNumber = path.match(/slide(\d+)\.xml/i)?.[1];
    if (slideNumber) {
      const notesFile = zip.file(`ppt/notesSlides/notesSlide${slideNumber}.xml`);
      if (notesFile) {
        try {
          const notesXml = await notesFile.async('text');
          const notesDoc = new DOMParser().parseFromString(notesXml, 'application/xml');
          const noteParas = notesDoc.getElementsByTagName('a:p');
          const noteTexts: string[] = [];
          for (let nIdx = 0; nIdx < noteParas.length; nIdx++) {
            const tNodes = noteParas[nIdx].getElementsByTagName('a:t');
            let txt = '';
            for (let t = 0; t < tNodes.length; t++) txt += tNodes[t].textContent || '';
            const tr = txt.trim();
            if (tr && !tr.match(/^\d+$/)) noteTexts.push(tr);
          }
          if (noteTexts.length > 0) speakerNotes = noteTexts.join('\n\n');
        } catch {
          // ignore notes extraction error
        }
      }
    }

    // Identify Slide Title and Subtitle
    let title = '';
    let subtitle: string | undefined = undefined;
    const contentShapes: ExtractedShape[] = [];

    for (const sh of shapes) {
      if (sh.isTitle && !title) {
        title = sh.paragraphs.map((p) => p.text).join(' ');
      } else if (sh.isSubtitle && !subtitle) {
        subtitle = sh.paragraphs.map((p) => p.text).join(' ');
      } else {
        contentShapes.push(sh);
      }
    }

    // Fallback: if no placeholder title was found, use the first non-empty shape
    if (!title && shapes.length > 0) {
      const firstShape = shapes[0];
      title = firstShape.paragraphs[0]?.text || `Slide ${i + 1}`;
      if (firstShape.paragraphs.length > 1 && !subtitle) {
        subtitle = firstShape.paragraphs[1].text;
      }
      contentShapes.shift();
    }

    if (!title) title = `Slide ${i + 1}`;

    // Layout Intelligence: Detect structure from shapes
    let detectedLayout: SlideLayout = 'bullets-points';
    let bullets: string[] | undefined = undefined;
    let columns: { heading: string; content: string[] }[] | undefined = undefined;
    let metrics: { label: string; value: string; change?: string }[] | undefined = undefined;
    let codeSnippet: { language: string; code: string } | undefined = undefined;
    let timeline: { step: string; title: string; description: string }[] | undefined = undefined;
    let quote: { text: string; author: string } | undefined = undefined;

    // Check 1: Title Cover (first slide with subtitle and no heavy bullet lists)
    if (i === 0 && contentShapes.length === 0) {
      detectedLayout = 'title-cover';
    }
    // Check 2: Split Columns (two side-by-side content shapes with horizontal separation)
    else if (contentShapes.length === 2 && Math.abs(contentShapes[0].x - contentShapes[1].x) > 1500000) {
      detectedLayout = 'split-columns';
      // Sort left to right
      const sortedCols = [...contentShapes].sort((a, b) => a.x - b.x);
      columns = sortedCols.map((col, cIdx) => {
        const h = col.paragraphs[0]?.text || `Pillar ${cIdx + 1}`;
        const c = col.paragraphs.slice(1).map((p) => (p.level > 0 ? `  • ${p.text}` : p.text));
        return {
          heading: h,
          content: c.length > 0 ? c : [h],
        };
      });
    }
    // Check 3: Metrics / KPIs (shapes containing numbers, currency, or percentages)
    else {
      const allParas = contentShapes.flatMap((s) => s.paragraphs);
      const metricCandidates = allParas.filter((p) =>
        /^[+$€£¥]?\d+(?:\.\d+)?[%kMBTG+]?$/i.test(p.text.trim()) ||
        /^\d+(?:\.\d+)?%$/.test(p.text.trim())
      );

      if (metricCandidates.length >= 2) {
        detectedLayout = 'stats-metrics';
        metrics = [];
        for (let mIdx = 0; mIdx < Math.min(metricCandidates.length, 4); mIdx++) {
          const val = metricCandidates[mIdx].text;
          const neighbor = allParas.find((p) => p.text !== val && p.text.length < 50);
          metrics.push({
            value: val,
            label: neighbor?.text || `Metric ${mIdx + 1}`,
          });
        }
      }
      // Check 4: Code block detection (shapes containing syntax keywords)
      else if (allParas.some((p) => /^(import |export |const |function |def |class |async )/.test(p.text))) {
        detectedLayout = 'code-architecture';
        codeSnippet = {
          language: 'typescript',
          code: allParas.map((p) => p.text).join('\n'),
        };
      }
      // Check 5: Timeline / Steps detection
      else if (allParas.some((p) => /^(Phase \d|Step \d|Q[1-4]|Sprint \d)/i.test(p.text))) {
        detectedLayout = 'timeline-roadmap';
        timeline = [];
        let stepIdx = 1;
        for (const p of allParas) {
          if (/^(Phase \d|Step \d|Q[1-4]|Sprint \d)/i.test(p.text) || timeline.length < 4) {
            timeline.push({
              step: `Phase ${stepIdx}`,
              title: p.text,
              description: 'Key execution objective and implementation milestones',
            });
            stepIdx++;
          }
        }
      }
      // Default: Bullets points with hierarchical preservation
      else {
        detectedLayout = 'bullets-points';
        bullets = allParas.map((p) => {
          if (p.level > 0) {
            return `${'  '.repeat(p.level)}• ${p.text}`;
          }
          return p.text;
        });

        if (bullets.length === 0) {
          bullets = ['Key presentation takeaway point'];
        }
      }
    }

    slides.push({
      id: `imported_slide_${i + 1}_${Date.now()}`,
      layout: detectedLayout,
      title,
      subtitle,
      bullets,
      columns,
      metrics,
      codeSnippet,
      timeline,
      quote,
      notes: speakerNotes,
      tag: i === 0 ? 'OVERVIEW' : `SLIDE ${i + 1}`,
    });
  }

  const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  return {
    id: `deck_pptx_${Date.now()}`,
    title: cleanName || 'Imported PowerPoint Deck',
    description: `Cleanly imported from "${file.name}" with formatting preserved under ${themeId} theme.`,
    author: 'Imported Deck',
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
        title: 'Empty Presentation',
        subtitle: 'Add slides to begin presentation',
        tag: 'START',
      },
    ],
  };
}
