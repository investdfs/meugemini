import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, AlertTriangle, Paperclip, X, File as FileIcon, Zap, FileText, Code, Globe, Languages } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import LZString from 'lz-string';

import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { SettingsModal } from './components/SettingsModal';
import { AgentsModal } from './components/AgentsModal';
import { TriggersModal } from './components/TriggersModal';
import { FuturisticLogo } from './components/FuturisticLogo';
import { GeminiService } from './services/geminiService';
import { ChatSession, Message, AppSettings, Attachment, Agent } from './types';
import { DEFAULT_MODEL, WELCOME_MESSAGE_TEMPLATE, AVAILABLE_MODELS, DEFAULT_AI_NAME, PROFESSIONAL_STARTERS } from './constants';
import { ENV } from './config/env';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
};

pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

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
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTriggersOpen, setIsTriggersOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<(Attachment & { extractedText?: string })[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const geminiService = useRef<GeminiService>(new GeminiService(settings.provider));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('gemini-settings-v2');
    if (savedSettings) {
      const decompressed = LZString.decompress(savedSettings);
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        setSettings(parsed);
        geminiService.current.updateConfig(parsed.provider);
      }
    }
    const savedSessions = localStorage.getItem('gemini-sessions-v2');
    if (savedSessions) {
      const decompressed = LZString.decompress(savedSessions);
      if (decompressed) setSessions(JSON.parse(decompressed));
    } else {
      createNewSession();
    }
    const savedAgents = localStorage.getItem('gemini-agents-v2');
    if (savedAgents) {
      const decompressed = LZString.decompress(savedAgents);
      if (decompressed) setAgents(JSON.parse(decompressed));
    }
  }, []);

  useEffect(() => {
    const data = JSON.stringify(settings);
    localStorage.setItem('gemini-settings-v2', LZString.compress(data));
    geminiService.current.updateConfig(settings.provider);
  }, [settings]);

  useEffect(() => {
    const data = JSON.stringify(sessions);
    try { localStorage.setItem('gemini-sessions-v2', LZString.compress(data)); } catch (e) {}
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
      title: agentId ? `Agente: ${agents.find(a => a.id === agentId)?.name}` : 'Nova conversa', 
      messages: [], 
      updatedAt: Date.now(), 
      agentId 
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedFiles([]);
    setInput('');
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isGenerating || !currentSessionId) return;
    
    setIsGenerating(true);
    let userMsgText = input.trim();
    const currentAttachments = [...selectedFiles];
    const pdfTexts = currentAttachments.filter(f => f.extractedText).map(f => `[Conteúdo do PDF ${f.fileName}]:\n${f.extractedText}`);
    if (pdfTexts.length > 0) userMsgText += '\n\n' + pdfTexts.join('\n\n');

    setInput('');
    setSelectedFiles([]);

    const userMsg: Message = { id: generateId(), role: 'user', text: userMsgText, attachments: currentAttachments, timestamp: Date.now() };
    const botMsgId = generateId();
    const botMsg: Message = { id: botMsgId, role: 'model', text: '...', timestamp: Date.now() + 1 };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg], updatedAt: Date.now() } : s));

    try {
      const history = currentSession?.messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })) || [];
      if (history.length === 0) geminiService.current.generateTitle(userMsgText).then(t => setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: t } : s)));
      let systemPrompt = settings.systemInstruction || '';
      if (currentAgent) systemPrompt += `\nPersonalidade: ${currentAgent.systemInstruction}`;
      const stream = geminiService.current.streamChat(settings.modelId, history, userMsgText, currentAttachments, systemPrompt, settings.googleSearchEnabled);
      for await (const chunk of stream) {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const newMsgs = [...s.messages];
            const idx = newMsgs.findIndex(m => m.id === botMsgId);
            if (idx !== -1) newMsgs[idx] = { ...newMsgs[idx], text: chunk.text, sources: chunk.sources };
            return { ...s, messages: newMsgs, updatedAt: Date.now() };
          }
          return s;
        }));
      }
    } catch (e: any) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: s.messages.map(m => m.id === botMsgId ? { ...m, text: e.message, isError: true } : m) } : s));
    } finally { setIsGenerating(false); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
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

  const getStarterIcon = (iconName: string) => {
    switch(iconName) {
      case 'FileText': return <FileText size={18} />;
      case 'Code': return <Code size={18} />;
      case 'Globe': return <Globe size={18} />;
      case 'Languages': return <Languages size={18} />;
      default: return <Zap size={18} />;
    }
  };

  return (
    <div className="flex h-screen bg-gemini-dark text-white overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        sessions={sessions} agents={agents} currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId} onNewChat={() => createNewSession()} onNewAgentChat={createNewSession}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); }}
        onOpenSettings={() => setIsSettingsOpen(true)} onOpenAgentModal={(a) => { setEditingAgent(a || null); setIsAgentModalOpen(true); }}
        onDeleteAgent={(id, e) => { e.stopPropagation(); setAgents(prev => prev.filter(a => a.id !== id)); }}
        aiDisplayName={settings.aiDisplayName}
        isGenerating={isGenerating}
      />
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-gemini-dark/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"><Menu size={22} /></button>
            <div onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 px-3 rounded-2xl transition-all group border border-transparent hover:border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="font-semibold text-sm text-gray-300 group-hover:text-white">{AVAILABLE_MODELS.find(m => m.id === settings.modelId)?.name}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="float-animation mb-10">
                   <FuturisticLogo size={160} isProcessing={isGenerating} />
                </div>
                <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent text-center tracking-tight">
                  {WELCOME_MESSAGE_TEMPLATE.replace("{name}", settings.aiDisplayName)}
                </h1>
                <p className="text-gray-500 text-sm max-w-lg text-center leading-relaxed font-medium mb-12">
                   Sua central de inteligência avançada. Selecione um gatilho profissional ou comece uma conversa livre.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
                   {PROFESSIONAL_STARTERS.map(starter => (
                     <button 
                        key={starter.id}
                        onClick={() => setInput(starter.prompt)}
                        className="p-5 rounded-[24px] bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left flex flex-col gap-3 group relative overflow-hidden"
                     >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-400/10 transition-all">
                          {getStarterIcon(starter.icon)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-gray-200 group-hover:text-white">{starter.label}</span>
                           <p className="text-[11px] text-gray-500 line-clamp-1 mt-1 font-medium">{starter.prompt}</p>
                        </div>
                        <div className="absolute top-4 right-4 text-xs font-black text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">PROMPT+</div>
                     </button>
                   ))}
                   <button 
                    onClick={() => setIsTriggersOpen(true)}
                    className="col-span-2 mt-2 p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/20 hover:border-blue-500/40 transition-all text-sm font-bold text-blue-300 flex items-center justify-center gap-3 group"
                   >
                     <Zap size={18} className="group-hover:animate-pulse" />
                     VER BIBLIOTECA COMPLETA DE COMANDOS
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-2">
                {messages.map(m => (
                  <MessageBubble key={m.id} message={m} isAgentContext={!!currentAgent} themeColor={currentAgent?.themeColor} avatar={currentAgent?.avatar} isTyping={isGenerating && m.id === messages[messages.length-1].id && m.role === 'model'} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gemini-dark/80 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto">
            <div className={`
              flex items-end gap-2 glass rounded-[32px] p-2.5 transition-all duration-500
              ${isGenerating ? 'opacity-50 pointer-events-none' : 'focus-within:border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'}
            `}>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <button onClick={() => setIsTriggersOpen(true)} className="p-3.5 text-blue-400 hover:text-white hover:bg-blue-500/10 rounded-full transition-all" title="Biblioteca de Comandos"><Zap size={22} /></button>
              <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all" title="Anexar arquivos"><Paperclip size={22} /></button>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} placeholder="Digite seu comando profissional..." className="w-full bg-transparent text-white py-3.5 outline-none resize-none max-h-48 text-[15px] font-medium placeholder-gray-600 px-2" rows={1} />
              <button onClick={handleSendMessage} disabled={isGenerating} className={`p-3.5 rounded-full transition-all shadow-xl ${isGenerating ? 'bg-gray-800 text-gray-600' : 'bg-white text-black hover:scale-105 active:scale-95'}`}><Send size={22} /></button>
            </div>
          </div>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} onExportData={() => {}} onImportData={() => {}} />
        <AgentsModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} onSaveAgent={a => setAgents(prev => [...prev, a])} agentToEdit={editingAgent} />
        <TriggersModal isOpen={isTriggersOpen} onClose={() => setIsTriggersOpen(false)} onSelectPrompt={setInput} />
      </main>
    </div>
  );
};

export default App;