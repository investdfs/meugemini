/**
 * Provider Default Configurations
 * Pre-configured settings for all supported AI providers
 */

import { ProviderConfig, AIModel, ProviderName } from '../types/ai';
import { v4 as uuidv4 } from 'uuid';

// ==================== SYSTEM DEFAULT ====================
/**
 * OpenRouter é o provider padrão do sistema.
 * O usuário pode alterar para outro provider já configurado como padrão.
 */
export const SYSTEM_DEFAULT_PROVIDER: ProviderName = 'openrouter';
export const SYSTEM_DEFAULT_MODEL_ID = 'google/gemini-2.0-flash-lite-preview-02-05:free';

// ==================== PROVIDER DEFAULTS ====================

export const DEFAULT_PROVIDERS: Omit<ProviderConfig, 'apiKeyEncrypted'>[] = [
    {
        id: 'provider_openrouter',
        name: 'openrouter',
        displayName: 'OpenRouter (Agregador)',
        baseUrl: 'https://openrouter.ai/api/v1',
        isActive: true,
        requiresKey: true,
    },
    {
        id: 'provider_google',
        name: 'google',
        displayName: 'Google Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com',
        isActive: true,
        requiresKey: true,
    },
    {
        id: 'provider_openai',
        name: 'openai',
        displayName: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        isActive: false,
        requiresKey: true,
    },
    {
        id: 'provider_anthropic',
        name: 'anthropic',
        displayName: 'Anthropic (Claude)',
        baseUrl: 'https://api.anthropic.com/v1',
        isActive: false,
        requiresKey: true,
    },
    {
        id: 'provider_deepseek',
        name: 'deepseek',
        displayName: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com',
        isActive: false,
        requiresKey: true,
    },
    {
        id: 'provider_groq',
        name: 'groq',
        displayName: 'Groq Cloud',
        baseUrl: 'https://api.groq.com/openai/v1',
        isActive: false,
        requiresKey: true,
    },
    {
        id: 'provider_mistral',
        name: 'mistral',
        displayName: 'Mistral AI',
        baseUrl: 'https://api.mistral.ai/v1',
        isActive: false,
        requiresKey: true,
    },
    {
        id: 'provider_xai',
        name: 'xai',
        displayName: 'xAI (Grok)',
        baseUrl: 'https://api.x.ai/v1',
        isActive: false,
        requiresKey: true,
    },
];

// ==================== MODEL DEFAULTS ====================

