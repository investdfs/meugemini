import React, { useEffect, useState, useRef } from 'react';
import { X, Key, Info, ExternalLink, Globe, Cpu, Download, Upload, Database, Search, User } from 'lucide-react';
import { AppSettings, ModelId, Provider, ChatSession, Agent } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onExportData,
  onImportData,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentModels = AVAILABLE_MODELS.filter(m => m.provider === localSettings.provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1e1f20] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0 bg-[#282a2c]">
          <h2 className="text-xl font-semibold text-white">Configurações</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* AI Profile Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
              <User size={16} />
              Identidade da IA
            </label>
            <div className="space-y-2">
              <span className="text-xs text-gray-500">Nome de Exibição</span>
              <input
                type="text"
                value={localSettings.aiDisplayName}
                onChange={(e) => setLocalSettings({ ...localSettings, aiDisplayName: e.target.value })}
                placeholder="Ex: Jarvis, Assistente, Gemini..."
                className="w-full bg-[#282a2c] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 outline-none transition-all placeholder-gray-500"
              />
            </div>
          </div>

          {/* Provider Selector */}
          <div className="space-y-3">
             <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
              <Globe size={16} />
              Provedor da IA
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#282a2c] p-1 rounded-lg">
              <button
                onClick={() => {
                  setLocalSettings({ 
                    ...localSettings, 
                    provider: 'google',
                    modelId: 'gemini-3-flash-preview'
                  });
                }}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  localSettings.provider === 'google' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-[#37393b]'
                }`}
              >
                Google Gemini
              </button>
              <button
                 onClick={() => {
                  setLocalSettings({ 
                    ...localSettings, 
                    provider: 'openrouter',
                    modelId: 'deepseek/deepseek-r1:free'
                  });
                }}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  localSettings.provider === 'openrouter' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-[#37393b]'
                }`}
              >
                OpenRouter
              </button>
            </div>
          </div>

          {/* Google Search Toggle */}
          {localSettings.provider === 'google' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search size={16} />
                  Pesquisa Google (Grounding)
                </div>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, googleSearchEnabled: !localSettings.googleSearchEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    localSettings.googleSearchEnabled ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings.googleSearchEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              <p className="text-xs text-gray-400">Permite que o assistente acesse informações atualizadas na web.</p>
            </div>
          )}

          {/* API Key Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
              <Key size={16} />
              {localSettings.provider === 'google' ? 'Chave API do Google' : 'Chave API da OpenRouter'}
            </label>
            
            {localSettings.provider === 'google' ? (
              <>
                <input
                  type="password"
                  value={localSettings.apiKey}
                  onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                  placeholder="Cole sua Google API Key..."
                  className="w-full bg-[#282a2c] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 outline-none transition-all placeholder-gray-500"
                />
                <div className="text-xs text-gray-400 flex items-start gap-1">
                  <Info size={12} className="mt-0.5 flex-shrink-0" />
                  <p>
                     Obtenha sua chave gratuitamente no 
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-400 hover:underline ml-1 inline-flex items-center"
                    >
                      Google AI Studio <ExternalLink size={10} className="ml-0.5"/>
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <>
                <input
                  type="password"
                  value={localSettings.openRouterApiKey || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, openRouterApiKey: e.target.value })}
                  placeholder="Cole sua OpenRouter API Key..."
                  className="w-full bg-[#282a2c] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 outline-none transition-all placeholder-gray-500"
                />
                <div className="text-xs text-gray-400 flex items-start gap-1">
                  <Info size={12} className="mt-0.5 flex-shrink-0" />
                  <p>
                     Obtenha sua chave no 
                    <a 
                      href="https://openrouter.ai/keys" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-purple-400 hover:underline ml-1 inline-flex items-center"
                    >
                      OpenRouter Dashboard <ExternalLink size={10} className="ml-0.5"/>
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
              <Cpu size={16} />
              Modelo
            </label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {currentModels.map((model) => (
                <div 
                  key={model.id}
                  onClick={() => setLocalSettings({ ...localSettings, modelId: model.id })}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${
                    localSettings.modelId === model.id 
                      ? localSettings.provider === 'google' 
                        ? 'bg-blue-900/20 border-blue-500/50' 
                        : 'bg-purple-900/20 border-purple-500/50'
                      : 'bg-[#282a2c] border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                        localSettings.modelId === model.id 
                          ? localSettings.provider === 'google' ? 'text-blue-400' : 'text-purple-400' 
                          : 'text-gray-200'
                      }`}>
                      {model.name}
                    </span>
                    {localSettings.modelId === model.id && (
                      <div className={`w-2 h-2 rounded-full ${localSettings.provider === 'google' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{model.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-700">
            <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
              <Database size={16} />
              Dados e Backup
            </label>
            <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={onExportData}
                 className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#282a2c] hover:bg-[#37393b] text-white text-sm font-medium rounded-lg border border-gray-700 transition-colors"
               >
                 <Download size={16} />
                 Exportar
               </button>
               <button
                 onClick={handleImportClick}
                 className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#282a2c] hover:bg-[#37393b] text-white text-sm font-medium rounded-lg border border-gray-700 transition-colors"
               >
                 <Upload size={16} />
                 Importar
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 accept=".json" 
                 className="hidden" 
               />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#282a2c] flex justify-end shrink-0">
          <button
            onClick={handleSave}
            className={`px-6 py-2 text-white font-medium rounded-full transition-colors shadow-lg ${
                localSettings.provider === 'google' 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' 
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/20'
            }`}
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};