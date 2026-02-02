/**
 * Fallback Handler for AI Model Requests
 * Implements retry logic and automatic fallback to secondary models
 */

import { AIModel, StreamChunk, ChatMessage, ChatOptions, ProviderStrategy } from '../../../types/ai';

export interface FallbackConfig {
    maxRetries: number;
    retryDelayMs: number;
    enableFallback: boolean;
}

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
    maxRetries: 2,
    retryDelayMs: 1000,
    enableFallback: true,
};

/**
 * Executes a chat request with automatic retry and fallback
 */
export async function* chatWithFallback(
    models: AIModel[],
    providers: Map<string, ProviderStrategy>,
    getApiKey: (providerName: string) => string,
    messages: ChatMessage[],
    options?: ChatOptions,
    config: FallbackConfig = DEFAULT_FALLBACK_CONFIG
): AsyncGenerator<StreamChunk & { modelUsed?: string }, void, unknown> {
    const sortedModels = [...models]
        .filter(m => m.isActive)
        .sort((a, b) => a.priorityOrder - b.priorityOrder);

    if (sortedModels.length === 0) {
        throw new Error('Nenhum modelo ativo configurado.');
    }

    const errors: Array<{ model: string; error: string }> = [];

    for (const model of sortedModels) {
        const provider = providers.get(model.providerName);

        if (!provider) {
            errors.push({ model: model.displayName, error: 'Provider não encontrado' });
            continue;
        }

        const apiKey = getApiKey(model.providerName);

        if (!apiKey) {
            errors.push({ model: model.displayName, error: 'Chave de API não configurada' });
            continue;
        }

        // Retry loop for current model
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    await delay(config.retryDelayMs * attempt);
                    console.log(`Retentativa ${attempt}/${config.maxRetries} para ${model.displayName}`);
                }

                let lastChunk: StreamChunk | null = null;

                for await (const chunk of provider.chat(model, messages, apiKey, options)) {
                    lastChunk = chunk;
                    yield { ...chunk, modelUsed: model.displayName };
                }

                // Success - exit completely
                return;

            } catch (error: any) {
                const errorMessage = error.message || 'Erro desconhecido';
                console.warn(`Erro no modelo ${model.displayName} (tentativa ${attempt + 1}):`, errorMessage);

                if (attempt === config.maxRetries) {
                    errors.push({ model: model.displayName, error: errorMessage });
                }
            }
        }

        // If fallback is disabled, throw after first model fails
        if (!config.enableFallback) {
            break;
        }
    }

    // All models failed
    const errorSummary = errors
        .map(e => `• ${e.model}: ${e.error}`)
        .join('\n');

    throw new Error(`Todos os modelos falharam:\n${errorSummary}`);
}

/**
 * Helper function to delay execution
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Tests if error is retryable (network issues, rate limits)
 */
export function isRetryableError(error: any): boolean {
    const message = (error?.message || '').toLowerCase();

    return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('503') ||
        message.includes('502')
    );
}
