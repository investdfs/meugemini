/**
 * useAIModels Hook
 * React hook for AI model management state and operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    AIModel,
    ProviderStatus,
    ConnectionTestResult,
    ProviderName,
} from '../types/ai';
import {
    aiModelManager,
    getModels,
    getProviders,
    addModel,
    updateModel,
    deleteModel,
    setDefaultModel,
    reorderModels,
    getApiKey,
    saveApiKey,
    hasApiKey,
    getActiveModel,
    setActiveModelId,
} from '../services/ai';

interface UseAIModelsReturn {
    // Data
    models: AIModel[];
    providers: ProviderStatus[];
    activeModel: AIModel | undefined;

    // Loading states
    isLoading: boolean;
    isTesting: Map<ProviderName, boolean>;
    testResults: Map<ProviderName, ConnectionTestResult>;

    // Model operations
    addModel: (model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateModel: (id: string, updates: Partial<AIModel>) => void;
    deleteModel: (id: string) => void;
    setDefaultModel: (id: string) => void;
    setActiveModel: (id: string) => void;
    reorderModels: (orderedIds: string[]) => void;

    // Provider operations
    configureApiKey: (providerName: ProviderName, apiKey: string) => void;
    testConnection: (providerName: ProviderName) => Promise<ConnectionTestResult>;

    // Refresh
    refresh: () => void;
}

export function useAIModels(): UseAIModelsReturn {
    const [models, setModels] = useState<AIModel[]>([]);
    const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
    const [activeModel, setActiveModelState] = useState<AIModel | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState<Map<ProviderName, boolean>>(new Map());
    const [testResults, setTestResults] = useState<Map<ProviderName, ConnectionTestResult>>(new Map());

    // Load data
    const loadData = useCallback(() => {
        setIsLoading(true);
        try {
            setModels(getModels());
            setProviderStatuses(aiModelManager.getProviderStatuses());
            setActiveModelState(getActiveModel());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Model operations
    const handleAddModel = useCallback((model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>) => {
        addModel(model);
        loadData();
    }, [loadData]);

    const handleUpdateModel = useCallback((id: string, updates: Partial<AIModel>) => {
        updateModel(id, updates);
        loadData();
    }, [loadData]);

    const handleDeleteModel = useCallback((id: string) => {
        deleteModel(id);
        loadData();
    }, [loadData]);

    const handleSetDefaultModel = useCallback((id: string) => {
        setDefaultModel(id);
        loadData();
    }, [loadData]);

    const handleSetActiveModel = useCallback((id: string) => {
        setActiveModelId(id);
        loadData();
    }, [loadData]);

    const handleReorderModels = useCallback((orderedIds: string[]) => {
        reorderModels(orderedIds);
        loadData();
    }, [loadData]);

    // Provider operations
    const handleConfigureApiKey = useCallback((providerName: ProviderName, apiKey: string) => {
        saveApiKey(providerName, apiKey);
        loadData();
    }, [loadData]);

    const handleTestConnection = useCallback(async (providerName: ProviderName): Promise<ConnectionTestResult> => {
        setIsTesting(prev => new Map(prev).set(providerName, true));

        try {
            const result = await aiModelManager.testConnection(providerName);
            setTestResults(prev => new Map(prev).set(providerName, result));
            loadData(); // Refresh provider status
            return result;
        } finally {
            setIsTesting(prev => new Map(prev).set(providerName, false));
        }
    }, [loadData]);

    return {
        models,
        providers: providerStatuses,
        activeModel,
        isLoading,
        isTesting,
        testResults,
        addModel: handleAddModel,
        updateModel: handleUpdateModel,
        deleteModel: handleDeleteModel,
        setDefaultModel: handleSetDefaultModel,
        setActiveModel: handleSetActiveModel,
        reorderModels: handleReorderModels,
        configureApiKey: handleConfigureApiKey,
        testConnection: handleTestConnection,
        refresh: loadData,
    };
}
