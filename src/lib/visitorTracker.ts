import crypto from 'crypto';

type StreamClient = {
  id: string;
  send: (chunk: Uint8Array) => void;
};

// Global in-memory singleton for realtime active visitors across SSE connections
const activeClients = new Map<string, StreamClient>();

function getBroadcastPayload(count: number): Uint8Array {
  const payload = JSON.stringify({ activeVisitors: count, timestamp: Date.now() });
  return new TextEncoder().encode(`data: ${payload}\n\n`);
}

export function broadcastActiveVisitors(): void {
  const count = Math.max(activeClients.size, 1);
  const chunk = getBroadcastPayload(count);

  for (const [id, client] of activeClients.entries()) {
    try {
      client.send(chunk);
    } catch {
      activeClients.delete(id);
    }
  }
}

export function registerVisitorStream(send: (chunk: Uint8Array) => void): string {
  const clientId = crypto.randomUUID();
  activeClients.set(clientId, { id: clientId, send });
  // Broadcast updated count immediately to all clients in real-time
  broadcastActiveVisitors();
  return clientId;
}

export function unregisterVisitorStream(clientId: string): void {
  if (activeClients.has(clientId)) {
    activeClients.delete(clientId);
    // Broadcast updated count immediately to all remaining clients in real-time
    broadcastActiveVisitors();
  }
}

export function getActiveVisitorCount(): number {
  return Math.max(activeClients.size, 1);
}
