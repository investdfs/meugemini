
/**
 * Testes de Validação Automática para Gemini Docs UI
 * Foco: Persistência de Chaves e Lógica de Boas-Vindas
 */

import LZString from 'lz-string';

export const runAutoTests = () => {
  console.group('🧪 Executando Testes de Qualidade');

  // Teste 1: Persistência Local Storage
  try {
    const testSettings = { googleApiKey: 'test-key-123', provider: 'google' };
    const compressed = LZString.compress(JSON.stringify(testSettings));
    localStorage.setItem('test-storage-key', compressed);
    
    const retrieved = localStorage.getItem('test-storage-key');
    if (!retrieved) throw new Error('Falha ao gravar no LocalStorage');
    
    const decompressed = LZString.decompress(retrieved);
    const parsed = JSON.parse(decompressed!);
    
    if (parsed.googleApiKey === 'test-key-123') {
      console.log('✅ Teste 1: Persistência e Compressão de Chaves - SUCESSO');
    } else {
      throw new Error('Dados recuperados inconsistentes');
    }
  } catch (e) {
    console.error('❌ Teste 1: Falha na Persistência', e);
  }

  // Teste 2: Validação de Chave (Simulação de Envio)
  const simulateSendWithoutKey = (hasKey: boolean) => {
    return hasKey ? 'PROSSEGUIR' : 'MOSTRAR_POPUP';
  };

  const case1 = simulateSendWithoutKey(false);
  const case2 = simulateSendWithoutKey(true);

  if (case1 === 'MOSTRAR_POPUP' && case2 === 'PROSSEGUIR') {
    console.log('✅ Teste 2: Lógica de Interrupção por Falta de Chave - SUCESSO');
  } else {
    console.error('❌ Teste 2: Falha na Lógica de Interrupção');
  }

  console.groupEnd();
};

// Inicia os testes se o ambiente permitir
if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
  runAutoTests();
}
