/**
 * AI Service Adapter
 * Bridge between legacy geminiService and new aiModelManager
 * 
 * Use this for gradual migration from the old service to the new one.
 */

import { aiModelManager } from './ai';
import { Attachment } from '../types';
import { ChatMessage } from '../types/ai';

interface StreamResult {
    text: string;
    sources?: Array<{ title: string; uri: string }>;
    modelUsed?: string;
}

/**
 * Adapter class that wraps aiModelManager with the same interface as GeminiService
 */
export class AIServiceAdapter {

    /**
     * Stream chat using the new AI Model Manager with fallback support.
     * This method provides the same interface as GeminiService.streamChat()
     */
    async *streamChat(
        provider: string,
        modelId: string,
        history: { role: string; parts: any[] }[],
        newMessage: string,
        attachments: Attachment[] = [],
        systemInstruction?: string,
        googleSearchEnabled: boolean = false,
        apiKeys: Record<string, string | undefined> = {}
    ): AsyncGenerator<StreamResult, void, unknown> {

        // Convert history to ChatMessage format (mapping 'model' to 'assistant')
        const messages: ChatMessage[] = history.map(h => ({
            role: (h.role === 'model' ? 'assistant' : h.role) as 'user' | 'assistant' | 'system',
            content: h.parts.map(p => p.text || '').join('\n'),
        }));

        // Add new message
        messages.push({
            role: 'user',
            content: newMessage,
            attachments: attachments.map(a => ({
                ...a,
                size: 0, // Required field
                lastModified: Date.now(),
            })),
        });

        // Store API keys from the legacy format
        for (const [key, value] of Object.entries(apiKeys)) {
            if (value) {
                // Map legacy key names to provider names
                const providerMap: Record<string, string> = {
                    openRouterApiKey: 'openrouter',
                    googleApiKey: 'google',
                    openaiApiKey: 'openai',
                    anthropicApiKey: 'anthropic',
                    deepseekApiKey: 'deepseek',
                    groqApiKey: 'groq',
                };
                const providerName = providerMap[key];
                if (providerName) {
                    // Note: This would update storage, might want to make this optional
                    // saveApiKey(providerName as any, value);
                }
            }
        }

        try {
            // Use the new manager with fallback
            const stream = aiModelManager.chat(messages, {
                systemInstruction,
            });

            let fullText = '';
            let modelUsed: string | undefined;

            for await (const chunk of stream) {
                fullText += chunk.text || '';
                modelUsed = chunk.modelUsed || modelUsed;

                yield {
                    text: fullText,
                    sources: chunk.sources,
                    modelUsed,
                };
            }
        } catch (error) {
            yield {
                text: `Erro: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }

    /**
     * Generate a title for the conversation using AI
     */
    async generateTitle(
        firstMessage: string,
        provider: string,
        apiKeys: Record<string, string | undefined> = {}
    ): Promise<string> {
        try {
            const messages: ChatMessage[] = [
                {
                    role: 'user',
                    content: `Gere um título curto (máximo 5 palavras) para uma conversa que começa com: "${firstMessage.substring(0, 200)}"`,
                },
            ];

            let title = '';
            for await (const chunk of aiModelManager.chat(messages, {
                systemInstruction: 'Responda apenas com o título, sem aspas ou pontuação extra.',
            })) {
                title += chunk.text || '';
            }

            return title.trim().slice(0, 50) || 'Nova conversa';
        } catch {
            return 'Nova conversa';
        }
    }
}

// Export singleton instance for easy use
export const aiServiceAdapter = new AIServiceAdapter();
