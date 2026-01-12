import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Menu, Sparkles, AlertTriangle, History, Lightbulb, Paperclip, X, File as FileIcon, Bot } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjs from 'pdfjs-dist';

import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { SettingsModal } from './components/SettingsModal';
import { AgentsModal } from './components/AgentsModal';
import { GeminiService } from './services/geminiService';
import { ChatSession, Message, AppSettings, Attachment, Agent, MessageSource } from './types';
import { DEFAULT_MODEL, WELCOME_MESSAGE_TEMPLATE, AVAILABLE_MODELS, DEFAULT_AI_NAME } from './constants';
import { ENV } from './config/env';

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
  const [isGenerating, setIsGenerating] = useState(false);
  
  const geminiService = useRef<GeminiService>(new GeminiService(settings.provider));

  useEffect(() => {
    const savedSettings = localStorage.getItem('gemini-clone-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      delete parsed.apiKey;
      delete parsed.openRouterApiKey;
      setSettings(parsed);
      geminiService.current.updateConfig(parsed.provider);
    }
    const savedSessions = localStorage.getItem('gemini-clone-sessions');
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    else createNewSession();
    const savedAgents = localStorage.getItem('gemini-clone-agents');
    if (savedAgents) setAgents(JSON.parse(savedAgents));
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini-clone-settings', JSON.stringify(settings));
    geminiService.current.updateConfig(settings.provider);
  }, [settings]);

  useEffect(() => { localStorage.setItem('gemini-clone-agents', JSON.stringify(agents)); }, [agents]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentAgent = agents.find(a => a.id === currentSession?.agentId);
  const messages = currentSession ? currentSession.messages : [];

  const createNewSession = (agentId?: string) => {
    const newSession: ChatSession = { id: uuidv4(), title: agentId ? `Agente: ${agents.find(a => a.id === agentId)?.name}` : 'Nova conversa', messages: [], updatedAt: Date.now(), agentId };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedFiles([]);
    setInput('');
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isGenerating || !currentSessionId) return;
    
    // Verificação de chaves via ambiente
    const isGoogle = settings.provider === 'google';
    const hasKey = isGoogle ? !!process.env.API_KEY : !!ENV.OPENROUTER_API_KEY;
    
    if (!hasKey) { 
      alert(`API Key para ${settings.provider} não configurada no ambiente.`);
      setIsSettingsOpen(true);
      return; 
    }

    let userMsgText = input.trim();
    const currentAttachments = [...selectedFiles];
    const pdfTexts = currentAttachments.filter(f => f.extractedText).map(f => `[Conteúdo do PDF ${f.fileName}]:\n${f.extractedText}`);
    if (pdfTexts.length > 0) userMsgText += '\n\n' + pdfTexts.join('\n\n');

    setInput('');
    setSelectedFiles([]);
    setIsGenerating(true);

    const userMsg: Message = { id: uuidv4(), role: 'user', text: userMsgText, attachments: currentAttachments, timestamp: Date.now() };
    const botMsgId = uuidv4();
    const botMsg: Message = { id: botMsgId, role: 'model', text: '', timestamp: Date.now() + 1 };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg, botMsg], updatedAt: Date.now() } : s));

    try {
      const history = currentSession?.messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })) || [];
      if (history.length === 0) geminiService.current.generateTitle(userMsgText).then(t => setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: t } : s)));
      
      let systemPrompt = settings.systemInstruction || '';
      if (currentAgent) systemPrompt += `\nPersonalidade: ${currentAgent.systemInstruction}`;

      const stream = geminiService.current.streamChat(settings.modelId, history, userMsgText, currentAttachments, systemPrompt, settings.googleSearchEnabled);
      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const newMsgs = [...s.messages];
            const idx = newMsgs.findIndex(m => m.id === botMsgId);
            if (idx !== -1) newMsgs[idx] = { ...newMsgs[idx], text: fullResponse, sources: chunk.sources };
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
        return { id: uuidv4(), mimeType: file.type, fileName: file.name, data: base64, extractedText };
      }));
      setSelectedFiles(prev => [...prev, ...newAtts]);
    }
  };

  return (
    <div className="flex h-screen bg-[#131314] text-white overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        sessions={sessions} agents={agents} currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId} onNewChat={() => createNewSession()} onNewAgentChat={createNewSession}
        onDeleteSession={(id, e) => { e.stopPropagation(); setSessions(prev => prev.filter(s => s.id !== id)); }}
        onOpenSettings={() => setIsSettingsOpen(true)} onOpenAgentModal={(a) => { setEditingAgent(a || null); setIsAgentModalOpen(true); }}
        onDeleteAgent={(id, e) => { e.stopPropagation(); setAgents(prev => prev.filter(a => a.id !== id)); }}
        aiDisplayName={settings.aiDisplayName}
      />
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[#131314]/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"><Menu size={20} /></button>
            <div onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors">
              <span className="font-medium">{AVAILABLE_MODELS.find(m => m.id === settings.modelId)?.name}</span>
              {currentAgent && <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: currentAgent.themeColor, color: currentAgent.themeColor }}>{currentAgent.name}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!(settings.provider === 'google' ? !!process.env.API_KEY : !!ENV.OPENROUTER_API_KEY) && 
              <div className="flex items-center gap-2 text-amber-400 bg-amber-900/20 px-3 py-1.5 rounded-lg text-xs border border-amber-900/50 animate-pulse">
                <AlertTriangle size={14} /> Chave Ausente no Env
              </div>
            }
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-2xl" style={{ backgroundColor: currentAgent?.themeColor || '#3b82f6' }}>
                  <Bot size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{WELCOME_MESSAGE_TEMPLATE.replace("{name}", settings.aiDisplayName)}</h1>
              </div>
            ) : (
              <div className="flex-1">
                {messages.map(m => (
                  <MessageBubble key={m.id} message={m} isAgentContext={!!currentAgent} themeColor={currentAgent?.themeColor} avatar={currentAgent?.avatar} isTyping={isGenerating && m.id === messages[messages.length-1].id && m.role === 'model'} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 bg-[#131314]">
          <div className="max-w-4xl mx-auto">
            <div className={`flex items-end gap-2 bg-[#1e1f20] rounded-[28px] border p-2 ${isGenerating ? 'opacity-50 pointer-events-none' : 'focus-within:border-gray-600'}`}>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-white"><Paperclip size={20} /></button>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} placeholder="Envie uma mensagem..." className="w-full bg-transparent text-white py-3 outline-none resize-none max-h-48" rows={1} />
              <button onClick={handleSendMessage} className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"><Send size={20} /></button>
            </div>
          </div>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} onExportData={() => {}} onImportData={() => {}} />
        <AgentsModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} onSaveAgent={a => setAgents(prev => [...prev, a])} agentToEdit={editingAgent} />
      </main>
    </div>
  );
};

export default App;