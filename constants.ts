
import { Provider, ModelOption, Workflow, Agent, NotebookSource } from './types';

export const PUBLIC_OPENROUTER_KEY = "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";

export const FIXED_NOTEBOOK_SOURCES: NotebookSource[] = [
  {
    id: 'fixed-diex-geral',
    url: 'https://notebooklm.google.com/notebook/f1d6026a-82b6-4c1e-9d4e-13f8c47bad67',
    name: 'Base de Conhecimento DIEx Geral',
    addedAt: 1710000000000,
    isFixed: true
  }
];

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', description: 'Velocidade extrema com inteligência de próxima geração', provider: 'google' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)', description: 'O modelo mais avançado e inteligente do Google', provider: 'google' },
  { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite (Free)', description: 'Rápido e leve via OpenRouter', provider: 'openrouter' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', description: 'Modelo de raciocínio de alto nível gratuito', provider: 'openrouter' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Eficiência e inteligência da OpenAI', provider: 'openai' }
];

export const PROVIDER_LABELS: Record<Provider, string> = {
  google: 'Google Gemini (API Nativa)',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  deepseek: 'DeepSeek',
  groq: 'Groq Cloud',
  mistral: 'Mistral AI',
  openrouter: 'OpenRouter',
  xai: 'xAI (Grok)'
};

export const DEFAULT_MODEL = 'gemini-3-flash-preview';
export const DEFAULT_AI_NAME = "Assistente Léo";

export const DEFAULT_DIEX_AGENT: Agent = {
  id: 'agent_diex_default',
  name: 'DIEx',
  description: 'Especialista em Elaboração de Documentos Internos (EB10-IG-01.001)',
  avatar: '📄',
  themeColor: '#475569',
  createdAt: Date.now(),
  driveFolderUrl: '',
  notebookLmUrl: 'https://notebooklm.google.com/notebook/f1d6026a-82b6-4c1e-9d4e-13f8c47bad67',
  tags: ['militar', 'diex', 'administrativo', 'sped'],
  systemInstruction: `# 📄 AGENTE ESPECIALISTA EM DIEx (EXÉRCITO BRASILEIRO)
Você é um assessor jurídico-administrativo sênior do Exército Brasileiro, mestre na EB10-IG-01.001 e nos padrões do SPED.`
};

export const PROFESSIONAL_STARTERS = [
  { id: 'doc_analysis', label: 'Padronização Total', prompt: "Gere um rascunho de DIEx seguindo a EB10-IG-01.001 sobre..." },
  { id: 'doc_contract', label: 'Lei nº 14.133/2021', prompt: "Analise este contrato sob a ótica da nova lei de licitações..." }
];

export const COMMAND_LIBRARY = [
  {
    category: "Correspondência Militar (EB10-IG-01.001)",
    items: [
      { 
        title: "1. DIEx – Escalão Superior", 
        prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar. O documento é um DIEx, destinado a escalão superior, devendo observar a EB10-IG-01.001 e o padrão SPED." 
      }
    ]
  }
];

export const WORKFLOW_LIBRARY: Workflow[] = [
  {
    id: 'wf_revision_full',
    name: 'Revisão Completa e Padronização',
    description: 'Análise profunda de conformidade com a EB10-IG-01.001 seguida de melhoria de redação.',
    icon: '📋',
    steps: [
      { id: 'step1', name: 'Verificação', prompt: 'Identifique desvios em relação à EB10-IG-01.001.' },
      { id: 'step2', name: 'Ajuste', prompt: 'Reescreva utilizando linguagem militar formal.' }
    ]
  }
];
