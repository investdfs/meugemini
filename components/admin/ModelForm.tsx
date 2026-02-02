/**
 * Model Form Component
 * Add/Edit form for AI models
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Cpu } from 'lucide-react';
import { AIModel, ProviderStatus, ProviderName, ModelCapabilities } from '../../types/ai';

interface ModelFormProps {
    model: AIModel | null;
    providers: ProviderStatus[];
    onSubmit: (data: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onClose: () => void;
}

export const ModelForm: React.FC<ModelFormProps> = ({ model, providers, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        modelId: '',
        displayName: '',
        description: '',
        providerName: 'openrouter' as ProviderName,
        isDefault: false,
        priorityOrder: 10,
        isActive: true,
        capabilities: {
            supportsVision: false,
            supportsTools: false,
            supportsStreaming: true,
            supportsReasoning: false,
            contextWindow: 128000,
        } as ModelCapabilities,
    });

    useEffect(() => {
        if (model) {
            setFormData({
                modelId: model.modelId,
                displayName: model.displayName,
                description: model.description || '',
                providerName: model.providerName,
                isDefault: model.isDefault,
                priorityOrder: model.priorityOrder,
                isActive: model.isActive,
                capabilities: model.capabilities,
            });
        }
    }, [model]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const provider = providers.find(p => p.name === formData.providerName);

        onSubmit({
            ...formData,
            providerId: `provider_${formData.providerName}`,
        });
    };

    const configuredProviders = providers.filter(p => p.isConfigured);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                            {model ? 'Editar Modelo' : 'Novo Modelo'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Provider */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Provedor</label>
                        <select
                            value={formData.providerName}
                            onChange={(e) => setFormData({ ...formData, providerName: e.target.value as ProviderName })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {providers.map(p => (
                                <option key={p.name} value={p.name} disabled={!p.isConfigured}>
                                    {p.displayName} {!p.isConfigured && '(não configurado)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Model ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">ID do Modelo</label>
                        <input
                            type="text"
                            value={formData.modelId}
                            onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                            placeholder="ex: gpt-4o-mini, gemini-3-flash-preview"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome de Exibição</label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="ex: GPT-4o Mini"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Descrição</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Breve descrição do modelo..."
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">
                            Prioridade (menor = mais prioritário)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={formData.priorityOrder}
                            onChange={(e) => setFormData({ ...formData, priorityOrder: parseInt(e.target.value) || 10 })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Context Window */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Janela de Contexto</label>
                        <input
                            type="number"
                            value={formData.capabilities.contextWindow || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    capabilities: { ...formData.capabilities, contextWindow: parseInt(e.target.value) || undefined },
                                })
                            }
                            placeholder="128000"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Capabilities */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Capacidades</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'supportsVision', label: 'Visão (Imagens)' },
                                { key: 'supportsTools', label: 'Ferramentas' },
                                { key: 'supportsStreaming', label: 'Streaming' },
                                { key: 'supportsReasoning', label: 'Raciocínio' },
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(formData.capabilities as any)[key] || false}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                capabilities: { ...formData.capabilities, [key]: e.target.checked },
                                            })
                                        }
                                        className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-300">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-300">Ativo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-yellow-500 focus:ring-yellow-500"
                            />
                            <span className="text-sm text-gray-300">Modelo Padrão</span>
                        </label>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-medium transition-all"
                    >
                        <Save className="w-4 h-4" />
                        {model ? 'Salvar Alterações' : 'Adicionar Modelo'}
                    </button>
                </form>
            </div>
        </div>
    );
};
