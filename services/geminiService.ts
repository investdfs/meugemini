
import { GoogleGenAI, GenerateContentResponse, GenerateContentResponse as GenAIResponse } from "@google/genai";
import { Attachment, MessageSource } from "../types";

export interface StreamResult {
  text: string;
  sources?: MessageSource[];
  generatedImage?: string;
}

export class GeminiService {
  // O método agora aceita uma chave opcional passada na chamada
  private getClient(apiKeyOverride?: string) {
    // Ordem de prioridade: 
    // 1. Chave passada via parâmetro (Configurações da UI)
    // 2. Chave no process.env (Node/Vercel Edge)
    // 3. Chave no window.process (Shim do navegador)
    
    let key = apiKeyOverride;

    if (!key) {
      try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
          key = process.env.API_KEY;
        }
      } catch (e) {}
    }

    if (!key) {
      key = (window as any).process?.env?.API_KEY || '';
    }

    if (!key) {
      throw new Error("Chave de API não configurada. Por favor, adicione sua API Key nas Configurações.");
    }

    return new GoogleGenAI({ apiKey: key });
  }

  async *streamChat(
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[] = [],
    systemInstruction?: string,
    googleSearchEnabled: boolean = false,
    apiKey?: string // Novo parâmetro
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    // Inicializa o cliente com a chave correta
    const ai = this.getClient(apiKey);
    
    try {
      // Se for um modelo de imagem ou o prompt pedir imagem explicitamente
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
        
        // Texto
        if (c.text) {
          fullText += c.text;
        }

        // Imagem Gerada (Se houver)
        let generatedImage = undefined;
        const candidate = c.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
          }
        }
        
        // Fontes Grounding
        const sources = candidate?.groundingMetadata?.groundingChunks
          ?.filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            title: chunk.web.title,
            uri: chunk.web.uri
          }));

        yield { text: fullText, sources, generatedImage };
      }
      
    } catch (error: any) {
      console.error("Gemini SDK Error:", error);
      // Tratamento específico para erro de chave
      if (error.message?.includes("403") || error.toString().includes("API key")) {
         throw new Error("Erro de Permissão (403): Sua chave de API é inválida ou expirou. Atualize nas Configurações.");
      }
      throw new Error(error.message || "Falha na comunicação com Gemini.");
    }
  }

  async generateTitle(firstMessage: string, apiKey?: string): Promise<string> {
    try {
      const ai = this.getClient(apiKey);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crie um título curtíssimo (máx 3 palavras) para este chat: "${firstMessage}". Responda apenas o título.`,
      });
      return response.text?.trim().replace(/["']/g, '') || "Nova Conversa";
    } catch {
      return "Nova Conversa";
    }
  }
}
