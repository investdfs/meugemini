
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

export type Provider = 'google' | 'openrouter' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'mistral' | 'xai';

export type Theme = 'light' | 'dark';

export interface AppSettings {
  provider: Provider;
  googleApiKey?: string;
  openRouterApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  deepseekApiKey?: string;
  groqApiKey?: string;
  mistralApiKey?: string;
  xaiApiKey?: string;
  modelId: string;
  customModelId?: string;
  systemInstruction?: string;
  googleSearchEnabled: boolean;
  aiDisplayName: string;
  theme: Theme;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: Provider;
}
