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

/**
 * Natively opens any external URL in the host system's default browser (Safari, Chrome, Edge, etc.)
 * Bypasses Tauri webview navigation limitations and gracefully falls back to window.open in web mode.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;
  const cleanUrl = url.trim();

  if (isTauriDesktop()) {
    try {
      await safeTauriInvoke<boolean>('open_external_url', { url: cleanUrl });
      return;
    } catch (err) {
      console.warn('Tauri open_external_url failed, falling back to window.open', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Checks if arduino-cli is installed and accessible on the host machine.
 */
export async function tauriCheckArduinoCli(): Promise<boolean> {
  try {
    return await safeTauriInvoke<boolean>('check_arduino_cli');
  } catch {
    return false;
  }
}

/**
 * Gets the detected arduino-cli version string.
 */
export async function tauriGetArduinoCliVersion(): Promise<string | null> {
  try {
    return await safeTauriInvoke<string>('get_arduino_cli_version');
  } catch {
    return null;
  }
}

/**
 * Lists connected serial ports and boards on the host system.
 */
export async function tauriListSerialPorts(): Promise<string[]> {
  try {
    return await safeTauriInvoke<string[]>('list_serial_ports');
  } catch {
    return [];
  }
}

/**
 * Compiles an Arduino sketch natively via arduino-cli.
 */
export async function tauriCompileSketch(
  code: string,
  fqbn = 'esp32:esp32:esp32'
): Promise<{ success: boolean; output: string }> {
  try {
    const output = await safeTauriInvoke<string>('compile_arduino_sketch', {
      code,
      fqbn,
    });
    return { success: true, output };
  } catch (err: any) {
    return {
      success: false,
      output: err?.message || String(err),
    };
  }
}

/**
 * Uploads an Arduino sketch to the selected serial port via arduino-cli.
 */
export async function tauriUploadSketch(
  port: string,
  code: string,
  fqbn = 'esp32:esp32:esp32'
): Promise<{ success: boolean; output: string }> {
  try {
    const output = await safeTauriInvoke<string>('upload_arduino_sketch', {
      port,
      code,
      fqbn,
    });
    return { success: true, output };
  } catch (err: any) {
    return {
      success: false,
      output: err?.message || String(err),
    };
  }
}

/**
 * Installs an Arduino library via arduino-cli lib install.
 */
export async function tauriInstallLibrary(
  libraryName: string
): Promise<{ success: boolean; output: string }> {
  try {
    const output = await safeTauriInvoke<string>('install_arduino_library', {
      libraryName,
    });
    return { success: true, output };
  } catch (err: any) {
    return {
      success: false,
      output: err?.message || String(err),
    };
  }
}

/**
 * Searches the official Arduino library registry via arduino-cli lib search.
 */
export async function tauriSearchLibraries(query: string): Promise<any[]> {
  try {
    const data = await safeTauriInvoke<any>('search_arduino_libraries', { query });
    if (Array.isArray(data)) return data;
    if (data?.libraries && Array.isArray(data.libraries)) return data.libraries;
    return [];
  } catch {
    return [];
  }
}

/**
 * Uninstalls an Arduino library via arduino-cli lib uninstall.
 */
export async function tauriUninstallLibrary(
  libraryName: string
): Promise<{ success: boolean; output: string }> {
  try {
    const output = await safeTauriInvoke<string>('uninstall_arduino_library', {
      libraryName,
    });
    return { success: true, output };
  } catch (err: any) {
    return {
      success: false,
      output: err?.message || String(err),
    };
  }
}

/**
 * Lists installed board cores via arduino-cli core list.
 */
export async function tauriListInstalledCores(): Promise<any[]> {
  try {
    const data = await safeTauriInvoke<any>('list_installed_cores');
    if (Array.isArray(data)) return data;
    if (data?.platforms && Array.isArray(data.platforms)) return data.platforms;
    return [];
  } catch {
    return [];
  }
}

/**
 * Installs an Arduino board core package (e.g. "esp32:esp32").
 */
export async function tauriInstallCore(
  coreName: string
): Promise<{ success: boolean; output: string }> {
  try {
    const output = await safeTauriInvoke<string>('install_arduino_core', {
      coreName,
    });
    return { success: true, output };
  } catch (err: any) {
    return {
      success: false,
      output: err?.message || String(err),
    };
  }
}

/**
 * Uninstalls an Arduino board core package.
 */
export async function tauriUninstallCore(
  coreName: string
): Promise<{ success: boolean; output: string }> {
  try {
    const output = await safeTauriInvoke<string>('uninstall_arduino_core', {
      coreName,
    });
    return { success: true, output };
  } catch (err: any) {
    return {
      success: false,
      output: err?.message || String(err),
    };
  }
}

/**
 * Lists installed libraries via arduino-cli lib list.
 */
export async function tauriListInstalledLibraries(): Promise<any[]> {
  try {
    const data = await safeTauriInvoke<any>('list_installed_libraries');
    if (Array.isArray(data)) return data;
    if (data?.installed_libraries && Array.isArray(data.installed_libraries)) {
      return data.installed_libraries;
    }
    return [];
  } catch {
    return [];
  }
}

