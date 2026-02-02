/**
 * OpenAI-Compatible Provider Implementation
 * Generic provider for APIs that follow OpenAI's chat/completions format
 * Used by: OpenAI, DeepSeek, Groq, Mistral, xAI
 */

import {
    ProviderStrategy,
    ProviderName,
    AIModel,
    ChatMessage,
    ChatOptions,
    StreamChunk,
    ConnectionTestResult,
    ExternalModelInfo,
} from '../../../types/ai';

interface OpenAICompatibleConfig {
    name: ProviderName;
    displayName: string;
    baseUrl: string;
    testModel?: string;
    authHeader?: string;
}

export class OpenAICompatibleProvider implements ProviderStrategy {
    readonly name: ProviderName;
    readonly displayName: string;
    readonly baseUrl: string;
    private testModel: string;
    private authHeader: string;

    constructor(config: OpenAICompatibleConfig) {
        this.name = config.name;
        this.displayName = config.displayName;
        this.baseUrl = config.baseUrl;
        this.testModel = config.testModel || 'gpt-4o-mini';
        this.authHeader = config.authHeader || 'Authorization';
    }

    async testConnection(apiKey: string): Promise<ConnectionTestResult> {
        const start = performance.now();

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    [this.authHeader]: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.testModel,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5,
                }),
            });

            const latencyMs = Math.round(performance.now() - start);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return {
                    success: false,
                    latencyMs,
                    error: error.error?.message || `HTTP ${response.status}`,
                };
            }

            const data = await response.json();
            return {
                success: true,
                latencyMs,
                modelInfo: `Conectado a ${this.displayName}`,
            };
        } catch (error: any) {
            return {
                success: false,
                latencyMs: Math.round(performance.now() - start),
                error: error.message || 'Erro de conexão',
            };
        }
    }

    async *chat(
        model: AIModel,
        messages: ChatMessage[],
        apiKey: string,
        options?: ChatOptions
    ): AsyncGenerator<StreamChunk, void, unknown> {
        const formattedMessages = [
            ...(options?.systemInstruction
                ? [{ role: 'system', content: options.systemInstruction }]
                : []),
            ...messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        ];

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                [this.authHeader]: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model.modelId,
                messages: formattedMessages,
                max_tokens: options?.maxTokens,
                temperature: options?.temperature,
                top_p: options?.topP,
                stop: options?.stopSequences,
                stream: true,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `${this.displayName}: ${response.statusText}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let reasoning = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;

                if (trimmed.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const delta = json.choices?.[0]?.delta;

                        if (delta?.content) {
                            fullText += delta.content;
                            yield { text: fullText, reasoning };
                        }

                        // Handle reasoning (DeepSeek style)
                        if (delta?.reasoning_content) {
                            reasoning += delta.reasoning_content;
                            yield { text: fullText, reasoning };
                        }
                    } catch {
                        // Ignore incomplete chunks
                    }
                }
            }
        }

        yield { text: fullText, reasoning, isComplete: true };
    }

    async listAvailableModels(apiKey: string): Promise<ExternalModelInfo[]> {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: { [this.authHeader]: `Bearer ${apiKey}` },
            });

            if (!response.ok) return [];

            const data = await response.json();
            return (data.data || []).map((m: any) => ({
                id: m.id,
                name: m.id,
            }));
        } catch {
            return [];
        }
    }
}

// ==================== PRE-CONFIGURED PROVIDERS ====================

export const openAIProvider = new OpenAICompatibleProvider({
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    testModel: 'gpt-4o-mini',
});

export const deepSeekProvider = new OpenAICompatibleProvider({
    name: 'deepseek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    testModel: 'deepseek-chat',
});

export const groqProvider = new OpenAICompatibleProvider({
    name: 'groq',
    displayName: 'Groq Cloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    testModel: 'llama-3.3-70b-versatile',
});

export const mistralProvider = new OpenAICompatibleProvider({
    name: 'mistral',
    displayName: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    testModel: 'mistral-small-latest',
});

export const xaiProvider = new OpenAICompatibleProvider({
    name: 'xai',
    displayName: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    testModel: 'grok-3',
});
