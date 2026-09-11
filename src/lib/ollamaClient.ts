import {
  OllamaModel,
  OllamaTagResponse,
  OllamaChatMessage,
  OllamaChatResponseChunk,
  OllamaPullProgress,
} from '@/types/aiHub';

export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';

/**
 * Pings the Ollama REST API to verify if daemon is active and fetch installed models.
 */
export async function checkOllamaConnection(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  timeoutMs: number = 2500
): Promise<{ status: boolean; models: OllamaModel[]; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    const res = await fetch(`${cleanEndpoint}/api/tags`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { status: false, models: [], error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data: OllamaTagResponse = await res.json();
    return {
      status: true,
      models: data.models || [],
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      status: false,
      models: [],
      error: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Daemon unreachable'),
    };
  }
}

/**
 * Checks which models are currently loaded in GPU VRAM / CPU memory.
 */
export async function getRunningModels(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  timeoutMs: number = 2000
): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    const res = await fetch(`${cleanEndpoint}/api/ps`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!res.ok) return [];

    const data = await res.json();
    return (data.models || []).map((m: any) => m.name || m.model);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

/**
 * Pulls a model from Ollama registry with real-time streaming progress.
 */
export async function pullOllamaModel(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  modelName: string,
  onProgress: (progress: OllamaPullProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  const res = await fetch(`${cleanEndpoint}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: true }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to pull model: HTTP ${res.status} ${res.statusText}`);
  }

  if (!res.body) {
    throw new Error('ReadableStream not supported on this browser');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const layersMap: Record<string, { total: number; completed: number }> = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        if (chunk.error) {
          throw new Error(chunk.error);
        }

        let calculatedPercent = 0;
        if (chunk.digest && chunk.total) {
          layersMap[chunk.digest] = {
            total: chunk.total || 0,
            completed: chunk.completed || 0,
          };
          const totalBytes = Object.values(layersMap).reduce((acc, l) => acc + l.total, 0);
          const completedBytes = Object.values(layersMap).reduce((acc, l) => acc + l.completed, 0);
          if (totalBytes > 0) {
            calculatedPercent = Math.min(99, Math.round((completedBytes / totalBytes) * 100));
          }
        } else if (chunk.total && chunk.completed) {
          calculatedPercent = Math.min(99, Math.round((chunk.completed / chunk.total) * 100));
        } else if (chunk.status === 'success') {
          calculatedPercent = 100;
        }

        onProgress({
          status: chunk.status || 'pulling',
          digest: chunk.digest,
          total: chunk.total,
          completed: chunk.completed,
          percent: calculatedPercent,
        });
      } catch (err: any) {
        if (!err.message?.includes('JSON')) throw err;
      }
    }
  }

  onProgress({ status: 'success', percent: 100 });
}

/**
 * Deletes a local model from Ollama storage.
 */
export async function deleteOllamaModel(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  modelName: string
): Promise<void> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  const res = await fetch(`${cleanEndpoint}/api/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
  });

  if (!res.ok) {
    throw new Error(`Failed to delete model: HTTP ${res.status} ${res.statusText}`);
  }
}

/**
 * Fetches detailed metadata for an Ollama model (parameters, template, license).
 */
export async function showOllamaModel(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  modelName: string
): Promise<any> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  const res = await fetch(`${cleanEndpoint}/api/show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch model info: HTTP ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Streams chat tokens from Ollama's /api/chat endpoint.
 */
export async function streamOllamaChat(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  options: {
    model: string;
    messages: OllamaChatMessage[];
    temperature?: number;
    num_ctx?: number;
  },
  onToken: (fullText: string, newToken: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  const res = await fetch(`${cleanEndpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        num_ctx: options.num_ctx ?? 4096,
      },
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Inference failed: HTTP ${res.status} ${res.statusText}`);
  }

  if (!res.body) {
    throw new Error('ReadableStream not supported');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullAccumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk: OllamaChatResponseChunk = JSON.parse(line);
        const token = chunk.message?.content || '';
        if (token) {
          fullAccumulated += token;
          onToken(fullAccumulated, token);
        }
      } catch (err: any) {
        if (!err.message?.includes('JSON')) throw err;
      }
    }
  }

  return fullAccumulated;
}
