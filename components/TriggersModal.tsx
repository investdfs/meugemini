
import React, { useState } from 'react';
import { X, Search, Zap, ChevronRight, Scale, GraduationCap, Briefcase } from 'lucide-react';
import { COMMAND_LIBRARY } from '../constants';

interface TriggersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const TriggersModal: React.FC<TriggersModalProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLibrary = COMMAND_LIBRARY.map(cat => ({
    ...cat,
    items: cat.items.filter(i => 
      i.title.toLowerCase().includes(search.toLowerCase()) || 
      i.prompt.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f20] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-message">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Biblioteca de Comandos</h2>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Engenharia de Documentos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 bg-gray-100 dark:bg-[#131314] border-b border-gray-200 dark:border-white/5">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Pesquisar comando por título ou função..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#1e1f20] text-sm text-gray-900 dark:text-gray-200 pl-12 pr-4 py-3 rounded-2xl border border-transparent focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {filteredLibrary.length > 0 ? filteredLibrary.map((category, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-1">
                {category.category.includes("Jurídico") ? <Scale size={12}/> : 
                 category.category.includes("Acadêmico") ? <GraduationCap size={12}/> : <Briefcase size={12}/>}
                {category.category}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => { onSelectPrompt(item.prompt); onClose(); }}
                    className="group flex flex-col items-start p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all text-left relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</span>
                      <ChevronRight size={14} className="text-gray-400 dark:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{item.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
               <Search size={48} className="mb-4 opacity-20" />
               <p className="font-medium">Nenhum comando encontrado para "{search}"</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-[#282a2c] border-t border-gray-200 dark:border-white/5 flex justify-center">
           <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Selecione um prompt para carregar no chat</p>
        </div>
      </div>
    </div>
  );
};
