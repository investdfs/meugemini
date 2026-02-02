**Última Atualização:** 2026-02-02 15:42
**Status:** Integração NVIDIA NIM (Kimi K2.5) implementada. Pronto para uso via Dashboard.

### 🏗️ Arquitetura & Stack
- **Framework:** React 19 executado via Vite.
- **Linguagem:** TypeScript.
- **IA:** Integração multi-provider com Strategy Pattern:
  - OpenRouter, Google Gemini, OpenAI, Anthropic, DeepSeek, Groq, Mistral, xAI
  - **NOVO:** NVIDIA NIM (Kimi K2.5 com thinking mode)
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
- **AI Model Manager:** `services/ai/AIModelManager.ts` gerencia todos os providers com fallback automático.
- **Anexos:** Suporte para envio de dados `inlineData` (Base64) diretamente para a IA.

### ⚖️ Decisões Críticas (Log de Escolhas)
- **Vite como Bundler:** Escolhido pela velocidade de carregamento e facilidade de configuração em relação ao Webpack.
- **Edge Runtime:** Configurado em `api/chat.ts` para menor latência e melhor escalabilidade.
- **Multi-Provider:** Implementada lógica para alternar entre Gemini nativo e OpenRouter para maior flexibilidade de modelos.
- **NVIDIA NIM Provider:** Criado provider especializado (`NvidiaProvider.ts`) com suporte a `chat_template_kwargs` para o modo thinking do Kimi K2.5.
- **Adição de Tipos:** Instalados `@types/react`, `@types/react-dom`, `@types/crypto-js`, `@types/lz-string` e `@types/uuid` para resolver erros de compilação.

### 📍 Estado Atual & Pendências
- **Feito:**
  - Estrutura base do projeto criada.
  - Arquivo `.env` inicializado.
  - Instalação de todas as dependências concluída.
  - Correção de erro de tipagem no Sidebar.tsx.
  - Validação de tipos (TSC) concluída com sucesso.
  - **Módulo de Gestão de Modelos de IA implementado:**
    - Strategy Pattern com 9 providers (OpenRouter, Google, OpenAI, Anthropic, DeepSeek, Groq, Mistral, xAI, **NVIDIA**)
    - CRUD completo de modelos com priorização e fallback
    - Dashboard Admin com UI moderna (`ModelDashboard.tsx`)
    - Criptografia AES para chaves de API (`encryption.ts`)
    - Hook React `useAIModels` para integração
  - **Integração NVIDIA NIM (Kimi K2.5):**
    - Provider `NvidiaProvider.ts` com suporte a thinking mode
    - Streaming de respostas com `reasoning_content`
    - Modelo padrão configurado em `providerDefaults.ts`
- **Bloqueios:** Nenhum detectado.
- **Próximos Passos:** 
  - Configurar chave API NVIDIA no Dashboard e testar conexão.
  - Testar chat com Kimi K2.5 para validar thinking mode.

---
**Confirmação:** Protocolo de memória ativado. Este arquivo foi atualizado após implementação da integração NVIDIA NIM.


