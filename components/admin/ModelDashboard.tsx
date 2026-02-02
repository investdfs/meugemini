/**
 * Model Dashboard Component
 * Admin interface for managing AI models and providers
 */

import React, { useState } from 'react';
import {
    Cpu,
    Star,
    StarOff,
    Trash2,
    Edit3,
    GripVertical,
    Plus,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Layers,
    Zap,
    Globe,
} from 'lucide-react';
import { useAIModels } from '../../hooks/useAIModels';
import { ProviderCard } from './ProviderCard';
import { ModelForm } from './ModelForm';
import { OpenRouterQuickAdd } from './OpenRouterQuickAdd';
import { AIModel, ProviderName } from '../../types/ai';

interface ModelDashboardProps {
    onClose?: () => void;
}

export const ModelDashboard: React.FC<ModelDashboardProps> = ({ onClose }) => {
    const {
        models,
        providers,
        activeModel,
        isLoading,
        isTesting,
        testResults,
        addModel,
        updateModel,
        deleteModel,
        setDefaultModel,
        setActiveModel,
        configureApiKey,
        testConnection,
        refresh,
    } = useAIModels();

    const [activeTab, setActiveTab] = useState<'providers' | 'openrouter' | 'models'>('providers');
    const [showModelForm, setShowModelForm] = useState(false);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);
    const [expandedProvider, setExpandedProvider] = useState<ProviderName | null>(null);

    const modelsByProvider = models.reduce((acc, model) => {
        if (!acc[model.providerName]) acc[model.providerName] = [];
        acc[model.providerName].push(model);
        return acc;
    }, {} as Record<ProviderName, AIModel[]>);

    const handleEditModel = (model: AIModel) => {
        setEditingModel(model);
        setShowModelForm(true);
    };

    const handleDeleteModel = (model: AIModel) => {
        if (confirm(`Excluir modelo "${model.displayName}"?`)) {
            deleteModel(model.id);
        }
    };

    const handleFormSubmit = (data: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (editingModel) {
            updateModel(editingModel.id, data);
        } else {
            addModel(data);
        }
        setShowModelForm(false);
        setEditingModel(null);
    };

    // Handler para adicionar modelo OpenRouter rapidamente
    const handleQuickAddOpenRouterModel = (modelId: string, displayName: string) => {
        addModel({
            providerId: 'provider_openrouter',
            providerName: 'openrouter',
            modelId,
            displayName,
            description: 'Modelo configurado via OpenRouter',
            isDefault: false,
            priorityOrder: models.filter(m => m.providerName === 'openrouter').length + 10,
            isActive: true,
            capabilities: {
                supportsStreaming: true,
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Gestão de Modelos de IA</h2>
                        <p className="text-xs text-gray-400">
                            {models.filter(m => m.isActive).length} modelos ativos • {providers.filter(p => p.isConfigured).length} providers configurados
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refresh}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Fechar
                        </button>
                    )}
                </div>
            </div>

            {/* Active Model Banner */}
            {activeModel && (
                <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                    <Zap className="w-5 h-5 text-green-400" />
                    <div>
                        <span className="text-sm text-green-400">Modelo Ativo:</span>
                        <span className="ml-2 text-white font-medium">{activeModel.displayName}</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-4 pb-0">
                <button
                    onClick={() => setActiveTab('providers')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'providers'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                >
                    <Zap className="w-4 h-4 inline-block mr-2" />
                    Provedores
                </button>
                <button
                    onClick={() => setActiveTab('openrouter')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'openrouter'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                >
                    <Globe className="w-4 h-4 inline-block mr-2" />
                    OpenRouter
                </button>
                <button
                    onClick={() => setActiveTab('models')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'models'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                >
                    <Layers className="w-4 h-4 inline-block mr-2" />
                    Todos os Modelos
                </button>
            </div>

            <div className="p-4">
                {/* Providers Tab */}
                {activeTab === 'providers' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {providers.map(provider => (
                            <ProviderCard
                                key={provider.name}
                                provider={provider}
                                isTesting={isTesting.get(provider.name) || false}
                                testResult={testResults.get(provider.name)}
                                onConfigureKey={configureApiKey}
                                onTestConnection={testConnection}
                            />
                        ))}
                    </div>
                )}

                {/* OpenRouter Tab */}
                {activeTab === 'openrouter' && (
                    <div className="bg-gray-800/30 rounded-xl p-4">
                        <OpenRouterQuickAdd
                            models={models}
                            onAddModel={handleQuickAddOpenRouterModel}
                            onDeleteModel={deleteModel}
                        />
                    </div>
                )}

                {/* Models Tab */}
                {activeTab === 'models' && (
                    <div className="space-y-4">
                        {/* Add Model Button */}
                        <button
                            onClick={() => {
                                setEditingModel(null);
                                setShowModelForm(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-xl text-gray-400 hover:text-purple-400 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Adicionar Modelo
                        </button>

                        {/* Models by Provider */}
                        {Object.entries(modelsByProvider).map(([providerName, providerModels]) => (
                            <div key={providerName} className="border border-gray-800 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedProvider(expandedProvider === providerName ? null : providerName as ProviderName)}
                                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-purple-400" />
                                        <span className="font-medium text-white capitalize">{providerName}</span>
                                        <span className="text-xs text-gray-500">({providerModels.length})</span>
                                    </div>
                                    {expandedProvider === providerName ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>

                                {expandedProvider === providerName && (
                                    <div className="p-2 space-y-2">
                                        {providerModels.sort((a, b) => a.priorityOrder - b.priorityOrder).map(model => (
                                            <div
                                                key={model.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg ${model.isActive ? 'bg-gray-800/50' : 'bg-gray-900/50 opacity-50'
                                                    } ${activeModel?.id === model.id ? 'ring-2 ring-green-500/50' : ''}`}
                                            >
                                                <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white truncate">{model.displayName}</span>
                                                        {model.isDefault && (
                                                            <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                                                                Padrão
                                                            </span>
                                                        )}
                                                        {!model.isActive && (
                                                            <span className="px-1.5 py-0.5 text-xs bg-gray-600 text-gray-300 rounded">
                                                                Inativo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">{model.modelId}</p>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setActiveModel(model.id)}
                                                        className={`p-1.5 rounded-lg transition-colors ${activeModel?.id === model.id
                                                            ? 'text-green-400 bg-green-500/20'
                                                            : 'text-gray-500 hover:text-green-400 hover:bg-gray-700'
                                                            }`}
                                                        title="Usar este modelo"
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDefaultModel(model.id)}
                                                        className={`p-1.5 rounded-lg transition-colors ${model.isDefault
                                                            ? 'text-yellow-400 bg-yellow-500/20'
                                                            : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-700'
                                                            }`}
                                                        title={model.isDefault ? 'Modelo padrão' : 'Definir como padrão'}
                                                    >
                                                        {model.isDefault ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditModel(model)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteModel(model)}
                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Model Form Modal */}
            {showModelForm && (
                <ModelForm
                    model={editingModel}
                    providers={providers}
                    onSubmit={handleFormSubmit}
                    onClose={() => {
                        setShowModelForm(false);
                        setEditingModel(null);
                    }}
                />
            )}
        </div>
    );
};
