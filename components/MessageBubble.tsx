
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, AlertCircle, FileText, Check, Copy, Globe, ExternalLink, Download, FileOutput, ArrowRightToLine } from 'lucide-react';
import { Message } from '../types';
import { ExportService } from '../services/exportService';

interface MessageBubbleProps {
  message: Message;
  isAgentContext?: boolean;
  onSaveResponse?: (text: string) => void;
  isTyping?: boolean;
  themeColor?: string;
  avatar?: string;
  onPushToEditor?: (text: string) => void;
  isSplitViewActive?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isAgentContext, 
  onSaveResponse, 
  isTyping, 
  themeColor, 
  avatar,
  onPushToEditor,
  isSplitViewActive
}) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Detecta se a mensagem parece um documento oficial para sugerir exportação
  const looksLikeDocument = !isUser && !isError && message.text && (
    message.text.toUpperCase().includes('DIEX') || 
    message.text.toUpperCase().includes('OFÍCIO') ||
    message.text.includes('Assunto:') ||
    message.text.includes('REFERÊNCIA:')
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    if (exporting || !message.text) return;
    setExporting(true);
    try {
      await ExportService.exportToDocx(message.text, "Documento_Militar");
    } catch (e) {
      console.error("Erro ao exportar:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`flex w-full mb-4 animate-message ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[92%] sm:max-w-2xl w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        <div className="flex flex-col items-center shrink-0">
          <div 
            className={`w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-500 shadow-sm ${
              isUser 
                ? 'bg-slate-200 dark:bg-gray-800 border border-slate-300 dark:border-gray-700' 
                : 'bg-white dark:bg-transparent text-gray-700 dark:text-white border border-gray-200 dark:border-white/10'
            }`}
            style={{ 
              backgroundColor: !isUser && !isError && themeColor ? themeColor : undefined,
              color: !isUser && !isError && themeColor ? 'white' : undefined,
            }}
          >
            {isUser ? (
              <User size={14} className="text-slate-600 dark:text-gray-400" />
            ) : isError ? (
              <AlertCircle size={14} className="text-red-500 dark:text-red-400" />
            ) : (
              avatar ? (
                avatar.startsWith('data:image') ? (
                  <img src={avatar} alt="agent" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">{avatar}</span>
                )
              ) : <Bot size={16} />
            )}
          </div>
        </div>

        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
            relative px-4 py-2.5 rounded-2xl text-sm leading-snug transition-all duration-200 group
            ${isUser 
              ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
              : 'bg-soft-card dark:bg-transparent text-gray-800 dark:text-gray-300 rounded-tl-none border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none'}
          `}>
            
            {!isUser && !isError && message.text && (
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {isSplitViewActive && onPushToEditor && (
                   <button 
                    onClick={() => onPushToEditor(message.text)}
                    title="Empurrar para Editor"
                    className="p-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all border border-blue-400 shadow-sm"
                  >
                    <ArrowRightToLine size={14} />
                  </button>
                )}
                <button 
                  onClick={handleExport}
                  title="Gerar Word (EB10-IG-01.001)"
                  className="p-1.5 bg-white/80 dark:bg-black/50 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 rounded-lg text-gray-400 dark:text-gray-500 transition-all border border-gray-200 dark:border-white/10 shadow-sm"
                >
                  <FileOutput size={14} className={exporting ? 'animate-pulse' : ''} />
                </button>
                <button 
                  onClick={handleCopy}
                  title="Copiar texto"
                  className="p-1.5 bg-white/80 dark:bg-black/50 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg text-gray-400 dark:text-gray-500 transition-all border border-gray-200 dark:border-white/10 shadow-sm"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}

            <div className={`markdown-body ${isTyping && message.text ? 'typing-cursor' : ''}`}>
              {isError ? (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 py-0.5">
                   <AlertCircle size={14} />
                   <span className="text-xs">{message.text}</span>
                </div>
              ) : isUser ? (
                <p className="whitespace-pre-wrap">{message.text}</p>
              ) : !message.text && isTyping ? (
                <div className="flex items-center gap-1 py-1 px-1">
                  <div className="w-1.5 h-1.5 bg-blue-500/60 dark:bg-blue-400/60 rounded-full dot-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500/60 dark:bg-blue-400/60 rounded-full dot-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500/60 dark:bg-blue-400/60 rounded-full dot-pulse"></div>
                </div>
              ) : (
                <>
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                  {looksLikeDocument && !isTyping && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-700 flex gap-2">
                      <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                      >
                        <Download size={14} />
                        Gerar .docx
                      </button>
                      {isSplitViewActive && onPushToEditor && (
                        <button 
                          onClick={() => onPushToEditor(message.text)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                        >
                          <ArrowRightToLine size={14} />
                          Abrir no Editor
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-2">
                  <Globe size={10} className="text-blue-500" /> Fontes Web
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx} href={source.uri} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-lg text-[10px] text-blue-600 dark:text-blue-400 transition-all"
                    >
                      <span className="truncate max-w-[120px]">{source.title}</span>
                      <ExternalLink size={8} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <span className={`text-[9px] text-slate-400 dark:text-gray-600 mt-0.5 font-medium ${isUser ? 'mr-1' : 'ml-1'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
