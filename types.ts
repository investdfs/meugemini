
export interface Attachment {
  id: string;
  mimeType: string;
  data: string;
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
  retrievedChunks?: KnowledgeChunk[];
}

export interface NotebookSource {
  id: string;
  url: string;
  name: string;
  addedAt: number;
  isFixed?: boolean;
  status?: 'idle' | 'checking' | 'success' | 'error';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  driveFolderUrl: string;
  notebookLmUrl?: string;
  createdAt: number;
  avatar?: string;
  themeColor?: string;
  tags?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  agentId?: string;
  editorContent?: string;
}

export type Provider = 'google' | 'openrouter' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'mistral' | 'xai';

export type Theme = 'light' | 'dark';

export interface SystemConfig {
  globalAppName: string;
  adminWelcomeMessage: string;
  notebookSources: NotebookSource[];
  lastUpdated: number;
}

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
  isSplitViewEnabled: boolean;
  aiDisplayName: string;
  theme: Theme;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: Provider;
}

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
