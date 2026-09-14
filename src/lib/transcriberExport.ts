import { TranscriberSession } from '@/types/transcriber';
import { formatTimestamp, formatSrtTimestamp, formatVttTimestamp } from '@/lib/audioProcessor';

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format plain text transcript (.txt)
 */
export function exportToTXT(session: TranscriberSession): string {
  const lines: string[] = [
    `TITLE: ${session.title}`,
    `DATE: ${new Date(session.createdAt).toLocaleString()}`,
    `DURATION: ${formatTimestamp(session.duration, true)}`,
    `LANGUAGE: ${session.language}`,
    `TIER: ${session.tier.toUpperCase()}`,
    '------------------------------------------------------------',
    '',
  ];

  for (const seg of session.segments) {
    const timeStr = `[${formatTimestamp(seg.startTime)} - ${formatTimestamp(seg.endTime)}]`;
    lines.push(`${timeStr} ${seg.speakerLabel}:`);
    lines.push(seg.text);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format rich Markdown (.md)
 */
export function exportToMarkdown(session: TranscriberSession): string {
  const lines: string[] = [
    `# ${session.title}`,
    '',
    `**Date:** ${new Date(session.createdAt).toLocaleDateString()} | **Duration:** ${formatTimestamp(session.duration, true)} | **Language:** \`${session.language}\` | **Engine:** \`${session.modelUsed || session.tier}\``,
    '',
    '---',
    '',
  ];

  // Executive Summary
  if (session.summary) {
    lines.push('## Executive Summary');
    lines.push('');
    lines.push(session.summary);
    lines.push('');
  }

  // Structured Meeting Notes
  if (session.meetingNotes && session.meetingNotes.length > 0) {
    const keyPoints = session.meetingNotes.filter((n) => n.category === 'key_point');
    const decisions = session.meetingNotes.filter((n) => n.category === 'decision');
    const actionItems = session.meetingNotes.filter((n) => n.category === 'action_item');
    const questions = session.meetingNotes.filter((n) => n.category === 'question');
    const followUps = session.meetingNotes.filter((n) => n.category === 'follow_up');

    if (keyPoints.length > 0) {
      lines.push('### 📌 Key Takeaways');
      for (const item of keyPoints) {
        lines.push(`- **[${formatTimestamp(item.timestamp)}]** ${item.content}`);
      }
      lines.push('');
    }

    if (decisions.length > 0) {
      lines.push('### ⚖️ Decisions Made');
      for (const item of decisions) {
        lines.push(`- **[${formatTimestamp(item.timestamp)}]** ${item.content}`);
      }
      lines.push('');
    }

    if (actionItems.length > 0) {
      lines.push('### ✅ Action Items');
      for (const item of actionItems) {
        const check = item.isCompleted ? '[x]' : '[ ]';
        const assigneeStr = item.assignee ? ` (@${item.assignee})` : '';
        lines.push(`- ${check} **[${formatTimestamp(item.timestamp)}]** ${item.content}${assigneeStr}`);
      }
      lines.push('');
    }

    if (questions.length > 0) {
      lines.push('### ❓ Questions & Inquiries');
      for (const item of questions) {
        lines.push(`- **[${formatTimestamp(item.timestamp)}]** ${item.content}`);
      }
      lines.push('');
    }

    if (followUps.length > 0) {
      lines.push('### 🔄 Follow-ups');
      for (const item of followUps) {
        lines.push(`- **[${formatTimestamp(item.timestamp)}]** ${item.content}`);
      }
      lines.push('');
    }
  }

  // User notes if present
  if (session.userNotes && session.userNotes.trim()) {
    lines.push('## Meeting Notes (Manual)');
    lines.push('');
    lines.push(session.userNotes);
    lines.push('');
  }

  // Full Transcript
  lines.push('## Full Transcript');
  lines.push('');
  for (const seg of session.segments) {
    lines.push(`> **${seg.speakerLabel}** \`[${formatTimestamp(seg.startTime)}]\``);
    lines.push(`> ${seg.text}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format SubRip Subtitles (.srt)
 */
export function exportToSRT(session: TranscriberSession): string {
  const blocks: string[] = [];

  session.segments.forEach((seg, index) => {
    const start = formatSrtTimestamp(seg.startTime);
    const end = formatSrtTimestamp(seg.endTime);
    blocks.push(`${index + 1}\n${start} --> ${end}\n[${seg.speakerLabel}] ${seg.text}\n`);
  });

  return blocks.join('\n');
}

/**
 * Format WebVTT Subtitles (.vtt)
 */
export function exportToVTT(session: TranscriberSession): string {
  const lines: string[] = ['WEBVTT', `NOTE Title: ${session.title}`, ''];

  session.segments.forEach((seg, index) => {
    const start = formatVttTimestamp(seg.startTime);
    const end = formatVttTimestamp(seg.endTime);
    lines.push(`${index + 1}`);
    lines.push(`${start} --> ${end}`);
    lines.push(`<v ${seg.speakerLabel}>${seg.text}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Lossless JSON export
 */
export function exportToJSON(session: TranscriberSession): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { audioBlob, audioUrl, ...safeSession } = session;
  return JSON.stringify(safeSession, null, 2);
}
