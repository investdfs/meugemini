import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Provider, Attachment, MessageSource } from "../types";
import { ENV } from "../config/env";

export interface StreamResult {
  text: string;
  sources?: MessageSource[];
}

export class GeminiService {
  private googleAi: GoogleGenAI | null = null;
  private currentProvider: Provider = 'google';

  constructor(provider: Provider = 'google') {
    this.updateConfig(provider);
  }

  updateConfig(provider: Provider) {
    this.currentProvider = provider;

    // Inicialização direta do SDK do Google usando process.env.API_KEY conforme regra de ouro
    if (process.env.API_KEY) {
      this.googleAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      this.googleAi = null;
    }
  }

  async *streamChat(
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[] = [],
    systemInstruction?: string,
    googleSearchEnabled: boolean = false
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    if (this.currentProvider === 'google') {
      yield* this.streamGoogleChat(modelId, history, newMessage, attachments, systemInstruction, googleSearchEnabled);
    } else {
      for await (const text of this.streamOpenRouterChat(modelId, history, newMessage, attachments, systemInstruction)) {
        yield { text };
      }
    }
  }

  private async *streamGoogleChat(
    modelId: string,
    history: any[],
    newMessage: string,
    attachments: Attachment[],
    systemInstruction?: string,
    googleSearchEnabled: boolean = false
  ): AsyncGenerator<StreamResult, void, unknown> {
    if (!this.googleAi) {
      throw new Error("API Key do Google não encontrada no ambiente (process.env.API_KEY).");
    }

    try {
      const config: any = {
        systemInstruction: systemInstruction,
      };

      if (googleSearchEnabled) {
        config.tools = [{ googleSearch: {} }];
      }

      const chat = this.googleAi.chats.create({
        model: modelId,
        history: history,
        config: config
      });

      const messageParts: any[] = [{ text: newMessage }];
      attachments.forEach(att => {
        messageParts.push({
            inlineData: {
                mimeType: att.mimeType,
                data: att.data
            }
        });
      });

      const resultStream = await chat.sendMessageStream({
        message: messageParts.length === 1 ? newMessage : messageParts
      } as any);

      let lastSources: MessageSource[] | undefined = undefined;

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        
        const groundingMetadata = c.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
          const sources: MessageSource[] = groundingMetadata.groundingChunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({
              title: chunk.web.title,
              uri: chunk.web.uri
            }));
          
          if (sources.length > 0) {
            lastSources = sources;
          }
        }

        if (c.text) {
          yield { text: c.text, sources: lastSources };
        }
      }
    } catch (error: any) {
      console.error("Google API Error:", error);
      throw new Error(error.message || "Erro ao comunicar com a API do Google.");
    }
  }

  private async *streamOpenRouterChat(
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[],
    systemInstruction?: string
  ): AsyncGenerator<string, void, unknown> {
    const orKey = ENV.OPENROUTER_API_KEY;
    if (!orKey) {
      throw new Error("Chave API da OpenRouter não encontrada no arquivo config/env.ts.");
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }

    for (const msg of history) {
      const contentParts: any[] = [];
      for (const part of msg.parts) {
        if (part.text) {
            contentParts.push({ type: "text", text: part.text });
        } else if (part.inlineData) {
            if (part.inlineData.mimeType.startsWith("image/")) {
                contentParts.push({
                    type: "image_url",
                    image_url: {
                        url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                    }
                });
            }
        }
      }
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: contentParts
      });
    }

    const currentContent: any[] = [{ type: "text", text: newMessage }];
    attachments.forEach(att => {
         if (att.mimeType.startsWith("image/")) {
             currentContent.push({
                 type: "image_url",
                 image_url: {
                     url: `data:${att.mimeType};base64,${att.data}`
                 }
             });
         }
    });

    messages.push({ role: "user", content: currentContent });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${orKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Erro OpenRouter: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr === "[DONE]") continue;
            try {
              const json = JSON.parse(jsonStr);
              const content = json.choices[0]?.delta?.content;
              if (content) yield content;
            } catch (e) {}
          }
        }
      }
    } catch (error: any) {
      throw new Error(error.message || "Erro ao comunicar com a OpenRouter.");
    }
  }

  async generateTitle(firstMessage: string): Promise<string> {
    if (this.currentProvider === 'google' && this.googleAi) {
      try {
        const response = await this.googleAi.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Crie um título curto (máx 4 palavras) para este chat: "${firstMessage}".`,
        });
        return response.text?.trim() || "Nova Conversa";
      } catch {
        return "Nova Conversa";
      }
    }
    return "Nova Conversa";
  }
}