export const DEFAULT_MODELS: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // ===== Google Gemini (Native) - Secondary Default =====
    {
        providerId: 'provider_google',
        providerName: 'google',
        modelId: 'gemini-3-flash-preview',
        displayName: 'Gemini 3 Flash',
        description: 'Velocidade extrema com IA de próxima geração',
        isDefault: false, // OpenRouter é o padrão do sistema
        priorityOrder: 5, // Alta prioridade como fallback
        isActive: true,
        capabilities: {
            supportsVision: true,
            supportsTools: true,
            supportsStreaming: true,
            contextWindow: 1000000,
        },
    },
    {
        providerId: 'provider_google',
        providerName: 'google',
        modelId: 'gemini-3-pro-preview',
        displayName: 'Gemini 3 Pro',
        description: 'O modelo mais avançado e inteligente do Google',
        isDefault: false,
        priorityOrder: 2,
        isActive: true,
        capabilities: {
            supportsVision: true,
            supportsTools: true,
            supportsStreaming: true,
            supportsReasoning: true,
            contextWindow: 2000000,
        },
    },

    // ===== OpenRouter (Primary Default - Free Tier) =====
    {
        providerId: 'provider_openrouter',
        providerName: 'openrouter',
        modelId: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        displayName: 'Gemini 2.0 Flash Lite (Free)',
        description: 'API padrão do sistema via OpenRouter',
        isDefault: true, // 🟢 PADRÃO DO SISTEMA
        priorityOrder: 1, // Máxima prioridade
        isActive: true,
        capabilities: {
            supportsVision: true,
            supportsStreaming: true,
            contextWindow: 128000,
        },
        pricing: { inputPerMillion: 0, outputPerMillion: 0, currency: 'USD' },
    },
    {
        providerId: 'provider_openrouter',
        providerName: 'openrouter',
        modelId: 'deepseek/deepseek-r1:free',
        displayName: 'DeepSeek R1 (Free)',
        description: 'Raciocínio avançado gratuito',
        isDefault: false,
        priorityOrder: 11,
        isActive: true,
        capabilities: {
            supportsStreaming: true,
            supportsReasoning: true,
            contextWindow: 64000,
        },
        pricing: { inputPerMillion: 0, outputPerMillion: 0, currency: 'USD' },
    },
    {
        providerId: 'provider_openrouter',
        providerName: 'openrouter',
        modelId: 'meta-llama/llama-3.3-70b-instruct:free',
        displayName: 'Llama 3.3 70B (Free)',
        description: 'Modelo open-source da Meta',
        isDefault: false,
        priorityOrder: 12,
        isActive: true,
        capabilities: {
            supportsStreaming: true,
            contextWindow: 128000,
        },
        pricing: { inputPerMillion: 0, outputPerMillion: 0, currency: 'USD' },
    },

    // ===== OpenAI =====
    {
        providerId: 'provider_openai',
        providerName: 'openai',
        modelId: 'gpt-4o',
        displayName: 'GPT-4o',
        description: 'Modelo multimodal da OpenAI',
        isDefault: false,
        priorityOrder: 20,
        isActive: true,
        capabilities: {
            supportsVision: true,
            supportsTools: true,
            supportsStreaming: true,
            contextWindow: 128000,
        },
        pricing: { inputPerMillion: 2.5, outputPerMillion: 10, currency: 'USD' },
    },
    {
        providerId: 'provider_openai',
        providerName: 'openai',
        modelId: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        description: 'Versão eficiente e econômica',
        isDefault: false,
        priorityOrder: 21,
        isActive: true,
        capabilities: {
            supportsVision: true,
            supportsStreaming: true,
            contextWindow: 128000,
        },
        pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6, currency: 'USD' },
    },

    // ===== Anthropic =====
    {
        providerId: 'provider_anthropic',
        providerName: 'anthropic',
        modelId: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4',
        description: 'Modelo equilibrado da Anthropic',
        isDefault: false,
        priorityOrder: 30,
        isActive: true,
        capabilities: {
            supportsVision: true,
            supportsTools: true,
            supportsStreaming: true,
            contextWindow: 200000,
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, currency: 'USD' },
    },

    // ===== DeepSeek (Native) =====
    {
        providerId: 'provider_deepseek',
        providerName: 'deepseek',
        modelId: 'deepseek-chat',
        displayName: 'DeepSeek Chat',
        description: 'Chat otimizado da DeepSeek',
        isDefault: false,
        priorityOrder: 40,
        isActive: true,
        capabilities: {
            supportsStreaming: true,
            contextWindow: 64000,
        },
        pricing: { inputPerMillion: 0.14, outputPerMillion: 0.28, currency: 'USD' },
    },

    // ===== Groq =====
    {
        providerId: 'provider_groq',
        providerName: 'groq',
        modelId: 'llama-3.3-70b-versatile',
        displayName: 'Llama 3.3 70B (Groq)',
        description: 'Inferência ultrarrápida via Groq',
        isDefault: false,
        priorityOrder: 50,
        isActive: true,
        capabilities: {
            supportsStreaming: true,
            contextWindow: 128000,
        },
    },

    // ===== xAI (Grok) =====
    {
        providerId: 'provider_xai',
        providerName: 'xai',
        modelId: 'grok-3',
        displayName: 'Grok 3',
        description: 'Modelo avançado da xAI',
        isDefault: false,
        priorityOrder: 60,
        isActive: true,
        capabilities: {
            supportsVision: true,
            supportsStreaming: true,
            contextWindow: 131072,
        },
        pricing: { inputPerMillion: 3, outputPerMillion: 15, currency: 'USD' },
    },
];

// ==================== HELPER FUNCTIONS ====================

export const getProviderByName = (name: ProviderName): Omit<ProviderConfig, 'apiKeyEncrypted'> | undefined => {
    return DEFAULT_PROVIDERS.find(p => p.name === name);
};

export const getModelsByProvider = (providerName: ProviderName): Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>[] => {
    return DEFAULT_MODELS.filter(m => m.providerName === providerName);
};

export const getDefaultModel = (): Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'> | undefined => {
    return DEFAULT_MODELS.find(m => m.isDefault);
};

export const generateModelId = (): string => uuidv4();
