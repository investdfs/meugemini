
import React, { useEffect, useState } from 'react';
import { X, User, Settings2, Key, ChevronDown, Zap, ShieldCheck, CheckCircle2, AlertTriangle, Loader2, Cpu, Lock, ShieldEllipsis } from 'lucide-react';
import { AppSettings, Provider } from '../types';
import { PROVIDER_LABELS, AVAILABLE_MODELS } from '../constants';
import { GeminiService } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  masterPassword: string | null;
  onUpdateMasterPassword: (password: string | null) => void;
}

type ValidationStatus = 'idle' | 'checking' | 'success' | 'error';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, masterPassword, onUpdateMasterPassword }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeProviderTab, setActiveProviderTab] = useState<Provider>('google');
  const [validationStatus, setValidationStatus] = useState<Record<Provider, ValidationStatus>>({
    google: 'idle', openai: 'idle', anthropic: 'idle', deepseek: 'idle', groq: 'idle', mistral: 'idle', openrouter: 'idle', xai: 'idle'
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const geminiService = new GeminiService();

  useEffect(() => { 
    if (isOpen) {
      setLocalSettings(settings);
      setActiveProviderTab(settings.provider);
      setErrorMessage(null);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const providers: Provider[] = ['google', 'openai', 'anthropic', 'deepseek', 'groq', 'mistral', 'openrouter', 'xai'];

  const getProviderKeyField = (provider: Provider): keyof AppSettings => {
    switch (provider) {
      case 'google': return 'googleApiKey';
      case 'openai': return 'openaiApiKey';
      case 'anthropic': return 'anthropicApiKey';
      case 'deepseek': return 'deepseekApiKey';
      case 'groq': return 'groqApiKey';
      case 'mistral': return 'mistralApiKey';
      case 'openrouter': return 'openRouterApiKey';
      case 'xai': return 'xaiApiKey';
      default: return 'googleApiKey';
    }
  };

  const handleKeyChange = (value: string) => {
    const field = getProviderKeyField(activeProviderTab);
    setLocalSettings({ ...localSettings, [field]: value });
    setValidationStatus(prev => ({ ...prev, [activeProviderTab]: 'idle' }));
    setErrorMessage(null);
  };

  const handleModelChange = (value: string) => {
    setLocalSettings({ ...localSettings, modelId: value, provider: activeProviderTab });
  };

  const handleValidateKey = async () => {
    const currentKey = localSettings[getProviderKeyField(activeProviderTab)] as string;
    if (!currentKey) {
      setErrorMessage("Por favor, insira uma chave para validar.");
      return;
    }

    setValidationStatus(prev => ({ ...prev, [activeProviderTab]: 'checking' }));
    setErrorMessage(null);

    try {
      await geminiService.validateApiKey(activeProviderTab, currentKey, localSettings.modelId);
      setValidationStatus(prev => ({ ...prev, [activeProviderTab]: 'success' }));
    } catch (err: any) {
      setValidationStatus(prev => ({ ...prev, [activeProviderTab]: 'error' }));
      setErrorMessage(err.message || "Falha na validação. Verifique a chave e o ID do modelo.");
    }
  };

  const filteredModels = AVAILABLE_MODELS.filter(m => m.provider === activeProviderTab);

  const handleUpdatePassword = () => {
    onUpdateMasterPassword(newPassword || null);
    setShowPasswordForm(false);
    setNewPassword('');
    alert(newPassword ? "Senha mestra ativada! Seus dados agora estão protegidos com AES-256." : "Proteção por senha removida.");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f20] rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-message">
        
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Settings2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Configurações</h2>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">Gestão de Identidade e Segurança</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <X size={22} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Seção de Segurança / Vault */}
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <ShieldEllipsis size={14} /> Segurança do Cofre Local
            </label>
            <div className="bg-gray-50 dark:bg-[#131314] rounded-2xl border border-gray-100 dark:border-white/5 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${masterPassword ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {masterPassword ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {masterPassword ? "Criptografia Ativa (AES-256)" : "Dados não criptografados"}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                      {masterPassword ? "Protegido por senha mestra" : "Ative para proteger suas chaves API"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  {masterPassword ? "Alterar Senha" : "Ativar Senha Mestra"}
                </button>
              </div>

              {showPasswordForm && (
                <div className="p-4 bg-white dark:bg-[#1e1f20] rounded-xl border border-blue-500/20 space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Nova Senha Mestra</span>
                    <div className="flex gap-2">
                      <input 
                        type="password"
                        placeholder="Deixe em branco para remover..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-[#0d0d0e] text-white px-4 py-2 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                      <button 
                        onClick={handleUpdatePassword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Confirmar
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-500 italic">Dica: Se você esquecer esta senha, precisará apagar todos os dados para redefinir o app.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <Key size={14} /> Configuração do Provedor Ativo
            </label>
            
            <div className="bg-gray-50 dark:bg-[#131314] rounded-2xl border border-gray-100 dark:border-white/5 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase ml-1">Provedor</span>
                  <div className="relative">
                    <select 
                      value={activeProviderTab}
                      onChange={(e) => {
                        const newProvider = e.target.value as Provider;
                        setActiveProviderTab(newProvider);
                        const firstModel = AVAILABLE_MODELS.find(m => m.provider === newProvider);
                        setLocalSettings(prev => ({ 
                          ...prev, 
                          provider: newProvider, 
                          modelId: firstModel?.id || prev.modelId
                        }));
                      }}
                      className="w-full bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm font-bold"
                    >
                      {providers.map(p => (
                        <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase ml-1">Chave API</span>
                  <input 
                    type="password" 
                    placeholder={`Chave para ${PROVIDER_LABELS[activeProviderTab]}...`}
                    value={(localSettings[getProviderKeyField(activeProviderTab)] as string) || ''} 
                    onChange={e => handleKeyChange(e.target.value)} 
                    className="w-full bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                  <Cpu size={12} /> Modelo Padrão (Engine)
                </span>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select 
                      value={localSettings.modelId}
                      onChange={e => handleModelChange(e.target.value)}
                      className="w-full bg-white dark:bg-[#1e1f20] text-gray-900 dark:text-white px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm font-bold"
                    >
                      {filteredModels.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <button 
                    onClick={handleValidateKey}
                    disabled={validationStatus[activeProviderTab] === 'checking'}
                    className={`
                      px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shrink-0 flex items-center gap-2
                      ${validationStatus[activeProviderTab] === 'success' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 
                        validationStatus[activeProviderTab] === 'error' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                        'bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105'}
                    `}
                  >
                    {validationStatus[activeProviderTab] === 'checking' ? <Loader2 size={14} className="animate-spin" /> : null}
                    {validationStatus[activeProviderTab] === 'checking' ? 'Testando...' : 'Validar'}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-100 dark:bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-message">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 dark:bg-[#282a2c] flex items-center justify-between border-t border-gray-100 dark:border-white/5">
           <button 
            onClick={() => { onSave(localSettings); onClose(); }} 
            className="px-12 py-3.5 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all w-full"
           >
             Aplicar e Sair
           </button>
        </div>
      </div>
    </div>
  );
};
