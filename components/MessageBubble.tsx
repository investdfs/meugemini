import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, AlertCircle, FileText, Music, ThumbsUp, Check, Download, ExternalLink, Globe } from 'lucide-react';
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

  const handleSave = () => {
    if (onSaveResponse) {
        onSaveResponse(message.text);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-4xl w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div 
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1 overflow-hidden transition-colors duration-300 ${
            isUser ? 'bg-gray-700 text-white' : isError ? 'bg-red-900/30 text-red-400' : 'text-white shadow-md'
          }`}
          style={{ backgroundColor: !isUser && !isError && themeColor ? themeColor : undefined }}
        >
          {isUser ? (
            <User size={18} />
          ) : isError ? (
            <AlertCircle size={18} />
          ) : (
            avatar ? (
              avatar.startsWith('data:image') ? (
                <img src={avatar} alt="agent" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">{avatar}</span>
              )
            ) : <Bot size={20} />
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-hidden ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block text-base group relative ${isUser ? 'bg-[#282a2c] px-5 py-3 rounded-3xl rounded-tr-sm text-gray-100' : 'text-gray-100 w-full'}`}>
            
            {/* Attachments Display */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`flex flex-wrap gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {message.attachments.map((att) => {
                  if (att.mimeType.startsWith('image/')) {
                    return (
                      <img 
                        key={att.id}
                        src={`data:${att.mimeType};base64,${att.data}`}
                        alt={att.fileName}
                        className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-700 object-cover"
                      />
                    );
                  } else if (att.mimeType.startsWith('audio/')) {
                    return (
                      <div key={att.id} className="bg-gray-800 p-2 rounded-lg flex items-center gap-2 border border-gray-700">
                        <Music size={16} className="text-blue-400" />
                        <audio controls src={`data:${att.mimeType};base64,${att.data}`} className="h-8 w-48" />
                      </div>
                    );
                  } else {
                    return (
                      <div key={att.id} className="bg-gray-800 p-3 rounded-lg flex items-center gap-3 border border-gray-700 min-w-[150px]">
                        <div className="bg-gray-700 p-2 rounded">
                          <FileText size={20} className="text-gray-300" />
                        </div>
                        <div className="flex flex-col overflow-hidden text-left">
                           <span className="text-sm font-medium text-gray-200 truncate max-w-[120px]">{att.fileName}</span>
                           <span className="text-[10px] text-gray-500 uppercase">{att.mimeType.split('/')[1]}</span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {isError ? (
              <span className="text-red-400">{message.text}</span>
            ) : (
              <div className={`markdown-body ${isUser ? '' : 'w-full'} ${isTyping ? 'typing-cursor' : ''}`}>
                 {isUser ? (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                 ) : (
                   <ReactMarkdown>{message.text}</ReactMarkdown>
                 )}
              </div>
            )}

            {/* Grounding Sources */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <Globe size={14} />
                  Fontes da Web
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131314] hover:bg-[#1e1f20] border border-gray-800 rounded-full text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <span className="truncate max-w-[150px]">{source.title}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Save Action */}
            {!isUser && !isError && isAgentContext && (
                <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 bg-gray-800/50 px-2 py-1 rounded transition-colors"
                        title="Aprovar e Salvar no Repositório (Drive)"
                    >
                        {isSaved ? <Check size={14} className="text-green-400" /> : <Download size={14} />}
                        {isSaved ? "Salvo" : "Salvar no Repositório"}
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};