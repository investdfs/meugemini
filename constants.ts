import { ModelId, ModelOption } from './types';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: ModelId.GeminiFlash,
    name: 'Gemini 3.0 Flash',
    description: 'Rápido e eficiente (Google)',
    provider: 'google'
  },
  {
    id: ModelId.GeminiPro,
    name: 'Gemini 3.0 Pro',
    description: 'Raciocínio complexo (Google)',
    provider: 'google'
  },
  {
    id: ModelId.Gemini25Flash,
    name: 'Gemini 2.5 Flash',
    description: 'Versão estável anterior (Google)',
    provider: 'google'
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
    description: 'Modelo de raciocínio avançado (OpenRouter)',
    provider: 'openrouter'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Equilíbrio entre inteligência e velocidade (OpenRouter)',
    provider: 'openrouter'
  }
];

export const DEFAULT_MODEL = ModelId.GeminiFlash;
export const DEFAULT_PROVIDER = 'google';
export const DEFAULT_AI_NAME = "Gemini";

export const WELCOME_MESSAGE_TEMPLATE = "Olá! Eu sou o {name}. Como posso ajudar você hoje?";

export const PROFESSIONAL_STARTERS = [
  {
    id: 'pdf',
    label: 'Analisar PDF',
    icon: 'FileText',
    prompt: "Atue como um analista de documentos especialista. Analise o arquivo PDF anexo, realize uma leitura crítica e forneça: 1) Um resumo executivo de 3 parágrafos, 2) Os 5 pontos mais importantes em tópicos, 3) Identificação de possíveis inconsistências ou riscos e 4) Três recomendações práticas baseadas no conteúdo."
  },
  {
    id: 'code',
    label: 'Gerar Código',
    icon: 'Code',
    prompt: "Atue como um Engenheiro de Software Sênior. Desenvolva uma solução robusta, limpa e performática para o problema descrito a seguir. Utilize as melhores práticas de Clean Code, SOLID e padrões de projeto modernos. Explique brevemente a lógica utilizada e inclua comentários claros no código.\n\nPROBLEMA: [DESCREVA AQUI]"
  },
  {
    id: 'web',
    label: 'Pesquisa Web',
    icon: 'Globe',
    prompt: "Utilize a pesquisa web para compilar as informações mais recentes, tendências e dados estatísticos atualizados sobre [ASSUNTO]. Organize a resposta comparando diferentes fontes confiáveis, destaque contradições se houver, e termine com uma análise de tendência para os próximos 12 meses."
  },
  {
    id: 'translate',
    label: 'Traduzir Texto',
    icon: 'Languages',
    prompt: "Atue como um tradutor e intérprete nativo profissional. Traduza o texto abaixo preservando fielmente o tom, as nuances culturais e as intenções do autor original. Adapte termos técnicos para o contexto local sem perder a precisão. \n\nTEXTO: [COLE AQUI]\nPARA O IDIOMA: [QUAL IDIOMA?]"
  }
];

export const COMMAND_LIBRARY = [
  {
    category: "Marketing & Vendas",
    items: [
      { title: "Criar Copy de Anúncio", prompt: "Crie uma copy de alta conversão para Facebook/Instagram Ads utilizando o framework AIDA (Atenção, Interesse, Desejo, Ação) para o produto: [PRODUTO]. Foco em [PÚBLICO ALVO]." },
      { title: "Calendário de Conteúdo", prompt: "Gere um calendário de conteúdo para 30 dias para o Instagram de uma empresa de [NICHO]. Inclua sugestão de legenda, tipo de post (Reels, Carrossel, Foto) e 5 hashtags estratégicas por post." }
    ]
  },
  {
    category: "Produtividade & Gestão",
    items: [
      { title: "Resumir Reunião", prompt: "Com base na transcrição da reunião abaixo, organize: 1) Decisões tomadas, 2) Tarefas atribuídas com respectivos responsáveis, 3) Próximos passos e 4) Data da próxima verificação.\n\nTRANSCRICAO: [COLE AQUI]" },
      { title: "Priorização de Tarefas", prompt: "Utilize a Matriz de Eisenhower para classificar e priorizar a seguinte lista de tarefas. Explique o porquê da classificação de cada uma.\n\nLISTA: [COLE AQUI]" }
    ]
  },
  {
    category: "Programação",
    items: [
      { title: "Refatorar Código", prompt: "Analise o código abaixo e sugira melhorias de legibilidade, performance e segurança. Reescreva o código aplicando as melhorias sugeridas.\n\nCODIGO: [COLE AQUI]" },
      { title: "Criar Testes Unitários", prompt: "Gere testes unitários abrangentes para a função abaixo utilizando [FRAMEWORK, ex: Jest/Pytest]. Garanta a cobertura de casos de borda (edge cases) e entradas inválidas.\n\nFUNCAO: [COLE AQUI]" }
    ]
  }
];