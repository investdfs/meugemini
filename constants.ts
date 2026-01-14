
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
export const DEFAULT_AI_NAME = "Gemini Docs";

export const WELCOME_MESSAGE_TEMPLATE = "Olá! Sou o {name}. Qual documento vamos redigir hoje?";

export const PROFESSIONAL_STARTERS = [
  {
    id: 'doc_analysis',
    label: 'Análise Jurídica',
    prompt: "Atue como um Consultor Jurídico Sênior. Analise o documento em anexo (ou o texto que colarei a seguir) em busca de cláusulas abusivas, riscos contratuais ocultos e ambiguidades. Forneça um parecer técnico estruturado em: 1) Resumo do Objeto, 2) Pontos de Atenção Crítica (Riscos), 3) Sugestões de Redação para Mitigação e 4) Conclusão sobre a viabilidade da assinatura."
  },
  {
    id: 'doc_contract',
    label: 'Minuta de Contrato',
    prompt: "Atue como um Especialista em Contratos Corporativos. Redija uma minuta completa e robusta para um [TIPO DE CONTRATO, EX: PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO]. Inclua cláusulas essenciais de: Objeto, Obrigações das Partes, Confidencialidade (NDA), Propriedade Intelectual, Vigência, Rescisão, LGPD e Foro. Utilize linguagem formal, precisa e juridicamente segura."
  },
  {
    id: 'doc_structure',
    label: 'Estruturar Artigo',
    prompt: "Atue como um Editor Chefe Acadêmico. Crie a estrutura detalhada (esqueleto) para um artigo técnico/científico sobre [TEMA]. A estrutura deve conter: Título Sugerido, Abstract (pontos chave), Introdução (contexto e tese), Desenvolvimento (divido em 3 subtópicos com argumentos principais para cada), Metodologia Sugerida e Conclusão. O objetivo é publicar em [PÚBLICO ALVO/REVISTA]."
  },
  {
    id: 'doc_formal',
    label: 'Reescrita Executiva',
    prompt: "Atue como um Assessor de Comunicação Executiva. Reescreva o texto abaixo elevando o tom para uma linguagem extremamente profissional, polida e persuasiva, adequada para ser enviada a um CEO ou Conselho de Administração. Elimine repetições, melhore a coesão e utilize vocabulário de alto nível corporativo.\n\nTEXTO ORIGINAL: [COLE AQUI]"
  }
];

export const COMMAND_LIBRARY = [
  {
    category: "Jurídico & Contratos",
    items: [
      { title: "Contrato de Prestação de Serviços", prompt: "Redija um contrato de prestação de serviços entre [CONTRATANTE] e [CONTRATADA] para o serviço de [DESCREVER SERVIÇO]. Inclua cláusulas de pagamento, prazos, multa por atraso e confidencialidade." },
      { title: "Notificação Extrajudicial", prompt: "Elabore uma Notificação Extrajudicial formal para cobrança de valores em atraso referentes a [DESCREVER DÍVIDA]. O tom deve ser firme, porém respeitoso, citando o Código Civil Brasileiro quando pertinente." },
      { title: "Termo de Confidencialidade (NDA)", prompt: "Crie um Termo de Confidencialidade (NDA) unilateral para proteger informações sensíveis sobre [PROJETO/INFORMAÇÃO] que serão compartilhadas com um prestador de serviços." }
    ]
  },
  {
    category: "Corporativo & Administrativo",
    items: [
      { title: "Ata de Reunião Formal", prompt: "Com base nas anotações abaixo, redija uma Ata de Reunião formal. Estruture com: Data/Hora, Presentes, Pauta, Deliberações (Decisões tomadas), Responsáveis por Ações (Action Items) e Prazos.\n\nANOTAÇÕES: [COLE AQUI]" },
      { title: "Memorando Executivo", prompt: "Escreva um Memorando interno para comunicar [MUDANÇA/NOVA POLÍTICA] a todos os colaboradores. Utilize uma linguagem clara, objetiva e motivadora, explicando os motivos e os benefícios da mudança." },
      { title: "Proposta Comercial", prompt: "Desenvolva uma estrutura de Proposta Comercial persuasiva para o cliente [NOME]. Inclua: Resumo Executivo, Entendimento do Problema, Nossa Solução, Metodologia, Cronograma, Investimento e Termos." }
    ]
  },
  {
    category: "Acadêmico & Editorial",
    items: [
      { title: "Resumo Expandido (Abstract)", prompt: "Gere um Resumo Expandido acadêmico sobre o texto anexo. O resumo deve conter: Objetivo, Metodologia, Resultados e Conclusões, respeitando a norma culta e limite de 500 palavras." },
      { title: "Revisão Bibliográfica", prompt: "Atue como pesquisador. Sugira 5 a 10 referências bibliográficas seminais e atuais sobre o tema [TEMA]. Para cada referência, escreva um breve parágrafo explicando sua relevância para o estudo." },
      { title: "Converter Tópicos em Texto", prompt: "Transforme a lista de tópicos abaixo em um texto corrido, coeso e bem articulado, utilizando conectivos variados para garantir fluidez na leitura.\n\nTÓPICOS: [COLE AQUI]" }
    ]
  }
];
