
import { Provider, ModelOption } from './types';

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
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', description: 'Performance de GPT-4 com velocidade instantânea', provider: 'groq' },
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
export const DEFAULT_AI_NAME = "Gemini Docs";

export const WELCOME_MESSAGE_TEMPLATE = "Olá! Sou o {name}. Qual documento vamos redigir hoje?";

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
      },
      { 
        title: "11. Ofício / Documento Externo", 
        prompt: "Atue como assessor administrativo da Administração Pública Militar. Elaborar documento oficial externo, com linguagem formal, impessoal e adequada ao destinatário. Objetivo: informar ou solicitar providência." 
      },
      { 
        title: "12. Mesmo Escalão", 
        prompt: "Atue como assessor administrativo militar. Elaborar documento destinado a OM do mesmo escalão, com linguagem formal, direta e objetiva. Objetivo: coordenação administrativa." 
      },
      { 
        title: "14. Padronização Interna", 
        prompt: "Atue como assessor administrativo militar experiente. Elaborar texto normativo ou orientativo para padronização de procedimentos internos. Use linguagem clara, formal e impessoal." 
      },
      { 
        title: "15. GATILHO MASTER", 
        prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar, com experiência em OM operativa. O documento é oficial, deve observar a EB10-IG-01.001 e o padrão SPED. Use linguagem formal, objetiva e impessoal, sem floreios. Objetivo: garantir clareza, conformidade normativa e segurança jurídica." 
      }
    ]
  },
  {
    category: "Contratos e Licitações (Lei 14.133)",
    items: [
      { 
        title: "3. Contrato Administrativo", 
        prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar. O documento trata de contrato administrativo e deve observar a Lei nº 14.133/2021. Use linguagem técnica, precisa e sem ambiguidades. Objetivo: instruir processo contratual." 
      },
      { 
        title: "4. Fiscalização de Contratos", 
        prompt: "Atue como especialista em fiscalização de contratos administrativos militares. Elaborar texto técnico, claro e juridicamente defensável, sem linguagem coloquial. Objetivo: registrar, informar ou justificar ato de fiscalização." 
      },
      { 
        title: "5. Termo Aditivo", 
        prompt: "Atue como consultor jurídico-administrativo militar. Redigir ou revisar cláusulas de termo aditivo, preservando o sentido jurídico, a legalidade e a padronização administrativa. Objetivo: ajuste formal do contrato." 
      },
      { 
        title: "6. Apostilamento Contratual", 
        prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar. Elaborar texto de apostilamento contratual, com linguagem objetiva e estritamente técnica. Objetivo: registrar alteração sem modificação do objeto contratual." 
      },
      { 
        title: "9. Correção de Cláusulas", 
        prompt: "Atue como assessor jurídico-administrativo. Reescreva as cláusulas a seguir, mantendo o sentido jurídico original, eliminando ambiguidades e aprimorando a técnica redacional." 
      },
      { 
        title: "10. E-mail Institucional Fornecedor", 
        prompt: "Atue como assessor administrativo militar. Elaborar e-mail institucional para fornecedor, com linguagem formal, objetiva e alinhada às rotinas de contratos da Administração Pública. Objetivo: comunicação oficial." 
      },
      { 
        title: "13. Instrução de Processo", 
        prompt: "Atue como assessor jurídico-administrativo da Administração Pública Militar. Elaborar texto para instrução de processo administrativo, garantindo clareza, encadeamento lógico e segurança jurídica." 
      }
    ]
  },
  {
    category: "Suporte e Justificativa",
    items: [
      { 
        title: "7. Justificativa Administrativa", 
        prompt: "Atue como assessor administrativo militar. Elaborar justificativa administrativa clara, lógica e juridicamente segura, destinada à instrução de processo. Evite subjetividade e termos genéricos." 
      }
    ]
  }
];
