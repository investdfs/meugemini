import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { modelId, history, newMessage, attachments, systemInstruction, googleSearchEnabled, provider } = await req.json();

    if (provider === 'google') {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return new Response('Google API Key not configured', { status: 500 });

      const ai = new GoogleGenAI({ apiKey });
      const model = ai.models.generateContent({
        model: modelId,
        contents: [...history, { role: 'user', parts: [{ text: newMessage }, ...attachments.map((a: any) => ({ inlineData: { mimeType: a.mimeType, data: a.data } }))] }],
        config: {
          systemInstruction,
          tools: googleSearchEnabled ? [{ googleSearch: {} }] : undefined,
        },
      });

      const response = await model;
      return new Response(JSON.stringify({ 
        text: response.text, 
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri })) 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Proxy OpenRouter
    const orKey = process.env.OPENROUTER_API_KEY;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${orKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'system', content: systemInstruction }, ...history, { role: 'user', content: newMessage }],
      })
    });
    
    const data = await response.json();
    return new Response(JSON.stringify({ text: data.choices[0]?.message?.content }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}