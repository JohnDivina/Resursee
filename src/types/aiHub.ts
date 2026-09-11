export type OllamaRole = 'system' | 'user' | 'assistant';

export interface OllamaModelDetails {
  parent_model?: string;
  format: string;
  family: string;
  families?: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: OllamaModelDetails;
}

export interface OllamaTagResponse {
  models: OllamaModel[];
}

export interface OllamaRunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  expires_at: string;
  size_vram?: number;
}

export interface OllamaChatMessage {
  role: OllamaRole;
  content: string;
  images?: string[]; // base64 strings for multimodal models
}

export interface OllamaChatResponseChunk {
  model: string;
  created_at: string;
  message?: {
    role: OllamaRole;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
  percent?: number;
  error?: string;
}

export interface AIHubSession {
  id: string;
  title: string;
  model: string;
  systemPrompt?: string;
  temperature: number;
  messages: Array<{
    id: string;
    role: OllamaRole;
    content: string;
    codeSnippet?: string;
    timestamp: string;
    images?: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

export type OllamaConnectionStatus = 'checking' | 'connected' | 'offline';
