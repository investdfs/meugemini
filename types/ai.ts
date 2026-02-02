/**
 * AI Model Management Module - Types & Interfaces
 * Implements Strategy Pattern for multi-provider AI integration
 */

import { Attachment } from '../types';

// ==================== PROVIDERS ====================

export type ProviderName =
    | 'openrouter'
    | 'google'
    | 'openai'
    | 'anthropic'
    | 'deepseek'
    | 'groq'
    | 'mistral'
    | 'xai';

export interface ProviderConfig {
    id: string;
    name: ProviderName;
    displayName: string;
    baseUrl: string;
    isActive: boolean;
    requiresKey: boolean;
    apiKeyEncrypted?: string;
    createdAt?: number;
    updatedAt?: number;
}

// ==================== MODELS ====================

export interface AIModel {
    id: string;
    providerId: string;
    providerName: ProviderName;
    modelId: string;
    displayName: string;
    description?: string;
    isDefault: boolean;
    priorityOrder: number;
    isActive: boolean;
    capabilities: ModelCapabilities;
    pricing?: ModelPricing;
    createdAt?: number;
    updatedAt?: number;
}

export interface ModelCapabilities {
    supportsVision?: boolean;
    supportsTools?: boolean;
    supportsStreaming?: boolean;
    supportsReasoning?: boolean;
    contextWindow?: number;
    maxOutputTokens?: number;
}

export interface ModelPricing {
    inputPerMillion?: number;
    outputPerMillion?: number;
    currency?: string;
}

// ==================== CHAT INTERFACES ====================

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: Attachment[];
}

export interface ChatOptions {
    systemInstruction?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
}

export interface StreamChunk {
    text: string;
    isComplete?: boolean;
    reasoning?: string;
    sources?: Array<{ title: string; uri: string }>;
}

// ==================== STRATEGY PATTERN ====================

export interface ConnectionTestResult {
    success: boolean;
    latencyMs: number;
    error?: string;
    modelInfo?: string;
}

export interface ExternalModelInfo {
    id: string;
    name: string;
    contextLength?: number;
    pricing?: ModelPricing;
}

export interface ProviderStrategy {
    readonly name: ProviderName;
    readonly displayName: string;
    readonly baseUrl: string;

    /**
     * Tests connectivity with the provider API
     */
    testConnection(apiKey: string): Promise<ConnectionTestResult>;

    /**
     * Streams a chat completion response
     */
    chat(
        model: AIModel,
        messages: ChatMessage[],
        apiKey: string,
        options?: ChatOptions
    ): AsyncGenerator<StreamChunk, void, unknown>;

    /**
     * Lists available models from the provider (if supported)
     */
    listAvailableModels?(apiKey: string): Promise<ExternalModelInfo[]>;
}

// ==================== MANAGER INTERFACES ====================

export interface AIModelManagerConfig {
    enableFallback: boolean;
    maxRetries: number;
    retryDelayMs: number;
    logUsage: boolean;
}

export interface ModelUsageLog {
    id: string;
    modelId: string;
    providerId: string;
    timestamp: number;
    tokensUsed?: number;
    latencyMs: number;
    success: boolean;
    errorMessage?: string;
}

// ==================== UI STATE ====================

export interface ProviderStatus {
    name: ProviderName;
    displayName: string;
    isConfigured: boolean;
    isActive: boolean;
    lastTestResult?: ConnectionTestResult;
    modelCount: number;
}

export interface ModelFormData {
    modelId: string;
    displayName: string;
    description: string;
    providerName: ProviderName;
    isDefault: boolean;
    priorityOrder: number;
    capabilities: ModelCapabilities;
}

// ==================== STORAGE KEYS ====================

export const AI_STORAGE_KEYS = {
    PROVIDERS: 'ai_providers_config',
    MODELS: 'ai_models_config',
    ACTIVE_MODEL: 'ai_active_model',
    API_KEYS: 'ai_api_keys_encrypted',
    USAGE_LOGS: 'ai_usage_logs',
} as const;
