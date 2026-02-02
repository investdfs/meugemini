/**
 * AI Model Storage Service
 * Handles persistence of providers, models and API keys using localStorage with compression
 */

import LZString from 'lz-string';
import { ProviderConfig, AIModel, AI_STORAGE_KEYS, ProviderName } from '../../types/ai';
import { encryptApiKey, decryptApiKey } from './utils/encryption';
import { DEFAULT_PROVIDERS, DEFAULT_MODELS, generateModelId } from '../../config/providerDefaults';

// ==================== STORAGE HELPERS ====================

function saveToStorage<T>(key: string, data: T): void {
    try {
        const compressed = LZString.compress(JSON.stringify(data));
        localStorage.setItem(key, compressed);
    } catch (error) {
        console.error(`Failed to save ${key}:`, error);
    }
}

function loadFromStorage<T>(key: string): T | null {
    try {
        const compressed = localStorage.getItem(key);
        if (!compressed) return null;
        const decompressed = LZString.decompress(compressed);
        return decompressed ? JSON.parse(decompressed) : null;
    } catch (error) {
        console.error(`Failed to load ${key}:`, error);
        return null;
    }
}

// ==================== PROVIDER MANAGEMENT ====================

export function getProviders(): ProviderConfig[] {
    const stored = loadFromStorage<ProviderConfig[]>(AI_STORAGE_KEYS.PROVIDERS);
    if (stored && stored.length > 0) return stored;

    // Initialize with defaults
    const defaults = DEFAULT_PROVIDERS.map(p => ({ ...p }));
    saveToStorage(AI_STORAGE_KEYS.PROVIDERS, defaults);
    return defaults;
}

export function saveProviders(providers: ProviderConfig[]): void {
    saveToStorage(AI_STORAGE_KEYS.PROVIDERS, providers);
}

export function updateProvider(name: ProviderName, updates: Partial<ProviderConfig>): void {
    const providers = getProviders();
    const index = providers.findIndex(p => p.name === name);
    if (index >= 0) {
        providers[index] = { ...providers[index], ...updates, updatedAt: Date.now() };
        saveProviders(providers);
    }
}

export function getProviderByName(name: ProviderName): ProviderConfig | undefined {
    return getProviders().find(p => p.name === name);
}

// ==================== API KEY MANAGEMENT ====================

interface ApiKeyStore {
    [providerName: string]: string; // encrypted keys
}

export function getApiKey(providerName: ProviderName): string {
    const store = loadFromStorage<ApiKeyStore>(AI_STORAGE_KEYS.API_KEYS) || {};
    const encrypted = store[providerName];
    return encrypted ? decryptApiKey(encrypted) : '';
}

export function saveApiKey(providerName: ProviderName, plainKey: string): void {
    const store = loadFromStorage<ApiKeyStore>(AI_STORAGE_KEYS.API_KEYS) || {};
    store[providerName] = encryptApiKey(plainKey);
    saveToStorage(AI_STORAGE_KEYS.API_KEYS, store);
}

export function removeApiKey(providerName: ProviderName): void {
    const store = loadFromStorage<ApiKeyStore>(AI_STORAGE_KEYS.API_KEYS) || {};
    delete store[providerName];
    saveToStorage(AI_STORAGE_KEYS.API_KEYS, store);
}

export function hasApiKey(providerName: ProviderName): boolean {
    return !!getApiKey(providerName);
}

// ==================== MODEL MANAGEMENT ====================

export function getModels(): AIModel[] {
    const stored = loadFromStorage<AIModel[]>(AI_STORAGE_KEYS.MODELS);
    if (stored && stored.length > 0) return stored;

    // Initialize with defaults
    const now = Date.now();
    const defaults: AIModel[] = DEFAULT_MODELS.map(m => ({
        ...m,
        id: generateModelId(),
        createdAt: now,
        updatedAt: now,
    }));
    saveToStorage(AI_STORAGE_KEYS.MODELS, defaults);
    return defaults;
}

export function saveModels(models: AIModel[]): void {
    saveToStorage(AI_STORAGE_KEYS.MODELS, models);
}

export function addModel(model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>): AIModel {
    const models = getModels();
    const now = Date.now();
    const newModel: AIModel = {
        ...model,
        id: generateModelId(),
        createdAt: now,
        updatedAt: now,
    };
    models.push(newModel);
    saveModels(models);
    return newModel;
}

export function updateModel(id: string, updates: Partial<AIModel>): void {
    const models = getModels();
    const index = models.findIndex(m => m.id === id);
    if (index >= 0) {
        models[index] = { ...models[index], ...updates, updatedAt: Date.now() };
        saveModels(models);
    }
}

export function deleteModel(id: string): void {
    const models = getModels().filter(m => m.id !== id);
    saveModels(models);
}

export function setDefaultModel(id: string): void {
    const models = getModels().map(m => ({
        ...m,
        isDefault: m.id === id,
        updatedAt: Date.now(),
    }));
    saveModels(models);
}

export function getDefaultModel(): AIModel | undefined {
    // Busca modelo marcado como padrão
    const defaultModel = getModels().find(m => m.isDefault && m.isActive);
    if (defaultModel) return defaultModel;

    // Fallback: primeiro modelo OpenRouter ativo (padrão do sistema)
    const openRouterModels = getModels().filter(m => m.providerName === 'openrouter' && m.isActive);
    if (openRouterModels.length > 0) {
        return openRouterModels.sort((a, b) => a.priorityOrder - b.priorityOrder)[0];
    }

    // Último fallback: qualquer modelo ativo
    return getModels().find(m => m.isActive);
}

export function getActiveModelsByPriority(): AIModel[] {
    return getModels()
        .filter(m => m.isActive)
        .sort((a, b) => {
            // OpenRouter sempre tem prioridade em caso de empate
            if (a.priorityOrder === b.priorityOrder) {
                if (a.providerName === 'openrouter') return -1;
                if (b.providerName === 'openrouter') return 1;
            }
            return a.priorityOrder - b.priorityOrder;
        });
}

export function getModelsByProvider(providerName: ProviderName): AIModel[] {
    return getModels().filter(m => m.providerName === providerName);
}

export function reorderModels(orderedIds: string[]): void {
    const models = getModels();
    orderedIds.forEach((id, index) => {
        const model = models.find(m => m.id === id);
        if (model) {
            model.priorityOrder = index + 1;
            model.updatedAt = Date.now();
        }
    });
    saveModels(models);
}

// ==================== ACTIVE MODEL ====================

export function getActiveModelId(): string | null {
    return localStorage.getItem(AI_STORAGE_KEYS.ACTIVE_MODEL);
}

export function setActiveModelId(id: string): void {
    localStorage.setItem(AI_STORAGE_KEYS.ACTIVE_MODEL, id);
}

export function getActiveModel(): AIModel | undefined {
    const activeId = getActiveModelId();
    if (activeId) {
        const model = getModels().find(m => m.id === activeId);
        if (model?.isActive) return model;
    }
    return getDefaultModel();
}

// ==================== RESET ====================

export function resetToDefaults(): void {
    localStorage.removeItem(AI_STORAGE_KEYS.PROVIDERS);
    localStorage.removeItem(AI_STORAGE_KEYS.MODELS);
    localStorage.removeItem(AI_STORAGE_KEYS.ACTIVE_MODEL);
    // Note: API keys are preserved for security
}
