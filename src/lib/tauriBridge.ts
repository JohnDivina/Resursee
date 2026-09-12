import { isTauriDesktop } from '@/lib/envDetector';
import type { OllamaModel } from '@/types/aiHub';

export interface SystemTelemetry {
  total_ram_mb: number;
  available_ram_mb: number;
  os_name: string;
  os_version: string;
  cpu_arch: string;
  recommended_tier: '4gb' | '8gb' | '16gb_plus';
}

/**
 * Safely executes a Tauri command using IPC.
 * Gracefully checks for desktop environment and handles module dynamic resolution.
 */
export async function safeTauriInvoke<T>(
  cmd: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  if (typeof window === 'undefined') {
    throw new Error('Tauri IPC cannot be called during SSR');
  }

  if (!isTauriDesktop()) {
    throw new Error('Not running inside the Tauri desktop container');
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(cmd, args);
  } catch (err: any) {
    const win = window as any;
    if (win.__TAURI__?.core?.invoke) {
      return await win.__TAURI__.core.invoke(cmd, args);
    }
    if (win.__TAURI_INTERNALS__?.invoke) {
      return await win.__TAURI_INTERNALS__.invoke(cmd, args);
    }
    throw err;
  }
}

/**
 * Natively checks whether Ollama port 11434 is open locally via Rust TcpStream.
 */
export async function tauriCheckOllamaStatus(): Promise<boolean> {
  try {
    return await safeTauriInvoke<boolean>('check_ollama_status');
  } catch {
    return false;
  }
}

/**
 * Natively launches the local Ollama daemon across macOS, Windows, and Linux.
 */
export async function tauriStartOllama(): Promise<string> {
  return await safeTauriInvoke<string>('start_ollama_daemon');
}

/**
 * Natively stops the local Ollama daemon across macOS, Windows, and Linux.
 */
export async function tauriStopOllama(): Promise<string> {
  return await safeTauriInvoke<string>('stop_ollama_daemon');
}

/**
 * Reads host hardware telemetry (RAM, CPU, OS) directly via Rust sysinfo.
 */
export async function tauriGetTelemetry(): Promise<SystemTelemetry | null> {
  try {
    return await safeTauriInvoke<SystemTelemetry>('get_system_telemetry');
  } catch {
    return null;
  }
}

/**
 * Natively queries Ollama /api/tags via Rust HTTP client.
 * Bypasses all browser mixed-content and CORS security policies.
 */
export async function tauriQueryOllamaTags(): Promise<{
  status: boolean;
  models: OllamaModel[];
  error?: string;
}> {
  try {
    const data = await safeTauriInvoke<{ models?: OllamaModel[] }>('query_ollama_tags');
    return {
      status: true,
      models: data?.models || [],
    };
  } catch (err: any) {
    return {
      status: false,
      models: [],
      error: err?.message || String(err),
    };
  }
}

/**
 * Natively queries Ollama /api/ps for currently running models loaded in VRAM.
 */
export async function tauriQueryOllamaPs(): Promise<string[]> {
  try {
    const data = await safeTauriInvoke<{ models?: Array<{ name?: string; model?: string }> }>(
      'query_ollama_ps'
    );
    return (data?.models || []).map((m) => m.name || m.model || '').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Streams chat tokens from Ollama /api/chat natively via Rust and Tauri Channel IPC.
 */
export async function tauriStreamOllamaChat(
  options: {
    model: string;
    messages: any[];
    temperature?: number;
    num_ctx?: number;
  },
  onToken: (fullText: string, newToken: string) => void
): Promise<string> {
  if (!isTauriDesktop()) {
    throw new Error('Not running inside the Tauri desktop container');
  }

  const { Channel, invoke } = await import('@tauri-apps/api/core');
  const channel = new Channel<string>();
  let fullAccumulated = '';

  channel.onmessage = (line: string) => {
    try {
      const chunk = JSON.parse(line);
      const token = chunk.message?.content || '';
      if (token) {
        fullAccumulated += token;
        onToken(fullAccumulated, token);
      }
    } catch {
      // Ignore non-JSON or partial delimiter lines
    }
  };

  const payload = {
    model: options.model,
    messages: options.messages,
    stream: true,
    options: {
      temperature: options.temperature ?? 0.7,
      num_ctx: options.num_ctx ?? 4096,
    },
  };

  const result = await invoke<string>('stream_ollama_chat', {
    options: payload,
    onChunk: channel,
  });

  return result || fullAccumulated;
}

/**
 * Generic native proxy for any Ollama JSON endpoint (e.g. /api/show, /api/delete).
 */
export async function tauriOllamaProxyRequest<T = any>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: any
): Promise<T> {
  return await safeTauriInvoke<T>('ollama_proxy_request', {
    method,
    path,
    body: body ?? null,
  });
}
