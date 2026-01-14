

import { GoogleGenAI, GenerateContentResponse as GenAIResponse } from "@google/genai";
import { Attachment, MessageSource, Provider } from "../types";

export interface StreamResult {
  text: string;
  sources?: MessageSource[];
  generatedImage?: string;
}

export class GeminiService {
  
  /**
   * Obtém a chave correta baseada no provedor selecionado
   */
  private getApiKey(provider: Provider, googleKey?: string, openRouterKey?: string): string {
    // 1. Tenta pegar a chave passada explicitamente (do estado da UI)
    let key = provider === 'google' ? googleKey : openRouterKey;

    // 2. Se não houver, tenta variáveis de ambiente (Server-side/Build time)
    if (!key) {
      if (typeof process !== 'undefined' && process.env) {
        key = provider === 'google' ? process.env.API_KEY : process.env.OPENROUTER_API_KEY;
      }
    }

    // 3. Fallback para shim window.process (Client-side)
    if (!key) {
      const env = (window as any).process?.env;
      key = provider === 'google' ? env?.API_KEY : env?.OPENROUTER_API_KEY;
    }

    if (!key) {
      throw new Error(`Chave de API para ${provider === 'google' ? 'Google' : 'OpenRouter'} não configurada.`);
    }

    return key;
  }

  async *streamChat(
    provider: Provider,
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[] = [],
    systemInstruction?: string,
    googleSearchEnabled: boolean = false,
    apiKeys?: { google?: string; openRouter?: string }
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    // Roteamento de Provedor
    if (provider === 'google') {
      yield* this.streamGoogle(modelId, history, newMessage, attachments, systemInstruction, googleSearchEnabled, apiKeys?.google);
    } else {
      yield* this.streamOpenRouter(modelId, history, newMessage, attachments, systemInstruction, apiKeys?.openRouter);
    }
  }

  // --- Implementação Google (SDK Oficial) ---
  private async *streamGoogle(
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[],
    systemInstruction: string | undefined,
    googleSearchEnabled: boolean,
    apiKey?: string
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    const key = this.getApiKey('google', apiKey);
    const ai = new GoogleGenAI({ apiKey: key });

    try {
      const isImageRequest = newMessage.toLowerCase().includes("gere uma imagem") || 
                             newMessage.toLowerCase().includes("crie uma imagem") ||
                             modelId.includes("image");

      const activeModel = isImageRequest ? 'gemini-3-pro-image-preview' : (modelId || 'gemini-3-flash-preview');

      const parts: any[] = [{ text: newMessage }];
      
      if (attachments.length > 0) {
        attachments.forEach(att => {
          if (att.mimeType.startsWith('image/')) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data
              }
            });
          }
        });
      }

      const responseStream = await ai.models.generateContentStream({
        model: activeModel,
        contents: [...history, { role: 'user', parts }],
        config: {
          systemInstruction: systemInstruction || 'Você é um assistente prestativo.',
          tools: googleSearchEnabled ? [{ googleSearch: {} }] : undefined,
          imageConfig: isImageRequest ? { aspectRatio: "1:1", imageSize: "1K" } : undefined
        },
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const c = chunk as GenAIResponse;
        
        if (c.text) fullText += c.text;

        let generatedImage = undefined;
        const candidate = c.candidates?.[0];
        
        // Extração de imagem
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
          }
        }
        
        // Extração de Grounding (Fontes)
        const sources = candidate?.groundingMetadata?.groundingChunks
          ?.filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            title: chunk.web.title,
            uri: chunk.web.uri
          }));

        yield { text: fullText, sources, generatedImage };
      }
      
    } catch (error: any) {
      console.error("Google SDK Error:", error);
      if (error.message?.includes("403") || error.toString().includes("API key")) {
         throw new Error("Erro 403 (Google): Chave inválida ou expirada.");
      }
      throw error;
    }
  }

  // --- Implementação OpenRouter (Fetch / OpenAI Standard) ---
  private async *streamOpenRouter(
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[],
    systemInstruction?: string,
    apiKey?: string
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    const key = this.getApiKey('openrouter', undefined, apiKey);
    
    // Converter histórico do formato Gemini para OpenAI
    const messages = [
      { role: 'system', content: systemInstruction || "You are a helpful assistant." },
      ...history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0]?.text || ''
      }))
    ];

    // Adicionar mensagem atual (com suporte básico a imagem via URL se necessário, mas aqui simplificado para texto)
    // OpenRouter suporta vision, mas requer formatação específica. Focando em texto/código por enquanto.
    let content: any = newMessage;
    
    // Se houver imagens, OpenRouter usa formato array content
    if (attachments.length > 0) {
      content = [
        { type: "text", text: newMessage },
        ...attachments.map(att => ({
          type: "image_url",
          image_url: { url: `data:${att.mimeType};base64,${att.data}` }
        }))
      ];
    }

    messages.push({ role: 'user', content });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Gemini Clone UI"
        },
        body: JSON.stringify({
          model: modelId || 'deepseek/deepseek-r1:free',
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenRouter Error: ${err.error?.message || response.statusText}`);
      }

      if (!response.body) throw new Error("Sem resposta do corpo da requisição.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Mantém o resto incompleto no buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.substring(6));
              const delta = json.choices[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                yield { text: fullText };
              }
            } catch (e) {
              console.warn("Erro ao parsear chunk OpenRouter", e);
            }
          }
        }
      }

    } catch (error: any) {
      console.error("OpenRouter Error:", error);
      throw new Error(`Falha OpenRouter: ${error.message}`);
    }
  }

  async generateTitle(firstMessage: string, provider: Provider, apiKeys?: { google?: string, openRouter?: string }): Promise<string> {
    // Para título, usamos sempre o modelo mais barato/rápido do provedor escolhido
    try {
      if (provider === 'google') {
        const ai = new GoogleGenAI({ apiKey: this.getApiKey('google', apiKeys?.google) });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Titulo 3 palavras: "${firstMessage}"`,
        });
        return response.text?.trim().replace(/["']/g, '') || "Nova Conversa";
      } else {
        const key = this.getApiKey('openrouter', undefined, apiKeys?.openRouter);
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: 'meta-llama/llama-3-8b-instruct:free', // Modelo free geralmente disponível
            messages: [{ role: 'user', content: `Crie um título de 3 palavras para: "${firstMessage}"` }]
          })
        });
        const data = await res.json();
        return data.choices[0]?.message?.content?.trim().replace(/["']/g, '') || "Nova Conversa";
      }
    } catch {
      return "Nova Conversa";
    }
  }
}