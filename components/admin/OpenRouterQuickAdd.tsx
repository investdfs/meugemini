/**
 * OpenRouter Quick Add Component
 * Simplified interface for adding OpenRouter models by ID
 */

import React, { useState } from 'react';
import { Plus, Trash2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { AIModel, ProviderName } from '../../types/ai';

interface OpenRouterQuickAddProps {
    models: AIModel[];
    onAddModel: (modelId: string, displayName: string) => void;
    onDeleteModel: (modelId: string) => void;
}

// Modelos populares sugeridos
const SUGGESTED_MODELS = [
    { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite (Free)' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)' },
    { id: 'stepfun/step-3.5-flash:free', name: 'Step 3.5 Flash (Free)' },
    { id: 'arcee-ai/trinity-large-preview:free', name: 'Trinity Large (Free)' },
    { id: 'upstage/solar-pro-3:free', name: 'Solar Pro 3 (Free)' },
];

export const OpenRouterQuickAdd: React.FC<OpenRouterQuickAddProps> = ({
    models,
    onAddModel,
    onDeleteModel,
}) => {
    const [newModelId, setNewModelId] = useState('');
    const [customName, setCustomName] = useState('');
    const [error, setError] = useState('');

    const openRouterModels = models.filter(m => m.providerName === 'openrouter');

    const handleAddModel = () => {
        if (!newModelId.trim()) {
            setError('Insira o ID do modelo');
            return;
        }

        // Verificar se já existe
        if (openRouterModels.some(m => m.modelId === newModelId.trim())) {
            setError('Este modelo já foi adicionado');
            return;
        }

        // Gerar nome automático se não fornecido
        const displayName = customName.trim() || generateDisplayName(newModelId.trim());

        onAddModel(newModelId.trim(), displayName);
        setNewModelId('');
        setCustomName('');
        setError('');
    };

    const handleQuickAdd = (modelId: string, name: string) => {
        if (!openRouterModels.some(m => m.modelId === modelId)) {
            onAddModel(modelId, name);
        }
    };

    const generateDisplayName = (modelId: string): string => {
        // Extrai nome do modelo do ID (ex: "google/gemini-2.0-flash" -> "Gemini 2.0 Flash")
        const parts = modelId.split('/');
        const modelPart = parts[parts.length - 1];
        return modelPart
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(':free', ' (Free)')
            .replace(':beta', ' (Beta)');
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Modelos OpenRouter</h3>
                <a
                    href="https://openrouter.ai/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                    Ver modelos disponíveis
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Quick Add Form */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={newModelId}
                        onChange={(e) => { setNewModelId(e.target.value); setError(''); }}
                        placeholder="ID do modelo (ex: google/gemini-2.0-flash:free)"
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                    <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nome personalizado (opcional)"
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                    </div>
                )}

                <button
                    onClick={handleAddModel}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Modelo
                </button>
            </div>

            {/* Suggested Models */}
            <div className="space-y-2">
                <span className="text-xs text-gray-500">Modelos sugeridos (clique para adicionar):</span>
                <div className="flex flex-wrap gap-2">
                    {SUGGESTED_MODELS.map(model => {
                        const isAdded = openRouterModels.some(m => m.modelId === model.id);
                        return (
                            <button
                                key={model.id}
                                onClick={() => handleQuickAdd(model.id, model.name)}
                                disabled={isAdded}
                                className={`px-2 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${isAdded
                                        ? 'bg-green-500/20 text-green-400 cursor-default'
                                        : 'bg-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white'
                                    }`}
                            >
                                {isAdded && <Check className="w-3 h-3" />}
                                {model.name.replace(' (Free)', '')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Current OpenRouter Models */}
            {openRouterModels.length > 0 && (
                <div className="space-y-2">
                    <span className="text-xs text-gray-500">Modelos configurados ({openRouterModels.length}):</span>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {openRouterModels.map(model => (
                            <div
                                key={model.id}
                                className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg group"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{model.displayName}</p>
                                    <p className="text-xs text-gray-500 truncate">{model.modelId}</p>
                                </div>
                                <button
                                    onClick={() => onDeleteModel(model.id)}
                                    className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Remover modelo"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
