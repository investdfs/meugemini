
import React from 'react';
import { Save, Download, Trash2, FileText, Type, AlignJustify, Eraser } from 'lucide-react';
import { ExportService } from '../services/exportService';

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onClear: () => void;
  theme: 'light' | 'dark';
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ content, onChange, onClear, theme }) => {
  const handleExport = async () => {
    if (!content) return;
    await ExportService.exportToDocx(content, "Documento_Editado");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#131314] border-l border-gray-200 dark:border-white/5 shadow-2xl animate-in slide-in-from-right duration-500">
      {/* Toolbar do Editor */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1e1f20]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/20">
            <FileText size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Editor Oficial</span>
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
          <div className="flex items-center gap-1 text-gray-400">
            <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md" title="Formatação"><Type size={16} /></button>
            <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md" title="Alinhamento"><AlignJustify size={16} /></button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onClear}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
            title="Limpar Editor"
          >
            <Eraser size={18} />
          </button>
          <button 
            onClick={handleExport}
            disabled={!content}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Download size={16} />
            Exportar .docx
          </button>
        </div>
      </div>

      {/* Área de Texto Estilizada (Simulando Papel A4) */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-[#0d0d0e] custom-scrollbar">
        <div className="max-w-[210mm] mx-auto min-h-[297mm] bg-white dark:bg-[#1e1f20] shadow-xl p-[20mm] md:p-[30mm] border border-gray-200 dark:border-white/5 rounded-sm transition-all duration-300">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="O conteúdo editado aparecerá aqui..."
            className="w-full h-full min-h-[250mm] bg-transparent outline-none resize-none text-gray-800 dark:text-gray-200 font-serif text-lg leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-700"
            style={{ fontFamily: 'Arial, sans-serif' }}
          />
        </div>
      </div>

      <div className="px-6 py-2 bg-gray-50 dark:bg-[#1e1f20] border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Padrão EB10-IG-01.001 v2.5</span>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{content.length} caracteres</span>
      </div>
    </div>
  );
};
