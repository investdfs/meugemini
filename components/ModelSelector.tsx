
import React, { useState } from 'react';
import { ChevronDown, Box, Cpu, Key, Check } from 'lucide-react';
import { AppSettings, Provider, ModelOption } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface ModelSelectorProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ settings, onUpdateSettings, onOpenSettings }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filtra modelos baseados no provedor selecionado
  const currentModels = AVAILABLE_MODELS.filter(m => m.provider === settings.provider);
  const currentModelName = settings.modelId === 'custom' 
    ? (settings.customModelId || 'Custom') 
    : AVAILABLE_MODELS.find(m => m.id === settings.modelId)?.name || settings.modelId;

  // Verifica se a chave do provedor atual está configurada
  const hasKey = settings.provider === 'google' ? !!settings.googleApiKey : !!settings.openRouterApiKey;

  const handleProviderChange = (provider: Provider) => {
    // Ao trocar provedor, seleciona o primeiro modelo da lista daquele provedor como default
    const firstModel = AVAILABLE_MODELS.find(m => m.provider === provider);
    onUpdateSettings({ 
      provider, 
      modelId: firstModel ? firstModel.id : 'custom'
    });
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all border border-transparent hover:border-black/5 dark:hover:border-white/10 group"
      >
        <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></div>
        <div className="flex flex-col items-start">
           <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider leading-none mb-0.5">
             {settings.provider === 'google' ? 'GOOGLE AI' : 'OPENROUTER'}
           </span>
           <span className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
             {currentModelName}
           </span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#1e1f20] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-50 animate-message">
             
             {/* Provider Switcher */}
             <div className="p-2 grid grid-cols-2 gap-1 bg-gray-50 dark:bg-[#282a2c] border-b border-gray-200 dark:border-white/5">
                <button 
                  onClick={() => handleProviderChange('google')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${settings.provider === 'google' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                >
                   <Box size={12} /> Google
                </button>
                <button 
                  onClick={() => handleProviderChange('openrouter')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${settings.provider === 'openrouter' ? 'bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                >
                   <Cpu size={12} /> OpenRouter
                </button>
             </div>

             {/* Key Warning */}
             {!hasKey && (
               <div 
                 onClick={onOpenSettings}
                 className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20 flex items-center gap-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
               >
                  <Key size={12} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Configurar API Key Necessária</span>
               </div>
             )}

             {/* Models List */}
             <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                <div className="px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modelos Disponíveis</div>
                {currentModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => { onUpdateSettings({ modelId: model.id }); setIsOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between group transition-all ${settings.modelId === model.id ? 'bg-blue-50 dark:bg-white/10 text-blue-700 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                  >
                    <span>{model.name}</span>
                    {settings.modelId === model.id && <Check size={12} className="text-blue-500 dark:text-blue-400" />}
                  </button>
                ))}
                
                {/* Custom Option */}
                <button
                    onClick={() => { onUpdateSettings({ modelId: 'custom' }); setIsOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between group transition-all ${settings.modelId === 'custom' ? 'bg-blue-50 dark:bg-white/10 text-blue-700 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                  >
                    <span className="italic">ID Personalizado...</span>
                    {settings.modelId === 'custom' && <Check size={12} />}
                  </button>
             </div>

             <div className="p-2 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c]">
                <button onClick={() => { setIsOpen(false); onOpenSettings(); }} className="w-full py-2 text-[10px] font-bold text-gray-500 hover:text-black dark:hover:text-white uppercase tracking-wider text-center">
                   Ver todas configurações
                </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};
