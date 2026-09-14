import { get, set, del, keys } from 'idb-keyval';
import { TranscriberSession } from '@/types/transcriber';

const SESSION_PREFIX = 'transcriber_session_';

/**
 * Saves a full transcriber session to IndexedDB
 */
export async function saveSession(session: TranscriberSession): Promise<void> {
  try {
    const key = `${SESSION_PREFIX}${session.id}`;
    // Store session. If audioBlob is too large, IndexedDB natively handles Blobs
    await set(key, session);
  } catch (err) {
    console.error('Failed to save session to IndexedDB:', err);
    throw err;
  }
}

/**
 * Loads a transcriber session by UUID
 */
export async function loadSession(id: string): Promise<TranscriberSession | null> {
  try {
    const key = `${SESSION_PREFIX}${id}`;
    const session = await get<TranscriberSession>(key);
    if (!session) return null;

    // Reconstruct audioUrl if audioBlob is present
    if (session.audioBlob && !session.audioUrl) {
      session.audioUrl = URL.createObjectURL(session.audioBlob);
    }
    return session;
  } catch (err) {
    console.error(`Failed to load session ${id}:`, err);
    return null;
  }
}

/**
 * Lists all stored sessions (metadata and summary, without heavy audioBlob)
 */
export async function listSessions(): Promise<Array<Omit<TranscriberSession, 'audioBlob' | 'audioUrl'>>> {
  try {
    const allKeys = await keys();
    const sessionKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(SESSION_PREFIX)
    );

    const summaries: Array<Omit<TranscriberSession, 'audioBlob' | 'audioUrl'>> = [];

    for (const key of sessionKeys) {
      const session = await get<TranscriberSession>(key);
      if (session) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { audioBlob, audioUrl, ...meta } = session;
        summaries.push(meta);
      }
    }

    // Sort newest first
    return summaries.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (err) {
    console.error('Failed to list sessions:', err);
    return [];
  }
}

/**
 * Deletes a session by ID from IndexedDB
 */
export async function deleteSession(id: string): Promise<void> {
  try {
    const key = `${SESSION_PREFIX}${id}`;
    await del(key);
  } catch (err) {
    console.error(`Failed to delete session ${id}:`, err);
  }
}

/**
 * Exports user corrections as an evaluation reference set
 */
export function exportCorrections(session: TranscriberSession) {
  const editedSegments = session.segments.filter((s) => s.isEdited && s.originalText);
  return {
    sessionId: session.id,
    sessionTitle: session.title,
    modelUsed: session.modelUsed,
    language: session.language,
    exportedAt: new Date().toISOString(),
    totalTurns: session.segments.length,
    editedTurns: editedSegments.length,
    corrections: editedSegments.map((s) => ({
      segmentId: s.id,
      speaker: s.speakerLabel,
      time: `${s.startTime.toFixed(2)}s - ${s.endTime.toFixed(2)}s`,
      predictedText: s.originalText,
      correctedText: s.text,
      revisions: s.revisionHistory,
    })),
  };
}
