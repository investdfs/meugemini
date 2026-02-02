
import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Paperclip, X, Zap, Sun, Moon, Database, Columns, Lock, Loader2, BrainCircuit, Globe, File as FileIcon } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import LZString from 'lz-string';

import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { SettingsModal } from './components/SettingsModal';
import { AgentsModal } from './components/AgentsModal';
import { WelcomeSetupModal } from './components/WelcomeSetupModal';
import { ModelSelector } from './components/ModelSelector';
import { FuturisticLogo } from './components/FuturisticLogo';
import { DocumentEditor } from './components/DocumentEditor';
import { MasterPasswordModal } from './components/MasterPasswordModal';
import { ModelDashboard } from './components/admin';
import { GeminiService } from './services/geminiService';
import { SecurityService } from './services/securityService';
import { getApiKey, getActiveModel } from './services/ai';
import { ChatSession, Message, AppSettings, Attachment, Agent, SystemConfig, NotebookSource } from './types';
import { DEFAULT_MODEL, DEFAULT_AI_NAME, PROFESSIONAL_STARTERS, DEFAULT_DIEX_AGENT, FIXED_NOTEBOOK_SOURCES } from './constants';

const generateId = () => Math.random().toString(36).substring(2, 11);

try {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
} catch (e) { }

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    globalAppName: DEFAULT_AI_NAME,
    adminWelcomeMessage: 'Sincronização de Conhecimento Mestre Ativada.',
    globalSystemContext: 'Você é um assistente militar especializado em assessoria administrativa. Suas respostas devem ser precisas, formais e baseadas nas regulamentações vigentes.',
    notebookSources: [...FIXED_NOTEBOOK_SOURCES.map(f => ({ ...f, isFixed: true }))],
    lastUpdated: Date.now()
  });

  const [settings, setSettings] = useState<AppSettings>({
    provider: 'google',
    modelId: DEFAULT_MODEL,
    systemInstruction: '',
    googleSearchEnabled: false,
    isSplitViewEnabled: false,
    aiDisplayName: DEFAULT_AI_NAME,
    theme: 'dark'
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([DEFAULT_DIEX_AGENT]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAIDashboardOpen, setIsAIDashboardOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [selectedFiles, setSelectedFiles] = useState<(Attachment & { extractedText?: string, isOcr?: boolean })[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiService = useRef<GeminiService>(new GeminiService());

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentAgent = agents.find(a => a.id === currentSession?.agentId);
  const messages = currentSession ? currentSession.messages : [];
  const editorContent = currentSession?.editorContent || "";

  useEffect(() => {
    try {
      const savedSystem = localStorage.getItem('gemini-system-config-v2');
      if (savedSystem) {
        setSystemConfig(JSON.parse(savedSystem));
      } else {
        setSystemConfig(prev => ({
          ...prev,
          notebookSources: FIXED_NOTEBOOK_SOURCES.map(f => ({ ...f, isFixed: true }))
        }));
      }

      const vaultData = localStorage.getItem('gemini-vault-v1');
      const savedSettings = localStorage.getItem('gemini-settings-v2');
      if (vaultData) {
        setIsLocked(true);
      } else if (savedSettings) {
        const decompressed = LZString.decompress(savedSettings);
        if (decompressed) setSettings(prev => ({ ...prev, ...JSON.parse(decompressed) }));
      } else {
        setIsWelcomeModalOpen(true);
      }

      const savedSessions = localStorage.getItem('gemini-sessions-v2');
      if (savedSessions) {
        const decompressed = LZString.decompress(savedSessions);
        if (decompressed) {
          const restored = JSON.parse(decompressed);
          setSessions(restored);
          if (restored.length > 0) setCurrentSessionId(restored[0].id);
        }
      } else {
        createNewSession();
      }

      const savedAgents = localStorage.getItem('gemini-agents-v2');
      if (savedAgents) {
        const decompressed = LZString.decompress(savedAgents);
        if (decompressed) setAgents(JSON.parse(decompressed));
      }
    } catch (e) {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.theme]);

  const handleUpdateSystemConfig = (newConfig: SystemConfig) => {
    const processedSources = newConfig.notebookSources.map(s => ({ ...s, isFixed: true }));
    const finalConfig = { ...newConfig, notebookSources: processedSources, lastUpdated: Date.now() };
    setSystemConfig(finalConfig);
    localStorage.setItem('gemini-system-config-v2', JSON.stringify(finalConfig));
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isGenerating) return;
    setIsGenerating(true);
    let userMsgText = input.trim();
    const currentAttachments = [...selectedFiles];
    setInput('');
    const userMsg: Message = { id: generateId(), role: 'user', text: userMsgText || "Análise Documental", attachments: currentAttachments, timestamp: Date.now() };
    const botMsgId = generateId();
    const botMsg: Message = { id: botMsgId, role: 'model', text: '', timestamp: Date.now() + 1 };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg], updatedAt: Date.now() } : s));

    try {
      const history = currentSession?.messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })) || [];
      // Prioriza chaves do Dashboard de IA, fallback para settings legados
      const apiKeys = {
        openRouterApiKey: getApiKey('openrouter') || settings.openRouterApiKey,
        openaiApiKey: getApiKey('openai') || settings.openaiApiKey,
        deepseekApiKey: getApiKey('deepseek') || settings.deepseekApiKey,
        groqApiKey: getApiKey('groq') || settings.groqApiKey,
        anthropicApiKey: getApiKey('anthropic') || settings.anthropicApiKey,
        googleApiKey: getApiKey('google') || settings.googleApiKey,
        nvidiaApiKey: getApiKey('nvidia')
      };

      // Usa modelo ativo do Dashboard se disponível
      const activeModel = getActiveModel();
      const effectiveProvider = activeModel?.providerName || settings.provider;
      const effectiveModelId = activeModel?.modelId || settings.modelId;

      let systemPrompt = systemConfig.globalSystemContext || settings.systemInstruction || 'Você é um assistente militar especializado.';
      const sources = systemConfig.notebookSources || [];

      if (currentAgent) {
        systemPrompt = `AGENTE: ${currentAgent.name.toUpperCase()}\n\n${currentAgent.systemInstruction}`;
        if (currentAgent.notebookLmUrl) systemPrompt += `\n\n[FONTE AGENTE]\nURL: ${currentAgent.notebookLmUrl}`;
      } else if (sources.length > 0) {
        const formattedSources = sources.map((s, i) => `[FONTE ${i + 1}] ${s.name}: ${s.url}`).join('\n');
        systemPrompt = `SISTEMA: ${systemConfig.globalAppName.toUpperCase()}\n\n[DIRETRIZES MESTRES]\n${systemConfig.globalSystemContext || 'Comporte-se como um assistente militar formal.'}\n\n[CONHECIMENTO MESTRE ATIVO]\nUtilize estes repositórios globais para fundamentar as respostas:\n${formattedSources}\n\n[INSTRUÇÃO DO USUÁRIO]\n${settings.systemInstruction || ''}`;
      }

      const stream = geminiService.current.streamChat(effectiveProvider as any, effectiveModelId, history, userMsgText, currentAttachments, systemPrompt, settings.googleSearchEnabled, apiKeys);
      for await (const chunk of stream) {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const newMsgs = [...s.messages];
            const idx = newMsgs.findIndex(m => m.id === botMsgId);
            if (idx !== -1) newMsgs[idx] = { ...newMsgs[idx], text: chunk.text || '', sources: chunk.sources };
            return { ...s, messages: newMsgs, updatedAt: Date.now() };
          }
          return s;
        }));
      }
    } catch (e: any) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === botMsgId ? { ...m, text: `Erro: ${e.message}`, isError: true } : m) } : s));
    } finally { setIsGenerating(false); }
  };

  const createNewSession = (agentId?: string) => {
    const agent = agents.find(a => a.id === agentId);
    const newSession: ChatSession = { id: generateId(), title: agent ? agent.name : 'Nova conversa', messages: [], updatedAt: Date.now(), agentId, editorContent: "" };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedFiles([]);
    setInput('');
  };

  return (
    <div className="flex h-screen bg-soft-bg dark:bg-gemini-dark text-slate-800 dark:text-white overflow-hidden transition-colors duration-300">
      <Sidebar
        isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions} agents={agents} currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={() => createNewSession()} onNewAgentChat={createNewSession}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if (currentSessionId === id) setCurrentSessionId(null); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAIDashboard={() => setIsAIDashboardOpen(true)}
        onOpenAgentModal={(a) => { setEditingAgent(a || null); setIsAgentModalOpen(true); }}
        onDeleteAgent={(id, e) => { e.stopPropagation(); setAgents(prev => prev.filter(a => a.id !== id)); }}
        aiDisplayName={systemConfig.globalAppName}
        isGenerating={isGenerating}
      />
      <main className="flex-1 flex flex-row h-full relative">
        <div className={`flex flex-col h-full transition-all duration-500 ${settings.isSplitViewEnabled ? 'w-1/2' : 'w-full'}`}>
          <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 dark:border-white/5 bg-soft-bg/80 dark:bg-gemini-dark/80 backdrop-blur-md z-[100] shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all shrink-0"><Menu size={18} /></button>

              {/* LOGO E NOME À ESQUERDA */}
              <div className="flex items-center gap-3 shrink-0">
                <FuturisticLogo size={28} isProcessing={isGenerating} />
                <span className="text-sm font-black hidden sm:block lg:block truncate max-w-[120px] uppercase tracking-tighter">{systemConfig.globalAppName}</span>
              </div>

              {/* SELETOR DE MODELOS POSICIONADO À ESQUERDA LOGO APÓS A MARCA */}
              <div className="hidden sm:block shrink-0">
                <ModelSelector
                  settings={settings}
                  onUpdateSettings={(newPartial) => setSettings(prev => ({ ...prev, ...newPartial }))}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onOpenAIDashboard={() => setIsAIDashboardOpen(true)}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button onClick={() => setSettings(prev => ({ ...prev, isSplitViewEnabled: !prev.isSplitViewEnabled }))} className={`p-2 rounded-lg transition-all flex items-center gap-2 ${settings.isSplitViewEnabled ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><Columns size={18} /><span className="text-[10px] font-black uppercase hidden lg:inline">Editor</span></button>
              <button onClick={() => setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all">{settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar scroll-smooth">
            <div className={`max-w-[98%] mx-auto min-h-full flex flex-col ${settings.isSplitViewEnabled ? 'px-2' : 'px-1 md:px-4'}`}>
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <FuturisticLogo size={60} isProcessing={isGenerating} className="mb-6" />
                  <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent px-4">
                    {currentAgent ? `Olá, eu sou o ${currentAgent.name}` : systemConfig.globalAppName}
                  </h1>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4 mt-8">
                    {PROFESSIONAL_STARTERS.map(starter => (
                      <button key={starter.id} onClick={() => setInput(starter.prompt)} className="px-4 py-3 rounded-2xl bg-soft-card dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all text-left group shadow-sm"><span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{starter.label}</span><span className="text-xs text-gray-500 dark:text-gray-400 block line-clamp-1">{starter.prompt}</span></button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4 pb-12 w-full">
                  {messages.map((m, idx) => (<MessageBubble key={m.id} message={m} isAgentContext={!!currentAgent} themeColor={currentAgent?.themeColor} avatar={currentAgent?.avatar} isTyping={isGenerating && idx === messages.length - 1 && m.role === 'model'} isSplitViewActive={settings.isSplitViewEnabled} onPushToEditor={(t) => setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, editorContent: t } : s))} />))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-soft-bg/80 dark:bg-gemini-dark/80 backdrop-blur-md">
            <div className="max-w-[98%] mx-auto space-y-3">
              {/* Preview de Anexos */}
              {selectedFiles.length > 0 && (
                <div className="flex gap-3 overflow-x-auto py-2 px-1 custom-scrollbar">
                  {selectedFiles.map(file => (
                    <div key={file.id} className="relative group shrink-0 animate-in fade-in zoom-in duration-200">
                      <div className="h-16 w-16 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/5 flex items-center justify-center relative">
                        {file.mimeType.startsWith('image/') ? (
                          <img src={`data:${file.mimeType};base64,${file.data}`} alt={file.fileName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 p-1">
                            <FileIcon size={20} className="text-blue-500" />
                            <span className="text-[9px] text-center line-clamp-2 w-full break-words leading-tight opacity-70">{file.fileName}</span>
                          </div>
                        )}
                        {/* Overlay com nome do arquivo no hover para imagens */}
                        {file.mimeType.startsWith('image/') && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-0.5 text-[8px] text-white truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.fileName}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className={`flex items-end gap-3 glass rounded-[2rem] p-4 border border-gray-200 dark:border-white/5 ${isGenerating ? 'opacity-50 pointer-events-none' : 'focus-within:border-blue-500/40 shadow-xl'}`}>
                <input type="file" multiple ref={fileInputRef} onChange={async (e) => { if (e.target.files) { const files = Array.from(e.target.files); const newAtts = await Promise.all(files.map(async (file: any) => { const base64 = await new Promise<string>(res => { const reader = new FileReader(); reader.onload = () => res((reader.result as string).split(',')[1]); reader.readAsDataURL(file); }); return { id: generateId(), mimeType: file.type, fileName: file.name, data: base64 }; })); setSelectedFiles(prev => [...prev, ...newAtts]); } }} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:bg-black/5 rounded-2xl transition-colors"><Paperclip size={22} /></button>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} placeholder="Digite sua mensagem..." className="w-full bg-transparent py-3 outline-none resize-none min-h-[50px] text-sm px-2 custom-scrollbar" rows={1} />
                <button onClick={handleSendMessage} disabled={isGenerating || (!input.trim() && selectedFiles.length === 0)} className={`p-4 rounded-2xl ${isGenerating || (!input.trim() && selectedFiles.length === 0) ? 'bg-soft-surface text-gray-400' : 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-xl hover:scale-105 transition-all'}`}><Send size={22} /></button>
              </div>
            </div>
          </div>
        </div>

        {settings.isSplitViewEnabled && (
          <div className="w-1/2 h-full"><DocumentEditor content={editorContent} onChange={(c) => setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, editorContent: c } : s))} onClear={() => setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, editorContent: "" } : s))} theme={settings.theme} /></div>
        )}

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} masterPassword={masterPassword} onUpdateMasterPassword={setMasterPassword} systemConfig={systemConfig} onUpdateSystemConfig={handleUpdateSystemConfig} />
        <WelcomeSetupModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} onOpenSettings={() => { setIsWelcomeModalOpen(false); setIsSettingsOpen(true); }} onSelectFreeMode={() => { setIsWelcomeModalOpen(false); }} adminWelcomeMessage={systemConfig.adminWelcomeMessage} appName={systemConfig.globalAppName} />
        <AgentsModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} onSaveAgent={(a) => { setAgents(prev => { const idx = prev.findIndex(item => item.id === a.id); if (idx !== -1) { const n = [...prev]; n[idx] = a; return n; } return [...prev, a]; }); }} agentToEdit={editingAgent} />
        {isAIDashboardOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
              <ModelDashboard onClose={() => setIsAIDashboardOpen(false)} />
            </div>
          </div>
        )}
        {isLocked && <MasterPasswordModal onUnlock={(p) => { const vaultData = localStorage.getItem('gemini-vault-v1'); if (!vaultData) return; const decrypted = SecurityService.decrypt(vaultData, p); if (decrypted) { setSettings(decrypted); setMasterPassword(p); setIsLocked(false); } else setUnlockError("Senha Incorreta"); }} error={unlockError} />}
      </main>
    </div>
  );
};

export default App;
