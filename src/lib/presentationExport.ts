import pptxgen from 'pptxgenjs';
import { PresentationDeck, TechTheme } from '@/types/presentation';

/**
 * Clean hex color string for pptxgenjs (removes leading #)
 */
function cleanHex(hex: string, defaultColor: string = 'FFFFFF'): string {
  if (!hex) return defaultColor;
  return hex.replace(/^#/, '').toUpperCase();
}

/**
 * Exports the active presentation deck directly into a native Microsoft PowerPoint (.pptx) file.
 */
export async function exportToPPTX(
  deck: PresentationDeck,
  theme: TechTheme
): Promise<void> {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = deck.author || 'Resursee Presentation Studio';
  pptx.title = deck.title;
  pptx.subject = deck.description;

  const bgHex = cleanHex(theme.canvasBg, '09090B');
  const isLight = bgHex === 'F8FAFC' || bgHex === 'FFFFFF';
  const textHex = isLight ? '09090B' : 'FFFFFF';
  const subtextHex = isLight ? '475569' : '94A3B8';
  const cardBgHex = isLight ? 'FFFFFF' : '17171C';
  const borderHex = isLight ? 'E2E8F0' : '27272A';

  deck.slides.forEach((slide, index) => {
    const pSlide = pptx.addSlide();
    pSlide.background = { color: bgHex };

    // Header Slide Tag / Number
    pSlide.addText(
      [
        { text: (slide.tag || `SLIDE ${index + 1}`).toUpperCase(), options: { bold: true, fontSize: 9, color: subtextHex } },
      ],
      {
        x: 0.8,
        y: 0.5,
        w: 11.7,
        h: 0.3,
        fontFace: 'Arial',
      }
    );

    // Slide Title
    pSlide.addText(slide.title, {
      x: 0.8,
      y: 0.85,
      w: 11.7,
      h: 0.8,
      fontSize: slide.layout === 'title-cover' ? 32 : 22,
      bold: true,
      color: textHex,
      fontFace: 'Arial',
      valign: 'top',
    });

    // Subtitle (if present)
    if (slide.subtitle) {
      pSlide.addText(slide.subtitle, {
        x: 0.8,
        y: slide.layout === 'title-cover' ? 1.8 : 1.6,
        w: 11.7,
        h: 0.5,
        fontSize: 13,
        color: subtextHex,
        fontFace: 'Arial',
        valign: 'top',
      });
    }

    const contentStartY = slide.subtitle ? 2.3 : 1.9;

    // Layout-specific content generation
    switch (slide.layout) {
      case 'title-cover': {
        // Decorative center card for cover
        pSlide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 3.2,
          w: 11.7,
          h: 2.6,
          fill: { color: cardBgHex },
          line: { color: borderHex, width: 1 },
        });

        pSlide.addText(
          [
            { text: 'Authored with Resursee Presentation Studio\n', options: { fontSize: 13, bold: true, color: textHex } },
            { text: 'Autonomous Local-First Technical Presentations with Real-Time AI Copilot', options: { fontSize: 11, color: subtextHex } },
          ],
          {
            x: 1.2,
            y: 4.0,
            w: 10.9,
            h: 1.2,
            align: 'center',
            fontFace: 'Arial',
          }
        );
        break;
      }

      case 'bullets-points': {
        if (slide.bullets && slide.bullets.length > 0) {
          const bulletItems = slide.bullets.map((b) => ({
            text: b,
            options: {
              fontSize: 14,
              color: textHex,
              bullet: { type: 'bullet' as const, code: '2022' },
              spacingAfter: 14,
            },
          }));

          pSlide.addText(bulletItems, {
            x: 0.8,
            y: contentStartY,
            w: 11.7,
            h: 4.2,
            fontFace: 'Arial',
            valign: 'top',
          });
        }
        break;
      }

      case 'split-columns': {
        const columns = slide.columns || [];
        const colWidth = 5.6;
        const gap = 0.5;

        columns.forEach((col, colIdx) => {
          const colX = 0.8 + colIdx * (colWidth + gap);

          // Card Background
          pSlide.addShape(pptx.ShapeType.rect, {
            x: colX,
            y: contentStartY,
            w: colWidth,
            h: 4.2,
            fill: { color: cardBgHex },
            line: { color: borderHex, width: 1 },
          });

          // Column Heading
          pSlide.addText(col.heading, {
            x: colX + 0.4,
            y: contentStartY + 0.3,
            w: colWidth - 0.8,
            h: 0.4,
            fontSize: 14,
            bold: true,
            color: textHex,
            fontFace: 'Arial',
          });

          // Column Bullets
          const items = col.content.map((item) => ({
            text: item,
            options: {
              fontSize: 11,
              color: subtextHex,
              bullet: { type: 'bullet' as const, code: '2022' },
              spacingAfter: 10,
            },
          }));

          pSlide.addText(items, {
            x: colX + 0.4,
            y: contentStartY + 0.8,
            w: colWidth - 0.8,
            h: 3.1,
            fontFace: 'Arial',
            valign: 'top',
          });
        });
        break;
      }

      case 'stats-metrics': {
        const metrics = slide.metrics || [];
        const cardW = 2.7;
        const gap = 0.3;

        metrics.forEach((m, mIdx) => {
          const mX = 0.8 + mIdx * (cardW + gap);

          pSlide.addShape(pptx.ShapeType.rect, {
            x: mX,
            y: contentStartY,
            w: cardW,
            h: 1.8,
            fill: { color: cardBgHex },
            line: { color: borderHex, width: 1 },
          });

          pSlide.addText(
            [
              { text: `${m.value}\n`, options: { fontSize: 24, bold: true, color: textHex } },
              { text: `${m.label}\n`, options: { fontSize: 10, color: subtextHex } },
              { text: m.change || '', options: { fontSize: 9, bold: true, color: isLight ? '15803D' : '4ADE80' } },
            ],
            {
              x: mX + 0.2,
              y: contentStartY + 0.2,
              w: cardW - 0.4,
              h: 1.4,
              fontFace: 'Arial',
              valign: 'top',
            }
          );
        });

        // Optional lower bullets
        if (slide.bullets && slide.bullets.length > 0) {
          const items = slide.bullets.map((b) => ({
            text: b,
            options: {
              fontSize: 12,
              color: textHex,
              bullet: { type: 'bullet' as const, code: '2022' },
              spacingAfter: 8,
            },
          }));

          pSlide.addText(items, {
            x: 0.8,
            y: contentStartY + 2.1,
            w: 11.7,
            h: 2.2,
            fontFace: 'Arial',
            valign: 'top',
          });
        }
        break;
      }

      case 'code-architecture': {
        if (slide.codeSnippet) {
          pSlide.addShape(pptx.ShapeType.rect, {
            x: 0.8,
            y: contentStartY,
            w: 11.7,
            h: 4.1,
            fill: { color: isLight ? 'F1F5F9' : '0D0F14' },
            line: { color: borderHex, width: 1 },
          });

          pSlide.addText(slide.codeSnippet.code, {
            x: 1.1,
            y: contentStartY + 0.3,
            w: 11.1,
            h: 3.5,
            fontSize: 11,
            fontFace: 'Courier New',
            color: isLight ? '0F172A' : 'E2E8F0',
            valign: 'top',
          });
        }
        break;
      }

      case 'timeline-roadmap': {
        const timeline = slide.timeline || [];
        const stepW = 2.7;
        const gap = 0.3;

        timeline.forEach((item, tIdx) => {
          const tX = 0.8 + tIdx * (stepW + gap);

          pSlide.addShape(pptx.ShapeType.rect, {
            x: tX,
            y: contentStartY,
            w: stepW,
            h: 3.8,
            fill: { color: cardBgHex },
            line: { color: borderHex, width: 1 },
          });

          pSlide.addText(
            [
              { text: `${item.step}\n`, options: { fontSize: 10, bold: true, color: isLight ? '475569' : '94A3B8' } },
              { text: `${item.title}\n\n`, options: { fontSize: 14, bold: true, color: textHex } },
              { text: item.description, options: { fontSize: 11, color: subtextHex } },
            ],
            {
              x: tX + 0.3,
              y: contentStartY + 0.3,
              w: stepW - 0.6,
              h: 3.2,
              fontFace: 'Arial',
              valign: 'top',
            }
          );
        });
        break;
      }

      case 'quote-highlight': {
        pSlide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: contentStartY,
          w: 11.7,
          h: 2.5,
          fill: { color: cardBgHex },
          line: { color: borderHex, width: 1 },
        });

        if (slide.quote) {
          pSlide.addText(
            [
              { text: `“${slide.quote.text}”\n\n`, options: { fontSize: 16, italic: true, bold: true, color: textHex } },
              { text: `— ${slide.quote.author || 'Key Insight'}`, options: { fontSize: 12, bold: true, color: textHex } },
              { text: slide.quote.role ? ` • ${slide.quote.role}` : '', options: { fontSize: 11, color: subtextHex } },
            ],
            {
              x: 1.4,
              y: contentStartY + 0.4,
              w: 10.5,
              h: 1.8,
              fontFace: 'Arial',
              valign: 'top',
            }
          );
        }

        if (slide.bullets && slide.bullets.length > 0) {
          const items = slide.bullets.map((b) => ({
            text: b,
            options: {
              fontSize: 12,
              color: textHex,
              bullet: { type: 'bullet' as const, code: '2022' },
              spacingAfter: 8,
            },
          }));

          pSlide.addText(items, {
            x: 0.8,
            y: contentStartY + 2.8,
            w: 11.7,
            h: 1.6,
            fontFace: 'Arial',
            valign: 'top',
          });
        }
        break;
      }
    }

    // Speaker notes
    if (slide.notes) {
      pSlide.addNotes(slide.notes);
    }
  });

  const fileName = `${(deck.title || 'Presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
}

/**
 * Exports deck data structure as JSON file for backup and re-importing.
 */
export function exportToJSON(deck: PresentationDeck): void {
  const jsonStr = JSON.stringify(deck, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(deck.title || 'presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}_backup.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports standalone, zero-dependency offline HTML presentation file.
 */
export function exportToHTML(deck: PresentationDeck, theme: TechTheme): void {
  const slidesHtml = deck.slides
    .map((slide, i) => {
      let bodyContent = '';
      if (slide.bullets) {
        bodyContent += `<ul style="margin-top:20px;font-size:18px;line-height:1.8;">${slide.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
      }
      if (slide.columns) {
        bodyContent += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;">${slide.columns
          .map(
            (c) => `<div style="padding:20px;background:#18181b;border-radius:12px;border:1px solid #27272a;"><h3 style="margin-bottom:12px;font-size:18px;">${c.heading}</h3><ul>${c.content.map((item) => `<li style="margin-bottom:8px;">${item}</li>`).join('')}</ul></div>`
          )
          .join('')}</div>`;
      }
      if (slide.metrics) {
        bodyContent += `<div style="display:grid;grid-template-columns:repeat(${slide.metrics.length},1fr);gap:16px;margin-top:24px;">${slide.metrics
          .map(
            (m) => `<div style="padding:20px;background:#18181b;border-radius:12px;border:1px solid #27272a;text-align:center;"><div style="font-size:32px;font-weight:bold;">${m.value}</div><div style="font-size:13px;color:#a1a1aa;margin-top:6px;">${m.label}</div><div style="font-size:11px;color:#22c55e;margin-top:4px;">${m.change || ''}</div></div>`
          )
          .join('')}</div>`;
      }
      if (slide.codeSnippet) {
        bodyContent += `<pre style="padding:24px;background:#0d0e12;border-radius:12px;border:1px solid #27272a;font-family:monospace;font-size:14px;overflow:auto;margin-top:20px;"><code>${slide.codeSnippet.code}</code></pre>`;
      }
      if (slide.timeline) {
        bodyContent += `<div style="display:grid;grid-template-columns:repeat(${slide.timeline.length},1fr);gap:16px;margin-top:24px;">${slide.timeline
          .map(
            (t) => `<div style="padding:20px;background:#18181b;border-radius:12px;border:1px solid #27272a;"><div style="font-size:11px;font-weight:bold;color:#a1a1aa;">${t.step}</div><div style="font-size:16px;font-weight:bold;margin:8px 0;">${t.title}</div><div style="font-size:13px;color:#71717a;">${t.description}</div></div>`
          )
          .join('')}</div>`;
      }
      if (slide.quote) {
        bodyContent += `<div style="padding:32px;background:#18181b;border-radius:12px;border:1px solid #27272a;margin-top:24px;"><blockquote style="font-size:22px;font-style:italic;">“${slide.quote.text}”</blockquote><div style="margin-top:16px;font-size:14px;font-weight:bold;">— ${slide.quote.author || ''} <span style="color:#a1a1aa;font-weight:normal;">${slide.quote.role ? `• ${slide.quote.role}` : ''}</span></div></div>`;
      }

      return `
    <div class="slide" id="slide-${i}" style="${i === 0 ? 'display:flex;' : 'display:none;'}">
      <div class="slide-header">
        <span class="slide-tag">${slide.tag || `SLIDE ${i + 1}`}</span>
        <span class="slide-count">${i + 1} / ${deck.slides.length}</span>
      </div>
      <h1 class="slide-title">${slide.title}</h1>
      ${slide.subtitle ? `<h2 class="slide-subtitle">${slide.subtitle}</h2>` : ''}
      <div class="slide-body">${bodyContent}</div>
      ${slide.notes ? `<div class="speaker-notes"><strong>Notes:</strong> ${slide.notes}</div>` : ''}
    </div>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${deck.title} — Resursee Presentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${theme.canvasBg}; color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .presentation-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .slide-card { width: 100%; max-width: 1200px; aspect-ratio: 16/9; background: #121215; border: 1px solid #27272a; border-radius: 18px; padding: 48px; display: flex; flex-direction: column; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .slide { display: flex; flex-direction: column; height: 100%; }
    .slide-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; color: #a1a1aa; }
    .slide-title { font-size: 32px; font-weight: 800; tracking-tight; line-height: 1.2; }
    .slide-subtitle { font-size: 16px; color: #a1a1aa; margin-top: 8px; font-weight: 500; }
    .slide-body { flex: 1; overflow-y: auto; }
    .speaker-notes { margin-top: auto; padding: 12px; background: rgba(0,0,0,0.4); border-radius: 8px; font-size: 12px; color: #71717a; border: 1px dashed #3f3f46; }
    .controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; background: #18181b; padding: 8px 16px; border-radius: 9999px; border: 1px solid #3f3f46; z-index: 100; }
    .btn { background: #27272a; color: white; border: none; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; cursor: pointer; }
    .btn:hover { background: #3f3f46; }
  </style>
</head>
<body>
  <div class="presentation-container">
    <div class="slide-card">
      ${slidesHtml}
    </div>
  </div>
  <div class="controls">
    <button class="btn" onclick="prevSlide()">◀ Previous (Left)</button>
    <button class="btn" onclick="nextSlide()">Next (Right) ▶</button>
  </div>
  <script>
    let current = 0;
    const total = ${deck.slides.length};
    function showSlide(index) {
      for (let i = 0; i < total; i++) {
        const el = document.getElementById('slide-' + i);
        if (el) el.style.display = i === index ? 'flex' : 'none';
      }
    }
    function nextSlide() { if (current < total - 1) { current++; showSlide(current); } }
    function prevSlide() { if (current > 0) { current--; showSlide(current); } }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(deck.title || 'presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
