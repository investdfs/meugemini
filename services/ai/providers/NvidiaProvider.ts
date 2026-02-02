/**
 * NVIDIA NIM Provider Implementation
 * Specialized provider for NVIDIA's NIM platform (Kimi K2.5, etc.)
 * 
 * Features:
 * - Uses Vite proxy to bypass CORS restrictions in dev
 * - Support for "thinking" mode via chat_template_kwargs
 * - Streaming with reasoning content extraction
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

interface NvidiaConfig {
    enableThinking?: boolean;
}

export class NvidiaProvider implements ProviderStrategy {
    readonly name: ProviderName = 'nvidia';
    readonly displayName: string = 'NVIDIA NIM';
    readonly baseUrl: string = 'https://integrate.api.nvidia.com/v1';

    private enableThinking: boolean;
    // In dev mode, Vite proxies /api/nvidia-proxy to the real API
    private proxyBaseUrl: string = '/api/nvidia-proxy';

    constructor(config?: NvidiaConfig) {
        this.enableThinking = config?.enableThinking ?? true;
    }

    private getBaseUrl(): string {
        // Use proxy in browser (dev mode), direct URL otherwise
        if (typeof window !== 'undefined') {
            return this.proxyBaseUrl;
        }
        return this.baseUrl;
    }

    async testConnection(apiKey: string): Promise<ConnectionTestResult> {
        const start = performance.now();

        try {
            const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'moonshotai/kimi-k2.5',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10,
                    stream: false,
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

            return {
                success: true,
                latencyMs,
                modelInfo: 'Conectado a NVIDIA NIM',
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

        // Build request body with NVIDIA-specific options
        const requestBody: Record<string, any> = {
            model: model.modelId,
            messages: formattedMessages,
            max_tokens: options?.maxTokens || 16384,
            temperature: options?.temperature ?? 1.0,
            top_p: options?.topP ?? 1.0,
            stream: true,
        };

        // Enable thinking mode for models that support it (like Kimi K2.5)
        if (this.enableThinking && model.capabilities?.supportsReasoning) {
            requestBody.chat_template_kwargs = { thinking: true };
        }

        const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `NVIDIA NIM: ${response.statusText}`);
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

                        // Handle regular content
                        if (delta?.content) {
                            fullText += delta.content;
                            yield { text: fullText, reasoning };
                        }

                        // Handle reasoning content (thinking mode)
                        if (delta?.reasoning_content) {
                            reasoning += delta.reasoning_content;
                            yield { text: fullText, reasoning };
                        }
                    } catch {
                        // Ignore incomplete JSON chunks
                    }
                }
            }
        }

        yield { text: fullText, reasoning, isComplete: true };
    }

    async listAvailableModels(_apiKey: string): Promise<ExternalModelInfo[]> {
        // NVIDIA NIM doesn't expose a models endpoint, return known models
        return [
            {
                id: 'moonshotai/kimi-k2.5',
                name: 'Kimi K2.5',
                contextLength: 131072,
            },
        ];
    }
}

// Export singleton instance
export const nvidiaProvider = new NvidiaProvider();
