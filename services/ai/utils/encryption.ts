/**
 * AI Model Encryption Utilities
 * Secure storage for API keys using AES encryption
 */

import CryptoJS from 'crypto-js';

// Encryption key from environment or fallback for dev
const getEncryptionKey = (): string => {
    if (typeof process !== 'undefined' && process.env?.ENCRYPTION_SECRET) {
        return process.env.ENCRYPTION_SECRET;
    }
    // Fallback for client-side (uses a derived key from browser fingerprint)
    const browserKey = [
        navigator.userAgent.slice(0, 20),
        navigator.language,
        screen.width.toString(),
        'meugemini-salt-v1',
    ].join('-');
    return CryptoJS.SHA256(browserKey).toString().slice(0, 32);
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
 */
export const decryptApiKey = (encryptedKey: string): string => {
    if (!encryptedKey) return '';
    try {
        const key = getEncryptionKey();
        const bytes = CryptoJS.AES.decrypt(encryptedKey, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Failed to decrypt API key:', error);
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
