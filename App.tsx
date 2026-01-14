
import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Paperclip, X, Zap, FileText, AlertCircle, Image as ImageIcon, Sun, Moon, FileSearch, ScrollText, LayoutTemplate, PenTool } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import LZString from 'lz-string';

import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { SettingsModal } from './components/SettingsModal';
import { AgentsModal } from './components/AgentsModal';
import { TriggersModal } from './components/TriggersModal';
import { WelcomeSetupModal } from './components/WelcomeSetupModal';
import { ModelSelector } from './components/ModelSelector';
import { FuturisticLogo } from './components/FuturisticLogo';
import { GeminiService } from './services/geminiService';
import { ChatSession, Message, AppSettings, Attachment, Agent } from './types';
import { DEFAULT_MODEL, WELCOME_MESSAGE_TEMPLATE, DEFAULT_AI_NAME, PROFESSIONAL_STARTERS } from './constants';

const generateId = () => Math.random().toString(36).substring(2, 11);

// Configuração segura do worker
try {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
} catch (e) {}

const extractTextFromPdf = async (base64: string): Promise<string> => {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const loadingTask = pdfjs.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return fullText;
  } catch (err) { return ""; }
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'google',
    modelId: DEFAULT_MODEL,
    systemInstruction: '',
    googleSearchEnabled: false,
    aiDisplayName: DEFAULT_AI_NAME,
    theme: 'dark'
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTriggersOpen, setIsTriggersOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [selectedFiles, setSelectedFiles] = useState<(Attachment & { extractedText?: string })[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiService = useRef<GeminiService>(new GeminiService());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-resize do textarea conforme o conteúdo
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reseta para calcular scrollHeight corretamente
      const newHeight = Math.min(inputRef.current.scrollHeight, 180); // Limite de 180px
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Verifica se qualquer provedor tem chave configurada
  const hasAnyApiKey = !!(settings.googleApiKey || settings.openRouterApiKey || settings.openaiApiKey || 
                        settings.anthropicApiKey || settings.deepseekApiKey || settings.groqApiKey || settings.mistralApiKey);
  
  const isCurrentProviderActive = (
    (settings.provider === 'google' && settings.googleApiKey) ||
    (settings.provider === 'openai' && settings.openaiApiKey) ||
    (settings.provider === 'anthropic' && settings.anthropicApiKey) ||
    (settings.provider === 'deepseek' && settings.deepseekApiKey) ||
    (settings.provider === 'groq' && settings.groqApiKey) ||
    (settings.provider === 'mistral' && settings.mistralApiKey) ||
    (settings.provider === 'openrouter' && settings.openRouterApiKey)
  );

  useEffect(() => {
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.theme]);

  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gemini-settings-v2');
      if (savedSettings) {
        const decompressed = LZString.decompress(savedSettings);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      }

      const savedSessions = localStorage.getItem('gemini-sessions-v2');
      if (savedSessions) {
        const decompressed = LZString.decompress(savedSessions);
        if (decompressed) {
          const parsed: ChatSession[] = JSON.parse(decompressed);
          setSessions(parsed);
          if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
          else createNewSession();
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
      setInitError("Erro ao restaurar sessão.");
    }
  }, []);

  useEffect(() => {
    const data = JSON.stringify(settings);
    localStorage.setItem('gemini-settings-v2', LZString.compress(data));
  }, [settings]);

  useEffect(() => {
    if (sessions.length > 0) {
      const data = JSON.stringify(sessions);
      try { localStorage.setItem('gemini-sessions-v2', LZString.compress(data)); } catch (e) {}
    }
  }, [sessions]);

  useEffect(() => {
    const data = JSON.stringify(agents);
    localStorage.setItem('gemini-agents-v2', LZString.compress(data));
  }, [agents]);
  
  useEffect(() => { scrollToBottom(); }, [sessions, currentSessionId]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentAgent = agents.find(a => a.id === currentSession?.agentId);
  const messages = currentSession ? currentSession.messages : [];

  const createNewSession = (agentId?: string) => {
    const newSession: ChatSession = { 
      id: generateId(), 
      title: 'Nova conversa', 
      messages: [], 
      updatedAt: Date.now(), 
      agentId 
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedFiles([]);
    setInput('');
  };

  const handleSaveAgent = (savedAgent: Agent) => {
    setAgents(prev => {
      const exists = prev.some(a => a.id === savedAgent.id);
      if (exists) return prev.map(a => a.id === savedAgent.id ? savedAgent : a);
      return [...prev, savedAgent];
    });
  };

  const handleSendMessage = async () => {
    // Se não houver NENHUMA chave API configurada, mostramos o modal de boas-vindas
    if (!hasAnyApiKey) {
      setShowWelcome(true);
      return;
    }

    // Se houver chaves mas o provedor ATUAL não estiver ativo, abrimos as configurações
    if (!isCurrentProviderActive) {
      setIsSettingsOpen(true);
      return;
    }

    let targetSessionId = currentSessionId;
    if (!targetSessionId) {
      const newSessId = generateId();
      createNewSession();
      targetSessionId = newSessId;
    }

    if ((!input.trim() && selectedFiles.length === 0) || isGenerating) return;
    
    setIsGenerating(true);
    let userMsgText = input.trim();
    const currentAttachments = [...selectedFiles];
    
    const pdfTexts = currentAttachments.filter(f => f.extractedText).map(f => `[Documento ${f.fileName}]:\n${f.extractedText}`);
    if (pdfTexts.length > 0) userMsgText += '\n\n' + pdfTexts.join('\n\n');

    setInput('');
    setSelectedFiles([]);

    const userMsg: Message = { id: generateId(), role: 'user', text: input.trim() || "Arquivo enviado", attachments: currentAttachments, timestamp: Date.now() };
    const botMsgId = generateId();
    const botMsg: Message = { id: botMsgId, role: 'model', text: '', timestamp: Date.now() + 1 };

    setSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg], updatedAt: Date.now() } : s));

    try {
      const sessionToProcess = sessions.find(s => s.id === targetSessionId);
      const history = sessionToProcess?.messages.map(m => ({ 
        role: m.role, 
        parts: [{ text: m.text }] 
      })) || [];

      const apiKeys = {
        google: settings.googleApiKey,
        openRouter: settings.openRouterApiKey,
        openai: settings.openaiApiKey,
        anthropic: settings.anthropicApiKey,
        deepseek: settings.deepseekApiKey,
        groq: settings.groqApiKey,
        mistral: settings.mistralApiKey
      };

      if (history.length === 0) {
        geminiService.current.generateTitle(userMsg.text, settings.provider, apiKeys).then(t => 
          setSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, title: t } : s))
        );
      }

      let systemPrompt = settings.systemInstruction || '';
      if (currentAgent) systemPrompt += `\nPersonalidade do Agente: ${currentAgent.systemInstruction}`;
      
      const stream = geminiService.current.streamChat(
        settings.provider,
        settings.modelId, 
        history, 
        userMsgText, 
        currentAttachments, 
        systemPrompt, 
        settings.googleSearchEnabled,
        apiKeys
      );

      for await (const chunk of stream) {
        setSessions(prev => prev.map(s => {
          if (s.id === targetSessionId) {
            const newMsgs = [...s.messages];
            const idx = newMsgs.findIndex(m => m.id === botMsgId);
            if (idx !== -1) {
              newMsgs[idx] = { ...newMsgs[idx], text: chunk.text || '', sources: chunk.sources };
            }
            return { ...s, messages: newMsgs, updatedAt: Date.now() };
          }
          return s;
        }));
      }
    } catch (e: any) {
      setSessions(prev => prev.map(s => s.id === targetSessionId ? { 
        ...s, 
        messages: s.messages.map(m => m.id === botMsgId ? { ...m, text: `Erro: ${e.message}`, isError: true } : m) 
      } : s));
    } finally { 
      setIsGenerating(false); 
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const newAtts = await Promise.all(files.map(async file => {
        const base64 = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        const extractedText = file.type === 'application/pdf' ? await extractTextFromPdf(base64) : undefined;
        return { id: generateId(), mimeType: file.type, fileName: file.name, data: base64, extractedText };
      }));
      setSelectedFiles(prev => [...prev, ...newAtts]);
    }
  };

  if (initError) {
    return (
      <div className="h-screen bg-white dark:bg-gemini-dark flex items-center justify-center p-6 text-center text-gray-900 dark:text-white">
        <div className="max-w-md space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h1 className="text-xl font-bold">Erro de Inicialização</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{initError}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 rounded-lg text-white font-bold">Recarregar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gemini-dark text-slate-800 dark:text-white overflow-hidden transition-colors duration-300">
      <Sidebar 
        isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        sessions={sessions} agents={agents} currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId} onNewChat={() => createNewSession()} onNewAgentChat={createNewSession}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(currentSessionId === id) setCurrentSessionId(null); }}
        onOpenSettings={() => setIsSettingsOpen(true)} onOpenAgentModal={(a) => { setEditingAgent(a || null); setIsAgentModalOpen(true); }}
        onDeleteAgent={(id, e) => { e.stopPropagation(); setAgents(prev => prev.filter(a => a.id !== id)); }}
        aiDisplayName={settings.aiDisplayName}
        isGenerating={isGenerating}
      />
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-gemini-dark/80 backdrop-blur-md z-10 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"><Menu size={18} /></button>
            <ModelSelector 
              settings={settings} 
              onUpdateSettings={(newSettings) => setSettings(prev => ({...prev, ...newSettings}))}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
          <button 
            onClick={toggleTheme} 
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
          >
            {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar scroll-smooth">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                <div className="float-animation mb-6">
                   <FuturisticLogo size={60} isProcessing={isGenerating} />
                </div>
                <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 dark:from-blue-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent text-center tracking-tight px-4">
                  {WELCOME_MESSAGE_TEMPLATE.replace("{name}", settings.aiDisplayName)}
                </h1>
                <p className="text-gray-500 dark:text-gray-600 text-[10px] max-w-xs text-center leading-relaxed font-black uppercase tracking-[0.3em] mb-10">
                   Engenharia de Documentos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                   {PROFESSIONAL_STARTERS.map(starter => (
                     <button 
                        key={starter.id}
                        onClick={() => setInput(starter.prompt)}
                        className="px-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all flex flex-col gap-1 group shadow-sm dark:shadow-none text-left"
                     >
                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{starter.label}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{starter.prompt}</span>
                     </button>
                   ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-4 pb-12">
                {messages.map((m, idx) => (
                  <MessageBubble 
                    key={m.id} 
                    message={m} 
                    isAgentContext={!!currentAgent} 
                    themeColor={currentAgent?.themeColor} 
                    avatar={currentAgent?.avatar} 
                    isTyping={isGenerating && idx === messages.length - 1 && m.role === 'model'} 
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/80 dark:bg-gemini-dark/80 backdrop-blur-md transition-colors duration-300">
          <div className="max-w-3xl mx-auto space-y-3">
            {selectedFiles.length > 0 && (
               <div className="flex flex-wrap gap-2 px-1">
                  {selectedFiles.map(file => (
                    <div key={file.id} className="relative group bg-gray-100 dark:bg-white/10 rounded-xl p-2 border border-gray-200 dark:border-white/10 flex items-center gap-3 animate-message">
                       <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                       <span className="text-xs font-bold text-gray-700 dark:text-gray-200 max-w-[120px] truncate">{file.fileName}</span>
                       <button onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))} className="text-gray-500 hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
               </div>
            )}
            <div className={`
              flex items-end gap-3 glass rounded-[2rem] p-4 transition-all duration-500 border border-gray-200 dark:border-white/5
              ${isGenerating ? 'opacity-50 pointer-events-none grayscale' : 'focus-within:border-blue-500/40 shadow-2xl'}
            `}>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <button onClick={() => setIsTriggersOpen(true)} className="p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/20 rounded-2xl transition-all" title="Biblioteca de Prompts"><Zap size={22} /></button>
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:bg-black/5 rounded-2xl transition-all" title="Anexar Arquivos"><Paperclip size={22} /></button>
              <textarea 
                ref={inputRef} value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} 
                placeholder="Como posso ajudar com seus documentos hoje?" 
                className="w-full bg-transparent text-gray-900 dark:text-white py-3 outline-none resize-none min-h-[50px] text-sm placeholder-gray-400 px-2 custom-scrollbar" 
                rows={1} 
              />
              <button 
                onClick={handleSendMessage} 
                disabled={isGenerating || (!input.trim() && selectedFiles.length === 0)} 
                className={`p-4 rounded-2xl transition-all mb-0.5 shrink-0 ${isGenerating || (!input.trim() && selectedFiles.length === 0) ? 'bg-gray-100 dark:bg-white/5 text-gray-400' : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/10'}`}
              >
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>
        
        <WelcomeSetupModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} onOpenSettings={() => { setShowWelcome(false); setIsSettingsOpen(true); }} />
        
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} onExportData={() => {}} onImportData={() => {}} />
        <AgentsModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} onSaveAgent={handleSaveAgent} agentToEdit={editingAgent} />
        <TriggersModal isOpen={isTriggersOpen} onClose={() => setIsTriggersOpen(false)} onSelectPrompt={setInput} />
      </main>
    </div>
  );
};

export default App;
