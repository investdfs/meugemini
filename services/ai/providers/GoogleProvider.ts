/**
 * Google Gemini Provider Implementation
 * Native integration with Google's Generative AI SDK
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import {
    ProviderStrategy,
    AIModel,
    ChatMessage,
    ChatOptions,
    StreamChunk,
    ConnectionTestResult,
} from '../../../types/ai';

export class GoogleProvider implements ProviderStrategy {
    readonly name = 'google' as const;
    readonly displayName = 'Google Gemini';
    readonly baseUrl = 'https://generativelanguage.googleapis.com';

    async testConnection(apiKey: string): Promise<ConnectionTestResult> {
        const start = performance.now();

        try {
            const ai = new GoogleGenAI({ apiKey });

            // Simple test with minimal tokens
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-lite',
                contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
                config: { maxOutputTokens: 5 },
            });

            const latencyMs = Math.round(performance.now() - start);

            if (response.text) {
                return {
                    success: true,
                    latencyMs,
                    modelInfo: 'Conexão com Gemini estabelecida',
                };
            }

            return {
                success: false,
                latencyMs,
                error: 'Resposta vazia do servidor',
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
        const ai = new GoogleGenAI({ apiKey });

        // Convert messages to Gemini format
        const history = messages.slice(0, -1).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        const lastMessage = messages[messages.length - 1];
        const parts: any[] = [{ text: lastMessage.content }];

        // Handle attachments
        if (lastMessage.attachments) {
            for (const att of lastMessage.attachments) {
                if (att.mimeType.startsWith('image/')) {
                    parts.push({
                        inlineData: { mimeType: att.mimeType, data: att.data },
                    });
                } else {
                    parts.push({ text: `[Arquivo: ${att.fileName}]\n${att.data}` });
                }
            }
        }

        try {
            const responseStream = await ai.models.generateContentStream({
                model: model.modelId,
                contents: [...history, { role: 'user', parts }],
                config: {
                    systemInstruction: options?.systemInstruction || 'Você é um assistente prestativo.',
                    maxOutputTokens: options?.maxTokens,
                    temperature: options?.temperature,
                    topP: options?.topP,
                    stopSequences: options?.stopSequences,
                },
            });

            let fullText = '';

            for await (const chunk of responseStream) {
                const c = chunk as GenerateContentResponse;
                if (c.text) {
                    fullText += c.text;
                }

                // Extract grounding sources (Google Search)
                const sources = c.candidates?.[0]?.groundingMetadata?.groundingChunks
                    ?.filter((chunk: any) => chunk.web)
                    .map((chunk: any) => ({
                        title: chunk.web.title,
                        uri: chunk.web.uri,
                    }));

                yield { text: fullText, sources };
            }

            yield { text: fullText, isComplete: true };
        } catch (error: any) {
            throw new Error(`Gemini: ${error.message}`);
        }
    }
}
