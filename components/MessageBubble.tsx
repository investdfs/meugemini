import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, AlertCircle, FileText, Music, Check, Download, ExternalLink, Globe, Copy } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isAgentContext?: boolean;
  onSaveResponse?: (text: string) => void;
  isTyping?: boolean;
  themeColor?: string;
  avatar?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isAgentContext, onSaveResponse, isTyping, themeColor, avatar }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSaveResponse) {
        onSaveResponse(message.text);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className={`flex w-full mb-10 animate-message ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] sm:max-w-3xl w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar Area */}
        <div className="flex flex-col items-center shrink-0">
          <div 
            className={`w-9 h-9 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 shadow-lg ${
              isUser ? 'bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600' : 'text-white border border-white/10'
            }`}
            style={{ 
              backgroundColor: !isUser && !isError && themeColor ? themeColor : undefined,
              boxShadow: !isUser && !isError && themeColor ? `0 4px 15px ${themeColor}44` : undefined
            }}
          >
            {isUser ? (
              <User size={18} className="text-gray-300" />
            ) : isError ? (
              <AlertCircle size={18} className="text-red-400" />
            ) : (
              avatar ? (
                avatar.startsWith('data:image') ? (
                  <img src={avatar} alt="agent" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">{avatar}</span>
                )
              ) : <Bot size={22} className="text-white" />
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
            relative p-5 rounded-[22px] text-[15px] leading-relaxed transition-all duration-300 group
            ${isUser 
              ? 'bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-tr-none shadow-[0_8px_20px_rgba(139,92,246,0.3)]' 
              : 'glass text-gray-200 rounded-tl-none border border-white/5'}
          `}>
            
            {/* Action Bar (Top Corner) */}
            {!isUser && !isError && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                  title="Copiar resposta"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            )}

            {/* Attachments Section */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`flex flex-wrap gap-2 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {message.attachments.map((att) => (
                  <div key={att.id} className="relative group/att">
                    {att.mimeType.startsWith('image/') ? (
                      <img 
                        src={`data:${att.mimeType};base64,${att.data}`}
                        alt={att.fileName}
                        className="max-w-[240px] rounded-xl border border-white/10 shadow-lg transition-transform hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="bg-black/20 backdrop-blur-md p-3 rounded-xl flex items-center gap-3 border border-white/5 min-w-[160px]">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                          <FileText size={18} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col overflow-hidden text-left">
                           <span className="text-xs font-semibold text-gray-200 truncate">{att.fileName}</span>
                           <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{att.mimeType.split('/')[1]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Text */}
            <div className={`markdown-body ${isTyping ? 'typing-cursor' : ''}`}>
              {isError ? (
                <div className="flex items-center gap-2 text-red-400 py-1">
                   <AlertCircle size={16} />
                   <span className="font-medium">{message.text}</span>
                </div>
              ) : isUser ? (
                <p className="whitespace-pre-wrap font-medium">{message.text}</p>
              ) : (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              )}
            </div>

            {/* Grounding / Sources */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">
                  <Globe size={12} className="text-blue-400" />
                  Conhecimento Atualizado
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[11px] text-blue-400 transition-all hover:translate-y-[-1px]"
                    >
                      <span className="truncate max-w-[140px] font-medium">{source.title}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Approval Action */}
            {!isUser && !isError && isAgentContext && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <button 
                        onClick={handleSave}
                        className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all ${
                          isSaved ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {isSaved ? <Check size={14} /> : <Download size={14} />}
                        {isSaved ? "Arquivo Gerado" : "Salvar no Drive"}
                    </button>
                    <span className="text-[10px] text-gray-600 font-mono">ID-{message.id.slice(0,4)}</span>
                </div>
            )}
          </div>
          
          {/* Timestamp */}
          <span className={`text-[10px] text-gray-600 mt-1 font-medium tracking-tight ${isUser ? 'mr-2' : 'ml-2'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};