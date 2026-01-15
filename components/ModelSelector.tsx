
import React, { useState, useMemo } from 'react';
import { ChevronDown, Check, Zap, Cpu, Key, Sparkles } from 'lucide-react';
import { AppSettings, Provider } from '../types';
import { AVAILABLE_MODELS, PROVIDER_LABELS } from '../constants';

interface ModelSelectorProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ settings, onUpdateSettings, onOpenSettings }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isActuallyFree = settings.provider === 'openrouter' && !settings.openRouterApiKey;

  const availableModels = useMemo(() => {
    return AVAILABLE_MODELS.filter(m => {
      // Se for OpenRouter e o modelo for :free, sempre está disponível
      if (m.provider === 'openrouter' && m.id.endsWith(':free')) return true;

      const field = (
        m.provider === 'google' ? settings.googleApiKey :
        m.provider === 'openai' ? settings.openaiApiKey :
        m.provider === 'anthropic' ? settings.anthropicApiKey :
        m.provider === 'deepseek' ? settings.deepseekApiKey :
        m.provider === 'groq' ? settings.groqApiKey :
        m.provider === 'mistral' ? settings.mistralApiKey :
        m.provider === 'xai' ? settings.xaiApiKey :
        settings.openRouterApiKey
      );
      return !!field && field.trim().length > 0;
    });
  }, [settings]);

  const activeProviders = useMemo(() => {
    const providers = new Set<Provider>();
    availableModels.forEach(m => providers.add(m.provider));
    return Array.from(providers);
  }, [availableModels]);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === settings.modelId) || AVAILABLE_MODELS[0];

  const handleModelSelect = (modelId: string, provider: Provider) => {
    onUpdateSettings({ modelId, provider });
    setIsOpen(false);
  };

  const isFreeModel = currentModel.id.endsWith(':free');

  return (
    <div className="relative z-[60]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 group"
      >
        <div className={`w-2.5 h-2.5 rounded-full ${isFreeModel || activeProviders.includes(settings.provider) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
        <div className="flex flex-col items-start text-left">
           <div className="flex items-center gap-1.5">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
               {isActuallyFree ? 'OpenRouter (Grátis)' : (PROVIDER_LABELS[settings.provider] || 'SELECIONAR')}
             </span>
             {isFreeModel && <Sparkles size={10} className="text-blue-500 mb-1" />}
           </div>
           <span className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-none group-hover:text-blue-500 transition-colors">
             {currentModel.name}
           </span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-3 w-80 bg-white dark:bg-[#1e1f20] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden animate-message">
             
             <div className="p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-[#282a2c] border-b border-gray-100 dark:border-white/5">
                {activeProviders.length > 0 ? activeProviders.map(p => (
                  <button 
                    key={p}
                    onClick={() => handleModelSelect(AVAILABLE_MODELS.find(m => m.provider === p)!.id, p)}
                    className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all ${settings.provider === p ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
                  >
                     {PROVIDER_LABELS[p].split(' ')[0]}
                  </button>
                )) : (
                  <button onClick={() => { handleModelSelect(AVAILABLE_MODELS[0].id, 'openrouter'); }} className="w-full py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase">Ativar Modo Free</button>
                )}
             </div>

             <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-3 space-y-1">
                {activeProviders.includes(settings.provider) ? (
                   availableModels.filter(m => m.provider === settings.provider).map(model => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id, model.provider)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${settings.modelId === model.id ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-100' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{model.name}</span>
                          {model.id.endsWith(':free') && <span className="text-[8px] px-1.5 py-0.5 bg-blue-500 text-white rounded-md font-black uppercase">FREE</span>}
                        </div>
                        <span className="text-[10px] opacity-60 font-medium">{model.description}</span>
                      </div>
                      {settings.modelId === model.id && <Check size={14} className="text-blue-500" />}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center space-y-4">
                     <p className="text-[11px] font-medium text-gray-500">Este provedor exige uma chave API. Use o <b>OpenRouter</b> para acessar modelos gratuitos.</p>
                  </div>
                )}
             </div>

             <div className="p-3 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c]">
                <button 
                  onClick={() => { setIsOpen(false); onOpenSettings(); }} 
                  className="w-full py-2.5 rounded-xl bg-gray-200 dark:bg-white/5 text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest"
                >
                   Configurar Chaves API
                </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};
