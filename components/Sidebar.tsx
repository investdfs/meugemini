
import React, { useState, useMemo, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Menu, X, Settings, Search as SearchIcon, Edit2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 15;

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
  const [currentPage, setCurrentPage] = useState(1);

  // Resetar para página 1 quando a busca muda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.messages.some(m => m.text.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSessions, currentPage]);

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

    // Usamos paginatedSessions aqui para agrupar apenas o que está visível na página
    paginatedSessions.forEach(session => {
      const date = session.updatedAt;
      if (date >= today) groups['Hoje'].push(session);
      else if (date >= yesterday) groups['Ontem'].push(session);
      else if (date >= last7Days) groups['Últimos 7 dias'].push(session);
      else if (date >= last30Days) groups['Este mês'].push(session);
      else groups['Anteriores'].push(session);
    });

    return groups;
  }, [paginatedSessions]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

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
        w-[300px] bg-white dark:bg-[#1e1f20] flex flex-col border-r border-gray-200 dark:border-r-0
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:w-[300px] md:flex-shrink-0
      `}>
        
        <div className="p-4 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <button 
                onClick={toggleSidebar}
                className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-3">
                 <FuturisticLogo size={28} isProcessing={isGenerating} />
                 <div className="font-bold text-gray-800 dark:text-gray-200 tracking-tight text-lg">
                    {aiDisplayName} <span className="text-blue-500 dark:text-blue-400">UI</span>
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
                className="w-full bg-gray-100 dark:bg-[#131314] text-sm text-gray-900 dark:text-gray-300 pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-gray-300 dark:focus:border-gray-700 outline-none transition-all placeholder-gray-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
           </div>
        </div>

        <div className="px-4 pb-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-[#282a2c] hover:bg-gray-200 dark:hover:bg-[#37393b] text-gray-700 dark:text-gray-300 rounded-full transition-all active:scale-95 shadow-sm dark:shadow-black/20"
          >
            <Plus size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold">Nova conversa</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-6 custom-scrollbar flex flex-col">
          <div className="space-y-1">
             <div className="px-3 py-1 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Agentes Customizados</span>
                <button 
                  onClick={() => onOpenAgentModal()}
                  className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1"
                  title="Criar Agente"
                >
                  <Plus size={14} />
                </button>
             </div>
             
             {agents && agents.length > 0 && agents.map((agent) => (
                <div 
                  key={agent.id}
                  onClick={() => onNewAgentChat(agent.id)}
                  className="group relative flex flex-col px-3 py-2.5 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-[#282a2c] text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all mb-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
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

                   {/* Agent Actions */}
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-lg p-0.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenAgentModal(agent); }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="Editar Agente"
                      >
                         <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => onDeleteAgent(agent.id, e)}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="Excluir Agente"
                      >
                         <Trash2 size={12} />
                      </button>
                   </div>
                </div>
              ))}
          </div>

          <div className="space-y-4 pt-2 flex-1">
            {Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
              const sessions = groupSessions as ChatSession[];
              if (sessions.length === 0) return null;
              return (
                <div key={groupName} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-black text-gray-500 uppercase tracking-widest">{groupName}</div>
                  {sessions.map((session) => {
                    const isActive = currentSessionId === session.id;
                    return (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`
                          group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer
                          transition-all text-sm
                          ${isActive 
                            ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-700 dark:text-blue-100 border-l-2 border-blue-500' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#282a2c] hover:text-black dark:hover:text-white border-l-2 border-transparent'}
                        `}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {isActive && isGenerating ? (
                            <Loader2 size={14} className="animate-spin text-blue-500 dark:text-blue-400" />
                          ) : (
                            <MessageSquare size={16} className="flex-shrink-0 opacity-40" />
                          )}
                          <span className="truncate font-medium">
                            {session.title || 'Nova conversa'}
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => onDeleteSession(session.id, e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-4 py-2 flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1f20]">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#282a2c] rounded-xl transition-all"
          >
            <Settings size={18} />
            <span>Configurações</span>
          </button>
        </div>
      </div>
    </>
  );
};
