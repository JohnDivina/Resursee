import {
  OllamaModel,
  OllamaTagResponse,
  OllamaChatMessage,
  OllamaChatResponseChunk,
  OllamaPullProgress,
  DocumentChunk,
  RetrievalResult,
} from '@/types/aiHub';

export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';

/**
 * Pings the Ollama REST API to verify if daemon is active and fetch installed models.
 */
export async function checkOllamaConnection(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  timeoutMs: number = 1500
): Promise<{ status: boolean; models: OllamaModel[]; error?: string }> {
  const tryEndpoint = async (url: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const cleanEndpoint = url.replace(/\/+$/, '');
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
  };

  const firstAttempt = await tryEndpoint(endpoint);
  if (firstAttempt.status) return firstAttempt;

  // Fallback: If 'localhost' was used, also attempt '127.0.0.1' (handles IPv6/IPv4 WebKit loopback quirks)
  if (endpoint.includes('localhost')) {
    const ipv4Endpoint = endpoint.replace('localhost', '127.0.0.1');
    const fallbackAttempt = await tryEndpoint(ipv4Endpoint);
    if (fallbackAttempt.status) return fallbackAttempt;
  }

  return firstAttempt;
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
 * Checks whether a model is an embedding-only model (not capable of text chat/completion).
 */
export function isEmbeddingModel(modelName: string, modelDetails?: OllamaModel): boolean {
  if (!modelName) return false;
  const lower = modelName.toLowerCase();
  if (
    lower.includes('embed') ||
    lower.includes('minilm') ||
    lower.includes('bge-') ||
    lower.includes('arctic-embed')
  ) {
    return true;
  }
  if (modelDetails) {
    if (modelDetails.details?.family === 'bert' || modelDetails.details?.family === 'nomic-bert') {
      return true;
    }
    if (
      modelDetails.capabilities?.includes('embedding') &&
      !modelDetails.capabilities?.includes('completion') &&
      !modelDetails.capabilities?.includes('tools')
    ) {
      return true;
    }
  }
  return false;
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
  if (isEmbeddingModel(options.model)) {
    throw new Error(
      `Model "${options.model}" is an embedding model and does not support chat/text generation. Please select a generative LLM (such as Llama 3.2 or Qwen 2.5) for synthesis.`
    );
  }

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
    let detail = '';
    try {
      const errData = await res.json();
      if (errData?.error) detail = `: ${errData.error}`;
    } catch {}
    throw new Error(`Inference failed: HTTP ${res.status} ${res.statusText}${detail}`);
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

/**
 * Triggers the 1-click start of local Ollama daemon via Resursee internal API.
 */
export async function startOllamaDaemon(): Promise<{
  success: boolean;
  running: boolean;
  modelsCount?: number;
  message?: string;
  isCloud?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/ai/ollama/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      running: false,
      error: err.message || 'Failed to trigger Ollama start',
    };
  }
}

/**
 * Triggers stopping the local Ollama daemon via Resursee internal API.
 */
export async function stopOllamaDaemon(): Promise<{
  success: boolean;
  stopped: boolean;
  message?: string;
  isCloud?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/ai/ollama/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      stopped: false,
      error: err.message || 'Failed to trigger Ollama stop',
    };
  }
}

/**
 * Recursively splits long text into overlapping chunks respecting natural paragraph and sentence boundaries.
 */
