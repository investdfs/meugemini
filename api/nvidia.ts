/**
 * NVIDIA NIM API Proxy
 * Handles NVIDIA API calls to bypass CORS restrictions
 */

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { action, apiKey, model, messages, options } = await req.json();

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const baseUrl = 'https://integrate.api.nvidia.com/v1';

        // Test connection action
        if (action === 'test') {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model || 'moonshotai/kimi-k2.5',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return new Response(JSON.stringify({
                    success: false,
                    error: error.error?.message || `HTTP ${response.status}`
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                modelInfo: 'Conectado a NVIDIA NIM'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Chat action with streaming
        if (action === 'chat') {
            const requestBody: Record<string, any> = {
                model: model || 'moonshotai/kimi-k2.5',
                messages,
                max_tokens: options?.maxTokens || 16384,
                temperature: options?.temperature ?? 1.0,
                top_p: options?.topP ?? 1.0,
                stream: true,
            };

            // Enable thinking mode if requested
            if (options?.enableThinking) {
                requestBody.chat_template_kwargs = { thinking: true };
            }

            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return new Response(JSON.stringify({
                    error: error.error?.message || `NVIDIA NIM: ${response.statusText}`
                }), {
                    status: response.status,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Stream the response back
            return new Response(response.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
