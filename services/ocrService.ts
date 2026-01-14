
import { createWorker } from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';

export class OcrService {
  /**
   * Extrai texto de uma imagem (Base64).
   */
  static async recognizeImage(base64: string, onProgress?: (progress: number) => void): Promise<string> {
    const worker = await createWorker('por', 1, {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress);
        }
      }
    });

    try {
      const { data: { text } } = await worker.recognize(`data:image/png;base64,${base64}`);
      return text;
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Converte páginas de PDF em imagens e executa OCR em cada uma.
   * Útil para documentos digitalizados sem camada de texto.
   */
  static async recognizeScannedPdf(base64: string, onProgress?: (progress: number) => void): Promise<string> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const loadingTask = pdfjs.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    const worker = await createWorker('por');

    try {
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Alta escala para melhor OCR
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/png');
          
          if (onProgress) onProgress((i - 1) / pdf.numPages);
          
          const { data: { text } } = await worker.recognize(imgData);
          fullText += text + "\n\n";
        }
      }
      return fullText;
    } finally {
      await worker.terminate();
    }
  }
}
