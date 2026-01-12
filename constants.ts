import { ModelId, ModelOption } from './types';

export const AVAILABLE_MODELS: ModelOption[] = [
  // Google Models
  {
    id: ModelId.GeminiFlash,
    name: 'Gemini 3.0 Flash',
    description: 'Rápido e eficiente (Google)',
    provider: 'google'
  },
  {
    id: ModelId.GeminiPro,
    name: 'Gemini 3.0 Pro',
    description: 'Raciocínio complexo (Google)',
    provider: 'google'
  },
  {
    id: ModelId.Gemini25Flash,
    name: 'Gemini 2.5 Flash',
    description: 'Versão estável anterior (Google)',
    provider: 'google'
  },
  // OpenRouter Models
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
    description: 'Modelo de raciocínio avançado (OpenRouter)',
    provider: 'openrouter'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Equilíbrio entre inteligência e velocidade (OpenRouter)',
    provider: 'openrouter'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Código aberto de alta performance (OpenRouter)',
    provider: 'openrouter'
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash (OR)',
    description: 'Gemini via OpenRouter',
    provider: 'openrouter'
  }
];

export const DEFAULT_MODEL = ModelId.GeminiFlash;
export const DEFAULT_PROVIDER = 'google';
export const DEFAULT_AI_NAME = "Gemini";

export const WELCOME_MESSAGE_TEMPLATE = "Olá! Eu sou o {name}. Como posso ajudar você hoje?";