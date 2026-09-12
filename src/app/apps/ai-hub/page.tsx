'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Sidebar, SidebarBody, SidebarLink, Links } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/theme/ThemeToggle';
import {
  IconMessageChatbot,
  IconCpu,
  IconEye,
  IconDatabase,
  IconSettings,
  IconArrowLeft,
  IconTerminal2,
  IconDownload,
  IconCheck,
  IconCopy,
  IconSearch,
  IconFileText,
  IconUpload,
  IconSparkles,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconAlertCircle,
  IconX,
  IconHistory,
  IconPlus,
  IconTrash,
  IconFileExport,
  IconAdjustmentsHorizontal,
  IconInfoCircle,
  IconAlertTriangle,
  IconLayersLinked,
  IconDisc,
  IconBook,
  IconBrandApple,
  IconBrandWindows,
  IconBrandUbuntu,
  IconExternalLink,
  IconCompass,
  IconShieldCheck,
  IconCube,
  IconHeart,
  IconTrendingUp,
  IconWorld,
} from '@tabler/icons-react';
import {
  checkOllamaConnection,
  getRunningModels,
  pullOllamaModel,
  deleteOllamaModel,
  showOllamaModel,
  streamOllamaChat,
  startOllamaDaemon,
  stopOllamaDaemon,
  chunkText,
  retrieveTopKChunks,
  getOllamaEmbedding,
  DEFAULT_OLLAMA_ENDPOINT,
} from '@/lib/ollamaClient';
import { isLocalEnvironment } from '@/lib/envDetector';
import { parseAnyDocumentFile } from '@/lib/documentParsers';
import {
  OllamaModel,
  OllamaConnectionStatus,
  AIHubSession,
  DocumentChunk,
  IndexedDocument,
  RetrievalResult,
} from '@/types/aiHub';

// --- Types ---
type ActiveTab = 'guide' | 'chat' | 'models' | 'vision' | 'rag' | 'settings';

interface ModelItem {
  id: string;
  name: string;
  category: 'compact' | 'reasoning' | 'code' | 'vision' | 'embeddings' | 'general';
  parameters: string;
  size: string;
  vram: string;
  description: string;
  isDownloaded?: boolean;
  author?: string;
  quantization?: string;
  source?: 'ollama' | 'huggingface';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeSnippet?: string;
  timestamp: string;
}

const CATALOG_MODELS: ModelItem[] = [
  // --- Fast & Compact ---
  {
    id: 'qwen2.5:0.5b',
    name: 'Qwen 2.5 (0.5B)',
    category: 'compact',
    parameters: '494M',
    size: '398 MB',
    vram: '1.0 GB',
    description: 'Ultra-lightweight edge model. Boots instantly on any device with minimal RAM usage.',
  },
  {
    id: 'qwen2.5:1.5b',
    name: 'Qwen 2.5 (1.5B)',
    category: 'compact',
    parameters: '1.54B',
    size: '986 MB',
    vram: '2.0 GB',
    description: 'Fast, high-density multilingual instruction model with remarkable accuracy for its compact footprint.',
  },
  {
    id: 'qwen2.5:1.5b-instruct',
    name: 'Qwen 2.5 Instruct (1.5B)',
    category: 'compact',
    parameters: '1.54B',
    size: '986 MB',
    vram: '2.0 GB',
    description: 'Official instruction-tuned checkpoint of Qwen 2.5 (1.5B) for structured Q&A, chat, and rapid reasoning.',
  },
  {
    id: 'llama3.2:1b',
    name: 'Llama 3.2 (1B)',
    category: 'compact',
    parameters: '1.24B',
    size: '1.3 GB',
    vram: '2.0 GB',
    description: 'Meta’s ultra-compact model optimized for edge devices, instant responses, and low memory usage.',
  },
  {
    id: 'llama3.2:latest',
    name: 'Llama 3.2 (3B)',
    category: 'compact',
    parameters: '3.21B',
    size: '2.0 GB',
    vram: '4.0 GB',
    description: 'High-efficiency instruction model with strong tool calling, summarizing, and multilingual capabilities.',
  },
  {
    id: 'gemma2:2b',
    name: 'Gemma 2 (2B)',
    category: 'compact',
    parameters: '2.6B',
    size: '1.6 GB',
    vram: '3.0 GB',
    description: 'Google DeepMind’s high-efficiency lightweight open model built on Gemini research.',
  },
  {
    id: 'tinyllama:latest',
    name: 'TinyLlama (1.1B)',
    category: 'compact',
    parameters: '1.1B',
    size: '637 MB',
    vram: '1.5 GB',
    description: 'Pre-trained on 3 trillion tokens, ideal for low-spec devices and background summarization.',
  },
  {
    id: 'granite3.1-moe:3b',
    name: 'IBM Granite 3.1 MoE (3B)',
    category: 'compact',
    parameters: '3.3B MoE',
    size: '2.1 GB',
    vram: '3.0 GB',
    description: 'IBM’s enterprise lightweight Mixture-of-Experts architecture optimized for fast inference on modest edge hardware.',
  },
  {
    id: 'nemotron-mini:latest',
    name: 'Nemotron Mini (4B)',
    category: 'compact',
    parameters: '4.0B',
    size: '2.7 GB',
    vram: '4.5 GB',
    description: 'NVIDIA’s optimized small language model with high token generation efficiency on RTX and Apple Silicon.',
  },
  {
    id: 'smollm2:1.7b',
    name: 'SmolLM2 (1.7B)',
    category: 'compact',
    parameters: '1.71B',
    size: '1.8 GB',
    vram: '2.5 GB',
    description: 'HuggingFace’s state-of-the-art small language model with high reasoning and instruction-following density.',
  },
  {
    id: 'smollm2:360m',
    name: 'SmolLM2 (360M)',
    category: 'compact',
    parameters: '360M',
    size: '229 MB',
    vram: '0.8 GB',
    description: 'Pocket-sized text assistant for real-time edge processing and low-latency streaming.',
  },

  // --- Reasoning & Math ---
  {
    id: 'deepseek-r1:latest',
    name: 'DeepSeek R1 (7B Reasoning)',
    category: 'reasoning',
    parameters: '7.6B',
    size: '4.7 GB',
    vram: '8.0 GB',
    description: 'Frontier chain-of-thought reasoning model with self-verifying step-by-step logic for math, STEM, and programming.',
  },
  {
    id: 'deepseek-r1:1.5b',
    name: 'DeepSeek R1 (1.5B Compact)',
    category: 'reasoning',
    parameters: '1.58B',
    size: '1.1 GB',
    vram: '2.5 GB',
    description: 'Distilled reasoning powerhouse with step-by-step chain-of-thought verification for math and logic.',
  },
  {
    id: 'deepseek-r1:8b',
    name: 'DeepSeek R1 (8B Llama-Distill)',
    category: 'reasoning',
    parameters: '8.0B',
    size: '4.9 GB',
    vram: '8.5 GB',
    description: 'Llama-distilled variant combining Meta architectural stability with DeepSeek self-reflection reasoning.',
  },
  {
    id: 'deepseek-r1:14b',
    name: 'DeepSeek R1 (14B)',
    category: 'reasoning',
    parameters: '14.8B',
    size: '9.0 GB',
    vram: '14.0 GB',
    description: 'Deep reasoning model for advanced algorithmic challenges, theorem proving, and multi-step deduction.',
  },
  {
    id: 'phi4:14b',
    name: 'Phi-4 (14B Reasoning)',
    category: 'reasoning',
    parameters: '14.7B',
    size: '9.1 GB',
    vram: '14.0 GB',
    description: 'Microsoft’s flagship synthetic-data trained reasoning model with exceptional STEM performance.',
  },
  {
    id: 'phi3.5:latest',
    name: 'Phi-3.5 Mini (3.8B)',
    category: 'reasoning',
    parameters: '3.82B',
    size: '2.2 GB',
    vram: '4.0 GB',
    description: 'Microsoft’s high-density reasoning model capable of 128k context windows on compact hardware.',
  },

  // --- Code & Systems ---
  {
    id: 'qwen2.5-coder:1.5b',
    name: 'Qwen 2.5 Coder (1.5B)',
    category: 'code',
    parameters: '1.54B',
    size: '986 MB',
    vram: '2.5 GB',
    description: 'Alibaba’s specialized code assistant with syntax mastery across TypeScript, Python, C++, and Rust.',
  },
  {
    id: 'qwen2.5-coder:latest',
    name: 'Qwen 2.5 Coder (7B)',
    category: 'code',
    parameters: '7.6B',
    size: '4.7 GB',
    vram: '8.0 GB',
    description: 'World-class code synthesis, bug repair, and multi-file refactoring on par with GPT-4o on HumanEval.',
  },
  {
    id: 'qwen2.5-coder:14b',
    name: 'Qwen 2.5 Coder (14B)',
    category: 'code',
    parameters: '14.7B',
    size: '9.0 GB',
    vram: '14.0 GB',
    description: 'High-capacity coding model for enterprise software development and complex system architectures.',
  },
  {
    id: 'qwen2.5-coder:32b',
    name: 'Qwen 2.5 Coder (32B)',
    category: 'code',
    parameters: '32.5B',
    size: '19 GB',
    vram: '24.0 GB',
    description: 'Flagship open-source code model rivaling GPT-4o on HumanEval, full repo editing, and multi-file codebases.',
  },
  {
    id: 'deepseek-coder-v2:16b',
    name: 'DeepSeek Coder V2 (16B MoE)',
    category: 'code',
    parameters: '16B MoE',
    size: '8.9 GB',
    vram: '12.0 GB',
    description: 'Mixture-of-Experts coding model supporting 338 programming languages and 128k context tokens.',
  },
  {
    id: 'codellama:7b',
    name: 'Code Llama (7B)',
    category: 'code',
    parameters: '6.7B',
    size: '3.8 GB',
    vram: '7.0 GB',
    description: 'Meta’s dedicated code completion and infilling model with Python and TypeScript specialization.',
  },
  {
    id: 'codellama:13b',
    name: 'Code Llama (13B)',
    category: 'code',
    parameters: '13B',
    size: '7.4 GB',
    vram: '12.0 GB',
    description: 'Deep code understanding, docstring generation, and automated test suite authoring.',
  },
  {
    id: 'starcoder2:3b',
    name: 'StarCoder 2 (3B)',
    category: 'code',
    parameters: '3.0B',
    size: '1.7 GB',
    vram: '3.0 GB',
    description: 'BigCode’s transparent, permissively trained code generation model with low GPU overhead.',
  },
  {
    id: 'starcoder2:7b',
    name: 'StarCoder 2 (7B)',
    category: 'code',
    parameters: '7.2B',
    size: '4.1 GB',
    vram: '7.5 GB',
    description: 'Trained on 619 programming languages from Software Heritage with Git commit awareness.',
  },
  {
    id: 'sqlcoder:7b',
    name: 'SQLCoder (7B)',
    category: 'code',
    parameters: '7.0B',
    size: '4.1 GB',
    vram: '7.0 GB',
    description: 'Defog’s purpose-built model for converting natural language queries into production-grade SQL.',
  },
  {
    id: 'codegemma:7b',
    name: 'CodeGemma (7B)',
    category: 'code',
    parameters: '7.0B',
    size: '5.0 GB',
    vram: '8.0 GB',
    description: 'Google’s specialized Gemma model for code completion, unit test generation, and syntax analysis.',
  },

  // --- Vision & Multimodal ---
  {
    id: 'llava:7b',
    name: 'LLaVA (7B Vision)',
    category: 'vision',
    parameters: '7.0B',
    size: '4.7 GB',
    vram: '8.0 GB',
    description: 'Multimodal vision transformer capable of visual OCR, foliar inspection, and document diagram analysis.',
  },
  {
    id: 'llava:13b',
    name: 'LLaVA (13B Vision)',
    category: 'vision',
    parameters: '13B',
    size: '8.0 GB',
    vram: '14.0 GB',
    description: 'High-detail visual reasoning and dense multimodal document analysis for complex charts.',
  },
  {
    id: 'llama3.2-vision:11b',
    name: 'Llama 3.2 Vision (11B)',
    category: 'vision',
    parameters: '11B',
    size: '7.9 GB',
    vram: '12.0 GB',
    description: 'Meta’s frontier multimodal model for high-resolution visual reasoning, chart understanding, and document OCR.',
  },
  {
    id: 'moondream:latest',
    name: 'Moondream 2 (1.8B Vision)',
    category: 'vision',
    parameters: '1.8B',
    size: '1.6 GB',
    vram: '2.5 GB',
    description: 'Tiny, ultra-fast vision model capable of running smoothly on low-resource laptops and edge hardware.',
  },
  {
    id: 'minicpm-v:8b',
    name: 'MiniCPM-V 2.6 (8B Vision)',
    category: 'vision',
    parameters: '8.0B',
    size: '5.5 GB',
    vram: '9.0 GB',
    description: 'OpenBMB vision model with high-resolution 1.8M pixel visual comprehension and OCR.',
  },
  {
    id: 'glm-ocr:latest',
    name: 'GLM OCR Document Model',
    category: 'vision',
    parameters: '0.9B',
    size: '1.8 GB',
    vram: '3.0 GB',
    description: 'Specialized document OCR model optimized for table recognition, receipts, invoices, and handwriting.',
  },
  {
    id: 'qwen2.5vl:7b',
    name: 'Qwen 2.5 VL (7B Vision)',
    category: 'vision',
    parameters: '7.6B',
    size: '5.5 GB',
    vram: '9.0 GB',
    description: 'Alibaba’s frontier visual-language model with native resolution image understanding, document OCR, and video reasoning.',
  },

  // --- General & Frontier Assistants ---
  {
    id: 'deepseek-v3:latest',
    name: 'DeepSeek V3 (671B MoE)',
    category: 'general',
    parameters: '671B MoE',
    size: '404 GB',
    vram: '450 GB',
    description: 'DeepSeek’s flagship Mixture-of-Experts foundation model rivaling top closed frontier LLMs.',
  },
  {
    id: 'llama3.3:70b',
    name: 'Llama 3.3 (70B Flagship)',
    category: 'general',
    parameters: '70.6B',
    size: '43 GB',
    vram: '48.0 GB',
    description: 'Meta’s latest flagship 70B open weight model delivering GPT-4 tier intelligence across 8 languages.',
  },
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 (8B)',
    category: 'general',
    parameters: '8.03B',
    size: '4.7 GB',
    vram: '8.0 GB',
    description: 'Industry standard open model with 128k context support, tool calling, and general conversational fluency.',
  },
  {
    id: 'qwen2.5:latest',
    name: 'Qwen 2.5 (7B)',
    category: 'general',
    parameters: '7.61B',
    size: '4.7 GB',
    vram: '8.0 GB',
    description: 'Alibaba’s flagship generalist model with leading benchmark scores across knowledge, coding, and roleplay.',
  },
  {
    id: 'mistral:latest',
    name: 'Mistral (7B v0.3)',
    category: 'general',
    parameters: '7.25B',
    size: '4.1 GB',
    vram: '7.5 GB',
    description: 'Mistral AI’s versatile flagship foundation model with function calling and strong comprehension.',
  },
  {
    id: 'mistral-small:latest',
    name: 'Mistral Small 3 (24B)',
    category: 'general',
    parameters: '24B',
    size: '14 GB',
    vram: '18.0 GB',
    description: 'Mistral AI’s state-of-the-art enterprise model with high benchmark scores in reasoning, coding, and multilingual tasks.',
  },
  {
    id: 'mistral-nemo:12b',
    name: 'Mistral NeMo (12B)',
    category: 'general',
    parameters: '12.2B',
    size: '7.1 GB',
    vram: '11.0 GB',
    description: 'Co-developed with NVIDIA. Features 128k context length with standard-setting general reasoning.',
  },
  {
    id: 'gemma2:9b',
    name: 'Gemma 2 (9B)',
    category: 'general',
    parameters: '9.24B',
    size: '5.5 GB',
    vram: '9.0 GB',
    description: 'Google’s state-of-the-art 9B architecture built on sliding window attention and knowledge distillation.',
  },
  {
    id: 'mixtral:8x7b',
    name: 'Mixtral (8x7B MoE)',
    category: 'general',
    parameters: '46.7B MoE',
    size: '26 GB',
    vram: '32.0 GB',
    description: 'Sparse Mixture-of-Experts routing 2 of 8 experts per token for fast inference with high capacity.',
  },
  {
    id: 'command-r:latest',
    name: 'Command R (35B RAG)',
    category: 'general',
    parameters: '35B',
    size: '20 GB',
    vram: '26.0 GB',
    description: 'Cohere’s specialized enterprise model optimized for grounded Retrieval Augmented Generation (RAG) and tool use.',
  },
  {
    id: 'hermes3:8b',
    name: 'Hermes 3 (8B)',
    category: 'general',
    parameters: '8.0B',
    size: '4.9 GB',
    vram: '8.0 GB',
    description: 'Nous Research instruction fine-tune with strong creative writing, persona following, and complex JSON output.',
  },

  // --- Embeddings & Vector RAG ---
  {
    id: 'nomic-embed-text:latest',
    name: 'Nomic Embed Text (137M)',
    category: 'embeddings',
    parameters: '137M',
    size: '274 MB',
    vram: '0.5 GB',
    description: '8192-token context embedding model optimized for technical documentation, search, and RAG retrieval.',
  },
  {
    id: 'all-minilm:latest',
    name: 'All-MiniLM L6 v2 (22M)',
    category: 'embeddings',
    parameters: '22.7M',
    size: '45 MB',
    vram: '0.2 GB',
    description: 'Ultra-compact sentence transformer producing high-speed semantic similarity embeddings.',
  },
  {
    id: 'bge-m3:latest',
    name: 'BGE-M3 Multilingual (567M)',
    category: 'embeddings',
    parameters: '567M',
    size: '1.2 GB',
    vram: '2.0 GB',
    description: 'BAAI multi-lingual embedding model supporting dense, sparse, and multi-vector retrieval across 100+ languages.',
  },
  {
    id: 'bge-large:latest',
    name: 'BAAI BGE Large (335M)',
    category: 'embeddings',
    parameters: '335M',
    size: '670 MB',
    vram: '1.0 GB',
    description: 'Top-performing dense sentence embedding model for high-accuracy document ranking in vector databases.',
  },
  {
    id: 'mxbai-embed-large:latest',
    name: 'Mixedbread Embed Large (335M)',
    category: 'embeddings',
    parameters: '335M',
    size: '670 MB',
    vram: '1.0 GB',
    description: 'Trained by Mixedbread AI for top-tier retrieval performance on the MTEB benchmark.',
  },
  {
    id: 'snowflake-arctic-embed:latest',
    name: 'Snowflake Arctic Embed (137M)',
    category: 'embeddings',
    parameters: '137M',
    size: '274 MB',
    vram: '0.5 GB',
    description: 'Enterprise-grade text embedding model fine-tuned for high-precision vector database ranking.',
  },
];

const CURATED_OLLAMA_TAGS = new Set([
  'llama3.2:1b',
  'llama3.2:latest',
  'llama3.2:3b',
  'llama3.1:8b',
  'deepseek-r1:1.5b',
  'deepseek-r1:7b',
  'deepseek-r1:8b',
  'deepseek-r1:latest',
  'qwen2.5-coder:1.5b',
  'qwen2.5-coder:7b',
  'qwen2.5-coder:latest',
  'qwen2.5:0.5b',
  'gemma2:2b',
  'gemma2:9b',
  'gemma2:latest',
  'mistral:7b',
  'mistral:latest',
  'phi3.5:3.8b',
  'phi3:latest',
  'llava:7b',
  'llava:latest',
  'granite3.1-dense:8b',
  'nomic-embed-text:latest',
]);

