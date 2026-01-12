/**
 * Configuração centralizada para o deploy na Vercel.
 * Adicionado fallback seguro para evitar crash em ambientes onde 'process' não é injetado.
 */

const getSafeEnv = (key: string): string => {
  try {
    // Tenta acessar via process.env (padrão Node/Vercel)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // Fallback para import.meta.env (padrão Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
  } catch (e) {
    console.warn(`Erro ao acessar variável de ambiente ${key}:`, e);
  }
  return '';
};

export const ENV = {
  // A regra de ouro exige process.env.API_KEY
  GOOGLE_API_KEY: getSafeEnv('API_KEY'),
  OPENROUTER_API_KEY: getSafeEnv('OPENROUTER_API_KEY'),
  APP_NAME: 'Gemini Profissional UI',
  IS_VERCEL: typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'),
};