export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleaned.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < cleaned.length) {
      // Look for a natural break: double newline, single newline, period, or space
      const slice = cleaned.slice(startIndex, endIndex + 80);
      const paragraphBreak = slice.lastIndexOf('\n\n', chunkSize);
      const lineBreak = slice.lastIndexOf('\n', chunkSize);
      const sentenceBreak = slice.lastIndexOf('. ', chunkSize);
      const spaceBreak = slice.lastIndexOf(' ', chunkSize);

      if (paragraphBreak > chunkSize * 0.6) {
        endIndex = startIndex + paragraphBreak + 2;
      } else if (sentenceBreak > chunkSize * 0.6) {
        endIndex = startIndex + sentenceBreak + 2;
      } else if (lineBreak > chunkSize * 0.5) {
        endIndex = startIndex + lineBreak + 1;
      } else if (spaceBreak > chunkSize * 0.5) {
        endIndex = startIndex + spaceBreak + 1;
      }
    }

    const chunk = cleaned.slice(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    // Step forward, keeping overlap
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

/**
 * Computes cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return Math.max(0, Math.min(1, dotProduct / denominator));
}

/**
 * Fetches dense vector embedding from Ollama /api/embed or /api/embeddings.
 */
export async function getOllamaEmbedding(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  model: string = 'nomic-embed-text',
  prompt: string
): Promise<number[]> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');

  // Try modern /api/embed first
  try {
    const embedRes = await fetch(`${cleanEndpoint}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: prompt }),
    });
    if (embedRes.ok) {
      const data = await embedRes.json();
      if (Array.isArray(data?.embeddings) && data.embeddings[0]) {
        return data.embeddings[0];
      }
    }
  } catch {
    // fallback to legacy /api/embeddings
  }

  // Fallback to legacy /api/embeddings
  const res = await fetch(`${cleanEndpoint}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Embedding failed (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (Array.isArray(data.embedding)) {
    return data.embedding;
  }

  throw new Error('No embedding returned by model');
}

/**
 * Hybrid Semantic & Lexical (TF-IDF Cosine) Retriever.
 * Works with dense Ollama vectors when available, or client-side TF-IDF vector space with 100% reliability.
 */
export async function retrieveTopKChunks(
  query: string,
  chunks: DocumentChunk[],
  options: {
    endpoint?: string;
    embeddingModel?: string;
    topK?: number;
    useDenseVectors?: boolean;
  } = {}
): Promise<RetrievalResult[]> {
  if (chunks.length === 0 || !query.trim()) return [];

  const topK = options.topK ?? 5;
  const cleanQuery = query.toLowerCase().trim();

  // Stop words to ignore when extracting content keywords
  const STOP_WORDS = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of',
    'or', 'by', 'with', 'from', 'as', 'that', 'it', 'this', 'these', 'those',
    'then', 'so', 'can', 'will', 'just', 'should', 'now', 'any', 'my', 'your',
    'you', 'me', 'we', 'our', 'us', 'him', 'her', 'them', 'who', 'whom',
    'what', 'why', 'how', 'when', 'where', 'there', 'here', 'please', 'could',
    'would', 'tell', 'give', 'show', 'find', 'get', 'doc', 'document', 'file',
    'files', 'page', 'pages', 'read', 'look', 'check'
  ]);

  // Check if this is an overview or summarization query
  const isOverviewQuery =
    /\b(summariz|summary|overview|tldr|takeaway|takeaways|about|explain|describe|tell me about|what is this|what does this|outline|points|key points|findings|brief|synopsis|contents)\b/i.test(
      cleanQuery
    ) ||
    /^(summarize|summary|overview|explain|outline|describe|tell me|what is this|what does this)/i.test(
      cleanQuery
    );

  // 1. Overview & Summarization Strategy:
  // Return key structural chunks (beginning/intro, middle, and conclusion) across active documents
  if (isOverviewQuery) {
    const docMap = new Map<string, DocumentChunk[]>();
    chunks.forEach((c) => {
      const existing = docMap.get(c.documentId) || [];
      existing.push(c);
      docMap.set(c.documentId, existing);
    });

    const overviewResults: RetrievalResult[] = [];
    docMap.forEach((docChunks) => {
      const sorted = [...docChunks].sort((a, b) => a.chunkIndex - b.chunkIndex);

      if (sorted.length <= topK) {
        sorted.forEach((c, idx) => {
          overviewResults.push({
            chunk: c,
            score: Math.max(0.95 - idx * 0.05, 0.65),
            matchedTerms: ['overview_section'],
          });
        });
      } else {
        const selectedIndices = new Set<number>();
        // Head chunks: Document title, executive summary, objectives
        selectedIndices.add(0);
        if (sorted.length > 1) selectedIndices.add(1);
        if (sorted.length > 2) selectedIndices.add(2);

        // Representative middle chunks
        const midIdx = Math.floor(sorted.length / 2);
        selectedIndices.add(midIdx);
        if (sorted.length > 6) selectedIndices.add(Math.floor(sorted.length * 0.75));

        // Conclusion / tail chunk
        if (sorted.length > 3) selectedIndices.add(sorted.length - 1);

        Array.from(selectedIndices)
          .sort((a, b) => a - b)
          .slice(0, topK)
          .forEach((idx, order) => {
            overviewResults.push({
              chunk: sorted[idx],
              score: Math.max(0.95 - order * 0.05, 0.7),
              matchedTerms: ['overview_section'],
            });
          });
      }
    });

    if (overviewResults.length > 0) {
      return overviewResults.slice(0, topK);
    }
  }

  // Extract content tokens (falling back to raw tokens if all were stop words)
  const rawTokens = cleanQuery.split(/[^a-z0-9_]+/).filter((t) => t.length > 1);
  const contentTokens = rawTokens.filter((t) => !STOP_WORDS.has(t));
  const queryTokens = contentTokens.length > 0 ? contentTokens : rawTokens;

  // 2. Try Dense Vector Embedding via Ollama if requested & model is active
  if (options.useDenseVectors && options.embeddingModel) {
    try {
      const queryVec = await getOllamaEmbedding(
        options.endpoint || DEFAULT_OLLAMA_ENDPOINT,
        options.embeddingModel,
        query
      );

      const scored = chunks
        .map((chunk) => {
          const score = chunk.embedding ? cosineSimilarity(queryVec, chunk.embedding) : 0;
          return { chunk, score };
        })
        .filter((r) => r.score > 0.2)
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        return scored.slice(0, topK);
      }
    } catch {
      // Fallback cleanly to high-precision TF-IDF vector space
    }
  }

  // 3. High-Precision Client-Side TF-IDF Cosine Vector Space Retriever
  const docFreq: Record<string, number> = {};
  const chunkTokenized = chunks.map((chunk) => {
    const textTokens = chunk.text.toLowerCase().split(/[^a-z0-9_]+/).filter((t) => t.length > 1);
    const docNameTokens = (chunk.documentName || '').toLowerCase().split(/[^a-z0-9_]+/).filter((t) => t.length > 1);
    const combined = [...textTokens, ...docNameTokens];
    const unique = new Set(combined);
    unique.forEach((t) => {
      docFreq[t] = (docFreq[t] || 0) + 1;
    });
    return { chunk, tokens: textTokens, docNameTokens };
  });

  const totalDocs = chunks.length;

  const results: RetrievalResult[] = chunkTokenized.map(({ chunk, tokens, docNameTokens }) => {
    const tf: Record<string, number> = {};
    tokens.forEach((t) => {
      tf[t] = (tf[t] || 0) + 1;
    });

    let score = 0;
    const matchedTerms: string[] = [];

    queryTokens.forEach((qToken) => {
      if (tf[qToken]) {
        const idf = Math.log((totalDocs + 1) / ((docFreq[qToken] || 1) + 0.5)) + 1;
        const termFreq = tf[qToken];
        const tfWeight = (termFreq * 2.2) / (termFreq + 1.2 * (1 - 0.25 + 0.25 * (tokens.length / 120)));
        score += tfWeight * idf;
        matchedTerms.push(qToken);
      } else {
        const subMatch = tokens.some((t) => t.includes(qToken) || (qToken.length >= 4 && qToken.includes(t)));
        if (subMatch) {
          score += 0.5;
          matchedTerms.push(qToken);
        }
      }

      // Boost if document name matches query keyword (e.g. "rooftop", "garden", "proposal")
      if (docNameTokens.includes(qToken) || docNameTokens.some((d) => d.includes(qToken))) {
        score += 1.2;
        if (!matchedTerms.includes(qToken)) matchedTerms.push(qToken);
      }
    });

    // Slight positional bonus for introductory chunks
    if (chunk.chunkIndex === 1 && score > 0) score *= 1.25;
    if (chunk.chunkIndex === 2 && score > 0) score *= 1.15;

    const normalized = Math.min(0.98, Math.max(0.05, score / (queryTokens.length * 2.5 + 1)));

    return {
      chunk,
      score: matchedTerms.length > 0 ? normalized : 0,
      matchedTerms,
    };
  });

  const filtered = results
    .filter((r) => r.score > 0.08)
    .sort((a, b) => b.score - a.score);

  if (filtered.length > 0) {
    return filtered.slice(0, topK);
  }

  // 4. Safe Context Fallback:
  // If the query had no direct keyword match, return the introductory chunks of the active documents!
  return chunks.slice(0, topK).map((chunk, idx) => ({
    chunk,
    score: Math.max(0.7 - idx * 0.05, 0.45),
    matchedTerms: ['document_context'],
  }));
}


