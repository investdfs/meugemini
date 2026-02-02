/**
 * AI Model Management Module - Public Exports
 */

// Manager
export { aiModelManager, AIModelManager } from './AIModelManager';

// Storage
export {
    getProviders,
    saveProviders,
    updateProvider,
    getProviderByName,
    getApiKey,
    saveApiKey,
    removeApiKey,
    hasApiKey,
    getModels,
    saveModels,
    addModel,
    updateModel,
    deleteModel,
    setDefaultModel,
    getDefaultModel,
    getActiveModelsByPriority,
    getModelsByProvider,
    reorderModels,
    getActiveModel,
    getActiveModelId,
    setActiveModelId,
    resetToDefaults,
} from './modelStorage';

// Providers
export {
    OpenRouterProvider,
    GoogleProvider,
    OpenAICompatibleProvider,
    openAIProvider,
    deepSeekProvider,
    groqProvider,
    mistralProvider,
    xaiProvider,
} from './providers';

// Utils
export { encryptApiKey, decryptApiKey, maskApiKey } from './utils/encryption';
export { chatWithFallback, DEFAULT_FALLBACK_CONFIG } from './utils/fallbackHandler';
