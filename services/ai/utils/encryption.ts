/**
 * AI Model Encryption Utilities
 * Secure storage for API keys using AES encryption
 */

import CryptoJS from 'crypto-js';

// Unique device ID persisted in localStorage for stable encryption
const getDeviceId = (): string => {
    const DEVICE_ID_KEY = 'meugemini_device_id';
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        // Generate a random device ID and persist it
        deviceId = CryptoJS.lib.WordArray.random(16).toString();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
};

// Encryption key from environment or stable fallback
const getEncryptionKey = (): string => {
    if (typeof process !== 'undefined' && process.env?.ENCRYPTION_SECRET) {
        return process.env.ENCRYPTION_SECRET;
    }
    // Use stable device ID + salt for consistent encryption key
    const stableKey = [
        getDeviceId(),
        window.location.hostname || 'localhost',
        'meugemini-salt-v2',
    ].join('-');
    return CryptoJS.SHA256(stableKey).toString().slice(0, 32);
};

/**
 * Encrypts an API key for secure storage
 */
export const encryptApiKey = (plainKey: string): string => {
    if (!plainKey) return '';
    const key = getEncryptionKey();
    return CryptoJS.AES.encrypt(plainKey, key).toString();
};

/**
 * Decrypts a stored API key
 * Falls back to treating the value as plain text if decryption fails
 */
export const decryptApiKey = (encryptedKey: string): string => {
    if (!encryptedKey) return '';

    try {
        const key = getEncryptionKey();
        const bytes = CryptoJS.AES.decrypt(encryptedKey, key);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        // If decryption produces empty string but we had input,
        // the key might be stored in plain text (legacy)
        if (!decrypted && encryptedKey.length > 0) {
            // Check if it looks like a plain API key (not encrypted)
            if (!isEncryptedKey(encryptedKey)) {
                console.warn('[encryption] Key appears to be plain text, re-encrypting...');
                return encryptedKey;
            }
            throw new Error('Decryption produced empty result');
        }

        return decrypted;
    } catch (error) {
        console.error('Failed to decrypt API key:', error);

        // If the value doesn't look encrypted, return it as-is (migration path)
        if (!isEncryptedKey(encryptedKey)) {
            return encryptedKey;
        }

        return '';
    }
};

/**
 * Validates if a string is a valid encrypted key
 */
export const isEncryptedKey = (value: string): boolean => {
    if (!value) return false;
    // AES encrypted strings are Base64 and start with 'U2Fsd' (Salted__)
    return value.startsWith('U2Fsd') && value.length > 50;
};

/**
 * Masks an API key for display (shows first 4 and last 4 characters)
 */
export const maskApiKey = (key: string): string => {
    if (!key || key.length < 12) return '••••••••';
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
};

