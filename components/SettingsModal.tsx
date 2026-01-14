
import React, { useEffect, useState } from 'react';
import { X, Globe, Cpu, User, Settings2, Info, MessageSquare, Search, Zap, ToggleLeft, ToggleRight, Key, Box } from 'lucide-react';
import { AppSettings, Provider } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  
  useEffect(() => { 
    if (isOpen) setLocalSettings(settings); 
  }, [settings, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f20] rounded-3xl border border-gray-200 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-message">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c]">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400">
              <Settings2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Painel de Controle</h2>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Configuração Avançada da Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <X size={22} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* SESSÃO: PROVEDOR & CHAVES */}
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
               <Globe size={14} /> Seleção de Provedor
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Opção Google */}
              <div 
                onClick={() => setLocalSettings({...localSettings, provider: 'google'})}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${localSettings.provider === 'google' ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-500 ring-1 ring-blue-500' : 'bg-gray-50 dark:bg-[#131314] border-transparent opacity-60'}`}
              >
                 <div className="flex items-center gap-2 mb-2 font-bold text-sm text-gray-800 dark:text-white">
                    <Box size={16} className="text-blue-500" /> Google AI (Gemini)
                 </div>
                 <input 
                    type="password" 
                    placeholder="Cole sua GOOGLE_API_KEY..."
                    value={localSettings.googleApiKey || ''} 
                    onChange={e => setLocalSettings({...localSettings, googleApiKey: e.target.value})} 
                    className="w-full bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono outline-none focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                 />
              </div>

              {/* Opção OpenRouter */}
              <div 
                onClick={() => setLocalSettings({...localSettings, provider: 'openrouter'})}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${localSettings.provider === 'openrouter' ? 'bg-purple-50 dark:bg-purple-600/10 border-purple-500 ring-1 ring-purple-500' : 'bg-gray-50 dark:bg-[#131314] border-transparent opacity-60'}`}
              >
                 <div className="flex items-center gap-2 mb-2 font-bold text-sm text-gray-800 dark:text-white">
                    <Cpu size={16} className="text-purple-500" /> OpenRouter
                 </div>
                 <input 
                    type="password" 
                    placeholder="Cole sua OPENROUTER_KEY..."
                    value={localSettings.openRouterApiKey || ''} 
                    onChange={e => setLocalSettings({...localSettings, openRouterApiKey: e.target.value})} 
                    className="w-full bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-mono outline-none focus:border-purple-500"
                    onClick={(e) => e.stopPropagation()}
                 />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 px-1">
              * Suas chaves são salvas apenas no seu navegador.
            </p>
          </div>

          {/* Sessão: Identidade */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Identidade da IA
            </label>
            <input 
              type="text" 
              placeholder="Ex: Gemini, Jarvis, Assistente..."
              value={localSettings.aiDisplayName} 
              onChange={e => setLocalSettings({...localSettings, aiDisplayName: e.target.value})} 
              className="w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-white px-5 py-3.5 rounded-2xl border border-transparent focus:border-blue-500/50 outline-none transition-all shadow-inner" 
            />
          </div>

          {/* Sessão: Comportamento */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} /> Instruções do Sistema (System Prompt)
              </label>
              <span className="text-[10px] text-blue-600 dark:text-blue-500 font-bold bg-blue-100 dark:bg-blue-500/10 px-2 py-0.5 rounded">MODO EXPERT</span>
            </div>
            <textarea 
              value={localSettings.systemInstruction} 
              onChange={e => setLocalSettings({...localSettings, systemInstruction: e.target.value})} 
              placeholder="Defina o comportamento base da IA, personalidade e restrições..."
              className="w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-white px-5 py-4 rounded-2xl border border-transparent focus:border-blue-500/50 outline-none transition-all min-h-[120px] text-sm leading-relaxed custom-scrollbar shadow-inner"
            />
          </div>

          {/* Sessão: Modelo e Ferramentas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Cpu size={14} /> Modelo Padrão ({localSettings.provider})
              </label>
              <div className="space-y-2">
                <select 
                  value={localSettings.modelId} 
                  onChange={e => setLocalSettings({...localSettings, modelId: e.target.value})}
                  className="w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-white px-5 py-3.5 rounded-2xl border border-transparent focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer text-sm"
                >
                  {AVAILABLE_MODELS.filter(m => m.provider === localSettings.provider).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                  <option value="custom">-- ID Personalizado --</option>
                </select>
                
                {localSettings.modelId === 'custom' && (
                  <input 
                    type="text"
                    placeholder="ID do Modelo (ex: gemini-1.5-pro)"
                    value={localSettings.customModelId || ''}
                    onChange={e => setLocalSettings({...localSettings, customModelId: e.target.value})}
                    className="w-full bg-gray-100 dark:bg-[#131314] text-xs text-blue-600 dark:text-blue-400 px-5 py-3 rounded-xl border border-blue-500/20 outline-none animate-message"
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Search size={14} /> Funcionalidades
              </label>
              <div 
                onClick={() => setLocalSettings({...localSettings, googleSearchEnabled: !localSettings.googleSearchEnabled})}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${localSettings.googleSearchEnabled ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-500/5' : 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#131314] opacity-60'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${localSettings.googleSearchEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                    <Search size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-200">Google Search Grounding</span>
                    <span className="text-[10px] text-gray-500">Apenas para modelos Google</span>
                  </div>
                </div>
                {localSettings.googleSearchEnabled ? <ToggleRight className="text-blue-500" size={28} /> : <ToggleLeft className="text-gray-400 dark:text-gray-600" size={28} />}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-[#282a2c] flex items-center justify-between border-t border-gray-200 dark:border-white/5">
           <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 dark:text-gray-600 uppercase tracking-[0.2em]">
              <Zap size={14} className="text-yellow-500" /> Auto-Save Ativo
           </div>
           <button 
            onClick={() => { onSave(localSettings); onClose(); }} 
            className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-sm"
           >
             Salvar Configurações
           </button>
        </div>
      </div>
    </div>
  );
};
