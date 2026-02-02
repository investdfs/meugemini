**Última Atualização:** 2026-02-02 14:45
**Status:** Integração API corrigida. Chat agora usa chaves e modelo do Dashboard de IA.

### 🏗️ Arquitetura & Stack
- **Framework:** React 19 executado via Vite.
- **Linguagem:** TypeScript.
- **IA:** Integração nativa com `@google/genai` (Gemini) e suporte a OpenRouter através de proxy.
- **Processamento de Dados:**
  - `pdfjs-dist`: Manipulação de PDFs.
  - `tesseract.js`: OCR para extração de texto de imagens.
  - `docx`: Geração de documentos Word.
  - `lz-string`: Compressão de dados.
  - `crypto-js`: Criptografia/Segurança.
- **Frontend/UI:** Lucide React (ícones), React Markdown (renderização de chat).

### 🔄 Fluxos de Dados & Lógica
- **Frontend -> API:** O `App.tsx` e `services/` comunicam-se com a rota de API Edge em `api/chat.ts`.
- **API Proxy:** O handler em `api/chat.ts` decide entre o provider `google` ou `openrouter` com base na configuração enviada, gerenciando chaves de API via variáveis de ambiente (`API_KEY`, `OPENROUTER_API_KEY`).
- **Anexos:** Suporte para envio de dados `inlineData` (Base64) diretamente para a IA.

### ⚖️ Decisões Críticas (Log de Escolhas)
- **Vite como Bundler:** Escolhido pela velocidade de carregamento e facilidade de configuração em relação ao Webpack.
- **Edge Runtime:** Configurado em `api/chat.ts` para menor latência e melhor escalabilidade.
- **Multi-Provider:** Implementada lógica para alternar entre Gemini nativo e OpenRouter para maior flexibilidade de modelos.
- **Adição de Tipos:** Instalados `@types/react`, `@types/react-dom`, `@types/crypto-js`, `@types/lz-string` e `@types/uuid` para resolver erros de compilação.

### 📍 Estado Atual & Pendências
- **Feito:**
  - Estrutura base do projeto criada.
  - Arquivo `.env` inicializado.
  - Instalação de todas as dependências concluída.
  - Correção de erro de tipagem no Sidebar.tsx.
  - Validação de tipos (TSC) concluída com sucesso.
  - **Módulo de Gestão de Modelos de IA implementado:**
    - Strategy Pattern com 7 providers (OpenRouter, Google, OpenAI, Anthropic, DeepSeek, Groq, xAI)
    - CRUD completo de modelos com priorização e fallback
    - Dashboard Admin com UI moderna (`ModelDashboard.tsx`)
    - Criptografia AES para chaves de API (`encryption.ts`)
    - Hook React `useAIModels` para integração
- **Bloqueios:** Nenhum detectado.
- **Próximos Passos:** 
  - Integrar `<ModelDashboard />` na interface principal.
  - Migrar `geminiService.ts` para usar `aiModelManager`.
  - Testar sistema de fallback em produção.

---
**Confirmação:** Protocolo de memória ativado. Este arquivo foi atualizado após implementação do Módulo de Gestão de Modelos de IA.

