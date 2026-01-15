
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Attachment, MessageSource, Provider } from "../types";
import { PUBLIC_OPENROUTER_KEY, DEFAULT_MODEL } from "../constants";

export interface StreamResult {
  text: string;
  sources?: MessageSource[];
  generatedImage?: string;
  reasoning?: string;
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Inicialização conforme diretriz: Uso exclusivo de process.env.API_KEY
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  private getOpenRouterKey(keys: Record<string, string | undefined>): string {
    return keys.openRouter?.trim() || PUBLIC_OPENROUTER_KEY;
  }

  /**
   * Gera uma imagem usando o modelo gemini-2.5-flash-image
   */
  async generateImage(prompt: string): Promise<string | undefined> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      throw error;
    }
    return undefined;
  }

  async *streamChat(
    provider: Provider,
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[] = [],
    systemInstruction?: string,
    googleSearchEnabled: boolean = false,
    apiKeys: Record<string, string | undefined> = {}
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    if (provider === 'google') {
      yield* this.streamGoogle(modelId, history, newMessage, attachments, systemInstruction, googleSearchEnabled);
    } else {
      yield* this.streamOpenAICompatible(provider, modelId, history, newMessage, attachments, systemInstruction, apiKeys);
    }
  }

  private async *streamGoogle(
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[],
    systemInstruction: string | undefined,
    googleSearchEnabled: boolean
  ): AsyncGenerator<StreamResult, void, unknown> {
    try {
      const parts: any[] = [{ text: newMessage }];
      
      attachments.forEach(att => {
        if (att.mimeType.startsWith('image/')) {
          parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
        }
      });

      const responseStream = await this.ai.models.generateContentStream({
        model: modelId || 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts }],
        config: {
          systemInstruction: systemInstruction || 'Você é um assistente prestativo e profissional.',
          tools: googleSearchEnabled ? [{ googleSearch: {} }] : undefined,
        },
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) fullText += c.text;
        
        // Extração de Grounding conforme diretrizes
        const sources = c.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({ 
            title: chunk.web.title, 
            uri: chunk.web.uri 
          }));

        yield { text: fullText, sources };
      }
    } catch (error: any) {
      throw new Error(`Erro Gemini: ${error.message}`);
    }
  }

  private async *streamOpenAICompatible(
    provider: Provider,
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[],
    systemInstruction?: string,
    apiKeys: Record<string, string | undefined> = {}
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    const effectiveKey = provider === 'openrouter' ? this.getOpenRouterKey(apiKeys) : apiKeys[provider];
    if (!effectiveKey) throw new Error(`Chave para ${provider} não encontrada.`);
    
    const endpoints: Record<string, string> = {
      openrouter: "https://openrouter.ai/api/v1/chat/completions",
      openai: "https://api.openai.com/v1/chat/completions",
      deepseek: "https://api.deepseek.com/chat/completions",
      groq: "https://api.groq.com/openai/v1/chat/completions"
    };

    const endpoint = endpoints[provider] || endpoints.openrouter;

    const messages = [
      { role: 'system', content: systemInstruction || "Você é um assistente prestativo." },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0]?.text || '' })),
      { role: 'user', content: newMessage }
    ];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${effectiveKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: true,
        stream_options: provider === 'openrouter' ? { include_usage: true } : undefined
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`${provider}: ${err.error?.message || response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.substring(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              yield { text: fullText };
            }
          } catch (e) {}
        }
      }
    }
  }

  async generateTitle(firstMessage: string, provider: Provider, apiKeys: Record<string, string | undefined>): Promise<string> {
    try {
      const prompt = `Crie um título curtíssimo (3 palavras) para esta conversa: "${firstMessage}"`;
      if (provider === 'google') {
        const res = await this.ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return res.text?.trim().replace(/[*"']/g, '') || "Nova Conversa";
      } else {
        const key = this.getOpenRouterKey(apiKeys);
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: DEFAULT_MODEL, // Sempre usa GPT-OSS 120B para títulos em modo free/openrouter
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim().replace(/[*"']/g, '') || "Nova Conversa";
      }
    } catch { return "Nova Conversa"; }
  }
}
