import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

type StreamClient = {
  id: string;
  send: (chunk: Uint8Array) => void;
};

interface VisitorState {
  activeClients: Map<string, StreamClient>;
  totalVisitors: number;
  isTotalLoaded: boolean;
}

// Attach to globalThis to preserve state across Next.js dev HMR reloads
const globalStore = globalThis as unknown as {
  __resursee_visitor_state?: VisitorState;
};

if (!globalStore.__resursee_visitor_state) {
  globalStore.__resursee_visitor_state = {
    activeClients: new Map<string, StreamClient>(),
    totalVisitors: 1484,
    isTotalLoaded: false,
  };
}

const state = globalStore.__resursee_visitor_state;
const METRICS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'visitor_metrics.json');

export async function loadTotalVisitors(): Promise<number> {
  if (state.isTotalLoaded) return state.totalVisitors;
  try {
    const data = await fs.readFile(METRICS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (typeof parsed.totalVisitors === 'number' && parsed.totalVisitors > 0) {
      state.totalVisitors = parsed.totalVisitors;
      state.isTotalLoaded = true;
      return state.totalVisitors;
    }
  } catch {
    // fallback to current baseline
  }
  state.isTotalLoaded = true;
  return state.totalVisitors;
}

export async function incrementTotalVisitors(): Promise<number> {
  await loadTotalVisitors();
  state.totalVisitors += 1;
  try {
    const payload = {
      totalVisitors: state.totalVisitors,
      lastUpdated: new Date().toISOString(),
    };
    await fs.writeFile(METRICS_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist visitor metrics:', err);
  }
  broadcastVisitorState();
  return state.totalVisitors;
}

export function getActiveVisitorCount(): number {
  return Math.max(state.activeClients.size, 1);
}

function getBroadcastPayload(): Uint8Array {
  const payload = JSON.stringify({
    activeVisitors: getActiveVisitorCount(),
    totalVisitors: state.totalVisitors,
    timestamp: Date.now(),
  });
  return new TextEncoder().encode(`data: ${payload}\n\n`);
}

export function broadcastVisitorState(): void {
  const chunk = getBroadcastPayload();
  for (const [id, client] of state.activeClients.entries()) {
    try {
      client.send(chunk);
    } catch {
      state.activeClients.delete(id);
    }
  }
}

export function registerVisitorStream(send: (chunk: Uint8Array) => void): string {
  const clientId = crypto.randomUUID();
  state.activeClients.set(clientId, { id: clientId, send });
  // Ensure total is loaded and broadcast immediately
  loadTotalVisitors().then(() => {
    // Send immediate initial payload to newly connected client
    try {
      send(getBroadcastPayload());
    } catch {
      // ignore
    }
    // Broadcast to all other clients in real-time
    broadcastVisitorState();
  });
  return clientId;
}

export function unregisterVisitorStream(clientId: string): void {
  if (state.activeClients.has(clientId)) {
    state.activeClients.delete(clientId);
    broadcastVisitorState();
  }
}
