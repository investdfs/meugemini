
import { KnowledgeChunk, Attachment } from '../types';

export class RagService {
  private static CHUNK_SIZE = 1200;
  private static CHUNK_OVERLAP = 200;

  /**
   * Divide um texto em pedaços menores com sobreposição para manter o contexto.
   */
  static createChunks(text: string, fileId: string, fileName: string): KnowledgeChunk[] {
    const chunks: KnowledgeChunk[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.CHUNK_SIZE, text.length);
      const chunkText = text.substring(start, end);
      
      chunks.push({
        id: Math.random().toString(36).substring(2, 11),
        fileId,
        fileName,
        text: chunkText.trim()
      });

      start += (this.CHUNK_SIZE - this.CHUNK_OVERLAP);
    }

    return chunks;
  }

  /**
   * Realiza uma busca simples baseada em frequência de termos (BM25-lite) 
   * para encontrar os trechos mais relevantes para uma consulta.
   */
  static searchRelevantChunks(query: string, allChunks: KnowledgeChunk[], topK: number = 4): KnowledgeChunk[] {
    if (!query || allChunks.length === 0) return [];

    const queryTerms = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);

    if (queryTerms.length === 0) return allChunks.slice(0, topK);

    const scoredChunks = allChunks.map(chunk => {
      let score = 0;
      const chunkTextLower = chunk.text.toLowerCase();
      
      queryTerms.forEach(term => {
        // Bonus por palavra exata encontrada
        const regex = new RegExp(`\\b${term}\\b`, 'g');
        const matches = chunkTextLower.match(regex);
        if (matches) {
          score += matches.length * 10;
        } else if (chunkTextLower.includes(term)) {
          // Score menor se apenas contiver a substring
          score += 2;
        }
      });

      return { ...chunk, score };
    });

    return scoredChunks
      .filter(c => (c.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  }

  /**
   * Formata os trechos recuperados para serem injetados no prompt.
   */
  static formatContext(chunks: KnowledgeChunk[]): string {
    if (chunks.length === 0) return "";
    
    return `
[CONTEXTO RECUPERADO DA MEMÓRIA LOCAL - USE ESTAS INFORMAÇÕES PARA RESPONDER SE FOR RELEVANTE]
${chunks.map((c, i) => `--- TRECHO ${i+1} (Arquivo: ${c.fileName}) ---\n${c.text}`).join('\n\n')}
[FIM DO CONTEXTO]
`;
  }
}
