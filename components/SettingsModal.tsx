
import React, { useEffect, useState } from 'react';
import { X, Settings2, Key, ChevronDown, ShieldCheck, AlertTriangle, Loader2, Cpu, Sparkles, Rocket } from 'lucide-react';
import { AppSettings, Provider } from '../types';
import { PROVIDER_LABELS, AVAILABLE_MODELS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  masterPassword: string | null;
  onUpdateMasterPassword: (password: string | null) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, masterPassword, onUpdateMasterPassword }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeProviderTab, setActiveProviderTab] = useState<Provider>('google');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { 
    if (isOpen) {
      setLocalSettings(settings);
      setActiveProviderTab(settings.provider);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const providers: Provider[] = ['google', 'openrouter', 'openai', 'anthropic', 'deepseek', 'groq'];

  const getProviderKeyField = (provider: Provider): keyof AppSettings | null => {
    switch (provider) {
      case 'openrouter': return 'openRouterApiKey';
      case 'openai': return 'openaiApiKey';
      case 'anthropic': return 'anthropicApiKey';
      case 'deepseek': return 'deepseekApiKey';
      case 'groq': return 'groqApiKey';
      default: return null;
    }
  };

  const handleKeyChange = (value: string) => {
    const field = getProviderKeyField(activeProviderTab);
    if (field) setLocalSettings({ ...localSettings, [field]: value });
  };

  const filteredModels = AVAILABLE_MODELS.filter(m => m.provider === activeProviderTab);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f20] rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-message">
        
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg">
              <Settings2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Configurações</h2>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">Gestão de Identidade de IA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <X size={22} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Status do Provedor Gemini */}
          <div className="p-5 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-3xl border border-green-500/20 flex items-center gap-5">
            <div className="p-3 bg-green-600 rounded-2xl text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Google Gemini Ativo</h4>
              <p className="text-[11px] text-gray-500 font-medium">A chave API Gemini está configurada de forma segura no ambiente.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <Key size={14} /> Configuração de Provedores
            </label>
            
            <div className="bg-gray-50 dark:bg-[#131314] rounded-2xl border border-gray-100 dark:border-white/5 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase ml-1">Provedor</span>
                  <select 
                    value={activeProviderTab}
                    onChange={(e) => setActiveProviderTab(e.target.value as Provider)}
                    className="w-full bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold appearance-none"
                  >
                    {providers.map(p => (<option key={p} value={p}>{PROVIDER_LABELS[p]}</option>))}
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase ml-1">Chave API (Opcional)</span>
                  {activeProviderTab === 'google' ? (
                    <div className="w-full bg-blue-500/5 text-blue-500 px-4 py-3 rounded-xl border border-blue-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} /> Chave Gerenciada pelo Sistema
                    </div>
                  ) : (
                    <input 
                      type="password" 
                      placeholder={`Chave para ${PROVIDER_LABELS[activeProviderTab]}...`}
                      value={(localSettings[getProviderKeyField(activeProviderTab) as keyof AppSettings] as string) || ''} 
                      onChange={e => handleKeyChange(e.target.value)} 
                      className="w-full bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                  <Cpu size={12} /> Seleção de Modelo
                </span>
                <select 
                  value={localSettings.modelId}
                  onChange={e => setLocalSettings({...localSettings, modelId: e.target.value})}
                  className="w-full bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 appearance-none text-sm font-bold"
                >
                  {filteredModels.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 dark:bg-[#282a2c] flex items-center justify-between border-t border-gray-100 dark:border-white/5">
           <button onClick={() => { onSave(localSettings); onClose(); }} className="px-12 py-3.5 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all w-full">
             Salvar e Aplicar
           </button>
        </div>
      </div>
    </div>
  );
};
