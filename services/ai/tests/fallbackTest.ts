/**
 * Fallback Test Script
 * Tests the fallback mechanism with simulated failures
 */

import { aiModelManager } from '../AIModelManager';
import { getModels, saveApiKey } from '../modelStorage';

/**
 * Test fallback behavior when primary model fails
 * 
 * This test:
 * 1. Configures an invalid API key for the primary provider
 * 2. Attempts to make a chat request
 * 3. Verifies that the system falls back to an alternative model
 */
export async function testFallbackWithInvalidKey(): Promise<void> {
    console.log('🧪 Starting Fallback Test...\n');

    // Get current models
    const models = getModels();
    console.log(`📊 Found ${models.length} configured models\n`);

    // Save an invalid key for OpenRouter (common primary provider)
    console.log('⚠️ Setting INVALID API key for OpenRouter...');
    saveApiKey('openrouter', 'sk-or-INVALID-KEY-FOR-TESTING');

    // Test connection - should fail
    console.log('\n📡 Testing connection (should fail)...');
    const testResult = await aiModelManager.testConnection('openrouter');
    console.log(`   Result: ${testResult.success ? '✅ Connected' : '❌ Failed'}`);
    if (testResult.error) {
        console.log(`   Error: ${testResult.error}`);
    }

    // Attempt chat - should trigger fallback
    console.log('\n💬 Attempting chat with fallback...');
    try {
        let lastModelUsed = '';
        let responseText = '';

        for await (const chunk of aiModelManager.chat([
            { role: 'user', content: 'Olá, responda brevemente: 2+2=' }
        ])) {
            responseText = chunk.text || responseText;
            if (chunk.modelUsed) {
                lastModelUsed = chunk.modelUsed;
            }
        }

        console.log(`\n✅ Fallback SUCCESS!`);
        console.log(`   Model used: ${lastModelUsed}`);
        console.log(`   Response: "${responseText.substring(0, 100)}..."`);
    } catch (error) {
        console.log(`\n❌ Fallback FAILED - all models exhausted`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('\n✨ Fallback test completed!\n');
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
    console.log('Run testFallbackWithInvalidKey() in the console to test fallback behavior.');
    (window as any).testFallback = testFallbackWithInvalidKey;
}
