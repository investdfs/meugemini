
import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Paperclip, X, Zap, FileText, AlertCircle, Sun, Moon, Database, Search, Layout, Columns, Lock, Play, Loader2, ScanSearch } from 'lucide-react';
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
import { DocumentEditor } from './components/DocumentEditor';
import { MasterPasswordModal } from './components/MasterPasswordModal';
import { GeminiService } from './services/geminiService';
import { RagService } from './services/ragService';
import { SecurityService } from './services/securityService';
import { OcrService } from './services/ocrService';
import { ChatSession, Message, AppSettings, Attachment, Agent, KnowledgeChunk } from './types';
import { DEFAULT_MODEL, WELCOME_MESSAGE_TEMPLATE, DEFAULT_AI_NAME, PROFESSIONAL_STARTERS } from './constants';

const generateId = () => Math.random().toString(36).substring(2, 11);

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
  const [isLocked, setIsLocked] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

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
  const [isTriggersOpen, setIsTriggersOpen] = useState(false);

  const [ocrProcessing, setOcrProcessing] = useState<{ [key: string]: number }>({});

  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [selectedFiles, setSelectedFiles] = useState<(Attachment & { extractedText?: string, isOcr?: boolean })[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeChunk[]>([]);
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 180);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const hasAnyApiKey = !!(settings.googleApiKey || settings.openRouterApiKey || settings.openaiApiKey || 
                        settings.anthropicApiKey || settings.deepseekApiKey || settings.groqApiKey || settings.mistralApiKey || settings.xaiApiKey);
  
  const isCurrentProviderActive = (
    (settings.provider === 'google' && settings.googleApiKey) ||
    (settings.provider === 'openai' && settings.openaiApiKey) ||
    (settings.provider === 'anthropic' && settings.anthropicApiKey) ||
    (settings.provider === 'deepseek' && settings.deepseekApiKey) ||
    (settings.provider === 'groq' && settings.groqApiKey) ||
    (settings.provider === 'mistral' && settings.mistralApiKey) ||
    (settings.provider === 'openrouter' && settings.openRouterApiKey) ||
    (settings.provider === 'xai' && settings.xaiApiKey)
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
      const vaultData = localStorage.getItem('gemini-vault-v1');
      if (vaultData) {
        setIsLocked(true);
      } else {
        const savedSettings = localStorage.getItem('gemini-settings-v2');
        if (savedSettings) {
          const decompressed = LZString.decompress(savedSettings);
          if (decompressed) {
            setSettings(prev => ({ ...prev, ...JSON.parse(decompressed) }));
          }
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

  const handleUnlock = (password: string) => {
    const vaultData = localStorage.getItem('gemini-vault-v1');
    if (!vaultData) return;
    const decrypted = SecurityService.decrypt(vaultData, password);
    if (decrypted) {
      setSettings(decrypted);
      setMasterPassword(password);
      setIsLocked(false);
      setUnlockError(null);
    } else {
      setUnlockError("Senha Incorreta");
    }
  };

  useEffect(() => {
    if (isLocked) return;
    if (masterPassword) {
      const encrypted = SecurityService.encrypt(settings, masterPassword);
      localStorage.setItem('gemini-vault-v1', encrypted);
      localStorage.removeItem('gemini-settings-v2');
    } else {
      const data = JSON.stringify(settings);
      localStorage.setItem('gemini-settings-v2', LZString.compress(data));
      localStorage.removeItem('gemini-vault-v1');
    }
  }, [settings, masterPassword, isLocked]);

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
  const editorContent = currentSession?.editorContent || "";

  const createNewSession = (agentId?: string) => {
    const newSession: ChatSession = { 
      id: generateId(), 
      title: 'Nova conversa', 
      messages: [], 
      updatedAt: Date.now(), 
      agentId,
      editorContent: ""
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedFiles([]);
    setKnowledgeBase([]);
    setInput('');
  };

  const handlePushToEditor = (text: string) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, editorContent: text } : s
    ));
    if (!settings.isSplitViewEnabled) {
      setSettings(prev => ({ ...prev, isSplitViewEnabled: true }));
    }
  };

  const updateEditorContent = (newContent: string) => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, editorContent: newContent } : s
    ));
  };

  const handleDeleteAgent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja realmente excluir este agente?")) {
      setAgents(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSaveAgent = (agent: Agent) => {
    setAgents(prev => {
      const exists = prev.find(a => a.id === agent.id);
      if (exists) {
        return prev.map(a => a.id === agent.id ? agent : a);
      }
      return [agent, ...prev];
    });
  };

  const handleSendMessage = async () => {
    if (!hasAnyApiKey) { setShowWelcome(true); return; }
    if (!isCurrentProviderActive) { setIsSettingsOpen(true); return; }
    if ((!input.trim() && selectedFiles.length === 0) || isGenerating) return;
    
    setIsGenerating(true);
    let userMsgText = input.trim();
    const currentAttachments = [...selectedFiles];
    const relevantChunks = RagService.searchRelevantChunks(input, knowledgeBase);
    const contextString = RagService.formatContext(relevantChunks);
    const promptWithContext = userMsgText + (contextString ? `\n\n${contextString}` : "");

    setInput('');
    const userMsg: Message = { id: generateId(), role: 'user', text: input.trim() || "Análise de documentos", attachments: currentAttachments, timestamp: Date.now() };
    const botMsgId = generateId();
    const botMsg: Message = { id: botMsgId, role: 'model', text: '', timestamp: Date.now() + 1, retrievedChunks: relevantChunks.length > 0 ? relevantChunks : undefined };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg], updatedAt: Date.now() } : s));

    try {
      const history = currentSession?.messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })) || [];
      const apiKeys = {
        google: settings.googleApiKey, openRouter: settings.openRouterApiKey, openai: settings.openaiApiKey,
        anthropic: settings.anthropicApiKey, deepseek: settings.deepseekApiKey, groq: settings.groqApiKey,
        mistral: settings.mistralApiKey, xai: settings.xaiApiKey
      };

      if (history.length === 0) {
        geminiService.current.generateTitle(userMsg.text, settings.provider, apiKeys).then(t => 
          setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: t } : s))
        );
      }

      let systemPrompt = settings.systemInstruction || '';
      if (currentAgent) systemPrompt += `\nPersonalidade do Agente: ${currentAgent.systemInstruction}`;
      
      const stream = geminiService.current.streamChat(settings.provider, settings.modelId, history, promptWithContext, [], systemPrompt, settings.googleSearchEnabled, apiKeys);

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
    } finally { setIsGenerating(false); setTimeout(() => inputRef.current?.focus(), 100); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      
      const newAtts = await Promise.all(files.map(async file => {
        const fileId = generateId();
        const base64 = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        
        let extractedText = "";
        let isOcr = false;

        if (file.type === 'application/pdf') {
          extractedText = await extractTextFromPdf(base64);
          
          if (extractedText.trim().length < 50) {
             setOcrProcessing(prev => ({ ...prev, [fileId]: 0.1 }));
             extractedText = await OcrService.recognizeScannedPdf(base64, (p) => {
                setOcrProcessing(prev => ({ ...prev, [fileId]: p }));
             });
             setOcrProcessing(prev => { const n = { ...prev }; delete n[fileId]; return n; });
             isOcr = true;
          }
        } else if (file.type.startsWith('image/')) {
          setOcrProcessing(prev => ({ ...prev, [fileId]: 0.1 }));
          extractedText = await OcrService.recognizeImage(base64, (p) => {
             setOcrProcessing(prev => ({ ...prev, [fileId]: p }));
          });
          setOcrProcessing(prev => { const n = { ...prev }; delete n[fileId]; return n; });
          isOcr = true;
        } else if (file.type === 'text/plain') {
          extractedText = atob(base64);
        }

        if (extractedText) {
          const chunks = RagService.createChunks(extractedText, fileId, file.name);
          setKnowledgeBase(prev => [...prev, ...chunks]);
        }

        return { id: fileId, mimeType: file.type, fileName: file.name, data: base64, extractedText, isOcr };
      }));

      setSelectedFiles(prev => [...prev, ...newAtts]);
    }
  };

  if (isLocked) return <MasterPasswordModal onUnlock={handleUnlock} error={unlockError} />;

  return (
    <div className="flex h-screen bg-soft-bg dark:bg-gemini-dark text-slate-800 dark:text-white overflow-hidden transition-colors duration-300">
      <Sidebar 
        isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        sessions={sessions} agents={agents} currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId} onNewChat={() => createNewSession()} onNewAgentChat={createNewSession}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); if(currentSessionId === id) setCurrentSessionId(null); }}
        onOpenSettings={() => setIsSettingsOpen(true)} onOpenAgentModal={(a) => { setEditingAgent(a || null); setIsAgentModalOpen(true); }}
        onDeleteAgent={handleDeleteAgent}
        aiDisplayName={settings.aiDisplayName}
        isGenerating={isGenerating}
      />
      <main className="flex-1 flex flex-row h-full relative">
        <div className={`flex flex-col h-full transition-all duration-500 ${settings.isSplitViewEnabled ? 'w-1/2' : 'w-full'}`}>
          <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/5 bg-soft-bg/80 dark:bg-gemini-dark/80 backdrop-blur-md z-10 shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"><Menu size={18} /></button>
              <ModelSelector settings={settings} onUpdateSettings={(s) => setSettings(prev => ({...prev, ...s}))} onOpenSettings={() => setIsSettingsOpen(true)} />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSettings(prev => ({ ...prev, isSplitViewEnabled: !prev.isSplitViewEnabled }))}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${settings.isSplitViewEnabled ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                <Columns size={18} />
                <span className="text-[10px] font-black uppercase hidden sm:inline">Editor</span>
              </button>
              <button onClick={toggleTheme} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all">
                {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar scroll-smooth">
            <div className={`max-w-3xl mx-auto min-h-full flex flex-col ${settings.isSplitViewEnabled ? 'px-2' : ''}`}>
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="float-animation mb-6"><FuturisticLogo size={60} isProcessing={isGenerating} /></div>
                  <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 dark:from-blue-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent text-center tracking-tight px-4">
                    {WELCOME_MESSAGE_TEMPLATE.replace("{name}", settings.aiDisplayName)}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-600 text-[10px] max-w-xs text-center leading-relaxed font-black uppercase tracking-[0.3em] mb-10">Engenharia de Documentos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                     {PROFESSIONAL_STARTERS.map(starter => (
                       <button key={starter.id} onClick={() => setInput(starter.prompt)} className="px-4 py-3 rounded-2xl bg-soft-card dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all flex flex-col gap-1 group shadow-sm text-left">
                          <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{starter.label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{starter.prompt}</span>
                       </button>
                     ))}
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setIsTriggersOpen(true)} className="text-[10px] font-black text-gray-400 dark:text-gray-600 hover:text-blue-500 uppercase tracking-[0.25em] transition-all flex items-center gap-2 group">
                      <Zap size={10} className="group-hover:animate-pulse" /> Ver Biblioteca de Prompts
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4 pb-12">
                  {messages.map((m, idx) => (
                    <MessageBubble key={m.id} message={m} isAgentContext={!!currentAgent} themeColor={currentAgent?.themeColor} avatar={currentAgent?.avatar} isTyping={isGenerating && idx === messages.length - 1 && m.role === 'model'} onPushToEditor={handlePushToEditor} isSplitViewActive={settings.isSplitViewEnabled} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-soft-bg/80 dark:bg-gemini-dark/80 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedFiles.map(file => (
                          <div key={file.id} className="relative group bg-soft-surface dark:bg-white/10 rounded-xl p-2 border border-gray-200 dark:border-white/10 flex items-center gap-3 animate-message overflow-hidden">
                            {ocrProcessing[file.id] !== undefined ? (
                               <div className="flex items-center gap-2">
                                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">OCR {Math.round(ocrProcessing[file.id] * 100)}%</span>
                               </div>
                            ) : (
                               <div className="flex items-center gap-3">
                                  {file.isOcr ? <ScanSearch size={16} className="text-violet-500" /> : <FileText size={16} className="text-blue-600 dark:text-blue-400" />}
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 max-w-[120px] truncate">{file.fileName}</span>
                                  <button onClick={() => { setSelectedFiles(prev => prev.filter(f => f.id !== file.id)); setKnowledgeBase(prev => prev.filter(c => c.fileId !== file.id)); }} className="text-gray-500 hover:text-red-500"><X size={14} /></button>
                               </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                  {knowledgeBase.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest animate-pulse">
                      <Database size={10} /> {knowledgeBase.length} Trechos Indexados
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex items-end gap-3 glass rounded-[2rem] p-4 transition-all duration-500 border border-gray-200 dark:border-white/5 ${isGenerating ? 'opacity-50 pointer-events-none grayscale' : 'focus-within:border-blue-500/40 shadow-xl'}`}>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.txt,.png,.jpg,.jpeg" />
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:bg-black/5 rounded-2xl transition-all" title="Anexar Documentos ou Imagens para OCR"><Paperclip size={22} /></button>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} placeholder="Pergunte ou anexe uma imagem para extração OCR..." className="w-full bg-transparent text-gray-900 dark:text-white py-3 outline-none resize-none min-h-[50px] text-sm placeholder-gray-400 px-2 custom-scrollbar" rows={1} />
                <button onClick={handleSendMessage} disabled={isGenerating || (!input.trim() && selectedFiles.length === 0)} className={`p-4 rounded-2xl transition-all mb-0.5 shrink-0 ${isGenerating || (!input.trim() && selectedFiles.length === 0) ? 'bg-soft-surface dark:bg-white/5 text-gray-400' : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 shadow-xl'}`}><Send size={22} /></button>
              </div>
            </div>
          </div>
        </div>

        {settings.isSplitViewEnabled && (
          <div className="w-1/2 h-full">
            <DocumentEditor content={editorContent} onChange={updateEditorContent} onClear={() => updateEditorContent("")} theme={settings.theme} />
          </div>
        )}
        
        <WelcomeSetupModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} onOpenSettings={() => { setShowWelcome(false); setIsSettingsOpen(true); }} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} masterPassword={masterPassword} onUpdateMasterPassword={setMasterPassword} />
        <AgentsModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} onSaveAgent={handleSaveAgent} agentToEdit={editingAgent} />
        <TriggersModal isOpen={isTriggersOpen} onClose={() => setIsTriggersOpen(false)} onSelectPrompt={setInput} />
      </main>
    </div>
  );
};

export default App;
