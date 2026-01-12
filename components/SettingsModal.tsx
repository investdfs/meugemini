import React, { useEffect, useState } from 'react';
import { X, Key, Globe, Cpu, User, CheckCircle, Info, ExternalLink, Terminal, ShieldCheck } from 'lucide-react';
import { AppSettings, Provider } from '../types';
import { AVAILABLE_MODELS } from '../constants';
import { ENV } from '../config/env';

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

  // No modelo de Proxy, o browser não vê a chave. 
  // Assumimos que está configurado se estiver na Vercel ou se o usuário estiver testando.
  const isVercel = ENV.IS_VERCEL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#1e1f20] rounded-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[95vh] animate-message">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-[#282a2c]">
          <h2 className="text-xl font-semibold text-white">Configurações</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Status da Conexão Seguro */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${isVercel ? 'bg-blue-900/10 border-blue-900/30 text-blue-400' : 'bg-amber-900/10 border-amber-900/30 text-amber-400'}`}>
            <div className={`p-2 rounded-lg ${isVercel ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
              <ShieldCheck size={24} />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-bold">{isVercel ? 'Segurança de Proxy Ativa' : 'Modo de Desenvolvimento'}</span>
              <span className="text-[10px] opacity-70 uppercase tracking-widest">As chaves são processadas no servidor</span>
            </div>
          </div>

          <div className="p-5 bg-blue-900/10 border border-blue-800/50 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-tighter">
              <Terminal size={14} /> Verificação de Chaves (Vercel)
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              O erro 401 no console indica que você precisa adicionar as <b>Environment Variables</b> no painel da Vercel e desativar a "Deployment Protection" se quiser acesso público.
            </p>
            <div className="bg-[#131314] p-3 rounded-lg border border-gray-800 font-mono text-[10px] space-y-2">
              <div className="flex justify-between text-blue-400">
                <span>API_KEY</span>
                <span className="text-gray-500">Configurada na Vercel</span>
              </div>
            </div>
            <a 
              href="https://vercel.com/dashboard" 
              target="_blank" 
              className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
            >
              Abrir Dashboard Vercel <ExternalLink size={12} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2"><User size={16} /> Nome da IA</label>
              <input 
                type="text" 
                value={localSettings.aiDisplayName} 
                onChange={e => setLocalSettings({...localSettings, aiDisplayName: e.target.value})} 
                className="w-full bg-[#282a2c] text-white px-4 py-3 rounded-lg border border-gray-600 outline-none focus:border-blue-500 transition-all" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2"><Globe size={16} /> Provedor</label>
              <div className="grid grid-cols-2 gap-2 bg-[#282a2c] p-1 rounded-lg border border-gray-700">
                <button 
                  onClick={() => setLocalSettings({...localSettings, provider: 'google'})} 
                  className={`py-2 px-3 rounded-md text-xs font-bold transition-all ${localSettings.provider === 'google' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  GOOGLE
                </button>
                <button 
                  onClick={() => setLocalSettings({...localSettings, provider: 'openrouter'})} 
                  className={`py-2 px-3 rounded-md text-xs font-bold transition-all ${localSettings.provider === 'openrouter' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                >
                  OPENROUTER
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2"><Cpu size={16} /> Modelo</label>
            <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {AVAILABLE_MODELS.filter(m => m.provider === localSettings.provider).map(m => (
                <div 
                  key={m.id} 
                  onClick={() => setLocalSettings({...localSettings, modelId: m.id})} 
                  className={`cursor-pointer p-3 rounded-xl border transition-all ${localSettings.modelId === m.id ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-[#282a2c] hover:border-gray-600'}`}
                >
                  <span className="block font-bold text-gray-100 text-xs">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#282a2c] flex justify-end border-t border-gray-700">
           <button 
            onClick={() => { onSave(localSettings); onClose(); }} 
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg transition-all text-sm"
           >
             Aplicar
           </button>
        </div>
      </div>
    </div>
  );
};