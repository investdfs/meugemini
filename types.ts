
export interface Attachment {
  id: string;
  mimeType: string;
  data: string; // Base64 string (raw content)
  fileName: string;
}

export interface MessageSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
  attachments?: Attachment[];
  sources?: MessageSource[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  driveFolderUrl: string; // Public link
  createdAt: number;
  avatar?: string; // Emoji or Base64
  themeColor?: string; // Hex color
  tags?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  agentId?: string; // Optional link to an agent
}

export type Provider = 'google' | 'openrouter';

export type Theme = 'light' | 'dark';

export interface AppSettings {
  provider: Provider;
  googleApiKey?: string;      // Chave específica para Google
  openRouterApiKey?: string;  // Chave específica para OpenRouter
  modelId: string;
  customModelId?: string;
  systemInstruction?: string;
  googleSearchEnabled: boolean;
  aiDisplayName: string;
  theme: Theme;
}

export enum ModelId {
  // Google Native
  GeminiFlash = 'gemini-3-flash-preview',
  GeminiPro = 'gemini-3-pro-preview',
  Gemini25Flash = 'gemini-2.5-flash-latest',
  
  // OpenRouter Common IDs
  DeepSeekR1 = 'deepseek/deepseek-r1:free',
  Claude35Sonnet = 'anthropic/claude-3.5-sonnet',
  Llama370B = 'meta-llama/llama-3-70b-instruct',
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: Provider;
}
