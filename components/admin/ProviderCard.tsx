/**
 * Provider Card Component
 * Displays status and configuration for a single AI provider
 */

import React, { useState } from 'react';
import {
    Wifi,
    WifiOff,
    Key,
    Settings,
    CheckCircle2,
    XCircle,
    Loader2,
    Eye,
    EyeOff,
    Zap,
} from 'lucide-react';
import { ProviderStatus, ConnectionTestResult, ProviderName } from '../../types/ai';
import { maskApiKey } from '../../services/ai';
import { getApiKey } from '../../services/ai';

interface ProviderCardProps {
    provider: ProviderStatus;
    isTesting: boolean;
    testResult?: ConnectionTestResult;
    onConfigureKey: (providerName: ProviderName, apiKey: string) => void;
    onTestConnection: (providerName: ProviderName) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
    provider,
    isTesting,
    testResult,
    onConfigureKey,
    onTestConnection,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);

    const currentKey = getApiKey(provider.name);
    const maskedKey = currentKey ? maskApiKey(currentKey) : '';

    const handleSaveKey = () => {
        if (apiKeyInput.trim()) {
            onConfigureKey(provider.name, apiKeyInput.trim());
            setApiKeyInput('');
            setIsExpanded(false);
        }
    };

    const getStatusIcon = () => {
        if (isTesting) {
            return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
        }
        if (testResult?.success) {
            return <CheckCircle2 className="w-5 h-5 text-green-400" />;
        }
        if (testResult?.success === false) {
            return <XCircle className="w-5 h-5 text-red-400" />;
        }
        if (provider.isActive && provider.isConfigured) {
            return <Wifi className="w-5 h-5 text-green-400" />;
        }
        return <WifiOff className="w-5 h-5 text-gray-500" />;
    };

    const getStatusText = () => {
        if (isTesting) return 'Testando...';
        if (testResult?.success) return `Conectado (${testResult.latencyMs}ms)`;
        if (testResult?.success === false) return testResult.error || 'Falha';
        if (provider.isConfigured) return 'Configurado';
        return 'Não configurado';
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{provider.displayName}</h3>
                        <p className="text-xs text-gray-400">{provider.modelCount} modelo(s)</p>
                    </div>
                </div>
                {getStatusIcon()}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-3">
                <span
                    className={`px-2 py-0.5 text-xs rounded-full ${provider.isConfigured && provider.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : provider.isConfigured
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-gray-600/50 text-gray-400'
                        }`}
                >
                    {getStatusText()}
                </span>
            </div>

            {/* Current Key Display */}
            {currentKey && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                    <Key className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400 font-mono">{maskedKey}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    {currentKey ? 'Alterar Chave' : 'Configurar'}
                </button>
                {provider.isConfigured && (
                    <button
                        onClick={() => onTestConnection(provider.name)}
                        disabled={isTesting}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                    >
                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                        Testar
                    </button>
                )}
            </div>

            {/* Expanded Key Input */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <label className="block text-sm text-gray-400 mb-2">Chave de API</label>
                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 pr-10 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleSaveKey}
                            disabled={!apiKeyInput.trim()}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={() => {
                                setIsExpanded(false);
                                setApiKeyInput('');
                            }}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Test Result Details */}
            {testResult && !isTesting && (
                <div
                    className={`mt-3 p-2 text-xs rounded-lg ${testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}
                >
                    {testResult.success
                        ? `✓ ${testResult.modelInfo || 'Conexão estabelecida'}`
                        : `✗ ${testResult.error}`}
                </div>
            )}
        </div>
    );
};