const HUGGINGFACE_MODELS: ModelItem[] = [
  // Fast & Compact
  {
    id: 'hf.co/bartowski/Llama-3.2-1B-Instruct-GGUF:Q4_K_M',
    name: 'Llama 3.2 (1B) Instruct',
    category: 'compact',
    parameters: '1.24B',
    size: '808 MB',
    vram: '1.8 GB',
    description: 'Meta’s ultra-compact model quantized by Bartowski. Boots in milliseconds with high efficiency.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M',
    name: 'Llama 3.2 (3B) Instruct',
    category: 'compact',
    parameters: '3.21B',
    size: '2.02 GB',
    vram: '3.8 GB',
    description: 'Meta’s official instruction model quantized to Q4_K_M by Bartowski with high perplexity preservation.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/SmolLM2-1.7B-Instruct-GGUF:Q4_K_M',
    name: 'SmolLM2 (1.7B) Instruct',
    category: 'compact',
    parameters: '1.71B',
    size: '1.06 GB',
    vram: '2.2 GB',
    description: 'Hugging Face official compact model family with strong conversational benchmarks for on-device applications.',
    author: 'HuggingFaceTB',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/SmolLM2-360M-Instruct-GGUF:Q4_K_M',
    name: 'SmolLM2 (360M) Instruct',
    category: 'compact',
    parameters: '360M',
    size: '260 MB',
    vram: '0.8 GB',
    description: 'Sub-billion lightweight model by Hugging Face TB. Perfect for embedded micro-tasks and low-spec laptops.',
    author: 'HuggingFaceTB',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Qwen2.5-0.5B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen 2.5 (0.5B) Instruct',
    category: 'compact',
    parameters: '494M',
    size: '398 MB',
    vram: '1.0 GB',
    description: 'Ultra-portable 0.5B checkpoint by Alibaba, ideal for background categorization and instant completions.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen 2.5 (1.5B) Instruct',
    category: 'compact',
    parameters: '1.54B',
    size: '1.02 GB',
    vram: '2.2 GB',
    description: 'Dense multilingual compact model excelling in mathematics, structured JSON extraction, and chat.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Qwen2.5-3B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen 2.5 (3B) Instruct',
    category: 'compact',
    parameters: '3.4B',
    size: '2.18 GB',
    vram: '3.9 GB',
    description: 'Balanced 3B model rivaling previous generation 7B checkpoints on instruction following and multilingual tasks.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/gemma-2-2b-it-GGUF:Q4_K_M',
    name: 'Gemma 2 (2B) Instruct',
    category: 'compact',
    parameters: '2.61B',
    size: '1.63 GB',
    vram: '3.2 GB',
    description: 'Google DeepMind’s ultra-compact instruction tuned model, great for quick summaries and chat tasks.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Phi-3.5-mini-instruct-GGUF:Q4_K_M',
    name: 'Phi-3.5 Mini Instruct (3.8B)',
    category: 'compact',
    parameters: '3.82B',
    size: '2.39 GB',
    vram: '4.2 GB',
    description: 'Microsoft’s multilingual instruction model with 128k context window and high reasoning benchmarks.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF:Q4_K_M',
    name: 'TinyLlama (1.1B) Chat',
    category: 'compact',
    parameters: '1.10B',
    size: '668 MB',
    vram: '1.8 GB',
    description: 'Compact 1.1B chat model quantized by TheBloke, boots in milliseconds and uses almost zero RAM.',
    author: 'TheBloke',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },

  // Reasoning & Math
  {
    id: 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF:Q4_K_M',
    name: 'DeepSeek R1 Distill Qwen (1.5B)',
    category: 'reasoning',
    parameters: '1.78B',
    size: '1.12 GB',
    vram: '2.2 GB',
    description: 'Chain-of-thought reasoning model distilled from DeepSeek-R1 by Unsloth, running smoothly on modest hardware.',
    author: 'unsloth',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/DeepSeek-R1-Distill-Qwen-7B-GGUF:Q4_K_M',
    name: 'DeepSeek R1 Distill Qwen (7B)',
    category: 'reasoning',
    parameters: '7.61B',
    size: '4.68 GB',
    vram: '6.5 GB',
    description: 'Mathematical and logical step-by-step reasoning distilled from DeepSeek-R1 into Qwen 2.5 7B.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/DeepSeek-R1-Distill-Llama-8B-GGUF:Q4_K_M',
    name: 'DeepSeek R1 Distill Llama (8B)',
    category: 'reasoning',
    parameters: '8.03B',
    size: '4.92 GB',
    vram: '7.2 GB',
    description: 'DeepSeek-R1 chain-of-thought reasoning capabilities distilled into Meta Llama 3.1 8B architecture.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/DeepSeek-R1-Distill-Qwen-14B-GGUF:Q4_K_M',
    name: 'DeepSeek R1 Distill Qwen (14B)',
    category: 'reasoning',
    parameters: '14.8B',
    size: '8.98 GB',
    vram: '11.5 GB',
    description: 'High-power 14B reasoning model rivaling OpenAI o1-mini on competitive math and programming benchmarks.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/DeepSeek-R1-Distill-Qwen-32B-GGUF:Q4_K_M',
    name: 'DeepSeek R1 Distill Qwen (32B)',
    category: 'reasoning',
    parameters: '32.5B',
    size: '19.8 GB',
    vram: '24.0 GB',
    description: 'Near-frontier reasoning powerhouse distilled from DeepSeek-R1 with state-of-the-art math and code synthesis.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Marco-o1-GGUF:Q4_K_M',
    name: 'Marco-o1 Reasoning (7B)',
    category: 'reasoning',
    parameters: '7.61B',
    size: '4.68 GB',
    vram: '6.5 GB',
    description: 'Open reasoning model by Alibaba utilizing Monte Carlo Tree Search (MCTS) reflection for complex problem solving.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },

  // Code & Systems
  {
    id: 'hf.co/bartowski/Qwen2.5-Coder-1.5B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen 2.5 Coder (1.5B) Instruct',
    category: 'code',
    parameters: '1.54B',
    size: '1.02 GB',
    vram: '2.2 GB',
    description: 'Ultra-fast code companion for inline autocompletion, regex generation, and quick syntax debugging.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Qwen2.5-Coder-7B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen 2.5 Coder (7B) Instruct',
    category: 'code',
    parameters: '7.61B',
    size: '4.68 GB',
    vram: '6.5 GB',
    description: 'Premier open code model with 128k context support, excels at code generation, debugging, and refactoring.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Qwen2.5-Coder-14B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen 2.5 Coder (14B) Instruct',
    category: 'code',
    parameters: '14.8B',
    size: '8.98 GB',
    vram: '11.5 GB',
    description: 'Full-stack software engineering model with deep understanding of distributed architectures and multi-file projects.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Qwen2.5-Coder-32B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen 2.5 Coder (32B) Instruct',
    category: 'code',
    parameters: '32.5B',
    size: '19.8 GB',
    vram: '24.0 GB',
    description: 'Enterprise grade code intelligence with state-of-the-art SWE-bench scores and large repository refactoring.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/granite-3.1-8b-instruct-GGUF:Q4_K_M',
    name: 'IBM Granite 3.1 (8B) Instruct',
    category: 'code',
    parameters: '8.18B',
    size: '4.92 GB',
    vram: '7.0 GB',
    description: 'IBM’s enterprise-grade model trained on enterprise code, SQL workflows, and tool calling protocols.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/starcoder2-3b-GGUF:Q4_K_M',
    name: 'StarCoder2 (3B)',
    category: 'code',
    parameters: '3.04B',
    size: '1.92 GB',
    vram: '3.5 GB',
    description: 'BigCode initiative code generation model trained on 600+ programming languages with Git commit histories.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/TheBloke/CodeLlama-7B-Instruct-GGUF:Q4_K_M',
    name: 'Code Llama (7B) Instruct',
    category: 'code',
    parameters: '6.85B',
    size: '4.08 GB',
    vram: '6.0 GB',
    description: 'Meta’s specialized coding model quantized by TheBloke. Battle-tested for Python, TypeScript, and C++.',
    author: 'TheBloke',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },

  // Vision & Multimodal
  {
    id: 'hf.co/city96/Llama-3.2-11B-Vision-Instruct-GGUF:Q4_K_M',
    name: 'Llama 3.2 Vision (11B) Instruct',
    category: 'vision',
    parameters: '10.6B',
    size: '7.18 GB',
    vram: '9.8 GB',
    description: 'Multimodal vision and text model by Meta, quantized by city96 for visual question answering and image inspection.',
    author: 'city96',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Qwen2-VL-7B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen2-VL (7B) Instruct',
    category: 'vision',
    parameters: '7.61B',
    size: '4.88 GB',
    vram: '7.2 GB',
    description: 'Leading vision-language model with native dynamic resolution reading documents, charts, UI, and video frames.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Qwen2-VL-2B-Instruct-GGUF:Q4_K_M',
    name: 'Qwen2-VL (2B) Instruct',
    category: 'vision',
    parameters: '2.21B',
    size: '1.54 GB',
    vram: '3.0 GB',
    description: 'Compact vision-language model capable of recognizing text in images and diagnosing visual errors on laptops.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/mys/ggml_llava-v1.5-7b:Q4_K_M',
    name: 'LLaVA 1.5 (7B) GGUF',
    category: 'vision',
    parameters: '7.06B',
    size: '4.15 GB',
    vram: '6.2 GB',
    description: 'Classic open multimodal visual reasoning model with CLIP visual encoder and vicuna text backbone.',
    author: 'mys',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },

  // General & Frontier
  {
    id: 'hf.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M',
    name: 'Meta Llama 3.1 (8B) Instruct',
    category: 'general',
    parameters: '8.03B',
    size: '4.92 GB',
    vram: '7.0 GB',
    description: 'Meta’s open flagship 8B model with 128k context length, top-tier tool calling, and general intelligence.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Llama-3.3-70B-Instruct-GGUF:Q4_K_M',
    name: 'Llama 3.3 (70B) Instruct',
    category: 'general',
    parameters: '70.6B',
    size: '42.5 GB',
    vram: '48.0 GB',
    description: 'Meta’s flagship frontier-tier 70B model delivering near-Llama-3.1-405B benchmark performance.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Mistral-7B-Instruct-v0.3-GGUF:Q4_K_M',
    name: 'Mistral (7B) Instruct v0.3',
    category: 'general',
    parameters: '7.25B',
    size: '4.37 GB',
    vram: '6.5 GB',
    description: 'Mistral AI’s updated 7B checkpoint featuring function calling and 32k context window.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Mistral-Small-24B-Instruct-2501-GGUF:Q4_K_M',
    name: 'Mistral Small (24B) Instruct 2501',
    category: 'general',
    parameters: '23.6B',
    size: '14.3 GB',
    vram: '18.0 GB',
    description: 'Mistral AI’s newest 24B instruction model, offering near-frontier coding and multilingual performance.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/gemma-2-9b-it-GGUF:Q4_K_M',
    name: 'Gemma 2 (9B) Instruct',
    category: 'general',
    parameters: '9.24B',
    size: '5.85 GB',
    vram: '8.2 GB',
    description: 'Google DeepMind’s 9B model using alternating sliding window attention and logit capping for precision.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/Hermes-3-Llama-3.1-8B-GGUF:Q4_K_M',
    name: 'Hermes 3 Llama 3.1 (8B)',
    category: 'general',
    parameters: '8.03B',
    size: '4.92 GB',
    vram: '7.0 GB',
    description: 'Nous Research’s uncensored general-purpose reasoning model with advanced roleplaying and complex agentic control.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
  {
    id: 'hf.co/bartowski/bge-m3-GGUF:Q4_K_M',
    name: 'BGE-M3 Multilingual Embedding',
    category: 'embeddings',
    parameters: '567M',
    size: '640 MB',
    vram: '1.2 GB',
    description: 'BAAI’s high-density embedding model supporting dense, sparse, and multi-vector search in 100+ languages.',
    author: 'bartowski',
    quantization: 'Q4_K_M',
    source: 'huggingface',
  },
];

// Client-side HTML5 Canvas Image Resizer & Base64 Encoder
function compressAndEncodeImage(
  file: File,
  maxDimension = 1280,
  quality = 0.85
): Promise<{ base64: string; dataUrl: string; width: number; height: number; formattedSize: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context unavailable'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
        const sizeInKb = Math.round((base64.length * 0.75) / 1024);
        resolve({
          base64,
          dataUrl,
          width,
          height,
          formattedSize: sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image into memory'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsDataURL(file);
  });
}

// 1-Click Interactive Sample Images for Vision Studio
const SAMPLE_PRESETS: Record<
  'foliar' | 'receipt' | 'schematic',
  { title: string; badge: string; prompt: string; svg: string; filename: string }
> = {
  foliar: {
    title: 'Diseased Citrus Leaf',
    badge: 'Plant Pathology',
    filename: 'sample_citrus_pathology.png',
    prompt:
      'Analyze this leaf image carefully. Identify the plant species if possible, diagnose any visible disease, chlorotic halos, or fungal lesions, and provide actionable organic treatment advice.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><rect width="400" height="300" fill="#18181b"/><path d="M70,160 C120,40 280,40 330,160 C280,260 120,260 70,160 Z" fill="#365314" stroke="#4d7c0f" stroke-width="4"/><path d="M70,160 Q200,160 330,160" stroke="#65a30d" stroke-width="3" fill="none"/><path d="M140,160 Q170,120 200,100" stroke="#65a30d" stroke-width="2" fill="none"/><path d="M200,160 Q230,120 260,110" stroke="#65a30d" stroke-width="2" fill="none"/><path d="M150,160 Q180,200 210,220" stroke="#65a30d" stroke-width="2" fill="none"/><circle cx="170" cy="120" r="16" fill="#713f12" stroke="#ca8a04" stroke-width="3"/><circle cx="240" cy="180" r="22" fill="#451a03" stroke="#eab308" stroke-width="4"/><circle cx="210" cy="140" r="10" fill="#713f12" stroke="#facc15" stroke-width="2"/><circle cx="280" cy="150" r="12" fill="#78350f" stroke="#ca8a04" stroke-width="2"/><text x="200" y="280" fill="#f4f4f5" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Sample: Citrus Leaf with Concentric Necrotic Lesions</text></svg>`,
  },
  receipt: {
    title: 'Commercial Coffee Receipt',
    badge: 'Document OCR',
    filename: 'sample_cafe_receipt.png',
    prompt:
      'Extract all visible text from this receipt. Transcribe the store name, date, itemized list of items with their individual prices, subtotal, sales tax, and final total in a clean Markdown table.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="400" height="480"><rect width="400" height="480" fill="#18181b"/><rect x="60" y="30" width="280" height="420" rx="10" fill="#f4f4f5" stroke="#71717a" stroke-width="2"/><text x="200" y="70" fill="#09090b" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">RESURSEE ROASTERY</text><text x="200" y="90" fill="#52525b" font-family="monospace" font-size="10" text-anchor="middle">104 Tech Boulevard, Suite 300</text><text x="200" y="105" fill="#52525b" font-family="monospace" font-size="10" text-anchor="middle">Date: 2026-09-11  Time: 09:14 AM</text><line x1="80" y1="120" x2="320" y2="120" stroke="#a1a1aa" stroke-dasharray="4,4"/><text x="80" y="150" fill="#09090b" font-family="monospace" font-size="12">1x Double Espresso</text><text x="320" y="150" fill="#09090b" font-family="monospace" font-size="12" text-anchor="end">$4.50</text><text x="80" y="180" fill="#09090b" font-family="monospace" font-size="12">1x Almond Croissant</text><text x="320" y="180" fill="#09090b" font-family="monospace" font-size="12" text-anchor="end">$5.25</text><text x="80" y="210" fill="#09090b" font-family="monospace" font-size="12">1x Cold Brew (16oz)</text><text x="320" y="210" fill="#09090b" font-family="monospace" font-size="12" text-anchor="end">$6.00</text><line x1="80" y1="240" x2="320" y2="240" stroke="#a1a1aa" stroke-dasharray="4,4"/><text x="80" y="270" fill="#3f3f46" font-family="monospace" font-size="12">Subtotal:</text><text x="320" y="270" fill="#3f3f46" font-family="monospace" font-size="12" text-anchor="end">$15.75</text><text x="80" y="295" fill="#3f3f46" font-family="monospace" font-size="12">Tax (8.25%):</text><text x="320" y="295" fill="#3f3f46" font-family="monospace" font-size="12" text-anchor="end">$1.30</text><line x1="80" y1="315" x2="320" y2="315" stroke="#09090b" stroke-width="2"/><text x="80" y="345" fill="#09090b" font-family="monospace" font-size="15" font-weight="bold">TOTAL DUE:</text><text x="320" y="345" fill="#09090b" font-family="monospace" font-size="15" font-weight="bold" text-anchor="end">$17.05</text><text x="200" y="390" fill="#52525b" font-family="monospace" font-size="10" text-anchor="middle">Payment: Apple Pay (****4912)</text><text x="200" y="420" fill="#09090b" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">THANK YOU FOR YOUR VISIT!</text></svg>`,
  },
  schematic: {
    title: 'ESP32 & DHT22 Sensor Circuit',
    badge: 'Hardware & IoT',
    filename: 'sample_esp32_schematic.png',
    prompt:
      'Examine this circuit diagram. Explain how the DHT22 sensor is connected to the ESP32 microcontroller, what purpose the pull-up resistor serves on the data line, and write the sample C++ code to read humidity and temperature.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 300" width="460" height="300"><rect width="460" height="300" fill="#18181b"/><rect x="40" y="50" width="130" height="190" rx="8" fill="#27272a" stroke="#71717a" stroke-width="2"/><text x="105" y="80" fill="#fafafa" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">ESP32-WROOM</text><text x="150" y="110" fill="#a1a1aa" font-family="monospace" font-size="11" text-anchor="end">3V3</text><text x="150" y="145" fill="#a1a1aa" font-family="monospace" font-size="11" text-anchor="end">GPIO4</text><text x="150" y="180" fill="#a1a1aa" font-family="monospace" font-size="11" text-anchor="end">GND</text><rect x="290" y="60" width="120" height="170" rx="8" fill="#27272a" stroke="#71717a" stroke-width="2"/><text x="350" y="90" fill="#fafafa" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">DHT22</text><text x="310" y="115" fill="#a1a1aa" font-family="monospace" font-size="11">Pin 1: VCC</text><text x="310" y="145" fill="#a1a1aa" font-family="monospace" font-size="11">Pin 2: DATA</text><text x="310" y="175" fill="#a1a1aa" font-family="monospace" font-size="11">Pin 3: NC</text><text x="310" y="205" fill="#a1a1aa" font-family="monospace" font-size="11">Pin 4: GND</text><line x1="150" y1="105" x2="310" y2="110" stroke="#f43f5e" stroke-width="2"/><line x1="150" y1="140" x2="310" y2="140" stroke="#eab308" stroke-width="2"/><line x1="150" y1="175" x2="310" y2="200" stroke="#71717a" stroke-width="2"/><rect x="220" y="95" width="25" height="40" rx="4" fill="#3f3f46" stroke="#f59e0b" stroke-width="1.5"/><text x="232" y="120" fill="#facc15" font-family="monospace" font-size="9" text-anchor="middle">4.7k</text><line x1="232" y1="95" x2="232" y2="108" stroke="#f43f5e" stroke-width="1.5"/><line x1="232" y1="135" x2="232" y2="140" stroke="#eab308" stroke-width="1.5"/><text x="230" y="280" fill="#d4d4d8" font-family="sans-serif" font-size="12" text-anchor="middle">ESP32 to DHT22 Telemetry Interface (GPIO4 + 4.7kΩ Pull-up)</text></svg>`,
  },
};


// Helper to format inline code & bold text within markdown lines
function parseInlineFormatting(text: string) {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const tokens = text.split(regex);

  return tokens.map((token, i) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={i}
          className="rounded-md bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--color-ink)] border border-neutral-300 dark:border-neutral-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-bold text-[var(--color-ink)]">
          {token.slice(2, -2)}
        </strong>
      );
    }
    return token;
  });
}

