import React, { useState, useMemo } from 'react';
import { MessageSquare, Plus, Trash2, Menu, X, Settings, Bot, Search as SearchIcon, Edit2, Loader2 } from 'lucide-react';
import { ChatSession, Agent } from '../types';
import { FuturisticLogo } from './FuturisticLogo';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  agents: Agent[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onNewAgentChat: (agentId: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenAgentModal: (agent?: Agent) => void;
  onDeleteAgent: (id: string, e: React.MouseEvent) => void;
  aiDisplayName?: string;
  isGenerating?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  sessions,
  agents,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onNewAgentChat,
  onDeleteSession,
  onOpenSettings,
  onOpenAgentModal,
  onDeleteAgent,
  aiDisplayName = "Gemini",
  isGenerating = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.messages.some(m => m.text.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: ChatSession[] } = {
      'Hoje': [],
      'Ontem': [],
      'Últimos 7 dias': [],
      'Este mês': [],
      'Anteriores': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const last7Days = today - (86400000 * 7);
    const last30Days = today - (86400000 * 30);

    filteredSessions.forEach(session => {
      const date = session.updatedAt;
      if (date >= today) groups['Hoje'].push(session);
      else if (date >= yesterday) groups['Ontem'].push(session);
      else if (date >= last7Days) groups['Últimos 7 dias'].push(session);
      else if (date >= last30Days) groups['Este mês'].push(session);
      else groups['Anteriores'].push(session);
    });

    return groups;
  }, [filteredSessions]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className={`
        fixed top-0 left-0 bottom-0 z-30
        w-[300px] bg-[#1e1f20] flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:w-[300px] md:flex-shrink-0
      `}>
        
        <div className="p-4 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <button 
                onClick={toggleSidebar}
                className="md:hidden p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-3">
                 <FuturisticLogo size={28} isProcessing={isGenerating} />
                 <div className="font-bold text-gray-200 tracking-tight text-lg">
                    {aiDisplayName} <span className="text-blue-400">UI</span>
                 </div>
              </div>
           </div>

           <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text"
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131314] text-sm text-gray-300 pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-gray-700 outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
           </div>
        </div>

        <div className="px-4 pb-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#282a2c] hover:bg-[#37393b] text-gray-300 rounded-full transition-all active:scale-95 shadow-lg shadow-black/20"
          >
            <Plus size={18} className="text-gray-400" />
            <span className="text-sm font-semibold">Nova conversa</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6 custom-scrollbar">
          <div className="space-y-1">
             <div className="px-3 py-1 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Agentes Customizados</span>
                <button 
                  onClick={() => onOpenAgentModal()}
                  className="text-gray-500 hover:text-blue-400 transition-colors p-1"
                  title="Criar Agente"
                >
                  <Plus size={14} />
                </button>
             </div>
             
             {agents.length > 0 && agents.map((agent: Agent) => (
                <div 
                  key={agent.id}
                  onClick={() => onNewAgentChat(agent.id)}
                  className="group flex flex-col px-3 py-2.5 rounded-2xl cursor-pointer hover:bg-[#282a2c] text-gray-300 hover:text-white transition-all mb-1 border border-transparent hover:border-gray-800"
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white overflow-hidden"
                          style={{ backgroundColor: agent.themeColor || '#3b82f6' }}
                        >
                           {agent.avatar && agent.avatar.startsWith('data:image') ? (
                             <img src={agent.avatar} alt="av" className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-lg">{agent.avatar || '🤖'}</span>
                           )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-bold truncate">{agent.name}</span>
                          <span className="text-[10px] text-gray-500 truncate">{agent.description}</span>
                        </div>
                      </div>
                   </div>
                </div>
              ))}
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
              if (groupSessions.length === 0) return null;
              return (
                <div key={groupName} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-black text-gray-500 uppercase tracking-widest">{groupName}</div>
                  {groupSessions.map((session) => {
                    const isActive = currentSessionId === session.id;
                    return (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`
                          group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer
                          transition-all text-sm
                          ${isActive 
                            ? 'bg-blue-600/10 text-blue-100 border-l-2 border-blue-500' 
                            : 'text-gray-400 hover:bg-[#282a2c] hover:text-white border-l-2 border-transparent'}
                        `}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {isActive && isGenerating ? (
                            <Loader2 size={14} className="animate-spin text-blue-400" />
                          ) : (
                            <MessageSquare size={16} className="flex-shrink-0 opacity-40" />
                          )}
                          <span className="truncate font-medium">
                            {session.title || 'Nova conversa'}
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => onDeleteSession(session.id, e)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#1e1f20]">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#282a2c] rounded-xl transition-all"
          >
            <Settings size={18} />
            <span>Configurações</span>
          </button>
        </div>
      </div>
    </>
  );
};