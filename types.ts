
export interface Attachment {
  id: string;
  mimeType: string;
  data: string; // Base64 string (raw content)
  fileName: string;
}

export interface KnowledgeChunk {
  id: string;
  fileId: string;
  fileName: string;
  text: string;
  score?: number;
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
  retrievedChunks?: KnowledgeChunk[]; // Trechos usados para gerar a resposta
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  driveFolderUrl: string; // Public link
  notebookLmUrl?: string; // Link para NotebookLM
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
  editorContent?: string; // Conteúdo persistido no editor para esta sessão
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
  isSplitViewEnabled: boolean; // Ativado pelo usuário abaixo do chat
  aiDisplayName: string;
  theme: Theme;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: Provider;
}

// Interfaces para Workflow adicionadas para suportar o componente WorkflowModal
export interface WorkflowStep {
  id: string;
  name: string;
  prompt: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: WorkflowStep[];
}
