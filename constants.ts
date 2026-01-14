

import { Provider, ModelOption, Workflow } from './types';

export const AVAILABLE_MODELS: ModelOption[] = [
  // --- GOOGLE ---
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)', description: 'O modelo mais avançado e inteligente do Google', provider: 'google' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', description: 'Velocidade extrema com inteligência de próxima geração', provider: 'google' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Stable)', description: 'Nova geração estável e multimodal', provider: 'google' },
  { id: 'gemini-2.0-flash-lite-preview-02-05', name: 'Gemini 2.0 Flash-Lite', description: 'Otimizado para latência ultra-baixa', provider: 'google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Raciocínio complexo e janela de contexto massiva', provider: 'google' },
  
  // --- xAI (GROK) ---
  { id: 'grok-2-1212', name: 'Grok-2', description: 'Modelo flagship da xAI com capacidades de raciocínio avançadas', provider: 'xai' },
  { id: 'grok-2-mini-1212', name: 'Grok-2 Mini', description: 'Equilíbrio entre velocidade e inteligência', provider: 'xai' },
  { id: 'grok-beta', name: 'Grok Beta', description: 'Versão de testes para novas funcionalidades', provider: 'xai' },

  // --- OPENAI ---
  { id: 'o3-mini', name: 'OpenAI o3-mini', description: 'Modelo de raciocínio ultra-rápido para STEM', provider: 'openai' },
  { id: 'o1', name: 'OpenAI o1', description: 'Raciocínio profundo de nível doutorado', provider: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o (2024-11-20)', description: 'O modelo flagship mais versátil da OpenAI', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Otimizado para velocidade e baixo custo', provider: 'openai' },

  // --- ANTHROPIC ---
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet V2', description: 'Líder em codificação e nuances de escrita', provider: 'anthropic' },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', description: 'Velocidade extrema com inteligência Claude 3 Opus', provider: 'anthropic' },
  { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', description: 'O modelo mais robusto para tarefas críticas', provider: 'anthropic' },

  // --- DEEPSEEK ---
  { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: 'Raciocínio puro (Chain of Thought) de alta performance', provider: 'deepseek' },
  { id: 'deepseek-chat', name: 'DeepSeek V3', description: 'Eficiência extrema em conversação e lógica', provider: 'deepseek' },

  // --- GROQ (Hardware Accelerated) ---
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', description: 'Performance de GPT-4 with velocidade instantânea', provider: 'groq' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 (Distill Llama)', description: 'Raciocínio R1 com a velocidade do Groq', provider: 'groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)', description: 'Resposta em milissegundos', provider: 'groq' },

  // --- MISTRAL ---
  { id: 'mistral-large-latest', name: 'Mistral Large 2', description: 'Soberania e inteligência europeia', provider: 'mistral' },
  { id: 'codestral-latest', name: 'Codestral', description: 'Focado exclusivamente em excelência de código', provider: 'mistral' },

  // --- OPENROUTER (Featured) ---
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OR)', description: 'Acesso unificado', provider: 'openrouter' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OR)', description: 'Acesso unificado', provider: 'openrouter' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OR)', description: 'Acesso unificado', provider: 'openrouter' }
];

export const PROVIDER_LABELS: Record<Provider, string> = {
  google: 'Google AI Studio',
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

export const WELCOME_MESSAGE_TEMPLATE = "Olá! Sou o {name}. Como posso ajudar você hoje?";

export const PROFESSIONAL_STARTERS = [
  {
    id: 'doc_analysis',
    label: 'Padronização Total',
    prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar. O documento é um DIEx, destinado a escalão superior, devendo observar a EB10-IG-01.001 e o padrão SPED. Use linguagem formal, objetiva e impessoal, sem floreios. Objetivo: informar e encaminhar providência administrativa."
  },
  {
    id: 'doc_contract',
    label: 'Lei nº 14.133/2021',
    prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar. O documento trata de contrato administrativo e deve observar a Lei nº 14.133/2021. Use linguagem técnica, precisa e sem ambiguidades. Objetivo: instruir processo contratual."
  },
  {
    id: 'doc_structure',
    label: 'Gatilho Master',
    prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar, com experiência em OM operativa. O documento é oficial, deve observar a EB10-IG-01.001 e o padrão SPED. Use linguagem formal, objetiva e impessoal, sem floreios. Objetivo: garantir clareza, conformidade normativa e segurança jurídica."
  },
  {
    id: 'doc_formal',
    label: 'Revisão Técnica',
    prompt: "Atue como revisor técnico de documentos militares. Vou enviar um texto para revisão, ajuste de linguagem, correção de impropriedades e adequação ao padrão da correspondência militar."
  }
];

export const COMMAND_LIBRARY = [
  {
    category: "Correspondência Militar (EB10-IG-01.001)",
    items: [
      { 
        title: "1. DIEx – Escalão Superior", 
        prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar. O documento é um DIEx, destinado a escalão superior, devendo observar a EB10-IG-01.001 e o padrão SPED. Use linguagem formal, objetiva e impessoal, sem floreios. Objetivo: informar e encaminhar providência administrativa." 
      },
      { 
        title: "2. DIEx – Solicitação Administrativa", 
        prompt: "Atue como assessor administrativo militar experiente. Elaborar um DIEx, com linguagem formal e hierarquia correta, observando a EB10-IG-01.001. Destinatário: escalão superior. Objetivo: solicitar providência administrativa específica." 
      },
      { 
        title: "8. Revisão Técnica Militar", 
        prompt: "Atue como revisor técnico de documentos militares. Vou enviar um texto para revisão, ajuste de linguagem, correção de impropriedades e adequação ao padrão da correspondência militar." 
      }
    ]
  }
];

// Constante WORKFLOW_LIBRARY adicionada para suportar o componente WorkflowModal
export const WORKFLOW_LIBRARY: Workflow[] = [
  {
    id: 'wf_revision_full',
    name: 'Revisão Completa e Padronização',
    description: 'Análise profunda de conformidade com a EB10-IG-01.001 seguida de melhoria de redação.',
    icon: '📋',
    steps: [
      {
        id: 'step1',
        name: 'Verificação de Conformidade',
        prompt: 'Analise o documento anexo e identifique desvios em relação à EB10-IG-01.001. Liste apenas os pontos a corrigir.'
      },
      {
        id: 'step2',
        name: 'Ajuste de Linguagem',
        prompt: 'Com base nas correções identificadas, reescreva o texto utilizando linguagem militar formal, objetiva e impessoal.'
      },
      {
        id: 'step3',
        name: 'Finalização SPED',
        prompt: 'Formate o texto final no padrão SPED para DIEx, garantindo que o Assunto e a Referência estejam destacados corretamente.'
      }
    ]
  },
  {
    id: 'wf_contract_analysis',
    name: 'Análise de Contrato (14.133)',
    description: 'Verificação técnica de minutas de contrato baseada na nova lei de licitações.',
    icon: '⚖️',
    steps: [
      {
        id: 'step1',
        name: 'Extração de Cláusulas Críticas',
        prompt: 'Identifique e extraia as cláusulas de sanções e rescisão do contrato anexo.'
      },
      {
        id: 'step2',
        name: 'Checklist Lei 14.133',
        prompt: 'Verifique se as cláusulas extraídas estão em conformidade com os artigos correspondentes da Lei nº 14.133/2021.'
      }
    ]
  }
];
