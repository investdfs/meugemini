/**
 * Model Selector Component
 * Displays available AI models from the admin-configured list
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, Check, Zap, Sparkles, Settings } from 'lucide-react';
import { AppSettings, Provider } from '../types';
import { PROVIDER_LABELS } from '../constants';
import { getActiveModelsByPriority, getActiveModel, setActiveModelId, hasApiKey } from '../services/ai';
import { AIModel, ProviderName } from '../types/ai';

interface ModelSelectorProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
  onOpenAIDashboard?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenAIDashboard
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Busca modelos configurados pelo admin
  const configuredModels = useMemo(() => {
    return getActiveModelsByPriority();
  }, [isOpen]); // Re-fetch when dropdown opens

  // Modelo atualmente selecionado
  const currentModel = useMemo(() => {
    return getActiveModel();
  }, [isOpen]);

  // Agrupa modelos por provider
  const modelsByProvider = useMemo(() => {
    const grouped: Record<ProviderName, AIModel[]> = {} as Record<ProviderName, AIModel[]>;
    configuredModels.forEach(model => {
      if (!grouped[model.providerName]) {
        grouped[model.providerName] = [];
      }
      grouped[model.providerName].push(model);
    });
    return grouped;
  }, [configuredModels]);

  // Lista de providers ativos
  const activeProviders = useMemo(() => {
    return Object.keys(modelsByProvider) as ProviderName[];
  }, [modelsByProvider]);

  // Provider selecionado (baseado no modelo atual)
  const [selectedProvider, setSelectedProvider] = useState<ProviderName>(
    currentModel?.providerName || 'openrouter'
  );

  const handleModelSelect = (model: AIModel) => {
    setActiveModelId(model.id);
    // Também atualiza o settings legado para compatibilidade
    onUpdateSettings({
      modelId: model.modelId,
      provider: model.providerName as Provider
    });
    setIsOpen(false);
  };

  const handleProviderChange = (provider: ProviderName) => {
    setSelectedProvider(provider);
    // Seleciona o primeiro modelo do provider
    const firstModel = modelsByProvider[provider]?.[0];
    if (firstModel) {
      handleModelSelect(firstModel);
    }
  };

  const isFreeModel = currentModel?.modelId.includes(':free') || false;
  const isConfigured = configuredModels.length > 0;

  // Mapeamento de labels de provider
  const getProviderLabel = (provider: ProviderName): string => {
    const labels: Record<ProviderName, string> = {
      openrouter: 'OpenRouter',
      google: 'Google',
      openai: 'OpenAI',
      anthropic: 'Claude',
      deepseek: 'DeepSeek',
      groq: 'Groq',
      mistral: 'Mistral',
      xai: 'Grok',
    };
    return labels[provider] || provider;
  };

  return (
    <div className="relative z-[60]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 group"
      >
        <div className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
        <div className="flex flex-col items-start text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
              {currentModel ? getProviderLabel(currentModel.providerName) : 'SELECIONAR'}
            </span>
            {isFreeModel && <Sparkles size={10} className="text-blue-500 mb-1" />}
          </div>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-none group-hover:text-blue-500 transition-colors">
            {currentModel?.displayName || 'Nenhum modelo'}
          </span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-3 w-80 bg-white dark:bg-[#1e1f20] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden animate-message">

            {/* Provider Tabs */}
            <div className="p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-[#282a2c] border-b border-gray-100 dark:border-white/5">
              {activeProviders.length > 0 ? activeProviders.map(provider => (
                <button
                  key={provider}
                  onClick={() => handleProviderChange(provider)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all ${selectedProvider === provider
                      ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                >
                  {getProviderLabel(provider)}
                </button>
              )) : (
                <button
                  onClick={onOpenAIDashboard}
                  className="w-full py-2 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase"
                >
                  Configurar Modelos
                </button>
              )}
            </div>

            {/* Model List */}
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-3 space-y-1">
              {modelsByProvider[selectedProvider]?.length > 0 ? (
                modelsByProvider[selectedProvider].map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${currentModel?.id === model.id
                        ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-100'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{model.displayName}</span>
                        {model.modelId.includes(':free') && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-blue-500 text-white rounded-md font-black uppercase">FREE</span>
                        )}
                        {model.isDefault && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-yellow-500/80 text-white rounded-md font-black uppercase">PADRÃO</span>
                        )}
                      </div>
                      <span className="text-[10px] opacity-60 font-medium truncate max-w-[200px]">
                        {model.description || model.modelId}
                      </span>
                    </div>
                    {currentModel?.id === model.id && <Check size={14} className="text-blue-500" />}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center space-y-4">
                  <p className="text-[11px] font-medium text-gray-500">
                    Nenhum modelo configurado para este provedor.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c] flex gap-2">
              <button
                onClick={() => { setIsOpen(false); onOpenSettings(); }}
                className="flex-1 py-2.5 rounded-xl bg-gray-200 dark:bg-white/5 text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest"
              >
                Chaves API
              </button>
              {onOpenAIDashboard && (
                <button
                  onClick={() => { setIsOpen(false); onOpenAIDashboard(); }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-1"
                >
                  <Settings size={12} />
                  Gerenciar
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
