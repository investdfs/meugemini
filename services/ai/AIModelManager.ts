/**
 * AI Model Manager - Main Facade
 * Central orchestrator for AI model operations with fallback support
 */

import {
    AIModel,
    ProviderStrategy,
    ChatMessage,
    ChatOptions,
    StreamChunk,
    ConnectionTestResult,
    ProviderName,
    ProviderStatus,
} from '../../types/ai';

import {
    OpenRouterProvider,
    GoogleProvider,
    openAIProvider,
    deepSeekProvider,
    groqProvider,
    mistralProvider,
    xaiProvider,
    nvidiaProvider,
} from './providers';

import {
    getProviders,
    getModels,
    getApiKey,
    saveApiKey,
    getActiveModel,
    getActiveModelsByPriority,
    setDefaultModel,
    hasApiKey,
    updateProvider,
} from './modelStorage';

import { chatWithFallback, FallbackConfig, DEFAULT_FALLBACK_CONFIG } from './utils/fallbackHandler';

// ==================== SINGLETON MANAGER ====================

class AIModelManager {
    private providers: Map<ProviderName, ProviderStrategy> = new Map();
    private fallbackConfig: FallbackConfig = DEFAULT_FALLBACK_CONFIG;

    constructor() {
        this.initializeProviders();
    }

    private initializeProviders(): void {
        // Register all providers
        this.providers.set('openrouter', new OpenRouterProvider());
        this.providers.set('google', new GoogleProvider());
        this.providers.set('openai', openAIProvider);
        this.providers.set('deepseek', deepSeekProvider);
        this.providers.set('groq', groqProvider);
        this.providers.set('mistral', mistralProvider);
        this.providers.set('xai', xaiProvider);
        this.providers.set('nvidia', nvidiaProvider);
    }

    // ==================== PROVIDER OPERATIONS ====================

    getProvider(name: ProviderName): ProviderStrategy | undefined {
        return this.providers.get(name);
    }

    async testConnection(providerName: ProviderName, apiKey?: string): Promise<ConnectionTestResult> {
        const provider = this.providers.get(providerName);
        if (!provider) {
            return { success: false, latencyMs: 0, error: 'Provider não encontrado' };
        }

        const key = apiKey || getApiKey(providerName);
        if (!key) {
            return { success: false, latencyMs: 0, error: 'Chave de API não configurada' };
        }

        const result = await provider.testConnection(key);

        // Update provider status based on test result
        updateProvider(providerName, { isActive: result.success });

        return result;
    }

    configureApiKey(providerName: ProviderName, apiKey: string): void {
        saveApiKey(providerName, apiKey);
    }

    getProviderStatuses(): ProviderStatus[] {
        const providers = getProviders();
        const models = getModels();

        return providers.map(p => ({
            name: p.name,
            displayName: p.displayName,
            isConfigured: hasApiKey(p.name),
            isActive: p.isActive,
            modelCount: models.filter(m => m.providerName === p.name).length,
        }));
    }

    // ==================== CHAT OPERATIONS ====================

    async *chat(
        messages: ChatMessage[],
        options?: ChatOptions
    ): AsyncGenerator<StreamChunk & { modelUsed?: string }, void, unknown> {
        const activeModel = getActiveModel();

        if (!activeModel) {
            throw new Error('Nenhum modelo ativo configurado.');
        }

        const provider = this.providers.get(activeModel.providerName);
        if (!provider) {
            throw new Error(`Provider ${activeModel.providerName} não encontrado.`);
        }

        const apiKey = getApiKey(activeModel.providerName);
        console.log('[AIModelManager] Debug - providerName:', activeModel.providerName, 'hasKey:', !!apiKey);

        if (!apiKey) {
            throw new Error(`Chave para ${activeModel.providerName} não configurada.`);
        }

        try {
            for await (const chunk of provider.chat(activeModel, messages, apiKey, options)) {
                yield { ...chunk, modelUsed: activeModel.displayName };
            }
        } catch (error) {
            // If fallback is enabled, try other models
            if (this.fallbackConfig.enableFallback) {
                console.warn(`Modelo principal falhou, iniciando fallback...`);
                yield* this.chatWithFallback(messages, options);
            } else {
                throw error;
            }
        }
    }

    async *chatWithFallback(
        messages: ChatMessage[],
        options?: ChatOptions
    ): AsyncGenerator<StreamChunk & { modelUsed?: string }, void, unknown> {
        const models = getActiveModelsByPriority();

        yield* chatWithFallback(
            models,
            this.providers,
            (providerName) => getApiKey(providerName as ProviderName),
            messages,
            options,
            this.fallbackConfig
        );
    }

    // ==================== MODEL OPERATIONS ====================

    getActiveModel(): AIModel | undefined {
        return getActiveModel();
    }

    getModels(): AIModel[] {
        return getModels();
    }

    setDefaultModel(modelId: string): void {
        setDefaultModel(modelId);
    }

    // ==================== CONFIGURATION ====================

    setFallbackConfig(config: Partial<FallbackConfig>): void {
        this.fallbackConfig = { ...this.fallbackConfig, ...config };
    }

    getFallbackConfig(): FallbackConfig {
        return { ...this.fallbackConfig };
    }
}

// Export singleton instance
export const aiModelManager = new AIModelManager();

// Export class for testing
export { AIModelManager };
