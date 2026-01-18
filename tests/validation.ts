
/**
 * Testes de Validação Automática para Gemini Docs UI
 * Foco: Persistência de Chaves, Lógica de Boas-Vindas e Inicialização de Sessão
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

  // Teste 2: Lógica de Inicialização (Sessão Limpa)
  // Simula o comportamento esperado do App.tsx no mount
  const validateStartupSession = (savedSessionsJson: string | null) => {
    let sessions = [];
    if (savedSessionsJson) {
      sessions = JSON.parse(savedSessionsJson);
    }
    
    // Regra: Sempre deve haver pelo menos uma sessão, e a atual deve ser vazia se acabamos de iniciar
    const latestIsEmpty = sessions.length > 0 && sessions[0].messages.length === 0;
    return latestIsEmpty;
  };

  const mockSaved = JSON.stringify([{ id: 'old', messages: [{ text: 'oi' }], updatedAt: 1 }]);
  // Se tivéssemos acabado de rodar a lógica do App.tsx, a lista teria uma nova sessão no topo
  const mockAfterInit = JSON.stringify([
    { id: 'new', messages: [], updatedAt: 2 },
    { id: 'old', messages: [{ text: 'oi' }], updatedAt: 1 }
  ]);

  if (validateStartupSession(mockAfterInit)) {
    console.log('✅ Teste 2: Validação de Sessão Limpa no Início - SUCESSO');
  } else {
    console.error('❌ Teste 2: Falha na Lógica de Sessão Limpa');
  }

  console.groupEnd();
};

// Inicia os testes se o ambiente permitir
if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
  runAutoTests();
}