// Formatted Message component for parsing markdown code blocks and inline styles
function FormattedMessage({
  content,
  messageId,
  copiedKey,
  onCopy,
}: {
  content: string;
  messageId: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)(?:```|$)/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.substring(lastIndex, match.index);
      if (textChunk) parts.push({ type: 'text', content: textChunk });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      content: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const textChunk = content.substring(lastIndex);
    if (textChunk) parts.push({ type: 'text', content: textChunk });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return (
    <div className="space-y-3">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          const codeKey = `code-${messageId}-${idx}`;
          return (
            <div
              key={idx}
              className="rounded-xl border border-[var(--color-rule-strong)] bg-neutral-950 text-neutral-100 p-3 font-mono text-[11px] overflow-x-auto relative my-2 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[10px] text-neutral-400">
                <span className="font-bold uppercase tracking-wider text-neutral-300">
                  {part.language || 'code'}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(part.content, codeKey)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer bg-neutral-900 hover:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-800 text-[10px]"
                >
                  {copiedKey === codeKey ? (
                    <>
                      <IconCheck size={11} className="text-white" />
                      <span className="font-semibold text-white">Copied</span>
                    </>
                  ) : (
                    <>
                      <IconCopy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto leading-relaxed whitespace-pre font-mono">
                {part.content}
              </pre>
            </div>
          );
        }

        return (
          <div key={idx} className="space-y-1.5">
            {part.content.split('\n').map((line, lineIdx) =>
              line.trim() === '' ? (
                <div key={lineIdx} className="h-1.5" />
              ) : (
                <p key={lineIdx} className="leading-relaxed">
                  {parseInlineFormatting(line)}
                </p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AIHubPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Setup Guide & Environment State
  const [guideOS, setGuideOS] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [isLocalHost, setIsLocalHost] = useState<boolean | null>(null);
  const [showRemoteNoticeModal, setShowRemoteNoticeModal] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [dontShowAgainSession, setDontShowAgainSession] = useState<boolean>(false);

  // Live Ollama Bridge State (Phase 1)
  const [endpoint, setEndpoint] = useState<string>(DEFAULT_OLLAMA_ENDPOINT);
  const [connectionStatus, setConnectionStatus] = useState<OllamaConnectionStatus>('checking');
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [runningModels, setRunningModels] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);

  // Dynamic Inference Parameters (Phase 2)
  const [temperature, setTemperature] = useState<number>(0.7);
  const [numCtx, setNumCtx] = useState<number>(4096);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are a private, offline intelligence engine integrated into Resursee. Provide concise, factual, and direct answers without unnecessary filler.'
  );

  // Chat State & Sessions (Phase 2)
  const DEFAULT_WELCOME: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content:
      'Welcome to **Resursee Local AI Hub**. All inference and embeddings run 100% locally on your machine via the local Ollama daemon (`http://localhost:11434`) with zero cloud data egress.\n\nSelect a model or try a sample inquiry below to begin exploring.',
    timestamp: 'Just now',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME]);
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Session Persistence & Modals (Phase 2)
  const [sessions, setSessions] = useState<AIHubSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('default-session');
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [isParametersModalOpen, setIsParametersModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Model Library Management State (Phase 3)
  const [modelSourceTab, setModelSourceTab] = useState<'ollama' | 'huggingface'>('ollama');
  const [ollamaViewMode, setOllamaViewMode] = useState<'curated' | 'full'>('curated');
  const [hfViewMode, setHfViewMode] = useState<'curated' | 'full'>('curated');
  const [hfLiveQuery, setHfLiveQuery] = useState<string>('');
  const [hfLiveSort, setHfLiveSort] = useState<'downloads' | 'trending' | 'likes'>('downloads');
  const [hfLiveResults, setHfLiveResults] = useState<
    Array<{
      id: string;
      author: string;
      name: string;
      downloads: number;
      likes: number;
      updatedAt: string;
      ollamaTag: string;
      tags: string[];
      quantization?: string;
    }>
  >([]);
  const [isHfSearching, setIsHfSearching] = useState<boolean>(false);
  const [hfSearchError, setHfSearchError] = useState<string | null>(null);
  const [hasSearchedHf, setHasSearchedHf] = useState<boolean>(false);
  const [modelCategory, setModelCategory] = useState<string>('all');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [hfSearch, setHfSearch] = useState<string>('');
  const [customHfTag, setCustomHfTag] = useState<string>('');
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [inspectingModel, setInspectingModel] = useState<string | null>(null);
  const [inspectData, setInspectData] = useState<any | null>(null);
  const [isLoadingInspect, setIsLoadingInspect] = useState<boolean>(false);
  const pullAbortControllerRef = useRef<AbortController | null>(null);

  // Ollama Daemon Launcher & Controller State
  const [isStartingDaemon, setIsStartingDaemon] = useState(false);
  const [isStoppingDaemon, setIsStoppingDaemon] = useState(false);
  const [daemonNotification, setDaemonNotification] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  // Vision & Multimodal Studio State (Phase 4)
  const [visionImageBase64, setVisionImageBase64] = useState<string | null>(null);
  const [visionImagePreview, setVisionImagePreview] = useState<string | null>(null);
  const [visionImageMeta, setVisionImageMeta] = useState<{
    name: string;
    size: string;
    dimensions?: string;
  } | null>(null);
  const [visionPrompt, setVisionPrompt] = useState<string>(
    'Inspect this image and provide a thorough, structured visual analysis.'
  );
  const [visionSelectedModel, setVisionSelectedModel] = useState<string>('llava:7b');
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionResult, setVisionResult] = useState<string>('');
  const [visionError, setVisionError] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const visionFileInputRef = useRef<HTMLInputElement | null>(null);
  const visionAbortControllerRef = useRef<AbortController | null>(null);

  // RAG & Knowledge Documents State (Phase 5)
  const [indexedDocs, setIndexedDocs] = useState<IndexedDocument[]>([]);
  const [ragQuery, setRagQuery] = useState<string>('');
  const [ragRetrievalResults, setRagRetrievalResults] = useState<RetrievalResult[]>([]);
  const [ragAnswer, setRagAnswer] = useState<string>('');
  const [isSearchingRag, setIsSearchingRag] = useState<boolean>(false);
  const [isGeneratingRagAnswer, setIsGeneratingRagAnswer] = useState<boolean>(false);
  const [ragEmbeddingEngine, setRagEmbeddingEngine] = useState<string>('hybrid');
  const [ragEmbeddingModel, setRagEmbeddingModel] = useState<string>('nomic-embed-text');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [ragViewMode, setRagViewMode] = useState<'answer' | 'chunks'>('answer');
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState<boolean>(false);
  const [newDocTitle, setNewDocTitle] = useState<string>('');
  const [newDocContent, setNewDocContent] = useState<string>('');
  const ragAbortControllerRef = useRef<AbortController | null>(null);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isParsingDoc, setIsParsingDoc] = useState<boolean>(false);
  const [parseStatusText, setParseStatusText] = useState<string>('');

  // Auto-scroll messages anchor
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Load Sessions and Documents from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Sessions
    try {
      const raw = localStorage.getItem('resursee_ai_hub_sessions');
      if (raw) {
        const parsed: AIHubSession[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          const active = parsed[0];
          setCurrentSessionId(active.id);
          setMessages(active.messages as ChatMessage[]);
          if (active.model) setSelectedModel(active.model);
          if (active.temperature !== undefined) setTemperature(active.temperature);
          if (active.systemPrompt) setSystemPrompt(active.systemPrompt);
        }
      } else {
        const initialSession: AIHubSession = {
          id: `sess-${Date.now()}`,
          title: 'New Conversation',
          model: selectedModel,
          temperature: 0.7,
          systemPrompt,
          messages: [DEFAULT_WELCOME],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions([initialSession]);
        setCurrentSessionId(initialSession.id);
        setMessages(initialSession.messages as ChatMessage[]);
      }
    } catch (e) {
      console.error('Failed to parse sessions:', e);
    }

    // 2. Knowledge Documents (Phase 5)
    try {
      const rawDocs = localStorage.getItem('resursee_ai_hub_documents');
      if (rawDocs) {
        const parsed: IndexedDocument[] = JSON.parse(rawDocs);
        if (Array.isArray(parsed)) {
          const userDocs = parsed.filter(
            (d) =>
              !d.id.startsWith('doc-esp32') &&
              !d.id.startsWith('doc-pathology') &&
              !d.id.startsWith('doc-resursee')
          );
          setIndexedDocs(userDocs);
          setSelectedDocIds(userDocs.map((d) => d.id));
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse documents:', e);
    }
    setIndexedDocs([]);
    setSelectedDocIds([]);
  }, []);

  // Synchronize selectedModel strictly with downloaded/installed models
  useEffect(() => {
    if (installedModels.length > 0) {
      const exists = installedModels.some((m) => m.name === selectedModel);
      if (!exists) {
        setSelectedModel(installedModels[0].name);
      }
    } else if (connectionStatus === 'connected' && installedModels.length === 0) {
      setSelectedModel('');
    }
  }, [installedModels, selectedModel, connectionStatus]);

  // Save active session to localStorage
  const saveCurrentSession = (updatedMessages: ChatMessage[], newTitle?: string) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: newTitle || s.title,
            model: selectedModel,
            temperature,
            systemPrompt,
            messages: updatedMessages,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('resursee_ai_hub_sessions', JSON.stringify(next));
      }
      return next;
    });
  };

  // Session Handlers
  const handleNewChat = () => {
    if (isGenerating) handleStopGeneration();
    const newSession: AIHubSession = {
      id: `sess-${Date.now()}`,
      title: 'New Conversation',
      model: selectedModel,
      temperature,
      systemPrompt,
      messages: [
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `New session initialized. Running on local engine **${selectedModel}** with zero data egress.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages as ChatMessage[]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resursee_ai_hub_sessions', JSON.stringify(updated));
    }
  };

  const handleSelectSession = (sessionId: string) => {
    if (isGenerating) handleStopGeneration();
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setCurrentSessionId(target.id);
      setMessages(target.messages as ChatMessage[]);
      if (target.model) setSelectedModel(target.model);
      if (target.temperature !== undefined) setTemperature(target.temperature);
      if (target.systemPrompt) setSystemPrompt(target.systemPrompt);
      setIsSessionDrawerOpen(false);
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (remaining.length === 0) {
      handleNewChat();
    } else {
      setSessions(remaining);
      if (sessionId === currentSessionId) {
        setCurrentSessionId(remaining[0].id);
        setMessages(remaining[0].messages as ChatMessage[]);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('resursee_ai_hub_sessions', JSON.stringify(remaining));
      }
    }
  };

  const handleClearChat = () => {
    if (isGenerating) handleStopGeneration();
    const cleared: ChatMessage[] = [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. Ready for your inquiries on local engine **${selectedModel}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(cleared);
    saveCurrentSession(cleared);
  };

  const handleExportChat = () => {
    const session = sessions.find((s) => s.id === currentSessionId);
    const title = session?.title || 'Resursee AI Hub Conversation';
    let md = `# ${title}\n\n`;
    md += `- **Date**: ${new Date().toLocaleString()}\n`;
    md += `- **Model**: \`${selectedModel}\`\n`;
    md += `- **Daemon Endpoint**: \`${endpoint}\`\n`;
    md += `- **Temperature**: \`${temperature.toFixed(2)}\`\n`;
    md += `- **Data Sovereignty**: 100% Local Inference via Ollama\n\n---\n\n`;

    messages.forEach((m) => {
      const roleName = m.role === 'user' ? 'User' : `Assistant (${selectedModel})`;
      md += `### ${roleName} [${m.timestamp}]\n\n${m.content}\n\n`;
      if (m.codeSnippet) {
        md += `\`\`\`\n${m.codeSnippet}\n\`\`\`\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resursee-chat-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Connection Bridge Check
  const refreshConnection = async (targetEndpoint: string = endpoint) => {
    setIsCheckingConnection(true);
    setConnectionStatus('checking');
    try {
      const result = await checkOllamaConnection(targetEndpoint, 2500);
      if (result.status) {
        setConnectionStatus('connected');
        setInstalledModels(result.models);
        setConnectionError(null);

        // Check running models in VRAM
        const running = await getRunningModels(targetEndpoint);
        setRunningModels(running);

        // If current model not installed, switch strictly to first available installed model
        if (result.models.length > 0) {
          const hasSelected = result.models.some((m) => m.name === selectedModel);
          if (!hasSelected) {
            setSelectedModel(result.models[0].name);
          }
        } else {
          setSelectedModel('');
        }
      } else {
        setConnectionStatus('offline');
        setInstalledModels([]);
        setRunningModels([]);
        setSelectedModel('');
        setConnectionError(result.error || 'Daemon unreachable');
      }
    } catch (err: any) {
      setConnectionStatus('offline');
      setInstalledModels([]);
      setRunningModels([]);
      setConnectionError(err.message || 'Connection failed');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  useEffect(() => {
    const savedEndpoint = typeof window !== 'undefined' ? localStorage.getItem('resursee_ollama_endpoint') : null;
    const activeEp = savedEndpoint || DEFAULT_OLLAMA_ENDPOINT;
    setEndpoint(activeEp);

    // Environment detection (Phase 2)
    const local = isLocalEnvironment();
    setIsLocalHost(local);
    if (!local) {
      setIsPreviewMode(true);
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('resursee_ai_hub_preview_dismissed') : null;
      if (!dismissed) {
        setShowRemoteNoticeModal(true);
      }
    }

    // Detect user OS for guide tab default
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('win')) setGuideOS('windows');
      else if (ua.includes('linux')) setGuideOS('linux');
      else setGuideOS('macos');
    }

    refreshConnection(activeEp);
  }, []);

  // 1-Click Start Ollama Daemon Handler
  const handleStartOllama = async () => {
    setIsStartingDaemon(true);
    setDaemonNotification({ type: 'info', message: 'Starting Ollama background daemon...' });

    try {
      const res = await startOllamaDaemon();
      if (res.running) {
        setDaemonNotification({
          type: 'success',
          message: res.message || 'Ollama daemon connected!',
        });
        await refreshConnection();
        setTimeout(() => setDaemonNotification(null), 4000);
        return;
      }

      if (res.isCloud) {
        setDaemonNotification({
          type: 'info',
          message: res.message || 'Running in cloud environment.',
        });
        setIsSetupModalOpen(true);
        return;
      }

      // Poll up to 7 times (3.5s total) for connection
      let connected = false;
      for (let i = 0; i < 7; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const check = await checkOllamaConnection(endpoint);
        if (check.status) {
          setConnectionStatus('connected');
          setInstalledModels(check.models);
          connected = true;
          setDaemonNotification({
            type: 'success',
            message: `Ollama is ready (${check.models.length} models installed)`,
          });
          setTimeout(() => setDaemonNotification(null), 4000);
          break;
        }
      }

      if (!connected) {
        setDaemonNotification({
          type: 'info',
          message: 'Ollama launch triggered. It may take a moment to initialize.',
        });
      }
    } catch (err: any) {
      setDaemonNotification({
        type: 'error',
        message: err.message || 'Failed to start Ollama daemon.',
      });
    } finally {
      setIsStartingDaemon(false);
    }
  };

  // Stop Ollama Daemon Handler
  const handleStopOllama = async () => {
    setIsStoppingDaemon(true);
    setDaemonNotification({ type: 'info', message: 'Stopping Ollama daemon...' });

    try {
      const res = await stopOllamaDaemon();
      if (res.stopped) {
        setConnectionStatus('offline');
        setInstalledModels([]);
        setRunningModels([]);
        setSelectedModel('');
        setDaemonNotification({
          type: 'success',
          message: res.message || 'Ollama daemon stopped.',
        });
        setTimeout(() => setDaemonNotification(null), 4000);
      } else {
        setDaemonNotification({
          type: 'error',
          message: res.error || 'Could not stop Ollama daemon.',
        });
      }
    } catch (err: any) {
      setDaemonNotification({
        type: 'error',
        message: err.message || 'Failed to stop Ollama daemon.',
      });
    } finally {
      setIsStoppingDaemon(false);
      await refreshConnection();
    }
  };

  // Vision File Upload & Drop Handlers (Phase 4)
  const handleProcessImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setVisionError('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }
    try {
      setVisionError(null);
      const { base64, dataUrl, width, height, formattedSize } = await compressAndEncodeImage(file);
      setVisionImageBase64(base64);
      setVisionImagePreview(dataUrl);
      setVisionImageMeta({
        name: file.name,
        size: formattedSize,
        dimensions: `${width}×${height}`,
      });
    } catch (err: any) {
      setVisionError(err.message || 'Failed to process image');
    }
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessImageFile(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessImageFile(file);
  };

  const handleClearImage = () => {
    setVisionImageBase64(null);
    setVisionImagePreview(null);
    setVisionImageMeta(null);
    setVisionResult('');
    setVisionError(null);
    if (visionFileInputRef.current) visionFileInputRef.current.value = '';
  };

  const handleLoadSample = (type: 'foliar' | 'receipt' | 'schematic') => {
    const sample = SAMPLE_PRESETS[type];
    if (!sample) return;
    try {
      const base64 = btoa(unescape(encodeURIComponent(sample.svg)));
      const dataUrl = `data:image/svg+xml;base64,${base64}`;
      setVisionImageBase64(base64);
      setVisionImagePreview(dataUrl);
      setVisionImageMeta({
        name: sample.filename,
        size: '12 KB',
        dimensions: type === 'receipt' ? '400×480' : '400×300',
      });
      setVisionPrompt(sample.prompt);
      setVisionResult('');
      setVisionError(null);
    } catch {
      setVisionError('Failed to load sample image');
    }
  };

  const handleRunVisionAnalysis = async () => {
    if (!visionImageBase64) {
      setVisionError('Please upload an image or select a sample first.');
      return;
    }
    if (connectionStatus !== 'connected') {
      setVisionError('Ollama daemon is offline. Click "Start Ollama Engine" to connect.');
      return;
    }

    const activeModel = visionSelectedModel || selectedModel;
    setIsAnalyzingVision(true);
    setVisionError(null);
    setVisionResult('');
    const controller = new AbortController();
    visionAbortControllerRef.current = controller;

    try {
      const accumulated = await streamOllamaChat(
        endpoint,
        {
          model: activeModel,
          messages: [
            {
              role: 'user',
              content: visionPrompt.trim() || 'Describe this image and analyze key features.',
              images: [visionImageBase64],
            },
          ],
          temperature: 0.2,
          num_ctx: 4096,
        },
        (fullText) => {
          setVisionResult(fullText);
        },
        controller.signal
      );
      setVisionResult(accumulated);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stopped cleanly by user
      } else {
        const errMsg = err.message || 'Vision analysis failed';
        if (
          errMsg.toLowerCase().includes('does not support images') ||
          errMsg.toLowerCase().includes('images') ||
          errMsg.toLowerCase().includes('vision')
        ) {
          setVisionError(
            `Model "${activeModel}" is a text-only model. Please switch to a vision model (e.g. LLaVA or Llama 3.2 Vision).`
          );
        } else {
          setVisionError(errMsg);
        }
      }
    } finally {
      setIsAnalyzingVision(false);
      visionAbortControllerRef.current = null;
    }
  };

  const handleStopVision = () => {
    if (visionAbortControllerRef.current) {
      visionAbortControllerRef.current.abort();
      visionAbortControllerRef.current = null;
    }
    setIsAnalyzingVision(false);
  };

  const handleExportVision = () => {
    if (!visionResult) return;
    let md = `# Local AI Hub - Vision Analysis Report\n\n`;
    md += `- **Date**: ${new Date().toLocaleString()}\n`;
    md += `- **Model**: \`${visionSelectedModel}\`\n`;
    md += `- **Image**: ${visionImageMeta?.name || 'Uploaded Image'} (${visionImageMeta?.dimensions || ''})\n`;
    md += `- **Prompt**: ${visionPrompt}\n\n---\n\n`;
    md += `## Visual Reasoning & Findings\n\n${visionResult}\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resursee-vision-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- RAG & Knowledge Documents Handlers (Phase 5) ---
  const handleIndexDocument = (title: string, content: string) => {
    if (!title.trim() || !content.trim()) return;
    const docId = `doc-${Date.now()}`;
    const filename = title.trim().includes('.') ? title.trim() : `${title.trim()}.md`;
    const rawChunks = chunkText(content, 450, 45);
    const chunks: DocumentChunk[] = rawChunks.map((c, cIdx) => ({
      id: `chunk-${docId}-${cIdx}`,
      documentId: docId,
      documentName: filename,
      chunkIndex: cIdx + 1,
      text: c,
      tokenCount: Math.round(c.length / 4),
    }));

    const newDoc: IndexedDocument = {
      id: docId,
      name: filename,
      size: content.length,
      characterCount: content.length,
      chunks,
      createdAt: new Date().toISOString(),
    };

    const updated = [newDoc, ...indexedDocs];
    setIndexedDocs(updated);
    setSelectedDocIds((prev) => [newDoc.id, ...prev]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('resursee_ai_hub_documents', JSON.stringify(updated));
      } catch {}
    }
    setNewDocTitle('');
    setNewDocContent('');
    setIsAddDocModalOpen(false);
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDoc(true);
    setParseStatusText(`Reading ${file.name}...`);
    try {
      const result = await parseAnyDocumentFile(file);
      if (result.text && result.text.trim()) {
        let displayTitle = file.name;
        if (result.pageCount) {
          const unit = result.format === 'pptx' ? 'slides' : 'pages';
          displayTitle = `${file.name} (${result.pageCount} ${unit})`;
        }
        handleIndexDocument(displayTitle, result.text);
        setIsAddDocModalOpen(false);
      } else {
        alert(`No readable text could be extracted from "${file.name}".`);
      }
    } catch (err: any) {
      console.error('Document parsing error:', err);
      alert(`Failed to extract text from ${file.name}: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsParsingDoc(false);
      setParseStatusText('');
      e.target.value = '';
    }
  };

  const handleToggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleToggleAllDocs = () => {
    if (selectedDocIds.length === indexedDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(indexedDocs.map((d) => d.id));
    }
  };

  const handleDeleteDoc = (docId: string) => {
    const updated = indexedDocs.filter((d) => d.id !== docId);
    setIndexedDocs(updated);
    setSelectedDocIds((prev) => prev.filter((id) => id !== docId));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('resursee_ai_hub_documents', JSON.stringify(updated));
      } catch {}
    }
    setRagRetrievalResults([]);
    setRagAnswer('');
  };

  const handleClearAllDocs = () => {
    setIndexedDocs([]);
    setSelectedDocIds([]);
    setRagRetrievalResults([]);
    setRagAnswer('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('resursee_ai_hub_documents');
    }
  };

  const handleExecuteRetrieval = async (queryText: string): Promise<RetrievalResult[]> => {
    if (!queryText.trim()) return [];
    setIsSearchingRag(true);
    try {
      const targetDocs =
        selectedDocIds.length > 0
          ? indexedDocs.filter((d) => selectedDocIds.includes(d.id))
          : indexedDocs;
      const allChunks = targetDocs.flatMap((d) => d.chunks);
      const results = await retrieveTopKChunks(queryText, allChunks, {
        endpoint,
        embeddingModel: ragEmbeddingModel || 'nomic-embed-text',
        topK: 4,
        useDenseVectors: ragEmbeddingEngine !== 'tfidf',
      });
      setRagRetrievalResults(results);
      return results;
    } finally {
      setIsSearchingRag(false);
    }
  };

  const handleAskRag = async (overrideQuery?: string) => {
    const q = (overrideQuery || ragQuery).trim();
    if (!q) return;
    if (connectionStatus !== 'connected') {
      setRagAnswer('Ollama daemon is offline. Click "Start Ollama Engine" to connect and ask questions.');
      setRagViewMode('answer');
      return;
    }
    if (indexedDocs.length === 0) {
      setRagAnswer('No documents have been uploaded yet. Please click "Add Document" to upload a PDF, Word (.docx), PowerPoint (.pptx), or text file.');
      setRagViewMode('answer');
      return;
    }
    if (selectedDocIds.length === 0) {
      setRagAnswer('No documents are currently selected. Please check at least one document in the selection list on the left to ground the retrieval.');
      setRagViewMode('answer');
      return;
    }

    setRagQuery(q);
    setIsGeneratingRagAnswer(true);
    setRagViewMode('answer');
    setRagAnswer('');
    const controller = new AbortController();
    ragAbortControllerRef.current = controller;

    try {
      const retrieved = await handleExecuteRetrieval(q);

      let contextText = '';
      if (retrieved.length > 0) {
        contextText = retrieved
          .map(
            (r, i) =>
              `[Source ${i + 1}: ${r.chunk.documentName} | Chunk #${r.chunk.chunkIndex} | Match Relevance: ${(
                r.score * 100
              ).toFixed(1)}%]\n${r.chunk.text}`
          )
          .join('\n\n');
      } else {
        contextText = 'No direct matches found in indexed knowledge base.';
      }

      const groundedPrompt = `You are a private, offline intelligence engine for Resursee. Use the following verified excerpts from the user's indexed document knowledge base to answer the inquiry accurately and factually.

--- VERIFIED LOCAL KNOWLEDGE EXCERPTS ---
${contextText}
--- END EXCERPTS ---

User Inquiry: ${q}

Instructions:
1. Provide a direct, highly accurate, and structured answer.
2. Cite the source document name (e.g. "[esp32_iot_datasheet.md]") when stating facts from the context.
3. If the context does not contain the answer, state that clearly and provide the best known factual answer.`;

      const accumulated = await streamOllamaChat(
        endpoint,
        {
          model: selectedModel,
          messages: [{ role: 'user', content: groundedPrompt }],
          temperature: 0.2,
          num_ctx: 4096,
        },
        (fullText) => {
          setRagAnswer(fullText);
        },
        controller.signal
      );
      setRagAnswer(accumulated);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setRagAnswer(`Error generating grounded response: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsGeneratingRagAnswer(false);
      ragAbortControllerRef.current = null;
    }
  };

  const handleStopRagGeneration = () => {
    if (ragAbortControllerRef.current) {
      ragAbortControllerRef.current.abort();
      ragAbortControllerRef.current = null;
    }
    setIsGeneratingRagAnswer(false);
  };

  const handleExportRagReport = () => {
    if (!ragAnswer) return;
    let md = `# Local AI Hub - Grounded Knowledge Report\n\n`;
    md += `- **Date**: ${new Date().toLocaleString()}\n`;
    md += `- **Model**: \`${selectedModel}\`\n`;
    md += `- **Inquiry**: ${ragQuery}\n`;
    md += `- **Indexed Documents**: ${indexedDocs.length} documents\n\n---\n\n`;
    md += `## Grounded Answer\n\n${ragAnswer}\n\n---\n\n`;
    md += `## Retrieved Context Excerpts\n\n`;
    ragRetrievalResults.forEach((r, idx) => {
      md += `### Source ${idx + 1}: ${r.chunk.documentName} (Chunk #${r.chunk.chunkIndex} • ${(
        r.score * 100
      ).toFixed(1)}% match)\n\n`;
      md += `\`\`\`\n${r.chunk.text}\n\`\`\`\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resursee-rag-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Live Chat Generation (Phase 2 with Real Multi-Turn History, Streaming & Abort)
  const handleSendMessage = async () => {
    if (!promptInput.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Auto title session from first prompt if still default
    let updatedTitle: string | undefined;
    const curSess = sessions.find((s) => s.id === currentSessionId);
    if (curSess && curSess.title === 'New Conversation') {
      updatedTitle = userMsg.content.slice(0, 36) + (userMsg.content.length > 36 ? '...' : '');
    }

    saveCurrentSession(newMessages, updatedTitle);
    const inquiry = promptInput.trim();
    setPromptInput('');
    setIsGenerating(true);

    if (connectionStatus === 'connected') {
      const assistantId = `reply-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const withAssistant = [...newMessages, assistantMsg];
      setMessages(withAssistant);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const ollamaHistory = [
          { role: 'system' as const, content: systemPrompt },
          ...newMessages
            .filter((m) => !m.id.startsWith('welcome'))
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
        ];

        const fullOutput = await streamOllamaChat(
          endpoint,
          {
            model: selectedModel,
            messages: ollamaHistory,
            temperature,
            num_ctx: numCtx,
          },
          (fullText) => {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantId ? { ...msg, content: fullText } : msg))
            );
          },
          controller.signal
        );

        const finalized = withAssistant.map((msg) =>
          msg.id === assistantId ? { ...msg, content: fullOutput } : msg
        );
        saveCurrentSession(finalized, updatedTitle);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setMessages((prev) => {
            saveCurrentSession(prev, updatedTitle);
            return prev;
          });
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: isPreviewMode
                      ? `ℹ️ **Cloud Web Preview Mode**: The browser cannot reach a local daemon from a remote website. Run Resursee locally or check the **Setup Guide** to stream real tokens directly from local GPU/CPU weights.`
                      : `⚠️ Failed to stream from Ollama (${err.message}). Ensure model "${selectedModel}" is pulled locally.`,
                  }
                : msg
            )
          );
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    } else {
      // Offline fallback simulation
      setTimeout(() => {
        let replyContent = '';
        let code = '';

        if (inquiry.toLowerCase().includes('esp32') || inquiry.toLowerCase().includes('iot')) {
          replyContent = `Here is a lightweight FreeRTOS sensor telemetry task for the ESP32 connecting to Resursee's IoT Cloud ingestion API:\n\n\`\`\`cpp\n#include <WiFi.h>\n#include <HTTPClient.h>\n\nvoid telemetryTask(void *pvParameters) {\n  for(;;) {\n    float temperature = readDHT22();\n    if (WiFi.status() == WL_CONNECTED) {\n      HTTPClient http;\n      http.begin("http://localhost:3000/api/iot/ingest");\n      http.addHeader("Content-Type", "application/json");\n      http.POST("{\\"device_id\\":\\"esp32-node\\",\\"temp\\":" + String(temperature) + "}");\n      http.end();\n    }\n    vTaskDelay(pdMS_TO_TICKS(5000));\n  }\n}\n\`\`\``;
        } else if (inquiry.toLowerCase().includes('quant') || inquiry.toLowerCase().includes('gguf')) {
          replyContent = `**Quantization Comparison: Q4_K_M vs Q8_0**\n\n- **Q4_K_M (4-bit)**: Compresses weights down to ~4.5 bits/weight. Ideal for consumer laptops (fits in 8GB–16GB RAM) with minimal perplexity degradation (< 0.15 PPL loss).\n- **Q8_0 (8-bit)**: Near-lossless precision matching original FP16 checkpoints, but requires double the VRAM.\n\nFor local execution on edge hardware, **Q4_K_M** delivers the optimal speed-to-accuracy ratio.`;
        } else {
          replyContent = isPreviewMode
            ? `*Running in Cloud Web Preview Mode*. Simulated response from **${selectedModel || 'Llama 3.2'}**.\n\nTo stream real tokens directly from your machine's GPU/CPU with 100% private offline compute, install Ollama and run Resursee locally!`
            : `Processed query via local **${selectedModel || 'Ollama'}** engine.\n\n*Running in demo simulation mode*. Connect local Ollama at \`${endpoint}\` to stream live tokens from GPU/CPU weights.`;
        }

        const assistantMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          codeSnippet: code || undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const updated = [...newMessages, assistantMsg];
        setMessages(updated);
        saveCurrentSession(updated, updatedTitle);
        setIsGenerating(false);
      }, 700);
    }
  };

  // Cancel Active Model Pull (Phase 3)
  const handleCancelPull = () => {
    if (pullAbortControllerRef.current) {
      pullAbortControllerRef.current.abort();
      pullAbortControllerRef.current = null;
    }
    setDownloadingModelId(null);
    setDownloadProgress(0);
    setDownloadStatus('');
  };

  // Live Model Pull with Real Daemon Stream (Phase 3)
  const handlePullModel = async (modelId: string) => {
    const cleanId = modelId.trim();
    if (!cleanId || downloadingModelId) return;
    setDownloadingModelId(cleanId);
    setDownloadProgress(0);
    setDownloadStatus('Connecting to Ollama registry...');

    if (connectionStatus === 'connected') {
      const controller = new AbortController();
      pullAbortControllerRef.current = controller;

      try {
        await pullOllamaModel(
          endpoint,
          cleanId,
          (progress) => {
            if (progress.status) {
              setDownloadStatus(progress.status);
            }
            if (progress.percent !== undefined) {
              setDownloadProgress(progress.percent);
            }
          },
          controller.signal
        );
        setDownloadStatus('Pull completed successfully!');
        await refreshConnection();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Cancelled by user
        } else {
          alert(`Failed to pull model "${cleanId}": ${err.message}`);
        }
      } finally {
        setDownloadingModelId(null);
        setDownloadProgress(0);
        setDownloadStatus('');
        pullAbortControllerRef.current = null;
      }
    } else {
      // Offline fallback simulation
      let currentPercent = 0;
      const interval = setInterval(() => {
        currentPercent += 20;
        if (currentPercent >= 100) {
          clearInterval(interval);
          setDownloadProgress(100);
          setDownloadStatus('Download complete!');
          const simulatedModel: OllamaModel = {
            name: cleanId,
            model: cleanId,
            modified_at: new Date().toISOString(),
            size: cleanId.includes('embed') ? 274 * 1024 * 1024 : 4.5 * 1024 * 1024 * 1024,
            digest: 'sha256:simulated',
            details: {
              format: 'gguf',
              family: cleanId.includes('embed') ? 'bert' : 'llama',
              parameter_size: cleanId.includes('embed') ? '137M' : '7B',
              quantization_level: 'Q4_K_M',
            },
          };
          setInstalledModels((prev) => [
            ...prev.filter((m) => m.name !== cleanId),
            simulatedModel,
          ]);
          setDownloadingModelId(null);
          setDownloadProgress(0);
          setDownloadStatus('');
        } else {
          setDownloadProgress(currentPercent);
          setDownloadStatus(`Simulating layer download (${currentPercent}%)...`);
        }
      }, 350);
    }
  };

  // Delete Local Model from Disk (Phase 3)
  const handleDeleteModel = async () => {
    if (!modelToDelete) return;
    setIsDeleting(true);
    try {
      if (connectionStatus === 'connected') {
        await deleteOllamaModel(endpoint, modelToDelete);
        await refreshConnection();
      }
      setModelToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete model: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Inspect Model Architecture & Details (Phase 3)
  const handleInspectModel = async (modelId: string) => {
    setInspectingModel(modelId);
    setIsLoadingInspect(true);
    setInspectData(null);

    if (connectionStatus === 'connected') {
      try {
        const data = await showOllamaModel(endpoint, modelId);
        setInspectData(data);
      } catch (err: any) {
        setInspectData({ error: err.message || 'Model details not available until pulled.' });
      } finally {
        setIsLoadingInspect(false);
      }
    } else {
      // Offline fallback inspect
      const cat = CATALOG_MODELS.find((c) => c.id === modelId);
      if (cat) {
        setInspectData({
          details: {
            format: 'gguf',
            family: cat.category,
            parameter_size: cat.parameters,
            quantization_level: 'Q4_K_M',
          },
          modelfile: `# Ollama Modelfile for ${cat.name}\nFROM ${cat.id}\nPARAMETER temperature 0.7\nPARAMETER stop "<|im_end|>"`,
        });
      }
      setIsLoadingInspect(false);
    }
  };

  // Merge installed models with catalog
  const allDisplayModels = React.useMemo(() => {
    const list: ModelItem[] = [];
    const addedIds = new Set<string>();

    // 1. Add ALL locally installed models from user machine first
    installedModels.forEach((im) => {
      addedIds.add(im.name);
      if (im.name.endsWith(':latest')) {
        addedIds.add(im.name.replace(':latest', ''));
      }

      const catalogMatch = CATALOG_MODELS.find(
        (cm) =>
          cm.id === im.name ||
          `${cm.id}:latest` === im.name ||
          cm.id === `${im.name}:latest`
      );

      list.push({
        id: im.name,
        name: catalogMatch ? catalogMatch.name : im.name,
        category: catalogMatch
          ? catalogMatch.category
          : im.name.includes('embed')
          ? 'embeddings'
          : im.name.includes('vision') || im.name.includes('llava') || im.name.includes('moondream')
          ? 'vision'
          : im.name.includes('coder') || im.name.includes('code')
          ? 'code'
          : 'compact',
        parameters: im.details?.parameter_size || (catalogMatch ? catalogMatch.parameters : 'Custom'),
        size: `${(im.size / (1024 * 1024 * 1024)).toFixed(1)} GB`,
        vram: `${((im.size / (1024 * 1024 * 1024)) * 1.3).toFixed(1)} GB`,
        description:
          catalogMatch?.description ||
          `Locally installed model weights (${im.details?.quantization_level || 'Q4_K_M'} ${im.details?.format || 'GGUF'}).`,
        isDownloaded: true,
      });
    });

    // 2. Add remaining catalog models not yet downloaded
    CATALOG_MODELS.forEach((cm) => {
      const isAlreadyAdded =
        addedIds.has(cm.id) ||
        addedIds.has(`${cm.id}:latest`) ||
        (cm.id.endsWith(':latest') && addedIds.has(cm.id.replace(':latest', '')));

      if (!isAlreadyAdded) {
        list.push({
          ...cm,
          isDownloaded: false,
        });
      }
    });

    return list;
  }, [installedModels]);

  // Merge installed HF models with Hugging Face catalog
  const allDisplayHfModels = React.useMemo(() => {
    const list: ModelItem[] = [];
    const addedIds = new Set<string>();

    // 1. Locally installed HF models
    installedModels
      .filter((im) => im.name.startsWith('hf.co/') || im.name.includes('hf.co'))
      .forEach((im) => {
        addedIds.add(im.name);
        const match = HUGGINGFACE_MODELS.find(
          (hm) => hm.id === im.name || `${hm.id}:latest` === im.name || hm.id === `${im.name}:latest`
        );

        list.push({
          id: im.name,
          name: match ? match.name : im.name.replace('hf.co/', ''),
          category: match ? match.category : 'compact',
          parameters: im.details?.parameter_size || (match ? match.parameters : 'GGUF'),
          size: `${(im.size / (1024 * 1024 * 1024)).toFixed(1)} GB`,
          vram: `${((im.size / (1024 * 1024 * 1024)) * 1.3).toFixed(1)} GB`,
          description:
            match?.description ||
            `Hugging Face GGUF model (${im.details?.quantization_level || 'Q4_K_M'}) installed in local Ollama storage.`,
          isDownloaded: true,
          author: match?.author || im.name.split('/')[1] || 'Community',
          quantization: match?.quantization || im.details?.quantization_level || 'Q4_K_M',
          source: 'huggingface',
        });
      });

    // 2. Curated HF catalog models not yet downloaded
    HUGGINGFACE_MODELS.forEach((hm) => {
      const isAlreadyAdded =
        addedIds.has(hm.id) ||
        addedIds.has(`${hm.id}:latest`) ||
        (hm.id.endsWith(':latest') && addedIds.has(hm.id.replace(':latest', '')));

      if (!isAlreadyAdded) {
        list.push({
          ...hm,
          isDownloaded: false,
        });
      }
    });

    return list;
  }, [installedModels]);

  const handlePullHfModel = (input: string) => {
    let trimmed = input.trim();
    if (!trimmed || !!downloadingModelId) return;
    if (trimmed.startsWith('https://huggingface.co/')) {
      trimmed = trimmed.replace('https://huggingface.co/', '');
    }
    if (!trimmed.startsWith('hf.co/')) {
      trimmed = `hf.co/${trimmed}`;
    }
    handlePullModel(trimmed);
  };

  const fetchHfLiveModels = React.useCallback(
    async (
      query: string = hfLiveQuery,
      sort: 'downloads' | 'trending' | 'likes' = hfLiveSort
    ) => {
      setIsHfSearching(true);
      setHfSearchError(null);
      setHasSearchedHf(true);
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          sort,
          limit: '36',
        });
        const res = await fetch(`/api/ai/huggingface/search?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Hugging Face Hub search returned status ${res.status}`);
        }
        const data = await res.json();
        setHfLiveResults(data.models || []);
      } catch (err: any) {
        setHfSearchError(err.message || 'Error querying Hugging Face Hub');
      } finally {
        setIsHfSearching(false);
      }
    },
    [hfLiveQuery, hfLiveSort]
  );

  const totalDiskBytes = installedModels.reduce((acc, m) => acc + (m.size || 0), 0);
  const totalDiskGB = (totalDiskBytes / (1024 * 1024 * 1024)).toFixed(2);

  // Navigation Links for Aceternity Sidebar
  const sidebarLinks: Links[] = [
    {
      label: 'Setup Guide',
      onClick: () => setActiveTab('guide'),
      icon: <IconBook size={18} className="shrink-0" />,
      isActive: activeTab === 'guide',
    },
    {
      label: 'Chat & Inference',
      onClick: () => setActiveTab('chat'),
      icon: <IconMessageChatbot size={18} className="shrink-0" />,
      isActive: activeTab === 'chat',
    },
    {
      label: 'Model Library',
      onClick: () => setActiveTab('models'),
      icon: <IconCpu size={18} className="shrink-0" />,
      isActive: activeTab === 'models',
      badge: installedModels.length > 0 ? `${installedModels.length}` : undefined,
    },
    {
      label: 'Vision & OCR',
      onClick: () => setActiveTab('vision'),
      icon: <IconEye size={18} className="shrink-0" />,
      isActive: activeTab === 'vision',
      badge: 'NEW',
    },
    {
      label: 'RAG & Knowledge',
      onClick: () => setActiveTab('rag'),
      icon: <IconDatabase size={18} className="shrink-0" />,
      isActive: activeTab === 'rag',
    },
    {
      label: 'Engine & Settings',
      onClick: () => setActiveTab('settings'),
      icon: <IconSettings size={18} className="shrink-0" />,
      isActive: activeTab === 'settings',
    },
  ];

  // Mobile Brand Header
  const mobileBrand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-xs">
        <IconSparkles size={16} stroke={2} />
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-xs text-[var(--color-ink)] leading-none">Resursee AI Hub</span>
        <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">Local Ollama Studio</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-[var(--color-paper)] text-[var(--color-ink)] font-sans antialiased">
      {/* 🧭 Aceternity Collapsible Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody brand={mobileBrand} className="justify-between gap-6">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Header Brand */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-bold select-none text-base">
                <IconSparkles size={18} stroke={2} />
              </div>
              <motion.div
                animate={{
                  display: sidebarOpen ? 'flex' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="flex flex-col truncate"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-[var(--color-ink)]">AI Hub Studio</span>
                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                    Local
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-[var(--color-ink-muted)]">
                  Local LLM & WebLLM Engine
                </span>
              </motion.div>
            </div>

            {/* Sidebar Navigation Links */}
            <div className="mt-6 flex flex-col gap-1">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Sidebar Footer: Engine Status & Back to Resursee */}
          <div className="border-t border-[var(--color-rule-subtle)] pt-3 mt-auto space-y-2">
            {/* Ollama Status Pill & Start/Stop Action */}
            <div
              onClick={() => {
                if (connectionStatus === 'connected') {
                  handleStopOllama();
                } else {
                  handleStartOllama();
                }
              }}
              className="group flex items-center justify-between p-2 rounded-xl bg-[var(--color-paper-card)] border border-[var(--color-rule-subtle)] hover:border-[var(--color-rule-strong)] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    connectionStatus === 'connected'
                      ? 'bg-neutral-900 dark:bg-white'
                      : connectionStatus === 'checking' || isStartingDaemon || isStoppingDaemon
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-neutral-400'
                  )}
                />
                <motion.span
                  animate={{
                    display: sidebarOpen ? 'inline-block' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  className="text-xs font-semibold text-[var(--color-ink)] truncate"
                >
                  {isStartingDaemon
                    ? 'Starting Engine...'
                    : isStoppingDaemon
                    ? 'Stopping Engine...'
                    : connectionStatus === 'connected'
                    ? `Ollama (${installedModels.length} models)`
                    : connectionStatus === 'checking'
                    ? 'Connecting...'
                    : 'Ollama Standby'}
                </motion.span>
              </div>
              <motion.span
                animate={{
                  display: sidebarOpen ? 'inline-block' : 'none',
                  opacity: sidebarOpen ? 1 : 0,
                }}
                className="text-[10px] font-mono text-[var(--color-ink-muted)] group-hover:underline"
              >
                {connectionStatus === 'connected' ? 'Stop' : 'Start'}
              </motion.span>
            </div>

            {/* Return to Resursee */}
            <SidebarLink
              link={{
                label: 'Back to Resursee',
                href: '/#apps',
                icon: <IconArrowLeft size={16} className="shrink-0 text-[var(--color-ink-muted)]" />,
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* 🖥️ Main Studio Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--color-paper)]">
        {/* Top Studio Action Bar */}
        <header className="h-14 shrink-0 px-4 sm:px-6 border-b border-[var(--color-rule-subtle)] flex items-center justify-between gap-3 bg-[var(--color-paper-card)]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[var(--color-ink)] truncate">
              {activeTab === 'guide' && 'Ollama Setup & Installation Guide'}
              {activeTab === 'chat' && 'Chat & Inference Studio'}
              {activeTab === 'models' && 'Model Library & Downloader'}
              {activeTab === 'vision' && 'Vision & OCR Multimodal Studio'}
              {activeTab === 'rag' && 'RAG & Knowledge Documents'}
              {activeTab === 'settings' && 'Engine & Host Settings'}
            </h1>

            {/* Active Model Pill */}
            {selectedModel ? (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                <span>{selectedModel}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                <span>0 Models Available</span>
              </div>
            )}

            {/* Preview Mode Pill if running on remote cloud host */}
            {isPreviewMode && (
              <button
                type="button"
                onClick={() => setShowRemoteNoticeModal(true)}
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1 text-[11px] font-mono font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                title="Running in cloud web preview mode. Click for local setup details."
              >
                <IconCompass size={13} />
                <span>Preview Mode (Cloud Web)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Start / Stop Ollama Button */}
            {connectionStatus === 'connected' ? (
              <button
                type="button"
                onClick={handleStopOllama}
                disabled={isStoppingDaemon}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Stop local Ollama background daemon"
              >
                {isStoppingDaemon ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                    <span>Stopping...</span>
                  </>
                ) : (
                  <>
                    <IconPlayerStop size={13} />
                    <span className="hidden sm:inline">Stop Ollama</span>
                    <span className="sm:hidden">Stop</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOllama}
                disabled={isStartingDaemon}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Launch local Ollama background daemon"
              >
                {isStartingDaemon ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-900 animate-ping" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <IconPlayerPlay size={13} />
                    <span className="hidden sm:inline">Start Ollama</span>
                    <span className="sm:hidden">Start</span>
                  </>
                )}
              </button>
            )}

            {/* Model Selector Dropdown (strictly downloaded local models) */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={installedModels.length === 0}
                className="appearance-none rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 pr-8 text-xs font-mono font-bold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-paper-muted)] focus:outline-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                title={installedModels.length > 0 ? 'Select downloaded local model' : 'No downloaded models available'}
              >
                {installedModels.length > 0 ? (
                  installedModels.map((im) => (
                    <option key={im.name} value={im.name}>
                      {im.name} ({(im.size / (1024 * 1024 * 1024)).toFixed(1)} GB)
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No downloaded models
                  </option>
                )}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[10px]">
                ▼
              </div>
            </div>

            {/* Setup Guide Button in Header */}
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={cn(
                'hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer',
                activeTab === 'guide'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
              )}
            >
              <IconBook size={15} />
              <span>Guide</span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Floating Daemon Notification Banner if triggered */}
        <AnimatePresence>
          {daemonNotification && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-xs font-mono text-neutral-800 dark:text-neutral-200 flex items-center justify-between z-10"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                <span>{daemonNotification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setDaemonNotification(null)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                <IconX size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Studio View Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {/* VIEW 0: SETUP & INSTALLATION GUIDE */}
          {activeTab === 'guide' && (
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
              {/* Header Hero */}
              <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
                      <IconBook size={20} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-[var(--color-ink)]">
                        Ollama Installation & Engine Setup
                      </h2>
                      <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                        AI Hub Studio runs directly on local hardware via Ollama (<code className="rounded-md bg-neutral-200 dark:bg-neutral-800 px-1 py-0.5 font-mono text-[11px] text-[var(--color-ink)]">http://localhost:11434</code>) for 100% data sovereignty, zero cloud egress, and complete privacy.
                      </p>
                    </div>
                  </div>

                  {/* OS Selector Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] shrink-0">
                    {[
                      { id: 'macos', label: 'macOS', icon: <IconBrandApple size={14} /> },
                      { id: 'windows', label: 'Windows', icon: <IconBrandWindows size={14} /> },
                      { id: 'linux', label: 'Linux', icon: <IconBrandUbuntu size={14} /> },
                    ].map((os) => (
                      <button
                        key={os.id}
                        type="button"
                        onClick={() => setGuideOS(os.id as any)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs',
                          guideOS === os.id
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                        )}
                      >
                        {os.icon}
                        <span>{os.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Engine Status Banner */}
              <div
                className={cn(
                  'rounded-2xl border p-5 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  connectionStatus === 'connected'
                    ? 'border-neutral-900 dark:border-white bg-[var(--color-paper-card)]'
                    : 'border-[var(--color-rule-strong)] bg-[var(--color-paper-card)]'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold',
                      connectionStatus === 'connected'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700'
                    )}
                  >
                    {connectionStatus === 'connected' ? <IconCheck size={18} /> : <IconAlertCircle size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--color-ink)]">
                        {connectionStatus === 'connected'
                          ? 'Ollama Engine is Active & Connected'
                          : 'Ollama Engine is Not Running'}
                      </h3>
                      <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold">
                        {connectionStatus === 'connected'
                          ? `${installedModels.length} models installed on disk`
                          : 'Port 11434 unreachable'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                      {connectionStatus === 'connected'
                        ? `Local daemon responding at ${endpoint}. Hardware weights loaded directly into RAM/VRAM.`
                        : 'Follow the steps below to install Ollama or start the local background daemon.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {connectionStatus === 'connected' ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold shadow-2xs hover:opacity-90 transition-all cursor-pointer"
                    >
                      <span>Proceed to Chat</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleStartOllama}
                        disabled={isStartingDaemon}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        <IconPlayerPlay size={13} />
                        <span>Start Ollama</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => refreshConnection()}
                        disabled={isCheckingConnection}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                        title="Probe port 11434 again"
                      >
                        <IconRefresh size={13} className={cn(isCheckingConnection && 'animate-spin')} />
                        <span>Rescan</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Straightforward 2-Step Workflow */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {guideOS === 'macos' && <IconBrandApple size={18} className="text-[var(--color-ink)]" />}
                    {guideOS === 'windows' && <IconBrandWindows size={18} className="text-[var(--color-ink)]" />}
                    {guideOS === 'linux' && <IconBrandUbuntu size={18} className="text-[var(--color-ink)]" />}
                    <h3 className="text-sm font-extrabold text-[var(--color-ink)]">
                      {guideOS === 'macos' && 'macOS Quick Setup (2 Steps)'}
                      {guideOS === 'windows' && 'Windows Quick Setup (2 Steps)'}
                      {guideOS === 'linux' && 'Linux Quick Setup (2 Steps)'}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                    No complex configuration required
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* STEP 1: Terminal / CMD Installation */}
                  <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--color-ink)]">
                          <span className="rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 text-[10px]">
                            STEP 1
                          </span>
                          <span>Install via Terminal / CMD</span>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                        {guideOS === 'macos' &&
                          'Open macOS Terminal and run this Homebrew command to install Ollama with Apple Silicon Metal acceleration:'}
                        {guideOS === 'windows' &&
                          'Open PowerShell or Command Prompt and run this winget command to install Ollama with automatic GPU support:'}
                        {guideOS === 'linux' &&
                          'Open your Linux shell and run the official 1-line installation script to configure the background daemon:'}
                      </p>

                      {/* Terminal Command Box with 1-Click Copy */}
                      <div className="flex items-center justify-between rounded-xl bg-neutral-950 text-neutral-100 p-3 font-mono text-xs shadow-xs border border-neutral-800">
                        <code className="text-neutral-200 select-all truncate pr-2">
                          {guideOS === 'macos' && 'brew install ollama'}
                          {guideOS === 'windows' && 'winget install Ollama.Ollama'}
                          {guideOS === 'linux' && 'curl -fsSL https://ollama.com/install.sh | sh'}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            const cmd =
                              guideOS === 'macos'
                                ? 'brew install ollama'
                                : guideOS === 'windows'
                                ? 'winget install Ollama.Ollama'
                                : 'curl -fsSL https://ollama.com/install.sh | sh';
                            handleCopy(cmd, 'step-1-cmd');
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 text-[11px] font-mono text-white transition-all cursor-pointer shrink-0 border border-neutral-700"
                        >
                          {copiedKey === 'step-1-cmd' ? (
                            <>
                              <IconCheck size={12} className="text-white" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <IconCopy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Direct Installer Fallback Links */}
                      <div className="text-[11px] text-[var(--color-ink-muted)] pt-1">
                        {guideOS === 'macos' && (
                          <span>
                            Don&apos;t have Homebrew?{' '}
                            <a
                              href="https://ollama.com/download/Ollama-darwin.zip"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-[var(--color-ink)] font-semibold inline-flex items-center gap-0.5"
                            >
                              Download the macOS .zip installer <IconExternalLink size={11} />
                            </a>
                          </span>
                        )}
                        {guideOS === 'windows' && (
                          <span>
                            Prefer an installer wizard?{' '}
                            <a
                              href="https://ollama.com/download/OllamaSetup.exe"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-[var(--color-ink)] font-semibold inline-flex items-center gap-0.5"
                            >
                              Download OllamaSetup.exe <IconExternalLink size={11} />
                            </a>
                          </span>
                        )}
                        {guideOS === 'linux' && (
                          <span>
                            Requires standard sudo permissions to configure the systemd background service.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--color-rule-subtle)] flex items-center justify-end text-[11px] text-[var(--color-ink-muted)]">
                      <button
                        type="button"
                        onClick={handleStartOllama}
                        className="font-bold underline hover:text-[var(--color-ink)] cursor-pointer"
                      >
                        Start Engine from Web
                      </button>
                    </div>
                  </div>

                  {/* STEP 2: Pick & Pull in Resursee Model Library */}
                  <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--color-ink)]">
                          <span className="rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 text-[10px]">
                            STEP 2
                          </span>
                          <span>Download in Resursee Model Library</span>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                        No terminal commands needed to download models! Browse Resursee’s built-in <strong>Model Library</strong> with 45+ official models and real-time progress bars.
                      </p>

                      {/* Quick 1-Click Recommended Models */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[var(--color-ink)] font-mono">Llama 3.2 (3B)</span>
                              <span className="rounded-full bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[9px] font-bold">2.0 GB</span>
                            </div>
                            <span className="text-[10.5px] text-[var(--color-ink-muted)] block">Fast, smart, lightweight general assistant</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('models');
                              handlePullModel('llama3.2:latest');
                            }}
                            className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2.5 py-1 text-[11px] font-bold shadow-2xs hover:opacity-90 transition-all cursor-pointer shrink-0"
                          >
                            Pull Model
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[var(--color-ink)] font-mono">Qwen 2.5 (1.5B)</span>
                              <span className="rounded-full bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[9px] font-bold">986 MB</span>
                            </div>
                            <span className="text-[10.5px] text-[var(--color-ink-muted)] block">Ultra-fast edge model with sharp reasoning</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('models');
                              handlePullModel('qwen2.5:1.5b');
                            }}
                            className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2.5 py-1 text-[11px] font-bold shadow-2xs hover:opacity-90 transition-all cursor-pointer shrink-0"
                          >
                            Pull Model
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('models')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-2.5 text-xs font-bold shadow-2xs hover:opacity-90 transition-all cursor-pointer"
                    >
                      <IconCpu size={14} />
                      <span>Open Model Library (45+ Available) →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hardware & FAQ Card */}
              <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xs space-y-3">
                <h3 className="text-sm font-extrabold text-[var(--color-ink)]">
                  Frequently Asked Questions & Sizing Advice
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-1">
                    <span className="font-bold text-xs text-[var(--color-ink)] block">
                      0.5B – 3B Models
                    </span>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug">
                      Requires 2GB–4GB RAM. Fast, lightweight inference for laptops.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-1">
                    <span className="font-bold text-xs text-[var(--color-ink)] block">
                      7B – 8B Models
                    </span>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug">
                      Requires 8GB–16GB RAM. High-quality reasoning and coding performance.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-1">
                    <span className="font-bold text-xs text-[var(--color-ink)] block">
                      Zero Cloud Egress
                    </span>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug">
                      100% private. All weights and prompts stay on your physical device.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Next Step Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-ink)]">
                    Ready to start chatting?
                  </h4>
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    Once Ollama is running, jump into Chat & Inference or explore the full Model Library.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('models')}
                    className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-ink)] transition-all cursor-pointer shadow-2xs"
                  >
                    Model Library (45+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                  >
                    Go to Chat & Inference →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: CHAT & INFERENCE */}
          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto h-full flex flex-col justify-between gap-4">
              {/* Chat Sub-Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--color-rule-subtle)] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsSessionDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <IconHistory size={14} className="shrink-0" />
                    <span>Sessions ({sessions.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <IconPlus size={14} className="shrink-0" />
                    <span className="hidden sm:inline">New Chat</span>
                  </button>

                  <span className="text-xs font-mono text-[var(--color-ink-muted)] truncate max-w-[140px] sm:max-w-[220px]">
                    {sessions.find((s) => s.id === currentSessionId)?.title || 'New Conversation'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsParametersModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                    title="Inference Parameters (Temperature, Context Length, System Prompt)"
                  >
                    <IconAdjustmentsHorizontal size={14} />
                    <span className="hidden sm:inline">Parameters</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportChat}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                    title="Export conversation to Markdown (.md)"
                  >
                    <IconFileExport size={14} />
                    <span className="hidden sm:inline">Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-1.5 text-xs text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
                    title="Reset current conversation"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col gap-1.5 max-w-[90%] sm:max-w-[82%]',
                      msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    )}
                  >
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-ink-muted)]">
                      <span className="font-bold uppercase">{msg.role === 'user' ? 'You' : selectedModel}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={cn(
                        'rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium'
                          : 'bg-[var(--color-paper-card)] border border-[var(--color-rule-subtle)] text-[var(--color-ink)] shadow-2xs'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <FormattedMessage
                          content={msg.content}
                          messageId={msg.id}
                          copiedKey={copiedKey}
                          onCopy={handleCopy}
                        />
                      )}

                      {/* Fallback code snippet if present */}
                      {msg.codeSnippet && !msg.content.includes('```') && (
                        <div className="mt-3 rounded-xl border border-[var(--color-rule-strong)] bg-neutral-950 text-neutral-100 p-3 font-mono text-[11px] overflow-x-auto relative group">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[10px] text-neutral-400">
                            <span>code</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.codeSnippet!, `code-${msg.id}`)}
                              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedKey === `code-${msg.id}` ? (
                                <>
                                  <IconCheck size={12} className="text-white" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <IconCopy size={12} />
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre>{msg.codeSnippet}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-muted)] p-3 rounded-xl bg-[var(--color-paper-card)] border border-[var(--color-rule-subtle)] w-max animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                    <span>Streaming local inference from {selectedModel}...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Floating Bottom Input Bar */}
              <div className="relative rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-2 shadow-lg">
                <textarea
                  rows={2}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${selectedModel} anything (Shift + Enter for multiline)...`}
                  className="w-full resize-none bg-transparent px-3 py-1.5 text-xs sm:text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                />

                <div className="flex items-center justify-between border-t border-[var(--color-rule-subtle)] pt-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsParametersModalOpen(true)}
                      className="rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold cursor-pointer transition-colors"
                      title="Adjust Temperature"
                    >
                      Temp: {temperature.toFixed(2)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsParametersModalOpen(true)}
                      className="hidden sm:inline rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold cursor-pointer transition-colors"
                      title="Adjust Context Tokens"
                    >
                      Ctx: {numCtx}
                    </button>
                  </div>

                  {isGenerating ? (
                    <button
                      type="button"
                      onClick={handleStopGeneration}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      <IconPlayerStop size={13} fill="currentColor" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!promptInput.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <span>Send</span>
                      <IconPlayerPlay size={13} fill="currentColor" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MODEL LIBRARY & DOWNLOADER (Phase 3) */}
          {activeTab === 'models' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header Strip & Live Machine Telemetry */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Model Catalog & Disk Manager</h2>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    Download model weights into your local Ollama storage, inspect GGUF tensor layers, or delete models to free disk space.
                  </p>
                </div>

                {/* Storage & VRAM Summary Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                    <IconDisc size={14} className="shrink-0" />
                    <span>{installedModels.length} Installed ({totalDiskGB} GB)</span>
                  </span>
                  {runningModels.length > 0 && (
                    <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping shrink-0" />
                      <span>VRAM: {runningModels[0]}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 💾 Dedicated Installed Models Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-2">
                  <div className="flex items-center gap-2">
                    <IconDisc size={16} className="text-[var(--color-ink)]" />
                    <h3 className="text-sm font-extrabold text-[var(--color-ink)]">
                      Installed on Your Machine ({installedModels.length + (downloadingModelId && !installedModels.some(m => m.name === downloadingModelId) ? 1 : 0)})
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                      {totalDiskGB} GB Total Storage
                    </span>
                    <button
                      type="button"
                      onClick={() => refreshConnection()}
                      disabled={isCheckingConnection}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] px-2.5 py-1 text-[11px] font-mono font-bold text-[var(--color-ink)] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                      title="Rescan Ollama disk models"
                    >
                      <IconRefresh size={12} className={cn(isCheckingConnection && 'animate-spin')} />
                      <span>Rescan</span>
                    </button>
                  </div>
                </div>

                {installedModels.length === 0 && !downloadingModelId ? (
                  <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 text-center space-y-2">
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {connectionStatus === 'connected'
                        ? 'No models currently downloaded to disk. Browse the library below or pull any model tag to begin.'
                        : 'Ollama engine is offline. Start Ollama to detect and manage your downloaded models.'}
                    </p>
                    {connectionStatus !== 'connected' && (
                      <button
                        type="button"
                        onClick={handleStartOllama}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                      >
                        <IconPlayerPlay size={13} />
                        <span>Start Ollama</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Active Downloading Model Card */}
                    {downloadingModelId && !installedModels.some((m) => m.name === downloadingModelId) && (
                      <div className="p-4 rounded-2xl border border-dashed border-neutral-400 dark:border-neutral-600 bg-[var(--color-paper-card)] shadow-2xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-[var(--color-ink)] truncate font-mono">
                                {downloadingModelId}
                              </span>
                              <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.2 font-mono text-[9px] font-bold inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                                Downloading
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--color-ink-muted)] block mt-0.5">
                              {downloadStatus || 'Downloading layers to disk...'}
                            </span>
                          </div>
                          <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold shrink-0">
                            {downloadProgress}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-neutral-900 dark:bg-white h-full transition-all duration-300"
                            style={{ width: `${Math.max(downloadProgress, 5)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink-muted)] pt-1 border-t border-[var(--color-rule-subtle)]">
                          <span>Pulling to local Ollama library</span>
                          <button
                            type="button"
                            onClick={handleCancelPull}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {installedModels.map((im) => {
                      const isVram = runningModels.includes(im.name);
                      const isSelected = selectedModel === im.name;
                      const sizeGB = (im.size / (1024 * 1024 * 1024)).toFixed(1);

                      return (
                        <div
                          key={im.name}
                          className={cn(
                            'p-4 rounded-2xl border bg-[var(--color-paper-card)] shadow-2xs space-y-3 transition-all',
                            isVram
                              ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/15 dark:ring-white/15'
                              : 'border-[var(--color-rule-strong)]'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-[var(--color-ink)] truncate font-mono">
                                  {im.name}
                                </span>
                                {im.name.startsWith('hf.co/') || im.name.includes('hf.co') ? (
                                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                                    Hugging Face
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                                    Ollama
                                  </span>
                                )}
                                {isVram && (
                                  <span className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-1.5 py-0.5 font-mono text-[8.5px] font-bold">
                                    VRAM
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-[var(--color-ink-muted)] block">
                                {im.details?.family || 'Transformer'} • {im.details?.parameter_size || 'N/A'} • {im.details?.quantization_level || 'Q4_K_M'}
                              </span>
                            </div>

                            <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold shrink-0">
                              {sizeGB} GB
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--color-rule-subtle)]">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedModel(im.name);
                                setActiveTab('chat');
                              }}
                              className={cn(
                                'flex-1 rounded-xl py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs',
                                isSelected
                                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                  : 'border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] text-[var(--color-ink)]'
                              )}
                            >
                              <IconPlayerPlay size={12} fill={isSelected ? 'currentColor' : 'none'} />
                              <span>{isSelected ? 'Active in Chat' : 'Chat'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInspectModel(im.name)}
                              className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                              title="Inspect Architecture & GGUF parameters"
                            >
                              <IconInfoCircle size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setModelToDelete(im.name)}
                              className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                              title="Delete model from disk"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dual Catalog Tabs Switcher: Ollama Library vs Hugging Face Models on left + Curated vs Full on other end */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-[var(--color-rule-subtle)]">
                {/* Left: Engine Selection */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] shrink-0">
                  <button
                    type="button"
                    onClick={() => setModelSourceTab('ollama')}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs',
                      modelSourceTab === 'ollama'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                    )}
                  >
                    <IconCpu size={14} />
                    <span>Ollama Library</span>
                    <span
                      className={cn(
                        'rounded-full text-[10px] px-1.5 py-0.2 font-mono font-bold transition-colors',
                        modelSourceTab === 'ollama'
                          ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                          : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      )}
                    >
                      {CATALOG_MODELS.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelSourceTab('huggingface')}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs',
                      modelSourceTab === 'huggingface'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                    )}
                  >
                    <IconCube size={14} />
                    <span>Hugging Face Models</span>
                    <span
                      className={cn(
                        'rounded-full text-[10px] px-1.5 py-0.2 font-mono font-bold transition-colors',
                        modelSourceTab === 'huggingface'
                          ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                          : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      )}
                    >
                      GGUF
                    </span>
                  </button>
                </div>

                {/* Right: Curated vs Full Catalog Selection (Same lane, other end) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] shrink-0 self-start md:self-auto">
                  {modelSourceTab === 'ollama' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOllamaViewMode('curated')}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs',
                          ollamaViewMode === 'curated'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                        )}
                      >
                        <IconSparkles size={13} />
                        <span>Curated Selection</span>
                        <span
                          className={cn(
                            'rounded-full text-[10px] px-1.5 py-0.2 font-mono font-bold transition-colors',
                            ollamaViewMode === 'curated'
                              ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                              : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          )}
                        >
                          {
                            allDisplayModels.filter(
                              (m) =>
                                m.isDownloaded ||
                                CURATED_OLLAMA_TAGS.has(m.id) ||
                                CURATED_OLLAMA_TAGS.has(m.id.replace(':latest', ''))
                            ).length
                          }
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOllamaViewMode('full')}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs',
                          ollamaViewMode === 'full'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                        )}
                      >
                        <IconWorld size={13} />
                        <span>Full Catalog</span>
                        <span
                          className={cn(
                            'rounded-full text-[10px] px-1.5 py-0.2 font-mono font-bold transition-colors',
                            ollamaViewMode === 'full'
                              ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                              : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          )}
                        >
                          {allDisplayModels.length}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setHfViewMode('curated')}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs',
                          hfViewMode === 'curated'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                        )}
                      >
                        <IconSparkles size={13} />
                        <span>Curated Showcase</span>
                        <span
                          className={cn(
                            'rounded-full text-[10px] px-1.5 py-0.2 font-mono font-bold transition-colors',
                            hfViewMode === 'curated'
                              ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                              : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          )}
                        >
                          {allDisplayHfModels.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHfViewMode('full');
                          if (!hasSearchedHf) {
                            fetchHfLiveModels('deepseek', 'downloads');
                          }
                        }}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs',
                          hfViewMode === 'full'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)]'
                        )}
                      >
                        <IconWorld size={13} />
                        <span>Full Catalog</span>
                        <span
                          className={cn(
                            'rounded-full text-[10px] px-1.5 py-0.2 font-mono font-bold transition-colors',
                            hfViewMode === 'full'
                              ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                              : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          )}
                        >
                          Live Hub
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* TAB 1: OLLAMA LIBRARY */}
              {modelSourceTab === 'ollama' && (
                <div className="space-y-4">
                  {/* Filter Strip & Search Across the Ollama Library */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0">
                      {[
                        { id: 'all', label: ollamaViewMode === 'curated' ? 'All Curated' : 'All Models' },
                        { id: 'installed', label: `Installed (${installedModels.filter((im) => !im.name.startsWith('hf.co/')).length})` },
                        { id: 'compact', label: 'Fast & Compact' },
                        { id: 'reasoning', label: 'Reasoning & Math' },
                        { id: 'code', label: 'Code & Systems' },
                        { id: 'vision', label: 'Vision & Multimodal' },
                        { id: 'embeddings', label: 'Embeddings & RAG' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setModelCategory(cat.id)}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                            modelCategory === cat.id
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-white'
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search Ollama models..."
                        className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] pl-8 pr-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Models Grid (Dynamic Catalog + Local Installed) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      const filteredList = allDisplayModels.filter((m) => {
                        if (
                          ollamaViewMode === 'curated' &&
                          !m.isDownloaded &&
                          !CURATED_OLLAMA_TAGS.has(m.id) &&
                          !CURATED_OLLAMA_TAGS.has(m.id.replace(':latest', ''))
                        ) {
                          return false;
                        }
                        if (modelCategory === 'installed' && !m.isDownloaded) return false;
                        if (modelCategory !== 'all' && modelCategory !== 'installed' && m.category !== modelCategory)
                          return false;
                        if (
                          modelSearch &&
                          !m.name.toLowerCase().includes(modelSearch.toLowerCase()) &&
                          !m.id.toLowerCase().includes(modelSearch.toLowerCase())
                        )
                          return false;
                        return true;
                      });

                      if (filteredList.length === 0) {
                        return (
                          <div className="col-span-full p-10 text-center rounded-2xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] space-y-3">
                            <IconSearch size={26} className="mx-auto text-[var(--color-ink-muted)]" />
                            <h4 className="text-sm font-bold text-[var(--color-ink)]">
                              {modelSearch ? `No catalog models matching "${modelSearch}"` : 'No models found in this category'}
                            </h4>
                            {modelSearch.trim() && (
                              <div className="space-y-2 pt-1">
                                <p className="text-xs text-[var(--color-ink-muted)] max-w-md mx-auto">
                                  You can pull &ldquo;{modelSearch.trim()}&rdquo; directly from the official Ollama registry to your local machine:
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handlePullModel(modelSearch.trim())}
                                  disabled={!!downloadingModelId}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                                >
                                  <IconDownload size={13} />
                                  <span>Pull &ldquo;{modelSearch.trim()}&rdquo; to Local Ollama</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return filteredList.map((model) => {
                        const isInstalled =
                          model.isDownloaded ||
                          installedModels.some(
                            (im) =>
                              im.name === model.id ||
                              `${im.name}:latest` === model.id ||
                              im.name === `${model.id}:latest`
                          );
                        const installedData = installedModels.find(
                          (im) =>
                            im.name === model.id ||
                            `${im.name}:latest` === model.id ||
                            im.name === `${model.id}:latest`
                        );
                        const isLoadedInVram = runningModels.some(
                          (rm) =>
                            rm === model.id ||
                            `${rm}:latest` === model.id ||
                            rm === `${model.id}:latest`
                        );
                        const isPulling = downloadingModelId === model.id;

                        return (
                          <div
                            key={model.id}
                            className={cn(
                              'flex flex-col justify-between rounded-2xl border bg-[var(--color-paper-card)] p-5 shadow-2xs transition-all space-y-4',
                              isLoadedInVram
                                ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/10'
                                : 'border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'
                            )}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="text-sm font-extrabold text-[var(--color-ink)] truncate">{model.name}</h3>
                                    {isLoadedInVram && (
                                      <span className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-1.5 py-0.2 font-mono text-[9px] font-bold">
                                        ACTIVE IN VRAM
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {isInstalled ? (
                                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold flex items-center gap-1 shrink-0">
                                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                                    Installed
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold shrink-0">
                                    Catalog
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-snug">
                                {model.description}
                              </p>

                              {/* Specs Row */}
                              <div className="flex items-center gap-2 mt-4 text-[11px] font-mono text-[var(--color-ink-muted)] flex-wrap">
                                <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                                  {installedData ? `${(installedData.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : model.size}
                                </span>
                                <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                                  VRAM: {model.vram}
                                </span>
                                <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                                  {model.parameters}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[var(--color-rule-subtle)] space-y-2">
                              {/* Terminal Run Pill */}
                              <div className="flex items-center justify-between rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2.5 py-1.5 text-[10.5px] font-mono text-[var(--color-ink)]">
                                <span className="truncate">ollama run {model.id}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(`ollama run ${model.id}`, `term-${model.id}`)}
                                  className="hover:text-[var(--color-ink)] transition-colors cursor-pointer shrink-0 ml-2"
                                >
                                  {copiedKey === `term-${model.id}` ? (
                                    <IconCheck size={13} className="text-neutral-900 dark:text-white" />
                                  ) : (
                                    <IconCopy size={13} />
                                  )}
                                </button>
                              </div>

                              {/* Download / Active Actions */}
                              {isPulling ? (
                                <div className="space-y-1.5 p-2 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)]">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink)]">
                                    <span className="truncate max-w-[170px]">{downloadStatus || 'Pulling layers...'}</span>
                                    <span className="font-bold">{downloadProgress}%</span>
                                  </div>
                                  <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                    <div
                                      className="h-full bg-neutral-900 dark:bg-white transition-all duration-200"
                                      style={{ width: `${downloadProgress}%` }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleCancelPull}
                                    className="w-full text-center text-[10px] font-mono text-[var(--color-ink-muted)] hover:text-red-500 transition-colors cursor-pointer pt-0.5"
                                  >
                                    Cancel Download
                                  </button>
                                </div>
                              ) : isInstalled ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedModel(model.id);
                                      setActiveTab('chat');
                                    }}
                                    className="flex-1 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                  >
                                    <IconPlayerPlay size={13} fill="currentColor" />
                                    <span>Launch</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInspectModel(model.id)}
                                    className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                                    title="Inspect Model Architecture"
                                  >
                                    <IconInfoCircle size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setModelToDelete(model.id)}
                                    className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-1.5 text-xs text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer"
                                    title="Delete from Local Disk"
                                  >
                                    <IconTrash size={15} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handlePullModel(model.id)}
                                    className="flex-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] py-1.5 text-xs font-bold text-[var(--color-ink)] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                  >
                                    <IconDownload size={13} />
                                    <span>Pull Model</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInspectModel(model.id)}
                                    className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                                    title="Inspect Model Architecture"
                                  >
                                    <IconInfoCircle size={15} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: HUGGING FACE MODELS */}
              {modelSourceTab === 'huggingface' && (
                <div className="space-y-4">
                  {/* Curated Showcase View */}
                  {hfViewMode === 'curated' && (
                    <>
                      {/* 📥 Custom Hugging Face GGUF Pull Card */}
                      <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--color-ink)]">
                            <IconCube size={16} />
                            <span>Pull Any Hugging Face GGUF Model:</span>
                          </div>
                          <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                            Runs directly on local hardware via Ollama
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <div className="relative flex-1 w-full">
                            <input
                              type="text"
                              value={customHfTag}
                              onChange={(e) => setCustomHfTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePullHfModel(customHfTag);
                              }}
                              placeholder="Enter Hugging Face repo e.g. bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M"
                              className="w-full rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePullHfModel(customHfTag)}
                            disabled={!customHfTag.trim() || !!downloadingModelId}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                          >
                            <IconDownload size={13} />
                            <span>Pull from Hugging Face</span>
                          </button>
                        </div>

                        {/* Quick Example Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-[var(--color-ink-muted)]">
                          <span className="font-mono text-[10.5px]">Quick repos:</span>
                          {[
                            { label: 'Llama 3.2 3B', tag: 'bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M' },
                            { label: 'DeepSeek R1 1.5B', tag: 'unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF:Q4_K_M' },
                            { label: 'DeepSeek R1 7B', tag: 'bartowski/DeepSeek-R1-Distill-Qwen-7B-GGUF:Q4_K_M' },
                            { label: 'Qwen 2.5 Coder 7B', tag: 'bartowski/Qwen2.5-Coder-7B-Instruct-GGUF:Q4_K_M' },
                            { label: 'Phi-3.5 Mini', tag: 'bartowski/Phi-3.5-mini-instruct-GGUF:Q4_K_M' },
                            { label: 'Gemma 2 2B', tag: 'bartowski/gemma-2-2b-it-GGUF:Q4_K_M' },
                            { label: 'SmolLM2 1.7B', tag: 'bartowski/SmolLM2-1.7B-Instruct-GGUF:Q4_K_M' },
                            { label: 'Granite 3.1 8B', tag: 'bartowski/granite-3.1-8b-instruct-GGUF:Q4_K_M' },
                          ].map((chip) => (
                            <button
                              key={chip.tag}
                              type="button"
                              onClick={() => setCustomHfTag(chip.tag)}
                              className="rounded-lg bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] border border-[var(--color-rule-subtle)] px-2 py-0.5 text-[10.5px] font-mono text-[var(--color-ink)] transition-colors cursor-pointer"
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hugging Face Search Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--color-ink)]">
                          <span>Curated GGUF Checkpoints</span>
                          <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold">
                            {allDisplayHfModels.length} Models
                          </span>
                        </div>

                        <div className="relative w-full sm:w-64">
                          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                          <input
                            type="text"
                            value={hfSearch}
                            onChange={(e) => setHfSearch(e.target.value)}
                            placeholder="Filter curated models..."
                            className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] pl-8 pr-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Hugging Face Models Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allDisplayHfModels
                          .filter((m) => {
                            if (
                              hfSearch &&
                              !m.name.toLowerCase().includes(hfSearch.toLowerCase()) &&
                              !m.id.toLowerCase().includes(hfSearch.toLowerCase()) &&
                              !(m.author && m.author.toLowerCase().includes(hfSearch.toLowerCase()))
                            )
                              return false;
                            return true;
                          })
                          .map((model) => {
                            const isInstalled =
                              model.isDownloaded ||
                              installedModels.some(
                                (im) =>
                                  im.name === model.id ||
                                  `${im.name}:latest` === model.id ||
                                  im.name === `${model.id}:latest`
                              );
                            const installedData = installedModels.find(
                              (im) =>
                                im.name === model.id ||
                                `${im.name}:latest` === model.id ||
                                im.name === `${model.id}:latest`
                            );
                            const isLoadedInVram = runningModels.some(
                              (rm) =>
                                rm === model.id ||
                                `${rm}:latest` === model.id ||
                                rm === `${model.id}:latest`
                            );
                            const isPulling = downloadingModelId === model.id;

                            return (
                              <div
                                key={model.id}
                                className={cn(
                                  'flex flex-col justify-between rounded-2xl border bg-[var(--color-paper-card)] p-5 shadow-2xs transition-all space-y-4',
                                  isLoadedInVram
                                    ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/10'
                                    : 'border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'
                                )}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <h3 className="text-sm font-extrabold text-[var(--color-ink)] truncate">
                                          {model.name}
                                        </h3>
                                        {model.quantization && (
                                          <span className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-1.5 py-0.2 font-mono text-[9px] font-bold shrink-0">
                                            {model.quantization}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {isInstalled ? (
                                      <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold flex items-center gap-1 shrink-0">
                                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                                        Installed
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold shrink-0">
                                        GGUF
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-snug">
                                    {model.description}
                                  </p>

                                  {/* Specs Row */}
                                  <div className="flex items-center gap-2 mt-4 text-[11px] font-mono text-[var(--color-ink-muted)] flex-wrap">
                                    <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                                      {installedData ? `${(installedData.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : model.size}
                                    </span>
                                    <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                                      VRAM: {model.vram}
                                    </span>
                                    <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                                      {model.parameters}
                                    </span>
                                    {model.author && (
                                      <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5 font-bold">
                                        by {model.author}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-[var(--color-rule-subtle)] space-y-2">
                                  {/* Terminal Run Pill */}
                                  <div className="flex items-center justify-between rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2.5 py-1.5 text-[10.5px] font-mono text-[var(--color-ink)]">
                                    <span className="truncate">ollama run {model.id}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(`ollama run ${model.id}`, `term-${model.id}`)}
                                      className="hover:text-[var(--color-ink)] transition-colors cursor-pointer shrink-0 ml-2"
                                    >
                                      {copiedKey === `term-${model.id}` ? (
                                        <IconCheck size={13} className="text-neutral-900 dark:text-white" />
                                      ) : (
                                        <IconCopy size={13} />
                                      )}
                                    </button>
                                  </div>

                                  {/* Download / Active Actions */}
                                  {isPulling ? (
                                    <div className="space-y-1.5 p-2 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)]">
                                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink)]">
                                        <span className="truncate max-w-[170px]">{downloadStatus || 'Pulling GGUF layers...'}</span>
                                        <span className="font-bold">{downloadProgress}%</span>
                                      </div>
                                      <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                        <div
                                          className="h-full bg-neutral-900 dark:bg-white transition-all duration-200"
                                          style={{ width: `${downloadProgress}%` }}
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleCancelPull}
                                        className="w-full text-center text-[10px] font-mono text-[var(--color-ink-muted)] hover:text-red-500 transition-colors cursor-pointer pt-0.5"
                                      >
                                        Cancel Download
                                      </button>
                                    </div>
                                  ) : isInstalled ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedModel(model.id);
                                          setActiveTab('chat');
                                        }}
                                        className="flex-1 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                      >
                                        <IconPlayerPlay size={13} fill="currentColor" />
                                        <span>Launch</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleInspectModel(model.id)}
                                        className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                                        title="Inspect Model Architecture"
                                      >
                                        <IconInfoCircle size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setModelToDelete(model.id)}
                                        className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-1.5 text-xs text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer"
                                        title="Delete from Local Disk"
                                      >
                                        <IconTrash size={15} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handlePullModel(model.id)}
                                        className="flex-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] py-1.5 text-xs font-bold text-[var(--color-ink)] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                      >
                                        <IconDownload size={13} />
                                        <span>Pull to Ollama</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleInspectModel(model.id)}
                                        className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                                        title="Inspect Model Architecture"
                                      >
                                        <IconInfoCircle size={15} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  )}

                  {/* FULL CATALOG VIEW (Dynamic Live Hub Search) */}
                  {hfViewMode === 'full' && (
                    <div className="space-y-4">
                      {/* Search Bar + Controls */}
                      <div className="rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-4 sm:p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--color-ink)]">
                            <IconWorld size={16} />
                            <span>Live Hugging Face Hub Dynamic Search</span>
                          </div>
                          <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                            Filtered for GGUF quantization format
                          </span>
                        </div>

                        {/* Search Input Row */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            fetchHfLiveModels(hfLiveQuery, hfLiveSort);
                          }}
                          className="flex flex-col sm:flex-row items-center gap-2"
                        >
                          <div className="relative flex-1 w-full">
                            <IconSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                            <input
                              type="text"
                              value={hfLiveQuery}
                              onChange={(e) => setHfLiveQuery(e.target.value)}
                              placeholder="Search any model name or architecture e.g. deepseek, qwen, llama, mistral..."
                              className="w-full rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] pl-9 pr-3 py-2 text-xs font-mono text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-hidden"
                            />
                            {hfLiveQuery && (
                              <button
                                type="button"
                                onClick={() => {
                                  setHfLiveQuery('');
                                  fetchHfLiveModels('', hfLiveSort);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                              >
                                <IconX size={14} />
                              </button>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={isHfSearching}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2 text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                          >
                            {isHfSearching ? (
                              <IconRefresh size={14} className="animate-spin" />
                            ) : (
                              <IconSearch size={14} />
                            )}
                            <span>Search Hub</span>
                          </button>
                        </form>

                        {/* Sort Strip & Quick Tags */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-[var(--color-rule-subtle)]">
                          {/* Quick Trending Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--color-ink-muted)]">
                            <span className="font-mono text-[10.5px]">Trending topics:</span>
                            {[
                              { label: 'DeepSeek R1', q: 'deepseek-r1' },
                              { label: 'Llama 3.3', q: 'llama-3.3' },
                              { label: 'Qwen 2.5', q: 'qwen2.5' },
                              { label: 'Mistral', q: 'mistral' },
                              { label: 'Gemma 2', q: 'gemma-2' },
                              { label: 'Phi 3.5', q: 'phi-3.5' },
                              { label: 'SmolLM2', q: 'smollm2' },
                            ].map((tag) => (
                              <button
                                key={tag.q}
                                type="button"
                                onClick={() => {
                                  setHfLiveQuery(tag.q);
                                  fetchHfLiveModels(tag.q, hfLiveSort);
                                }}
                                className="rounded-lg bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] border border-[var(--color-rule-subtle)] px-2 py-0.5 text-[10.5px] font-mono text-[var(--color-ink)] transition-colors cursor-pointer"
                              >
                                {tag.label}
                              </button>
                            ))}
                          </div>

                          {/* Sort Options */}
                          <div className="flex items-center gap-1 self-start md:self-auto p-1 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] shrink-0">
                            {[
                              { id: 'downloads', label: 'Most Downloads', icon: IconDownload },
                              { id: 'trending', label: 'Trending', icon: IconTrendingUp },
                              { id: 'likes', label: 'Most Likes', icon: IconHeart },
                            ].map((s) => {
                              const IconComponent = s.icon;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    const nextSort = s.id as 'downloads' | 'trending' | 'likes';
                                    setHfLiveSort(nextSort);
                                    fetchHfLiveModels(hfLiveQuery, nextSort);
                                  }}
                                  className={cn(
                                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
                                    hfLiveSort === s.id
                                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-2xs'
                                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                                  )}
                                >
                                  <IconComponent size={12} />
                                  <span>{s.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Error notification */}
                      {hfSearchError && (
                        <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 flex items-center justify-between gap-3 text-xs text-neutral-800 dark:text-neutral-200">
                          <div className="flex items-center gap-2">
                            <IconAlertCircle size={16} />
                            <span>{hfSearchError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => fetchHfLiveModels(hfLiveQuery, hfLiveSort)}
                            className="px-3 py-1 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Loading State */}
                      {isHfSearching && (
                        <div className="p-12 text-center rounded-2xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] space-y-3">
                          <IconRefresh size={28} className="animate-spin mx-auto text-[var(--color-ink-muted)]" />
                          <p className="text-xs font-mono text-[var(--color-ink-muted)]">
                            Searching Hugging Face Hub for GGUF model repositories...
                          </p>
                        </div>
                      )}

                      {/* Results Grid */}
                      {!isHfSearching && hfLiveResults.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)] px-1">
                            <span>Showing {hfLiveResults.length} GGUF repositories</span>
                            <span>Sorted by {hfLiveSort}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {hfLiveResults.map((model) => {
                              const isInstalled = installedModels.some(
                                (im) =>
                                  im.name === model.ollamaTag ||
                                  `${im.name}:latest` === model.ollamaTag ||
                                  im.name === `${model.ollamaTag}:latest`
                              );
                              const isPulling = downloadingModelId === model.ollamaTag;

                              return (
                                <div
                                  key={model.id}
                                  className="flex flex-col justify-between rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xs transition-all space-y-4"
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-extrabold text-[var(--color-ink)] truncate" title={model.name}>
                                          {model.name}
                                        </h3>
                                        <span className="font-mono text-[10.5px] text-[var(--color-ink-muted)] block truncate mt-0.5">
                                          by {model.author}
                                        </span>
                                      </div>

                                      {isInstalled ? (
                                        <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold flex items-center gap-1 shrink-0">
                                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                                          Installed
                                        </span>
                                      ) : (
                                        <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold shrink-0">
                                          GGUF
                                        </span>
                                      )}
                                    </div>

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-[var(--color-ink-muted)] flex-wrap">
                                      <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5 flex items-center gap-1">
                                        <IconDownload size={11} />
                                        {(model.downloads || 0) >= 1000
                                          ? `${((model.downloads || 0) / 1000).toFixed(1)}k`
                                          : model.downloads || 0}
                                      </span>
                                      <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5 flex items-center gap-1">
                                        <IconHeart size={11} />
                                        {(model.likes || 0) >= 1000
                                          ? `${((model.likes || 0) / 1000).toFixed(1)}k`
                                          : model.likes || 0}
                                      </span>
                                      {model.updatedAt && (
                                        <span className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2 py-0.5">
                                          {new Date(model.updatedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                        </span>
                                      )}
                                    </div>

                                    {/* Tags row */}
                                    {model.tags && model.tags.length > 0 && (
                                      <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                                        {model.tags.slice(0, 3).map((t: string) => (
                                          <span
                                            key={t}
                                            className="rounded-md bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-1.5 py-0.5 text-[9.5px] font-mono text-[var(--color-ink-muted)]"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-3 border-t border-[var(--color-rule-subtle)] space-y-2">
                                    {/* Terminal Run Pill */}
                                    <div className="flex items-center justify-between rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] px-2.5 py-1.5 text-[10.5px] font-mono text-[var(--color-ink)]">
                                      <span className="truncate">ollama run {model.ollamaTag}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(`ollama run ${model.ollamaTag}`, `term-${model.id}`)}
                                        className="hover:text-[var(--color-ink)] transition-colors cursor-pointer shrink-0 ml-2"
                                      >
                                        {copiedKey === `term-${model.id}` ? (
                                          <IconCheck size={13} className="text-neutral-900 dark:text-white" />
                                        ) : (
                                          <IconCopy size={13} />
                                        )}
                                      </button>
                                    </div>

                                    {/* Download / Active Actions */}
                                    {isPulling ? (
                                      <div className="space-y-1.5 p-2 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)]">
                                        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink)]">
                                          <span className="truncate max-w-[170px]">{downloadStatus || 'Pulling GGUF layers...'}</span>
                                          <span className="font-bold">{downloadProgress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                          <div
                                            className="h-full bg-neutral-900 dark:bg-white transition-all duration-200"
                                            style={{ width: `${downloadProgress}%` }}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={handleCancelPull}
                                          className="w-full text-center text-[10px] font-mono text-[var(--color-ink-muted)] hover:text-red-500 transition-colors cursor-pointer pt-0.5"
                                        >
                                          Cancel Download
                                        </button>
                                      </div>
                                    ) : isInstalled ? (
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedModel(model.ollamaTag);
                                            setActiveTab('chat');
                                          }}
                                          className="flex-1 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                        >
                                          <IconPlayerPlay size={13} fill="currentColor" />
                                          <span>Launch</span>
                                        </button>
                                        <a
                                          href={`https://huggingface.co/${model.id}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                                          title="View on Hugging Face"
                                        >
                                          <IconExternalLink size={15} />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handlePullModel(model.ollamaTag)}
                                          className="flex-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] py-1.5 text-xs font-bold text-[var(--color-ink)] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                        >
                                          <IconDownload size={13} />
                                          <span>Pull to Ollama</span>
                                        </button>
                                        <a
                                          href={`https://huggingface.co/${model.id}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] p-1.5 text-xs text-[var(--color-ink)] transition-all cursor-pointer"
                                          title="View on Hugging Face"
                                        >
                                          <IconExternalLink size={15} />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {!isHfSearching && hasSearchedHf && hfLiveResults.length === 0 && !hfSearchError && (
                        <div className="p-12 text-center rounded-2xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] space-y-3">
                          <IconCube size={28} className="mx-auto text-[var(--color-ink-muted)]" />
                          <h4 className="text-sm font-bold text-[var(--color-ink)]">No GGUF Models Found</h4>
                          <p className="text-xs text-[var(--color-ink-muted)] max-w-sm mx-auto">
                            Try searching for common model families like `llama`, `deepseek`, `mistral`, or `qwen`.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: VISION & MULTIMODAL STUDIO (Phase 4) */}
          {activeTab === 'vision' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header & Vision Model Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-rule-subtle)] pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--color-ink)]">
                    Vision & OCR Multimodal Studio
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    Inspect images, analyze foliar plant symptoms, transcribe receipts & tables, or explain schematics using local Ollama vision models.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Active Vision Model Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-mono text-[var(--color-ink-muted)] shrink-0">
                      Model:
                    </label>
                    <div className="relative">
                      <select
                        value={visionSelectedModel}
                        onChange={(e) => setVisionSelectedModel(e.target.value)}
                        className="appearance-none rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 pr-8 text-xs font-mono font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                      >
                        {installedModels.length > 0 && (
                          <optgroup label="Installed Local Models">
                            {installedModels.map((im) => (
                              <option key={im.name} value={im.name}>
                                {im.name} • Local
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Recommended Vision Models">
                          <option value="llava:7b">llava:7b (4.7 GB)</option>
                          <option value="llama3.2-vision:11b">llama3.2-vision:11b (7.9 GB)</option>
                          <option value="moondream:latest">moondream:latest (1.6 GB Compact)</option>
                        </optgroup>
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Pull button if selected vision model is not installed yet */}
                  {!installedModels.some(
                    (m) =>
                      m.name === visionSelectedModel ||
                      m.name.startsWith(visionSelectedModel.split(':')[0])
                  ) && (
                    <button
                      type="button"
                      disabled={downloadingModelId === visionSelectedModel}
                      onClick={() => handlePullModel(visionSelectedModel)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      {downloadingModelId === visionSelectedModel ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                          <span>Downloading {downloadProgress > 0 ? `${downloadProgress}%` : ''}</span>
                        </>
                      ) : (
                        <>
                          <IconDownload size={13} />
                          <span>Pull {visionSelectedModel}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Daemon Offline Notice if applicable */}
              {connectionStatus !== 'connected' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
                  <div className="flex items-center gap-2.5 text-xs font-semibold">
                    <IconAlertCircle size={16} className="shrink-0" />
                    <span>Ollama daemon is currently offline. Start the engine to run local vision inference.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartOllama}
                    disabled={isStartingDaemon}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
                  >
                    {isStartingDaemon ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-900 animate-ping" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <IconPlayerPlay size={13} />
                        <span>Start Ollama Engine</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Main 2-Column Studio Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (5 cols): Image Input & Presets */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Drag & Drop Zone / Image Preview */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={handleImageDrop}
                    className={cn(
                      'relative rounded-2xl border-2 transition-all p-4 text-center flex flex-col items-center justify-center min-h-[260px] bg-[var(--color-paper-card)]',
                      isDraggingImage
                        ? 'border-neutral-900 dark:border-white bg-[var(--color-paper-surface)]'
                        : 'border-dashed border-[var(--color-rule-strong)]'
                    )}
                  >
                    <input
                      ref={visionFileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/gif, image/bmp"
                      className="hidden"
                      onChange={handleImageInputChange}
                    />

                    {visionImagePreview ? (
                      <div className="w-full space-y-3">
                        <div className="relative rounded-xl overflow-hidden border border-[var(--color-rule-subtle)] bg-neutral-950 flex items-center justify-center max-h-64">
                          <img
                            src={visionImagePreview}
                            alt="Upload Preview"
                            className="max-h-64 w-auto object-contain"
                          />
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-900 text-white backdrop-blur-md cursor-pointer transition-all"
                            title="Remove image"
                          >
                            <IconX size={15} />
                          </button>
                        </div>

                        {visionImageMeta && (
                          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-ink-muted)] px-1">
                            <span className="truncate max-w-[180px] font-semibold text-[var(--color-ink)]">
                              {visionImageMeta.name}
                            </span>
                            <span>
                              {visionImageMeta.dimensions && `${visionImageMeta.dimensions} • `}
                              {visionImageMeta.size}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => visionFileInputRef.current?.click()}
                          className="w-full py-1.5 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] text-xs font-semibold text-[var(--color-ink)] transition-all cursor-pointer"
                        >
                          Replace Image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 py-6">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700">
                          <IconUpload size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--color-ink)]">
                            Drag and drop an image here
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                            PNG, JPG, or WebP (auto-scaled client-side)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => visionFileInputRef.current?.click()}
                          className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                        >
                          Select Photo
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Sample Image Loaders */}
                  <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">
                        Or Try a 1-Click Sample
                      </span>
                      <span className="text-[10px] text-[var(--color-ink-muted)]">Instant Preview</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadSample('foliar')}
                        className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] hover:border-[var(--color-rule-strong)] text-left transition-all cursor-pointer group"
                      >
                        <span className="text-base block mb-1">🌿</span>
                        <span className="text-[11px] font-bold text-[var(--color-ink)] block leading-tight">
                          Citrus Leaf
                        </span>
                        <span className="text-[9px] font-mono text-[var(--color-ink-muted)] block mt-0.5">
                          Pathology
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadSample('receipt')}
                        className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] hover:border-[var(--color-rule-strong)] text-left transition-all cursor-pointer group"
                      >
                        <span className="text-base block mb-1">📄</span>
                        <span className="text-[11px] font-bold text-[var(--color-ink)] block leading-tight">
                          Receipt
                        </span>
                        <span className="text-[9px] font-mono text-[var(--color-ink-muted)] block mt-0.5">
                          Table OCR
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadSample('schematic')}
                        className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] hover:border-[var(--color-rule-strong)] text-left transition-all cursor-pointer group"
                      >
                        <span className="text-base block mb-1">🔌</span>
                        <span className="text-[11px] font-bold text-[var(--color-ink)] block leading-tight">
                          ESP32 Circuit
                        </span>
                        <span className="text-[9px] font-mono text-[var(--color-ink-muted)] block mt-0.5">
                          Schematic
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column (7 cols): Prompt, Presets, and Streaming Analysis Output */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Prompt Configuration Card */}
                  <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 space-y-3.5">
                    {/* Preset Buttons */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[var(--color-ink)] block">
                        Quick Inspection Presets:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          {
                            label: '🌿 Leaf Pathology',
                            prompt:
                              'Analyze this leaf image carefully. Identify the plant species if possible, diagnose any visible disease, chlorotic halos, or fungal lesions, and provide actionable organic treatment advice.',
                          },
                          {
                            label: '📄 Document OCR',
                            prompt:
                              'Extract all visible text from this document image. Preserve table structures, headings, line items, and transcribe them into clean GitHub-flavored Markdown.',
                          },
                          {
                            label: '🔌 Circuit Schematic',
                            prompt:
                              'Examine this circuit diagram. Explain the wiring between components, verify pinout connections, and highlight any potential design issues.',
                          },
                          {
                            label: '🔍 Detailed VQA',
                            prompt:
                              'Provide a comprehensive visual description of this image, detailing key subjects, spatial arrangements, lighting, and anomalies.',
                          },
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setVisionPrompt(p.prompt)}
                            className="rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1 text-[11px] font-medium text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prompt Textarea */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--color-ink)] block mb-1">
                        Visual Question / Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={visionPrompt}
                        onChange={(e) => setVisionPrompt(e.target.value)}
                        placeholder="Ask anything about the uploaded image..."
                        className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] focus:outline-hidden leading-relaxed"
                      />
                    </div>

                    {/* Action Trigger */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                        {visionImageBase64 ? 'Ready to analyze' : 'Upload an image to start'}
                      </div>

                      {isAnalyzingVision ? (
                        <button
                          type="button"
                          onClick={handleStopVision}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                        >
                          <IconPlayerStop size={14} />
                          <span>Stop Generation</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRunVisionAnalysis}
                          disabled={!visionImageBase64}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 shadow-2xs"
                        >
                          <IconPlayerPlay size={14} />
                          <span>Run Local Vision Analysis</span>
                        </button>
                      )}
                    </div>

                    {/* Vision Error Notice if any */}
                    {visionError && (
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3 text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-2">
                        <IconAlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold">{visionError}</p>
                          {visionError.includes('text-only') && (
                            <button
                              type="button"
                              onClick={() => handlePullModel('llava:7b')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold underline cursor-pointer"
                            >
                              Click to pull LLaVA 7B Vision Model &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vision Analysis Streaming Output Console */}
                  <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 space-y-3 min-h-[240px] flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--color-ink)]">
                          Local Visual Reasoning Output
                        </span>
                        {isAnalyzingVision && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--color-ink-muted)] animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                            <span>Streaming tokens...</span>
                          </span>
                        )}
                      </div>

                      {visionResult && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(visionResult, 'vision-result')}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                          >
                            {copiedKey === 'vision-result' ? <IconCheck size={12} /> : <IconCopy size={12} />}
                            <span>{copiedKey === 'vision-result' ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleExportVision}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                          >
                            <IconFileExport size={12} />
                            <span>Export .md</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto text-xs text-[var(--color-ink)] leading-relaxed space-y-2">
                      {visionResult ? (
                        <FormattedMessage
                          content={visionResult}
                          messageId="vision-active-result"
                          copiedKey={copiedKey}
                          onCopy={handleCopy}
                        />
                      ) : isAnalyzingVision ? (
                        <div className="flex items-center justify-center py-12 text-xs font-mono text-[var(--color-ink-muted)] gap-2">
                          <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                          <span>Processing image tensors and generating visual explanation...</span>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-xs font-mono text-[var(--color-ink-muted)] space-y-1">
                          <p>No analysis run yet.</p>
                          <p className="text-[11px]">
                            Select an image or sample, configure your prompt, and click &quot;Run Local Vision Analysis&quot;.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: RAG & KNOWLEDGE DOCUMENTS (Phase 5) */}
          {activeTab === 'rag' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header & Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-rule-subtle)] pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--color-ink)]">
                    RAG & Knowledge Documents Studio
                  </h2>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    Ground local AI inference in private documents, technical datasheets, and code files with 100% offline semantic retrieval.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddDocModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                  >
                    <IconPlus size={14} />
                    <span>Add Document</span>
                  </button>
                </div>
              </div>

              {/* Daemon Offline Notice if applicable */}
              {connectionStatus !== 'connected' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
                  <div className="flex items-center gap-2.5 text-xs font-semibold">
                    <IconAlertCircle size={16} className="shrink-0" />
                    <span>Ollama daemon is currently offline. Start the engine to generate grounded answers.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartOllama}
                    disabled={isStartingDaemon}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
                  >
                    {isStartingDaemon ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-900 animate-ping" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <IconPlayerPlay size={13} />
                        <span>Start Ollama Engine</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* RAG Model Configuration & Hardware Recommendations */}
              <div className="p-4 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Embedding Model Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[var(--color-ink)] flex items-center gap-1.5">
                        <IconLayersLinked size={15} className="text-[var(--color-ink-muted)]" />
                        <span>Embedding Model (Semantic Vectors)</span>
                      </label>
                      <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                        Local Dense Retrieval
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={ragEmbeddingModel}
                          onChange={(e) => setRagEmbeddingModel(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 pr-8 text-xs font-mono font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                        >
                          {installedModels.filter(m => m.name.includes('embed') || m.name.includes('minilm') || m.name.includes('bge')).length > 0 && (
                            <optgroup label="Installed Local Embedders">
                              {installedModels.filter(m => m.name.includes('embed') || m.name.includes('minilm') || m.name.includes('bge')).map(im => (
                                <option key={im.name} value={im.name}>
                                  {im.name} • Local
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="4 GB RAM Budget (Fast & Lightweight)">
                            <option value="nomic-embed-text">nomic-embed-text (274 MB • 8k ctx • Rec. 4GB)</option>
                            <option value="all-minilm">all-minilm (45 MB • Ultra Light)</option>
                          </optgroup>
                          <optgroup label="8 GB RAM Budget (Balanced & Multilingual)">
                            <option value="bge-m3">bge-m3 (1.2 GB • 8k Multilingual • Rec. 8GB)</option>
                            <option value="mxbai-embed-large">mxbai-embed-large (670 MB • Search Optimized)</option>
                          </optgroup>
                          <optgroup label="16 GB+ RAM Budget (Frontier Precision)">
                            <option value="snowflake-arctic-embed2">snowflake-arctic-embed2 (1.2 GB • Rec. 16GB)</option>
                          </optgroup>
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[10px]">
                          ▼
                        </div>
                      </div>

                      {/* Pull Button for Selected Embedding Model */}
                      {!installedModels.some(m => m.name === ragEmbeddingModel || m.name.startsWith(ragEmbeddingModel.split(':')[0])) && (
                        <button
                          type="button"
                          disabled={downloadingModelId === ragEmbeddingModel}
                          onClick={() => handlePullModel(ragEmbeddingModel)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
                        >
                          {downloadingModelId === ragEmbeddingModel ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                              <span>Downloading {downloadProgress > 0 ? `${downloadProgress}%` : ''}</span>
                            </>
                          ) : (
                            <>
                              <IconDownload size={13} />
                              <span>Pull {ragEmbeddingModel.split(':')[0]}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Synthesis LLM Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[var(--color-ink)] flex items-center gap-1.5">
                        <IconCpu size={15} className="text-[var(--color-ink-muted)]" />
                        <span>Synthesis LLM (Grounded Answer)</span>
                      </label>
                      <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                        Local Reasoning Engine
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 pr-8 text-xs font-mono font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                      >
                        {installedModels.filter(m => !m.name.includes('embed') && !m.name.includes('minilm')).length > 0 && (
                          <optgroup label="Installed Local LLMs">
                            {installedModels.filter(m => !m.name.includes('embed') && !m.name.includes('minilm')).map((im) => (
                              <option key={im.name} value={im.name}>
                                {im.name} • Local
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Recommended Synthesis by RAM">
                          <option value="llama3.2:1b">llama3.2:1b (1.3 GB • Rec. 4GB RAM)</option>
                          <option value="llama3.2:3b">llama3.2:3b (2.0 GB • Rec. 4-8GB RAM)</option>
                          <option value="qwen2.5:7b">qwen2.5:7b (4.7 GB • Rec. 8GB RAM)</option>
                          <option value="llama3.1:8b">llama3.1:8b (4.9 GB • Rec. 8-16GB RAM)</option>
                          <option value="qwen2.5:14b">qwen2.5:14b (9.0 GB • Rec. 16GB+ RAM)</option>
                        </optgroup>
                      </select>
                      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specs Budget Recommendations Guide Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-rule-subtle)] text-[10.5px]">
                  <span className="font-mono font-bold text-[var(--color-ink-muted)]">Specs Guide:</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-mono">
                    4GB RAM: nomic-embed + llama3.2:1b
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-mono">
                    8GB RAM: bge-m3 + qwen2.5:7b
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-mono">
                    16GB+ RAM: bge-m3 / arctic + qwen2.5:14b
                  </span>
                </div>
              </div>

              {/* Main 2-Column Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (5 cols): Uploaded Documents & Active Selection */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconDatabase size={16} className="text-[var(--color-ink)]" />
                        <h3 className="text-xs font-bold text-[var(--color-ink)]">
                          Document Sources ({selectedDocIds.length}/{indexedDocs.length} Selected)
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          ref={docFileInputRef}
                          type="file"
                          accept=".pdf,.docx,.pptx,.txt,.md,.markdown,.json,.csv,.py,.ts,.tsx,.js,.cpp,.h,.log"
                          className="hidden"
                          onChange={handleDocFileUpload}
                        />
                        <button
                          type="button"
                          disabled={isParsingDoc}
                          onClick={() => docFileInputRef.current?.click()}
                          className="text-[11px] font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer disabled:opacity-50"
                        >
                          {isParsingDoc ? (parseStatusText || 'Parsing...') : 'Upload'}
                        </button>
                        {indexedDocs.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={handleToggleAllDocs}
                              className="text-[11px] font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer ml-1"
                            >
                              {selectedDocIds.length === indexedDocs.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <button
                              type="button"
                              onClick={handleClearAllDocs}
                              className="text-[11px] font-mono text-[var(--color-ink-muted)] hover:text-red-500 cursor-pointer ml-1"
                            >
                              Clear
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Document Selection List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {indexedDocs.length === 0 ? (
                        <div className="p-5 rounded-xl border border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] text-center space-y-3">
                          <div className="flex justify-center">
                            <div className="p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                              <IconUpload size={20} />
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[var(--color-ink)]">No documents uploaded yet</p>
                            <p className="text-[10.5px] font-mono text-[var(--color-ink-muted)] mt-1">
                              Upload PDF, Word (.docx), PowerPoint (.pptx), or text files to select and query with local RAG.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => docFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                          >
                            <IconPlus size={13} />
                            <span>Upload Document</span>
                          </button>
                        </div>
                      ) : (
                        indexedDocs.map((doc) => {
                          const isSelected = selectedDocIds.includes(doc.id);
                          return (
                            <div
                              key={doc.id}
                              onClick={() => handleToggleDocSelection(doc.id)}
                              className={cn(
                                'flex items-center justify-between p-2.5 rounded-xl border text-xs group transition-all cursor-pointer select-none',
                                isSelected
                                  ? 'bg-[var(--color-paper-surface)] border-neutral-900 dark:border-white ring-1 ring-neutral-900/10 dark:ring-white/10'
                                  : 'bg-[var(--color-paper-surface)]/60 border-[var(--color-rule-subtle)] opacity-60 hover:opacity-100'
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleDocSelection(doc.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded accent-neutral-900 dark:accent-white shrink-0 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={cn('font-semibold block truncate', isSelected ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]')}>
                                      {doc.name}
                                    </span>
                                    {doc.name.toLowerCase().includes('.pdf') && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shrink-0">
                                        PDF
                                      </span>
                                    )}
                                    {doc.name.toLowerCase().includes('.docx') && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shrink-0">
                                        DOCX
                                      </span>
                                    )}
                                    {doc.name.toLowerCase().includes('.pptx') && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shrink-0">
                                        PPTX
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">
                                    {doc.chunks.length} chunks • {(doc.size / 1024).toFixed(1)} KB • {isSelected ? 'Active' : 'Excluded'}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDoc(doc.id);
                                }}
                                className="p-1 rounded-md text-[var(--color-ink-muted)] hover:text-red-500 hover:bg-[var(--color-paper-muted)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                                title="Delete document"
                              >
                                <IconTrash size={14} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column (7 cols): Semantic Query & Grounded Answer */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Query Input Card */}
                  <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 space-y-3.5">
                    {/* Query Input Bar */}
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={ragQuery}
                          onChange={(e) => setRagQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAskRag();
                          }}
                          placeholder="Search or ask a question across all indexed documents..."
                          className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] pl-3 pr-20 py-2.5 text-xs text-[var(--color-ink)] focus:outline-hidden"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleExecuteRetrieval(ragQuery)}
                            disabled={isSearchingRag || !ragQuery.trim()}
                            className="p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer disabled:opacity-40"
                            title="Semantic Search Only"
                          >
                            <IconSearch size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-ink-muted)]">
                          <span>
                            Model: <strong className="text-[var(--color-ink)]">{selectedModel}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleExecuteRetrieval(ragQuery);
                              setRagViewMode('chunks');
                            }}
                            disabled={!ragQuery.trim() || indexedDocs.length === 0}
                            className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer disabled:opacity-40"
                          >
                            <IconSearch size={13} />
                            <span>Retrieve Chunks</span>
                          </button>

                          {isGeneratingRagAnswer ? (
                            <button
                              type="button"
                              onClick={handleStopRagGeneration}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                            >
                              <IconPlayerStop size={13} />
                              <span>Stop</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAskRag()}
                              disabled={!ragQuery.trim() || indexedDocs.length === 0}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 shadow-2xs"
                            >
                              <IconSparkles size={13} />
                              <span>Ask Grounded AI</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results Display Console */}
                  <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-4 sm:p-5 space-y-3 min-h-[260px] flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] p-0.5">
                          <button
                            type="button"
                            onClick={() => setRagViewMode('answer')}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                              ragViewMode === 'answer'
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                            )}
                          >
                            Grounded Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => setRagViewMode('chunks')}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
                              ragViewMode === 'chunks'
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                            )}
                          >
                            <span>Retrieved Context</span>
                            {ragRetrievalResults.length > 0 && (
                              <span className="h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] inline-flex items-center justify-center font-mono">
                                {ragRetrievalResults.length}
                              </span>
                            )}
                          </button>
                        </div>

                        {isGeneratingRagAnswer && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--color-ink-muted)] animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                            <span>Synthesizing...</span>
                          </span>
                        )}
                      </div>

                      {ragAnswer && ragViewMode === 'answer' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(ragAnswer, 'rag-answer')}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                          >
                            {copiedKey === 'rag-answer' ? <IconCheck size={12} /> : <IconCopy size={12} />}
                            <span>{copiedKey === 'rag-answer' ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleExportRagReport}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                          >
                            <IconFileExport size={12} />
                            <span>Export .md</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto text-xs text-[var(--color-ink)] leading-relaxed space-y-3">
                      {ragViewMode === 'answer' ? (
                        ragAnswer ? (
                          <FormattedMessage
                            content={ragAnswer}
                            messageId="rag-active-answer"
                            copiedKey={copiedKey}
                            onCopy={handleCopy}
                          />
                        ) : isGeneratingRagAnswer ? (
                          <div className="flex items-center justify-center py-12 text-xs font-mono text-[var(--color-ink-muted)] gap-2">
                            <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                            <span>Retrieving vector context and generating grounded answer...</span>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-xs font-mono text-[var(--color-ink-muted)] space-y-1">
                            <p>No grounded query executed yet.</p>
                            <p className="text-[11px]">
                              Ask a question or select a starter prompt to synthesize answers with citations.
                            </p>
                          </div>
                        )
                      ) : (
                        /* CHUNKS VIEW */
                        ragRetrievalResults.length > 0 ? (
                          <div className="space-y-3">
                            {ragRetrievalResults.map((result) => (
                              <div
                                key={result.chunk.id}
                                className="p-3 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <div className="flex items-center gap-1.5 font-bold text-[var(--color-ink)] truncate max-w-[280px]">
                                    <IconFileText size={13} className="shrink-0 text-[var(--color-ink-muted)]" />
                                    <span>{result.chunk.documentName}</span>
                                    <span className="text-[10px] text-[var(--color-ink-muted)] font-normal">
                                      (Chunk #{result.chunk.chunkIndex})
                                    </span>
                                  </div>
                                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-[10px] font-bold">
                                    {(result.score * 100).toFixed(1)}% Match
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-[var(--color-paper-card)] border border-[var(--color-rule-subtle)] font-mono text-[11px] text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
                                  {result.chunk.text}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-xs font-mono text-[var(--color-ink-muted)] space-y-1">
                            <p>No retrieved chunks to display.</p>
                            <p className="text-[11px]">Click &quot;Retrieve Chunks&quot; to inspect matching excerpts.</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: ENGINE & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Engine & Daemon Settings</h2>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  Configure local Ollama connection endpoints, context window length, and inference hyperparameters.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-card)] p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-ink)]">Ollama Local API Endpoint</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      className="flex-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('resursee_ollama_endpoint', endpoint);
                        refreshConnection(endpoint);
                      }}
                      className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                      {isCheckingConnection ? 'Connecting...' : 'Save & Refresh'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    Default port for Ollama daemon on macOS, Linux, and Windows.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-rule-subtle)]">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-ink)]">Temperature (Creativity vs Determinism)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
                      <span>0.0 (Strict Logic)</span>
                      <span className="font-bold text-[var(--color-ink)]">{temperature.toFixed(2)}</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-ink)]">Context Token Limit</label>
                    <select
                      value={numCtx.toString()}
                      onChange={(e) => setNumCtx(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden cursor-pointer"
                    >
                      <option value="2048">2,048 Tokens (Low Memory)</option>
                      <option value="4096">4,096 Tokens (Standard)</option>
                      <option value="8192">8,192 Tokens (Extended)</option>
                      <option value="16384">16,384 Tokens (Max VRAM)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-rule-subtle)]">
                  <label className="text-xs font-bold text-[var(--color-ink)]">Global System Prompt</label>
                  <textarea
                    rows={3}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 🚀 How to Run DomoDomo / Resursee AI Hub Locally Modal */}
      <AnimatePresence>
        {isSetupModalOpen && (
          <div
            onClick={() => setIsSetupModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
                    <IconTerminal2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-ink)]">
                      How to Run Resursee AI Hub Locally
                    </h3>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      Zero server egress • 100% private offline compute
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSetupModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Instructions List */}
              <div className="space-y-3 font-mono text-xs">
                {/* 1-Click Fast Start Card */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 space-y-2 text-neutral-800 dark:text-neutral-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <IconPlayerPlay size={16} />
                      <span>Already have Ollama installed?</span>
                    </div>
                    {connectionStatus === 'connected' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await handleStopOllama();
                        }}
                        disabled={isStoppingDaemon}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isStoppingDaemon ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                            <span>Stopping...</span>
                          </>
                        ) : (
                          <>
                            <IconPlayerStop size={13} />
                            <span>Stop Ollama</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          await handleStartOllama();
                        }}
                        disabled={isStartingDaemon}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isStartingDaemon ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-900 animate-ping" />
                            <span>Starting...</span>
                          </>
                        ) : (
                          <>
                            <IconPlayerPlay size={13} />
                            <span>Start Ollama</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-muted)] font-sans">
                    Resursee can automatically launch your local Ollama background daemon on your machine without opening the terminal.
                  </p>
                </div>

                {/* Step 1 */}
                <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--color-ink)]">
                      STEP 1: Install Ollama Engine (macOS, Windows, Linux)
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-[var(--color-ink-muted)]">
                    Run the terminal command below or download the standalone installer from ollama.com:
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-950 text-neutral-100 p-2 text-[11px]">
                    <code>curl -fsSL https://ollama.com/install.sh</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('curl -fsSL https://ollama.com/install.sh', 'step-1')}
                      className="text-neutral-400 hover:text-white cursor-pointer ml-2"
                    >
                      {copiedKey === 'step-1' ? <IconCheck size={13} className="text-white" /> : <IconCopy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 space-y-2">
                  <span className="font-bold text-[var(--color-ink)]">
                    STEP 2: Pull & Start a Local Model
                  </span>
                  <p className="font-sans text-[11px] text-[var(--color-ink-muted)]">
                    Launch your model in terminal to initialize the background REST daemon:
                  </p>
                  <div className="space-y-1.5 rounded-lg bg-neutral-950 text-neutral-100 p-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <code>ollama run llama3.2:1b # Text & Tools</code>
                      <button
                        type="button"
                        onClick={() => handleCopy('ollama run llama3.2:1b', 'step-2a')}
                        className="text-neutral-400 hover:text-white cursor-pointer ml-2"
                      >
                        {copiedKey === 'step-2a' ? <IconCheck size={13} className="text-white" /> : <IconCopy size={13} />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-800 pt-1.5">
                      <code>ollama run llava:7b # Vision & OCR</code>
                      <button
                        type="button"
                        onClick={() => handleCopy('ollama run llava:7b', 'step-2b')}
                        className="text-neutral-400 hover:text-white cursor-pointer ml-2"
                      >
                        {copiedKey === 'step-2b' ? <IconCheck size={13} className="text-white" /> : <IconCopy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 space-y-2">
                  <span className="font-bold text-[var(--color-ink)]">
                    STEP 3: Run Resursee Development Server
                  </span>
                  <p className="font-sans text-[11px] text-[var(--color-ink-muted)]">
                    Launch Resursee so the browser shares the localhost origin with Ollama:
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-neutral-950 text-neutral-100 p-2 text-[11px]">
                    <code>npm run dev</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('npm run dev', 'step-3')}
                      className="text-neutral-400 hover:text-white cursor-pointer ml-2"
                    >
                      {copiedKey === 'step-3' ? <IconCheck size={13} className="text-white" /> : <IconCopy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-3.5 space-y-1">
                  <span className="font-bold text-[var(--color-ink)]">
                    STEP 4: Open Local AI Hub
                  </span>
                  <p className="font-sans text-[11px] text-[var(--color-ink-muted)]">
                    Open <code className="font-bold text-[var(--color-ink)]">http://localhost:3000/apps/ai-hub</code> with zero cloud data transfer!
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSetupModalOpen(false)}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  Got It, Let&apos;s Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💬 Conversation Sessions Drawer Modal (Phase 2) */}
      <AnimatePresence>
        {isSessionDrawerOpen && (
          <div
            onClick={() => setIsSessionDrawerOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconHistory size={18} className="text-[var(--color-ink)]" />
                  <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Saved Conversations</h3>
                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-[10px] font-mono font-bold">
                    {sessions.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSessionDrawerOpen(false)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleNewChat();
                  setIsSessionDrawerOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-2 text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                <IconPlus size={15} />
                <span>Start New Conversation</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    className={cn(
                      'group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left',
                      sess.id === currentSessionId
                        ? 'border-neutral-900 dark:border-white bg-[var(--color-paper-surface)] shadow-2xs'
                        : 'border-[var(--color-rule-subtle)] bg-[var(--color-paper-card)] hover:border-[var(--color-rule-strong)] hover:bg-[var(--color-paper-muted)]'
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--color-ink)] truncate">
                          {sess.title}
                        </span>
                        {sess.id === currentSessionId && (
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-ink-muted)] mt-0.5">
                        <span>{sess.model || selectedModel}</span>
                        <span>•</span>
                        <span>{sess.messages.length} msgs</span>
                        <span>•</span>
                        <span>{new Date(sess.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer"
                      title="Delete Session"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚙️ Dynamic Inference Parameters Modal (Phase 2) */}
      <AnimatePresence>
        {isParametersModalOpen && (
          <div
            onClick={() => setIsParametersModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconAdjustmentsHorizontal size={18} className="text-[var(--color-ink)]" />
                  <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Inference Parameters</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsParametersModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-4 text-left text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[var(--color-ink)]">Temperature (Creativity)</label>
                    <span className="font-mono font-bold text-[var(--color-ink)]">{temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
                    <span>0.0 (Strict / Code)</span>
                    <span>0.7 (Balanced)</span>
                    <span>1.0 (Creative)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--color-ink)]">Context Token Window</label>
                  <select
                    value={numCtx.toString()}
                    onChange={(e) => setNumCtx(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--color-ink)] focus:outline-hidden cursor-pointer"
                  >
                    <option value="2048">2,048 Tokens (Low Memory)</option>
                    <option value="4096">4,096 Tokens (Standard)</option>
                    <option value="8192">8,192 Tokens (Extended)</option>
                    <option value="16384">16,384 Tokens (Max VRAM)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[var(--color-ink)]">System Prompt</label>
                    <button
                      type="button"
                      onClick={() =>
                        setSystemPrompt(
                          'You are a private, offline intelligence engine integrated into Resursee. Provide concise, factual, and direct answers without unnecessary filler.'
                        )
                      }
                      className="text-[10px] font-mono text-[var(--color-ink-muted)] hover:underline cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-2.5 text-xs text-[var(--color-ink)] focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsParametersModalOpen(false)}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🗑️ Delete Model Confirmation Modal (Phase 3) */}
      <AnimatePresence>
        {modelToDelete && (
          <div
            onClick={() => setModelToDelete(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle size={18} className="text-neutral-800 dark:text-neutral-200" />
                  <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Delete Model from Disk</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModelToDelete(null)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[var(--color-ink-muted)]">
                <p>
                  Are you sure you want to permanently delete <strong className="text-[var(--color-ink)] font-mono">{modelToDelete}</strong> from local Ollama storage?
                </p>
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3 text-[11px] text-neutral-800 dark:text-neutral-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Local Storage Deletion</span>
                  </div>
                  <p>
                    This will delete the model weights from your machine disk and free up space. You can re-download this model anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setModelToDelete(null)}
                  className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] px-4 py-1.5 text-xs font-bold text-[var(--color-ink)] cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteModel}
                  disabled={isDeleting}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <IconTrash size={13} />
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔍 Model Architecture & Quantization Inspector Modal (Phase 3) */}
      <AnimatePresence>
        {inspectingModel && (
          <div
            onClick={() => setInspectingModel(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4 text-left max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconCpu size={18} className="text-[var(--color-ink)]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Model Architecture & Weights</h3>
                    <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{inspectingModel}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingModel(null)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {isLoadingInspect ? (
                  <div className="flex items-center justify-center py-12 text-xs font-mono text-[var(--color-ink-muted)] gap-2 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white animate-ping" />
                    <span>Querying local Ollama daemon for Modelfile and GGUF parameters...</span>
                  </div>
                ) : inspectData?.error ? (
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 space-y-2 text-neutral-800 dark:text-neutral-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <IconInfoCircle size={15} />
                      <span>Model Not Yet Cached Locally</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Detailed GGUF tensor layers, Modelfile templates, and architecture parameters become inspectable once the model is pulled to your machine.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const tag = inspectingModel;
                          setInspectingModel(null);
                          handlePullModel(tag);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                      >
                        <IconDownload size={13} />
                        <span>Pull {inspectingModel} to Inspect</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Technical Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block">Format</span>
                        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{inspectData?.details?.format || 'GGUF'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block">Family</span>
                        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{inspectData?.details?.family || 'Transformer'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block">Parameters</span>
                        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{inspectData?.details?.parameter_size || 'N/A'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-paper-surface)] border border-[var(--color-rule-subtle)] space-y-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase block">Quantization</span>
                        <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{inspectData?.details?.quantization_level || 'Q4_K_M'}</span>
                      </div>
                    </div>

                    {/* Modelfile & Template Viewer */}
                    {inspectData?.modelfile && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-[var(--color-ink)]">Modelfile Blueprint</label>
                          <button
                            type="button"
                            onClick={() => handleCopy(inspectData.modelfile, 'inspect-modelfile')}
                            className="text-[10px] font-mono text-[var(--color-ink-muted)] hover:underline cursor-pointer"
                          >
                            {copiedKey === 'inspect-modelfile' ? 'Copied' : 'Copy Modelfile'}
                          </button>
                        </div>
                        <div className="rounded-xl border border-[var(--color-rule-strong)] bg-neutral-950 text-neutral-100 p-3 font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed">
                          <pre>{inspectData.modelfile}</pre>
                        </div>
                      </div>
                    )}

                    {/* Parameters Text */}
                    {inspectData?.parameters && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-[var(--color-ink)]">Inference Parameters</label>
                        <div className="rounded-xl border border-[var(--color-rule-strong)] bg-neutral-950 text-neutral-100 p-3 font-mono text-[11px] overflow-x-auto">
                          <pre>{inspectData.parameters}</pre>
                        </div>
                      </div>
                    )}

                    {/* License snippet */}
                    {inspectData?.license && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-[var(--color-ink)]">Model License</label>
                        <div className="rounded-xl border border-[var(--color-rule-subtle)] bg-[var(--color-paper-surface)] p-2.5 text-[10.5px] font-mono text-[var(--color-ink-muted)] max-h-24 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">{inspectData.license.slice(0, 500)}...</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setInspectingModel(null)}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📄 Add Document Modal (Phase 5) */}
      <AnimatePresence>
        {isAddDocModalOpen && (
          <div
            onClick={() => setIsAddDocModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-5 shadow-2xl space-y-4 text-left max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-rule-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <IconFileText size={18} className="text-[var(--color-ink)]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--color-ink)]">Add Knowledge Document</h3>
                    <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">
                      Indexed locally for semantic RAG retrieval (0 bytes uploaded)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                {/* File Upload Trigger */}
                <div className="p-4 rounded-xl border border-dashed border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] transition-all text-center space-y-2.5">
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt,.md,.markdown,.json,.csv,.py,.ts,.tsx,.js,.cpp,.h,.log"
                    onChange={handleDocFileUpload}
                    className="hidden"
                  />
                  <div className="flex justify-center">
                    <div className="p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                      <IconUpload size={20} className={isParsingDoc ? 'animate-pulse' : ''} />
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      disabled={isParsingDoc}
                      onClick={() => docFileInputRef.current?.click()}
                      className="font-bold text-xs text-[var(--color-ink)] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isParsingDoc ? (parseStatusText || 'Extracting text...') : 'Choose file to index'}
                    </button>
                    <p className="text-[10.5px] font-mono text-[var(--color-ink-muted)] mt-0.5">
                      Extracts text directly in your browser. Zero cloud upload.
                    </p>
                  </div>

                  {/* Format badges */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 text-[9.5px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      PDF (.pdf)
                    </span>
                    <span className="px-2 py-0.5 text-[9.5px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      Word (.docx)
                    </span>
                    <span className="px-2 py-0.5 text-[9.5px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      PowerPoint (.pptx)
                    </span>
                    <span className="px-2 py-0.5 text-[9.5px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      Markdown (.md)
                    </span>
                    <span className="px-2 py-0.5 text-[9.5px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      Code &amp; TXT
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--color-rule-subtle)]" />
                  <span className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase">or paste text</span>
                  <div className="h-px flex-1 bg-[var(--color-rule-subtle)]" />
                </div>

                {/* Manual Text Input */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--color-ink)]">
                      Document Title / Name
                    </label>
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="e.g. system_architecture_notes.md"
                      className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] px-3 py-2 text-xs text-[var(--color-ink)] focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[var(--color-ink)]">
                        Document Content
                      </label>
                      <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                        {newDocContent.length} chars (approx. {Math.max(1, Math.ceil(newDocContent.length / 500))} chunks)
                      </span>
                    </div>
                    <textarea
                      rows={7}
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      placeholder="Paste technical documentation, notes, API specifications, or code snippets here..."
                      className="w-full rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] p-3 text-xs text-[var(--color-ink)] font-mono focus:outline-hidden resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddDocModalOpen(false)}
                  className="rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] px-4 py-1.5 text-xs font-bold text-[var(--color-ink)] cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newDocContent.trim()) return;
                    handleIndexDocument(newDocTitle.trim() || 'Untitled_Document.md', newDocContent);
                  }}
                  disabled={!newDocContent.trim()}
                  className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 text-xs font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <IconPlus size={13} />
                  <span>Index Document</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌐 Remote Cloud Environment Notice Modal (Phase 2) */}
      <AnimatePresence>
        {showRemoteNoticeModal && (
          <div
            onClick={() => setShowRemoteNoticeModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-card)] p-6 shadow-2xl space-y-5 text-left"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[var(--color-rule-subtle)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
                    <IconCompass size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--color-ink)]">
                      Local-Only AI Engine Notice
                    </h3>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      Zero cloud egress • 100% private offline compute
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRemoteNoticeModal(false)}
                  className="p-1 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Explanatory Body */}
              <div className="space-y-3 text-xs text-[var(--color-ink-muted)] leading-relaxed">
                <p>
                  You are accessing Resursee via a <strong className="text-[var(--color-ink)]">remote web host</strong>. The <strong>AI Hub Studio</strong> is designed to run models directly on your physical hardware via Ollama (<code className="rounded-md bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-ink)]">http://localhost:11434</code>) to guarantee complete data privacy with zero cloud subscription fees.
                </p>
                <p>
                  Modern web browsers restrict remote websites from making silent requests to a visitor’s local computer. To experience real GPU/CPU inference, run Resursee locally or install Ollama on your machine.
                </p>
              </div>

              {/* What You Can Do Card */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-neutral-800 dark:text-neutral-200">
                  <IconShieldCheck size={16} />
                  <span>Your Options:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11.5px] text-neutral-700 dark:text-neutral-300">
                  <li>
                    <strong className="text-neutral-900 dark:text-neutral-100">Explore in Preview Mode</strong>: Browse the studio interface, 45+ model library, and sample RAG documents with interactive simulated responses.
                  </li>
                  <li>
                    <strong className="text-neutral-900 dark:text-neutral-100">Setup Guide</strong>: Follow quick step-by-step instructions to install Ollama on macOS, Windows, or Linux.
                  </li>
                </ul>
              </div>

              {/* Dismiss for session checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgainSession}
                  onChange={(e) => setDontShowAgainSession(e.target.checked)}
                  className="rounded border-[var(--color-rule-strong)] text-neutral-900 dark:text-white cursor-pointer"
                />
                <label htmlFor="dontShowAgain" className="text-xs text-[var(--color-ink-muted)] cursor-pointer select-none">
                  Don&apos;t show this notice again for this session
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[var(--color-rule-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    if (dontShowAgainSession && typeof window !== 'undefined') {
                      sessionStorage.setItem('resursee_ai_hub_preview_dismissed', 'true');
                    }
                    setShowRemoteNoticeModal(false);
                    setIsPreviewMode(true);
                  }}
                  className="w-full sm:flex-1 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-2 text-xs font-bold transition-all cursor-pointer text-center shadow-2xs hover:opacity-90"
                >
                  Explore in Preview Mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (dontShowAgainSession && typeof window !== 'undefined') {
                      sessionStorage.setItem('resursee_ai_hub_preview_dismissed', 'true');
                    }
                    setShowRemoteNoticeModal(false);
                    setActiveTab('guide');
                  }}
                  className="w-full sm:flex-1 rounded-xl border border-[var(--color-rule-strong)] bg-[var(--color-paper-surface)] hover:bg-[var(--color-paper-muted)] py-2 text-xs font-bold text-[var(--color-ink)] transition-all cursor-pointer text-center shadow-2xs"
                >
                  View Setup Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
