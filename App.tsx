import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Menu, Sparkles, AlertTriangle, History, Lightbulb, Paperclip, X, File as FileIcon, Bot } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjs from 'pdfjs-dist';

import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { SettingsModal } from './components/SettingsModal';
import { AgentsModal } from './components/AgentsModal';
import { GeminiService } from './services/geminiService';
import { ChatSession, Message, AppSettings, ModelId, Attachment, Agent, MessageSource } from './types';
import { DEFAULT_MODEL, WELCOME_MESSAGE_TEMPLATE, AVAILABLE_MODELS, DEFAULT_AI_NAME } from './constants';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;

const SUGGESTION_TEMPLATES = [
  "Resuma o texto a seguir:",
  "Crie um código em Python para...",
  "Explique computação quântica de forma simples",
  "Escreva um e-mail profissional sobre...",
  "Dicas para melhorar a produtividade",
  "Analise os prós e contras de..."
];

const useAutoScroll = (dependencies: any[]) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, dependencies);
  return bottomRef;
};

const extractTextFromPdf = async (base64: string): Promise<string> => {
  try {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const loadingTask = pdfjs.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    return fullText.trim();
  } catch (err) {
    console.error("PDF Extraction Error:", err);
    return "";
  }
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    apiKey: process.env.API_KEY || '',
    openRouterApiKey: '',
    provider: 'google',
    modelId: DEFAULT_MODEL,
    systemInstruction: '',
    googleSearchEnabled: false,
    aiDisplayName: DEFAULT_AI_NAME,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<(Attachment & { extractedText?: string })[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{text: string, type: 'history' | 'template'}[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const geminiService = useRef<GeminiService>(new GeminiService(settings.apiKey, settings.openRouterApiKey, settings.provider));

  useEffect(() => {
    const savedSettings = localStorage.getItem('gemini-clone-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (!parsed.provider) parsed.provider = 'google';
      if (!parsed.openRouterApiKey) parsed.openRouterApiKey = '';
      if (!parsed.aiDisplayName) parsed.aiDisplayName = DEFAULT_AI_NAME;
      if (parsed.googleSearchEnabled === undefined) parsed.googleSearchEnabled = false;
      if (!parsed.apiKey && process.env.API_KEY) parsed.apiKey = process.env.API_KEY;
      setSettings(parsed);
      geminiService.current.updateConfig(parsed.apiKey, parsed.openRouterApiKey, parsed.provider);
    } else if (process.env.API_KEY) {
        const initialSettings: AppSettings = { 
            apiKey: process.env.API_KEY, 
            openRouterApiKey: '',
            provider: 'google',
            modelId: DEFAULT_MODEL,
            googleSearchEnabled: false,
            aiDisplayName: DEFAULT_AI_NAME
        };
        setSettings(initialSettings);
        geminiService.current.updateConfig(initialSettings.apiKey, '', 'google');
    }

    const savedSessions = localStorage.getItem('gemini-clone-sessions');
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    else createNewSession();

    const savedAgents = localStorage.getItem('gemini-clone-agents');
    if (savedAgents) setAgents(JSON.parse(savedAgents));
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini-clone-settings', JSON.stringify(settings));
    geminiService.current.updateConfig(settings.apiKey, settings.openRouterApiKey, settings.provider);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('gemini-clone-agents', JSON.stringify(agents));
  }, [agents]);

  const sessionsRef = useRef(sessions);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  useEffect(() => {
    const saveSessionsToStorage = () => localStorage.setItem('gemini-clone-sessions', JSON.stringify(sessionsRef.current));
    const intervalId = setInterval(saveSessionsToStorage, 30000);
    const handleBeforeUnload = () => saveSessionsToStorage();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const historyPrompts = useMemo(() => {
    const uniquePrompts = new Set<string>();
    sessions.forEach(session => {
        [...session.messages].reverse().forEach(msg => {
            if (msg.role === 'user' && msg.text.trim().length > 3) uniquePrompts.add(msg.text.trim());
        });
    });
    return Array.from(uniquePrompts);
  }, [sessions]);

  useEffect(() => {
    if (!isInputFocused || selectedFiles.length > 0) {
        setShowSuggestions(false);
        return;
    }
    const searchText = input.trim().toLowerCase();
    let matches: {text: string, type: 'history' | 'template'}[] = [];
    if (!searchText) {
        matches = [...historyPrompts.slice(0, 3).map(t => ({ text: t, type: 'history' as const })), ...SUGGESTION_TEMPLATES.slice(0, 3).map(t => ({ text: t, type: 'template' as const }))];
    } else {
        matches = [...historyPrompts.filter(p => p.toLowerCase().includes(searchText)).slice(0, 4).map(t => ({ text: t, type: 'history' as const })), ...SUGGESTION_TEMPLATES.filter(p => p.toLowerCase().includes(searchText)).slice(0, 2).map(t => ({ text: t, type: 'template' as const }))];
    }
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [input, isInputFocused, historyPrompts, selectedFiles]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentAgent = agents.find(a => a.id === currentSession?.agentId);
  const messages = currentSession ? currentSession.messages : [];
  const bottomRef = useAutoScroll([messages, isGenerating]);

  const createNewSession = (agentId?: string) => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: agentId ? `Conversa com ${agents.find(a => a.id === agentId)?.name}` : 'Nova conversa',
      messages: [],
      updatedAt: Date.now(),
      agentId: agentId
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedFiles([]);
    setInput('');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      if (newSessions.length > 0) setCurrentSessionId(newSessions[0].id);
      else createNewSession();
    }
  };

  const handleSaveAgent = (agent: Agent) => setAgents(prev => {
    const exists = prev.findIndex(a => a.id === agent.id);
    if (exists !== -1) {
        const updated = [...prev];
        updated[exists] = agent;
        return updated;
    }
    return [...prev, agent];
  });

  const handleDeleteAgent = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setAgents(prev => prev.filter(a => a.id !== id));
  };

  const handleOpenAgentModal = (agent?: Agent) => {
      setEditingAgent(agent || null);
      setIsAgentModalOpen(true);
  };

  const handleOpenSettings = () => {
    // Removida trava de senha para facilitar o acesso do usuário
    setIsSettingsOpen(true);
  };

  const handleSaveResponseToFile = (text: string) => {
      if (!currentAgent) return;
      const element = document.createElement("a");
      const file = new Blob([text], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      const safeDate = new Date().toISOString().split('T')[0];
      element.download = `${currentAgent.name}_Repo_${safeDate}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      alert(`Arquivo baixado! Arraste-o para a pasta do Drive do agente: ${currentAgent.driveFolderUrl}`);
  };

  const handleExportData = () => {
    const backupData = { sessions, agents, settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.sessions && Array.isArray(data.sessions)) {
          if (window.confirm("Isso substituirá suas conversas e agentes atuais. Deseja continuar?")) {
            setSessions(data.sessions);
            if (data.agents) setAgents(data.agents);
            if (data.settings) setSettings(data.settings);
            if (data.sessions.length > 0) setCurrentSessionId(data.sessions[0].id);
            alert("Backup restaurado com sucesso!");
          }
        } else alert("Formato de arquivo inválido.");
      } catch (err) { alert("Erro ao ler o arquivo de backup."); }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: (Attachment & { extractedText?: string })[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          let extractedText: string | undefined;
          if (file.type === 'application/pdf') {
            extractedText = await extractTextFromPdf(base64Data);
          }

          newAttachments.push({
            id: uuidv4(),
            mimeType: file.type,
            fileName: file.name,
            data: base64Data,
            extractedText
          });
        } catch (error) { console.error("Error reading file:", error); }
      }
      setSelectedFiles(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => setSelectedFiles(prev => prev.filter(f => f.id !== id));

  const handleSendMessage = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isGenerating || !currentSessionId) return;
    const isGoogle = settings.provider === 'google';
    const hasGoogleKey = !!settings.apiKey;
    const hasOpenRouterKey = !!settings.openRouterApiKey;
    if ((isGoogle && !hasGoogleKey) || (!isGoogle && !hasOpenRouterKey)) { handleOpenSettings(); return; }

    let userMsgText = input.trim();
    const currentAttachments = [...selectedFiles];
    
    const pdfTexts = currentAttachments.filter(f => f.extractedText).map(f => `[Conteúdo Extraído do PDF ${f.fileName}]:\n${f.extractedText}`);
    if (pdfTexts.length > 0) {
        userMsgText += (userMsgText ? '\n\n' : '') + pdfTexts.join('\n\n');
    }

    setInput('');
    setSelectedFiles([]);
    setShowSuggestions(false);

    const userMsg: Message = { id: uuidv4(), role: 'user', text: userMsgText, attachments: currentAttachments, timestamp: Date.now() };
    const botMsgId = uuidv4();
    const botMsg: Message = { id: botMsgId, role: 'model', text: '', timestamp: Date.now() + 1 };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg], updatedAt: Date.now() } : s));
    setIsGenerating(true);

    try {
      const currentHistory = currentSession?.messages.map(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        if (m.attachments) m.attachments.forEach(att => parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } }));
        return { role: m.role, parts: parts };
      }) || [];

      if (currentHistory.length === 0) geminiService.current.generateTitle(userMsgText || "Arquivo enviado").then(title => setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s)));

      let finalSystemInstruction = settings.systemInstruction || '';
      if (currentAgent) {
        finalSystemInstruction += `\n\n[AGENT CONTEXT: ${currentAgent.name}]\n${currentAgent.systemInstruction}`;
        if (currentAgent.driveFolderUrl) finalSystemInstruction += `\n\n[KNOWLEDGE BASE]\nYou have access to files located at this public drive link: ${currentAgent.driveFolderUrl}. Please refer to the information contained there if relevant.`;
      }

      const stream = geminiService.current.streamChat(settings.modelId, currentHistory, userMsgText, currentAttachments, finalSystemInstruction, settings.googleSearchEnabled);
      let fullResponse = "";
      let lastSources: MessageSource[] | undefined = undefined;

      for await (const chunk of stream) {
        fullResponse += chunk.text;
        if (chunk.sources) lastSources = chunk.sources;
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const newMessages = [...s.messages];
            const msgIndex = newMessages.findIndex(m => m.id === botMsgId);
            if (msgIndex !== -1) newMessages[msgIndex] = { ...newMessages[msgIndex], text: fullResponse, sources: lastSources };
            return { ...s, messages: newMessages, updatedAt: Date.now() };
          }
          return s;
        }));
      }
    } catch (error: any) {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const newMessages = [...s.messages];
          const msgIndex = newMessages.findIndex(m => m.id === botMsgId);
          if (msgIndex !== -1) newMessages[msgIndex] = { ...newMessages[msgIndex], text: newMessages[msgIndex].text ? `${newMessages[msgIndex].text}\n\n[Erro: ${error.message}]` : error.message, isError: true };
          return { ...s, messages: newMessages, updatedAt: Date.now() };
        }
        return s;
      }));
    } finally { setIsGenerating(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleSelectSuggestion = (text: string) => { setInput(text); if (inputRef.current) inputRef.current.focus(); };

  const currentModelName = AVAILABLE_MODELS.find(m => m.id === settings.modelId)?.name || settings.modelId;
  const isGoogle = settings.provider === 'google';
  const hasKey = isGoogle ? !!settings.apiKey : !!settings.openRouterApiKey;
  const welcomeMessage = WELCOME_MESSAGE_TEMPLATE.replace("{name}", settings.aiDisplayName);

  return (
    <div className="flex h-screen bg-[#131314] text-white overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        sessions={sessions} 
        agents={agents} 
        currentSessionId={currentSessionId} 
        onSelectSession={(id) => { setCurrentSessionId(id); if(window.innerWidth < 768) setIsSidebarOpen(false); }} 
        onNewChat={() => createNewSession()} 
        onNewAgentChat={(agentId) => createNewSession(agentId)} 
        onDeleteSession={deleteSession} 
        onOpenSettings={handleOpenSettings} 
        onOpenAgentModal={handleOpenAgentModal} 
        onDeleteAgent={handleDeleteAgent} 
        aiDisplayName={settings.aiDisplayName}
      />
      <main className="flex-1 flex flex-col h-full relative w-full">
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-gray-800/50 bg-[#131314]/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"><Menu size={20} /></button>
            <div onClick={handleOpenSettings} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#282a2c] cursor-pointer transition-colors">
              <span className="text-lg font-medium text-gray-200">{currentModelName}</span>
              {currentAgent && (
                <span 
                  className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm transition-all duration-300"
                  style={{ backgroundColor: `${currentAgent.themeColor}20`, borderColor: currentAgent.themeColor, color: currentAgent.themeColor }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentAgent.themeColor }}></div>
                  {currentAgent.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">{!hasKey && <button onClick={handleOpenSettings} className="flex items-center gap-2 text-amber-400 bg-amber-900/20 px-3 py-1.5 rounded-lg text-sm border border-amber-900/50 animate-pulse"><AlertTriangle size={14} /> Configurar Key</button>}</div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div 
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-2xl overflow-hidden transition-all duration-500 transform hover:scale-110`}
                  style={{ backgroundColor: currentAgent?.themeColor || (isGoogle ? '#3b82f6' : '#8b5cf6') }}
                >
                  {currentAgent ? (
                    currentAgent.avatar && currentAgent.avatar.startsWith('data:image') ? (
                      <img src={currentAgent.avatar} alt="av" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{currentAgent.avatar || '🤖'}</span>
                    )
                  ) : <Sparkles size={40} className="text-white" />}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent mb-2 text-center">
                  {currentAgent ? `Olá! Sou ${currentAgent.name}.` : welcomeMessage}
                </h1>
                <p className="text-gray-500 text-center max-w-md">
                   {currentAgent 
                    ? currentAgent.description 
                    : (isGoogle ? `Converse com a inteligência artificial mais capaz do Google.` : "Acesse múltiplos modelos através da OpenRouter.")}
                </p>
                {currentAgent?.tags && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {(currentAgent.tags as string[]).map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-900/50 border border-gray-800 rounded-full text-[10px] text-gray-400 uppercase font-black tracking-widest">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 py-4">
                {messages.map((msg, index) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isAgentContext={!!currentAgent} 
                    onSaveResponse={handleSaveResponseToFile} 
                    isTyping={isGenerating && index === messages.length - 1 && msg.role === 'model'} 
                    themeColor={currentAgent?.themeColor}
                    avatar={currentAgent?.avatar}
                  />
                ))}
                {isGenerating && messages[messages.length - 1]?.role !== 'model' && <div className="flex items-center gap-2 text-gray-500 ml-12 mb-8"><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-200"></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-400"></div></div>}
                <div ref={bottomRef} className="h-4" />
              </div>
            )}
          </div>
        </div>
        <div className="p-4 bg-[#131314] relative z-10">
          <div className="max-w-4xl mx-auto relative">
            {selectedFiles.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-3 px-1 custom-scrollbar">
                    {selectedFiles.map(file => (
                        <div key={file.id} className="relative group shrink-0">
                            {file.mimeType.startsWith('image/') ? <img src={`data:${file.mimeType};base64,${file.data}`} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-gray-700" /> : <div className="h-16 w-16 bg-[#282a2c] rounded-lg border border-gray-700 flex flex-col items-center justify-center p-1 text-center"><FileIcon size={18} className="text-gray-400" /><span className="text-[8px] truncate w-full text-gray-500">{file.fileName}</span>{file.extractedText && <span className="text-[6px] text-green-500 uppercase font-bold mt-1">Texto Extraído</span>}</div>}
                            <button onClick={() => removeFile(file.id)} className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full p-0.5 border border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                        </div>
                    ))}
                </div>
            )}
            {showSuggestions && !isGenerating && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-[#1e1f20]/95 backdrop-blur-md rounded-xl border border-gray-700 shadow-2xl overflow-hidden z-20 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
                 <div className="py-2">
                   <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center"><span>Sugestões</span><span className="text-[10px] font-normal opacity-70">Tab ou Clique para selecionar</span></div>
                   {suggestions.map((suggestion, idx) => (
                     <div key={idx} onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(suggestion.text); }} className="px-4 py-3 hover:bg-[#282a2c] cursor-pointer flex items-center gap-3 transition-colors group">{suggestion.type === 'history' ? <History size={16} className="text-gray-400 group-hover:text-blue-400" /> : <Lightbulb size={16} className="text-gray-400 group-hover:text-amber-400" />}<span className="text-sm text-gray-300 group-hover:text-white truncate">{suggestion.text}</span></div>
                   ))}
                 </div>
              </div>
            )}
            <div className={`relative flex items-end gap-2 bg-[#1e1f20] rounded-[28px] border transition-all duration-300 p-2 shadow-lg ${isGenerating ? 'border-gray-700 opacity-80 cursor-not-allowed' : 'border-gray-700 focus-within:border-gray-500 hover:border-gray-600'}`} style={{ borderColor: (!isGenerating && isInputFocused && currentAgent) ? currentAgent.themeColor : undefined }}>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf,audio/*,text/*" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isGenerating} className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-[#37393b] flex-shrink-0 mb-1 transition-colors" title="Anexar arquivo"><Paperclip size={20} /></button>
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => setIsInputFocused(true)} onBlur={() => { setTimeout(() => setIsInputFocused(false), 200); }} placeholder={isGenerating ? "A IA está pensando..." : `Converse com ${currentAgent ? currentAgent.name : settings.aiDisplayName}...`} disabled={isGenerating} className="w-full bg-transparent text-white placeholder-gray-500 py-3 min-h-[52px] max-h-[200px] outline-none resize-none overflow-y-auto" rows={1} style={{ height: input.length > 50 ? 'auto' : '52px' }} onInput={(e) => { const target = e.target as HTMLTextAreaElement; target.style.height = 'auto'; target.style.height = `${Math.min(target.scrollHeight, 200)}px`; }} />
              <button onClick={handleSendMessage} disabled={(!input.trim() && selectedFiles.length === 0) || isGenerating} className={`p-3 rounded-full flex-shrink-0 mb-1 transition-all duration-300 ${(input.trim() || selectedFiles.length > 0) && !isGenerating ? 'text-white hover:brightness-110 scale-100' : 'bg-transparent text-gray-500 cursor-not-allowed scale-90'}`} style={{ backgroundColor: (input.trim() || selectedFiles.length > 0) && !isGenerating ? (currentAgent?.themeColor || '#fff') : undefined }}><Send size={20} className={(input.trim() || selectedFiles.length > 0) && !isGenerating ? "ml-0.5" : ""} /></button>
            </div>
            <div className="text-center mt-2"><p className="text-[10px] text-gray-500">A IA pode apresentar informações imprecisas, inclusive sobre pessoas, então verifique as respostas.</p></div>
          </div>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} onExportData={handleExportData} onImportData={handleImportData} />
        <AgentsModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} onSaveAgent={handleSaveAgent} agentToEdit={editingAgent} />
      </main>
    </div>
  );
};

export default App;