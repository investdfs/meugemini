/**
 * Configuração centralizada para o deploy na Vercel.
 * As chaves devem ser configuradas no painel da Vercel como:
 * API_KEY -> Sua chave do Google Gemini
 * OPENROUTER_API_KEY -> Sua chave da OpenRouter (Opcional)
 */

export const ENV = {
  // Conforme regra de ouro: Chave Gemini deve vir estritamente de process.env.API_KEY
  GOOGLE_API_KEY: process.env.API_KEY || '',
  
  // Chave OpenRouter
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  
  // Nome padrão da aplicação
  APP_NAME: 'Gemini Profissional UI',
  
  // Status do Ambiente
  IS_VERCEL: window.location.hostname.includes('vercel.app'),
};
