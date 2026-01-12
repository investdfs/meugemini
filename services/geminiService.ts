import { Provider, Attachment, MessageSource } from "../types";

export interface StreamResult {
  text: string;
  sources?: MessageSource[];
}

export class GeminiService {
  private currentProvider: Provider = 'google';

  constructor(provider: Provider = 'google') {
    this.updateConfig(provider);
  }

  updateConfig(provider: Provider) {
    this.currentProvider = provider;
  }

  async *streamChat(
    modelId: string,
    history: { role: string; parts: any[] }[],
    newMessage: string,
    attachments: Attachment[] = [],
    systemInstruction?: string,
    googleSearchEnabled: boolean = false
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          history,
          newMessage,
          attachments,
          systemInstruction,
          googleSearchEnabled,
          provider: this.currentProvider
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no Proxy da API');
      }

      const data = await response.json();
      yield { text: data.text, sources: data.sources };
      
    } catch (error: any) {
      console.error("Proxy Error:", error);
      throw new Error(error.message || "Erro de conexão com o servidor proxy.");
    }
  }

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'gemini-3-flash-preview',
          history: [],
          newMessage: `Crie um título curto (máx 4 palavras) para este chat: "${firstMessage}".`,
          attachments: [],
          provider: 'google'
        })
      });
      const data = await response.json();
      return data.text?.trim() || "Nova Conversa";
    } catch {
      return "Nova Conversa";
    }
  }
}