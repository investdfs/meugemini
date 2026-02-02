/**
 * OpenRouter Provider Implementation
 * Aggregator that provides access to multiple AI models via single API
 */

import {
    ProviderStrategy,
    AIModel,
    ChatMessage,
    ChatOptions,
    StreamChunk,
    ConnectionTestResult,
    ExternalModelInfo,
} from '../../../types/ai';

export class OpenRouterProvider implements ProviderStrategy {
    readonly name = 'openrouter' as const;
    readonly displayName = 'OpenRouter (Agregador)';
    readonly baseUrl = 'https://openrouter.ai/api/v1';

    async testConnection(apiKey: string): Promise<ConnectionTestResult> {
        const start = performance.now();

        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
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
                modelInfo: `${data.data?.length || 0} modelos disponíveis`,
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
                role: m.role === 'assistant' ? 'assistant' : m.role,
                content: m.content,
            })),
        ];

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://meugemini.app',
                'X-Title': 'MeuGemini AI Hub',
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
            throw new Error(err.error?.message || `OpenRouter: ${response.statusText}`);
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

                        // Handle reasoning tokens (DeepSeek R1 style)
                        if (delta?.reasoning_content) {
                            reasoning += delta.reasoning_content;
                            yield { text: fullText, reasoning };
                        }
                    } catch {
                        // Ignore JSON parse errors for incomplete chunks
                    }
                }
            }
        }

        yield { text: fullText, reasoning, isComplete: true };
    }

    async listAvailableModels(apiKey: string): Promise<ExternalModelInfo[]> {
        const response = await fetch(`${this.baseUrl}/models`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) throw new Error('Falha ao listar modelos do OpenRouter');

        const data = await response.json();

        return data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            contextLength: m.context_length,
            pricing: {
                inputPerMillion: m.pricing?.prompt ? m.pricing.prompt * 1_000_000 : undefined,
                outputPerMillion: m.pricing?.completion ? m.pricing.completion * 1_000_000 : undefined,
                currency: 'USD',
            },
        }));
    }
}
