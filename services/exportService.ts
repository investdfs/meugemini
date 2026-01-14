
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from "docx";

export class ExportService {
  /**
   * Converte mm para twips (unidade interna do docx)
   * 1mm ≈ 56.7 twips
   */
  private static mmToTwips(mm: number): number {
    return Math.round(mm * 56.7);
  }

  /**
   * Gera um documento Word (.docx) no padrão EB10-IG-01.001.
   */
  static async exportToDocx(content: string, title: string = "Documento_Militar"): Promise<void> {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Tenta identificar o título (primeira linha que parece um identificador)
    const docHeaderIdx = lines.findIndex(l => 
      l.toUpperCase().includes('DIEX') || 
      l.toUpperCase().includes('OFÍCIO') || 
      l.toUpperCase().includes('MEMORANDO')
    );
    
    const docTitle = docHeaderIdx !== -1 ? lines[docHeaderIdx] : "DOCUMENTO INTERNO";
    const bodyLines = docHeaderIdx !== -1 ? lines.slice(docHeaderIdx + 1) : lines;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: this.mmToTwips(20),    // 2.0 cm
              bottom: this.mmToTwips(20), // 2.0 cm
              left: this.mmToTwips(30),   // 3.0 cm
              right: this.mmToTwips(15),  // 1.5 cm
            }
          }
        },
        children: [
          // Cabeçalho Oficial
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "MINISTÉRIO DA DEFESA", bold: true, size: 24, font: "Arial" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "EXÉRCITO BRASILEIRO", bold: true, size: 24, font: "Arial" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: "OM NOME - COMANDO OU CHEFIA", bold: true, size: 24, font: "Arial" }),
            ],
          }),

          // Título do Documento
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 400, after: 400 },
            children: [
              new TextRun({ text: docTitle.toUpperCase(), bold: true, size: 24, font: "Arial" }),
            ],
          }),

          // Corpo do Texto (Justificado com espaçamento 1.5)
          ...bodyLines.map(line => {
             // Se a linha parecer uma assinatura (começa com muitos hífens ou traços)
             if (line.includes('____')) return null;

             return new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 360, before: 120, after: 120 }, // 360 twips = 1.5 linhas
                children: [
                  new TextRun({ 
                    text: line, 
                    size: 24, // 12pt
                    font: "Arial" 
                  })
                ]
             });
          }).filter(p => p !== null) as Paragraph[],

          // Espaço para Assinatura
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000 },
            children: [
              new TextRun({ text: "_______________________________________", size: 24, font: "Arial" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "NOME COMPLETO - POSTO/GRAD", bold: true, size: 24, font: "Arial" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Cargo ou Função", size: 24, font: "Arial" }),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${safeTitle}_${Date.now()}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
