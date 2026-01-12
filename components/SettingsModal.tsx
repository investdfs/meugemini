import React, { useEffect, useState } from 'react';
import { X, Key, Globe, Cpu, User, CheckCircle, Info, ExternalLink, Terminal } from 'lucide-react';
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
  useEffect(() => { setLocalSettings(settings); }, [settings, isOpen]);
  if (!isOpen) return null;

  const isGoogle = localSettings.provider === 'google';
  const hasKey = isGoogle ? !!process.env.API_KEY : !!ENV.OPENROUTER_API_KEY;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1e1f20] rounded-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-[#282a2c]">
          <h2 className="text-xl font-semibold text-white">Configurações do Sistema</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Status da Conexão */}
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${hasKey ? 'bg-green-900/10 border-green-900/30 text-green-400' : 'bg-amber-900/10 border-amber-900/30 text-amber-400'}`}>
            <div className={`p-2 rounded-lg ${hasKey ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
              {hasKey ? <CheckCircle size={24} /> : <Key size={24} />}
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-bold">{hasKey ? 'API Conectada com Sucesso' : 'API Key não detectada'}</span>
              <span className="text-[10px] opacity-70 uppercase tracking-widest">{isGoogle ? 'Variável esperada: API_KEY' : 'Variável esperada: OPENROUTER_API_KEY'}</span>
            </div>
          </div>

          {/* Guia Vercel para Chaves (Baseado no seu print) */}
          {!hasKey && (
            <div className="p-5 bg-blue-900/10 border border-blue-800/50 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-tighter">
                <Terminal size={14} /> Guia de Deploy Vercel
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Para que o site funcione na Vercel, você deve adicionar as chaves nas <b>Environment Variables</b> do projeto:
              </p>
              <div className="bg-[#131314] p-3 rounded-lg border border-gray-800 font-mono text-[10px] space-y-2">
                <div className="flex justify-between border-b border-gray-800 pb-1">
                  <span className="text-gray-500">KEY</span>
                  <span className="text-gray-500">VALUE</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>API_KEY</span>
                  <span>SUA_CHAVE_AQUI</span>
                </div>
                {localSettings.provider === 'openrouter' && (
                  <div className="flex justify-between text-purple-400">
                    <span>OPENROUTER_API_KEY</span>
                    <span>SUA_CHAVE_AQUI</span>
                  </div>
                )}
              </div>
              <a 
                href="https://vercel.com/dashboard" 
                target="_blank" 
                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
              >
                Abrir Dashboard Vercel <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2"><User size={16} /> Identidade Visual</label>
              <input 
                type="text" 
                value={localSettings.aiDisplayName} 
                onChange={e => setLocalSettings({...localSettings, aiDisplayName: e.target.value})} 
                placeholder="Nome da sua IA"
                className="w-full bg-[#282a2c] text-white px-4 py-3 rounded-lg border border-gray-600 outline-none focus:border-blue-500 transition-all" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2"><Globe size={16} /> Provedor de API</label>
              <div className="grid grid-cols-2 gap-2 bg-[#282a2c] p-1 rounded-lg border border-gray-700">
                <button 
                  onClick={() => setLocalSettings({...localSettings, provider: 'google', modelId: 'gemini-3-flash-preview'})} 
                  className={`py-2 px-3 rounded-md text-xs font-bold transition-all ${localSettings.provider === 'google' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  GOOGLE
                </button>
                <button 
                  onClick={() => setLocalSettings({...localSettings, provider: 'openrouter', modelId: 'deepseek/deepseek-r1:free'})} 
                  className={`py-2 px-3 rounded-md text-xs font-bold transition-all ${localSettings.provider === 'openrouter' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  OPENROUTER
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2"><Cpu size={16} /> Seleção de Modelo</label>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {AVAILABLE_MODELS.filter(m => m.provider === localSettings.provider).map(m => (
                <div 
                  key={m.id} 
                  onClick={() => setLocalSettings({...localSettings, modelId: m.id})} 
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col gap-1 ${localSettings.modelId === m.id ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-[#282a2c] hover:border-gray-600'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-100 text-sm">{m.name}</span>
                    {localSettings.modelId === m.id && <CheckCircle size={14} className="text-blue-500" />}
                  </div>
                  <span className="text-[10px] text-gray-500 italic">{m.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-gray-900/50 rounded-lg flex gap-3 border border-gray-800">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-relaxed">
              <b>Segurança em primeiro lugar:</b> Para manter suas chaves protegidas, elas nunca são salvas no navegador. O sistema lê diretamente do ambiente do servidor (Vercel).
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#282a2c] flex justify-between items-center border-t border-gray-700">
           <p className="text-[10px] text-gray-500 italic">Vercel Auto-Deploy Ready</p>
           <button 
            onClick={() => { onSave(localSettings); onClose(); }} 
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg active:scale-95 transition-all text-sm"
           >
             Aplicar Configurações
           </button>
        </div>
      </div>
    </div>
  );
};
