import JSZip from 'jszip';

export interface DocumentParseResult {
  text: string;
  format: 'pdf' | 'docx' | 'pptx' | 'text' | 'unknown';
  pageCount?: number;
  wordCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

/**
 * Extracts text content from a PDF file using pdfjs-dist directly in the browser.
 */
export async function parsePdfDocument(file: File): Promise<DocumentParseResult> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const pageSections: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let pageText = '';

    for (const item of textContent.items as any[]) {
      if ('str' in item) {
        pageText += item.str;
        if (item.hasEOL) {
          pageText += '\n';
        } else {
          pageText += ' ';
        }
      }
    }

    const cleanPageText = pageText.replace(/[ \t]+/g, ' ').trim();
    if (cleanPageText) {
      pageSections.push(`## Page ${i}\n${cleanPageText}`);
    }
  }

  const fullText = pageSections.join('\n\n');
  return {
    text: fullText,
    format: 'pdf',
    pageCount: numPages,
    wordCount: countWords(fullText),
  };
}

/**
 * Extracts formatted text, headings, and tables from a Word (.docx) file.
 */
export async function parseDocxDocument(file: File): Promise<DocumentParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('Invalid DOCX format: word/document.xml was not found in the file archive.');
  }

  const xmlText = await docFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  const body = xmlDoc.getElementsByTagName('w:body')[0];
  if (!body) {
    throw new Error('Invalid DOCX structure: w:body is missing.');
  }

  const lines: string[] = [];
  const childNodes = Array.from(body.childNodes);

  for (const node of childNodes) {
    const el = node as Element;
    if (!el.tagName) continue;

    // 1. Paragraphs (<w:p>)
    if (el.tagName === 'w:p') {
      const pText = extractDocxParagraphText(el);
      if (pText) {
        lines.push(pText);
      }
    }

    // 2. Tables (<w:tbl>)
    if (el.tagName === 'w:tbl') {
      const tableMarkdown = extractDocxTableMarkdown(el);
      if (tableMarkdown) {
        lines.push(tableMarkdown);
      }
    }
  }

  const fullText = lines.join('\n\n');
  return {
    text: fullText,
    format: 'docx',
    wordCount: countWords(fullText),
  };
}

function extractDocxParagraphText(p: Element): string {
  // Check heading level
  let prefix = '';
  const pStyle = p.getElementsByTagName('w:pStyle')[0];
  if (pStyle) {
    const val = pStyle.getAttribute('w:val') || '';
    if (val.toLowerCase().includes('heading1') || val === '1') prefix = '# ';
    else if (val.toLowerCase().includes('heading2') || val === '2') prefix = '## ';
    else if (val.toLowerCase().includes('heading3') || val === '3') prefix = '### ';
  }

  const textNodes = p.getElementsByTagName('w:t');
  let paragraphText = '';
  for (let i = 0; i < textNodes.length; i++) {
    paragraphText += textNodes[i].textContent || '';
  }

  const clean = paragraphText.trim();
  return clean ? `${prefix}${clean}` : '';
}

function extractDocxTableMarkdown(tbl: Element): string {
  const rows = tbl.getElementsByTagName('w:tr');
  if (rows.length === 0) return '';

  const tableRows: string[][] = [];

  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    const rowContent: string[] = [];
    for (let c = 0; c < cells.length; c++) {
      const cellTextNodes = cells[c].getElementsByTagName('w:t');
      let cellText = '';
      for (let t = 0; t < cellTextNodes.length; t++) {
        cellText += cellTextNodes[t].textContent || '';
      }
      rowContent.push(cellText.trim().replace(/\|/g, '\\|') || ' ');
    }
    if (rowContent.length > 0) {
      tableRows.push(rowContent);
    }
  }

  if (tableRows.length === 0) return '';

  const colCount = Math.max(...tableRows.map((r) => r.length));
  const normalizedRows = tableRows.map((r) => {
    while (r.length < colCount) r.push(' ');
    return r;
  });

  const header = `| ${normalizedRows[0].join(' | ')} |`;
  const separator = `| ${new Array(colCount).fill('---').join(' | ')} |`;
  const body = normalizedRows
    .slice(1)
    .map((r) => `| ${r.join(' | ')} |`)
    .join('\n');

  return body ? `${header}\n${separator}\n${body}` : `${header}\n${separator}`;
}

/**
 * Extracts slides, titles, and bullet points from a PowerPoint (.pptx) file.
 */
export async function parsePptxDocument(file: File): Promise<DocumentParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Discover and sort all slide XML files numerically (slide1, slide2, slide10, etc.)
  const slideFilenames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

  if (slideFilenames.length === 0) {
    throw new Error('Invalid PPTX format: No slides found in the PowerPoint presentation archive.');
  }

  const parser = new DOMParser();
  const slidesContent: string[] = [];

  for (let idx = 0; idx < slideFilenames.length; idx++) {
    const filename = slideFilenames[idx];
    const xmlText = await zip.files[filename].async('text');
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    const paragraphs = xmlDoc.getElementsByTagName('a:p');
    const slideLines: string[] = [];

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const p = paragraphs[pIdx];
      const textNodes = p.getElementsByTagName('a:t');
      let lineText = '';
      for (let tIdx = 0; tIdx < textNodes.length; tIdx++) {
        lineText += textNodes[tIdx].textContent || '';
      }
      const cleanLine = lineText.trim();
      if (cleanLine) {
        slideLines.push(cleanLine);
      }
    }

    const slideNumber = idx + 1;
    if (slideLines.length > 0) {
      const title = slideLines[0];
      const details = slideLines.slice(1);
      let slideMarkdown = `## Slide ${slideNumber}: ${title}`;
      if (details.length > 0) {
        slideMarkdown += `\n${details.map((d) => `- ${d}`).join('\n')}`;
      }
      slidesContent.push(slideMarkdown);
    } else {
      slidesContent.push(`## Slide ${slideNumber}\n*(Visual-only slide without text)*`);
    }
  }

  const fullText = slidesContent.join('\n\n');
  return {
    text: fullText,
    format: 'pptx',
    pageCount: slideFilenames.length,
    wordCount: countWords(fullText),
  };
}

/**
 * Universal client-side document parser supporting PDF, Word (DOCX), PowerPoint (PPTX),
 * Markdown, and plaintext code files.
 */
export async function parseAnyDocumentFile(file: File): Promise<DocumentParseResult> {
  const lowerName = file.name.toLowerCase();

  // 1. PDF Documents
  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    return await parsePdfDocument(file);
  }

  // 2. Microsoft Word Documents (.docx)
  if (
    lowerName.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return await parseDocxDocument(file);
  }

  // 3. Microsoft PowerPoint Presentations (.pptx)
  if (
    lowerName.endsWith('.pptx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return await parsePptxDocument(file);
  }

  // 4. Plaintext / Markdown / Code files (.txt, .md, .csv, .json, .py, .ts, etc.)
  const rawText = await readFileAsText(file);
  return {
    text: rawText,
    format: lowerName.endsWith('.md') || lowerName.endsWith('.markdown') ? 'text' : 'text',
    wordCount: countWords(rawText),
  };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = (e) => reject(new Error(`Failed to read file: ${e}`));
    reader.readAsText(file);
  });
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}
