
/**
 * Configuração centralizada para o ambiente.
 * Evita o erro "process is not defined" no navegador.
 */

export const getSafeEnv = (key: string): string => {
  try {
    // No lado do servidor (Vercel Edge), process.env funciona
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // Silencioso no browser
  }
  return '';
};

export const ENV = {
  // Verificamos se estamos no browser ou servidor
  IS_SERVER: typeof window === 'undefined',
  IS_VERCEL: typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'),
  APP_NAME: 'Assistente Léo'
};
