
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, AlertCircle, FileText, Check, Copy, Globe, ExternalLink } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-4 animate-message ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[92%] sm:max-w-2xl w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar Area */}
        <div className="flex flex-col items-center shrink-0">
          <div 
            className={`w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-500 shadow-sm ${
              isUser 
                ? 'bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700' 
                : 'bg-white dark:bg-transparent text-gray-700 dark:text-white border border-gray-200 dark:border-white/10'
            }`}
            style={{ 
              backgroundColor: !isUser && !isError && themeColor ? themeColor : undefined,
              color: !isUser && !isError && themeColor ? 'white' : undefined,
            }}
          >
            {isUser ? (
              <User size={14} className="text-gray-600 dark:text-gray-400" />
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

        {/* Content Area */}
        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
            relative px-4 py-2.5 rounded-2xl text-sm leading-snug transition-all duration-200 group
            ${isUser 
              ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
              : 'glass text-gray-800 dark:text-gray-300 rounded-tl-none border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none'}
          `}>
            
            {/* Action Bar (Top Corner) */}
            {!isUser && !isError && message.text && (
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleCopy}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-gray-400 dark:text-gray-500 transition-colors"
                >
                  {copied ? <Check size={12} className="text-green-500 dark:text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
            )}

            {/* Attachments Section */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {message.attachments.map((att) => (
                  <div key={att.id} className="relative group/att">
                    {att.mimeType.startsWith('image/') ? (
                      <img 
                        src={`data:${att.mimeType};base64,${att.data}`}
                        alt={att.fileName}
                        className="max-w-[180px] rounded-lg border border-white/20 dark:border-white/10 shadow-sm"
                      />
                    ) : (
                      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-2 rounded-lg flex items-center gap-2 border border-white/10 min-w-[140px]">
                        <div className="bg-blue-500/20 p-1.5 rounded-md text-blue-200 dark:text-blue-400">
                          <FileText size={14} />
                        </div>
                        <div className="flex flex-col overflow-hidden text-left">
                           <span className="text-[11px] font-bold text-white/90 dark:text-gray-300 truncate">{att.fileName}</span>
                           <span className="text-[9px] text-white/70 dark:text-gray-500 uppercase">{att.mimeType.split('/')[1]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Text */}
            <div className={`markdown-body ${isTyping && message.text ? 'typing-cursor' : ''}`}>
              {isError ? (
                <div className="flex items-center gap-2 text-red-500 dark:text-red-400 py-0.5">
                   <AlertCircle size={14} />
                   <span className="text-xs">{message.text}</span>
                </div>
              ) : isUser ? (
                <p className="whitespace-pre-wrap">{message.text}</p>
              ) : !message.text && isTyping ? (
                /* Enhanced Typing Indicator Dots */
                <div className="flex items-center gap-1 py-1 px-1">
                  <div className="w-1.5 h-1.5 bg-blue-500/60 dark:bg-blue-400/60 rounded-full dot-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500/60 dark:bg-blue-400/60 rounded-full dot-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500/60 dark:bg-blue-400/60 rounded-full dot-pulse"></div>
                </div>
              ) : (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              )}
            </div>

            {/* Grounding / Sources */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase mb-2">
                  <Globe size={10} className="text-blue-500" /> Fontes Web
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx} href={source.uri} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 rounded-lg text-[10px] text-blue-600 dark:text-blue-400 transition-all"
                    >
                      <span className="truncate max-w-[120px]">{source.title}</span>
                      <ExternalLink size={8} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <span className={`text-[9px] text-gray-400 dark:text-gray-600 mt-0.5 font-medium ${isUser ? 'mr-1' : 'ml-1'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
