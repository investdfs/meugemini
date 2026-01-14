
import { GoogleGenAI, GenerateContentResponse as GenAIResponse } from "@google/genai";
import { Attachment, MessageSource, Provider } from "../types";

export interface StreamResult {
  text: string;
  sources?: MessageSource[];
  generatedImage?: string;
}

export class GeminiService {
  
  private getApiKey(provider: Provider, keys: Record<string, string | undefined>): string {
    const keyMap: Record<Provider, string | undefined> = {
      google: keys.google,
      openrouter: keys.openRouter,
      openai: keys.openai,
      anthropic: keys.anthropic,
      deepseek: keys.deepseek,
      groq: keys.groq,
      mistral: keys.mistral,
      xai: keys.xai
    };

    const key = keyMap[provider];
    if (!key) throw new Error(`Chave de API para ${provider} não configurada.`);
    return key;
  }

  /**
   * Valida uma chave de API enviando uma requisição mínima ao provedor.
   */
  async validateApiKey(provider: Provider, key: string, modelId?: string): Promise<void> {
    if (!key || key.trim().length < 5) throw new Error("Chave inválida ou muito curta.");

    if (provider === 'google') {
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({
        model: modelId || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      });
    } else {
      const endpoints: Record<string, string> = {
        openai: "https://api.openai.com/v1/chat/completions",
        openrouter: "https://openrouter.ai/api/v1/chat/completions",
        deepseek: "https://api.deepseek.com/chat/completions",
        groq: "https://api.groq.com/openai/v1/chat/completions",
        mistral: "https://api.mistral.ai/v1/chat/completions",
        anthropic: "https://api.anthropic.com/v1/messages",
        xai: "https://api.x.ai/v1/chat/completions"
      };

      const endpoint = endpoints[provider];
      if (!endpoint) throw new Error(`Validação não suportada para o provedor ${provider}`);

      const fallbackModels: Record<string, string> = {
        openai: 'gpt-4o-mini',
        openrouter: 'google/gemini-3-flash-preview',
        deepseek: 'deepseek-chat',
        groq: 'llama-3.1-8b-instant',
        mistral: 'mistral-small-latest',
        anthropic: 'claude-3-5-haiku-latest',
        xai: 'grok-2-mini-1212'
      };

      const targetModel = modelId || fallbackModels[provider];

      const body: any = {
        model: targetModel,
        max_tokens: 1
      };

      body.messages = [{ role: 'user', content: 'hi' }];

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "x-api-key": provider === 'anthropic' ? key : '',
          "anthropic-version": provider === 'anthropic' ? "2023-06-01" : ""
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Erro ${response.status}: Falha na autenticação ou modelo indisponível.`);
      }
    }
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
      yield* this.streamGoogle(modelId, history, newMessage, attachments, systemInstruction, googleSearchEnabled, apiKeys.google);
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
    googleSearchEnabled: boolean,
    apiKey?: string
  ): AsyncGenerator<StreamResult, void, unknown> {
    
    const key = apiKey || "";
    if (!key) throw new Error("Google API Key não configurada.");
    const ai = new GoogleGenAI({ apiKey: key });

    try {
      const parts: any[] = [{ text: newMessage }];
      
      if (attachments.length > 0) {
        attachments.forEach(att => {
          if (att.mimeType.startsWith('image/')) {
            parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
          }
        });
      }

      const responseStream = await ai.models.generateContentStream({
        model: modelId || 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts }],
        config: {
          systemInstruction: systemInstruction || 'Você é um assistente prestativo.',
          tools: googleSearchEnabled ? [{ googleSearch: {} }] : undefined,
        },
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const c = chunk as GenAIResponse;
        if (c.text) fullText += c.text;
        
        const candidate = c.candidates?.[0];
        const sources = candidate?.groundingMetadata?.groundingChunks
          ?.filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));

        yield { text: fullText, sources };
      }
    } catch (error: any) {
      throw error;
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
    
    const keyMap: Record<string, string | undefined> = {
      openai: apiKeys.openai,
      openrouter: apiKeys.openRouter,
      deepseek: apiKeys.deepseek,
      groq: apiKeys.groq,
      mistral: apiKeys.mistral,
      anthropic: apiKeys.anthropic,
      xai: apiKeys.xai
    };
    const key = keyMap[provider];
    if (!key) throw new Error(`Chave de API para ${provider} não configurada.`);
    
    const endpoints: Record<string, string> = {
      openai: "https://api.openai.com/v1/chat/completions",
      openrouter: "https://openrouter.ai/api/v1/chat/completions",
      deepseek: "https://api.deepseek.com/chat/completions",
      groq: "https://api.groq.com/openai/v1/chat/completions",
      mistral: "https://api.mistral.ai/v1/chat/completions",
      anthropic: "https://api.anthropic.com/v1/messages",
      xai: "https://api.x.ai/v1/chat/completions"
    };

    const endpoint = endpoints[provider];
    const messages = [
      { role: 'system', content: systemInstruction || "Você é um assistente prestativo." },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0]?.text || '' }))
    ];

    let userContent: any = newMessage;
    if (attachments.length > 0) {
      userContent = [
        { type: "text", text: newMessage },
        ...attachments.map(att => ({
          type: "image_url",
          image_url: { url: `data:${att.mimeType};base64,${att.data}` }
        }))
      ];
    }
    messages.push({ role: 'user', content: userContent });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Gemini Docs UI",
        "x-api-key": provider === 'anthropic' ? key : '',
        "anthropic-version": provider === 'anthropic' ? "2023-06-01" : ""
      },
      body: JSON.stringify({
        model: modelId,
        messages: provider === 'anthropic' ? undefined : messages,
        stream: true
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`${provider} Error: ${err.error?.message || response.statusText}`);
    }

    if (!response.body) throw new Error("Sem resposta do corpo.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

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
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              yield { text: fullText };
            }
          } catch (e) {}
        }
      }
    }
  }

  async generateTitle(firstMessage: string, provider: Provider, apiKeys: Record<string, string | undefined>): Promise<string> {
    try {
      const key = this.getApiKey(provider, apiKeys);
      if (provider === 'google') {
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Crie um título curtíssimo (3 palavras) para esta conversa: "${firstMessage}"`,
        });
        return response.text?.trim().replace(/["']/g, '') || "Nova Conversa";
      } else {
        const endpoint = provider === 'xai' ? "https://api.x.ai/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: provider === 'xai' ? 'grok-2-mini-1212' : 'google/gemini-3-flash-preview',
            messages: [{ role: 'user', content: `Crie um título de 3 palavras para: "${firstMessage}"` }]
          })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim().replace(/["']/g, '') || "Nova Conversa";
      }
    } catch {
      return "Nova Conversa";
    }
  }
}
