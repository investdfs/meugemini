
import React, { useState, useEffect, useRef } from 'react';
import { X, User, FileText, Link as LinkIcon, Save, Bot, Palette, Tag, Camera, Smile, Plus, BrainCircuit } from 'lucide-react';
import { Agent } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAgent: (agent: Agent) => void;
  agentToEdit?: Agent | null;
}

const THEME_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#10b981', // Emerald
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
];

const EMOJI_PRESETS = ['🤖', '🧠', '✍️', '🎨', '🚀', '💼', '🧪', '⚖️', '🌐', '📊'];

export const AgentsModal: React.FC<AgentsModalProps> = ({
  isOpen,
  onClose,
  onSaveAgent,
  agentToEdit
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instruction, setInstruction] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [notebookLmUrl, setNotebookLmUrl] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name);
      setDescription(agentToEdit.description);
      setInstruction(agentToEdit.systemInstruction);
      setDriveLink(agentToEdit.driveFolderUrl);
      setNotebookLmUrl(agentToEdit.notebookLmUrl || '');
      setAvatar(agentToEdit.avatar || '🤖');
      setThemeColor(agentToEdit.themeColor || THEME_COLORS[0]);
      setTags(agentToEdit.tags || []);
    } else {
      setName('');
      setDescription('');
      setInstruction('');
      setDriveLink('');
      setNotebookLmUrl('');
      setAvatar('🤖');
      setThemeColor(THEME_COLORS[0]);
      setTags([]);
    }
  }, [agentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 5) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newAgent: Agent = {
      id: agentToEdit ? agentToEdit.id : uuidv4(),
      name,
      description,
      systemInstruction: instruction,
      driveFolderUrl: driveLink,
      notebookLmUrl,
      createdAt: agentToEdit ? agentToEdit.createdAt : Date.now(),
      avatar,
      themeColor,
      tags
    };

    onSaveAgent(newAgent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#1e1f20] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-[#282a2c]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden transition-colors duration-300"
              style={{ backgroundColor: themeColor }}
            >
              {avatar.startsWith('data:image') ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{avatar}</span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {agentToEdit ? 'Customizar Agente' : 'Novo Agente Customizado'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Customization */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-[#131314] rounded-xl border border-gray-200 dark:border-gray-800">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Smile size={14} /> Avatar
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {EMOJI_PRESETS.map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${avatar === emoji ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-dashed border-gray-400 dark:border-gray-700 hover:border-blue-500 transition-colors"
                    >
                      <Camera size={14} className="text-gray-500" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Palette size={14} /> Cor de Destaque
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {THEME_COLORS.map(color => (
                      <button 
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all transform hover:scale-110 ${themeColor === color ? 'border-white dark:border-white scale-110 shadow-md' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
               </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User size={16} /> Nome do Agente
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: DIEx Especialista"
                  className="w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-transparent focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText size={16} /> Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Análise de licitações e contratos"
                  className="w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-transparent focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
            <label className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <BrainCircuit size={16} /> Fonte de Conhecimento (NotebookLM)
            </label>
            <input
              type="text"
              value={notebookLmUrl}
              onChange={(e) => setNotebookLmUrl(e.target.value)}
              placeholder="Cole o link do seu notebooklm.google.com aqui..."
              className="w-full bg-white dark:bg-[#131314] text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-blue-500/20 focus:border-blue-500 outline-none text-xs font-mono"
            />
            <p className="text-[10px] text-gray-500 italic">
              Este link será fornecido como contexto mestre para o agente melhorar as respostas.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Bot size={16} /> Instruções do Sistema
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Descreva o comportamento..."
              className="w-full bg-gray-100 dark:bg-[#131314] text-gray-900 dark:text-white px-4 py-3 rounded-lg border border-transparent focus:border-blue-500 outline-none min-h-[120px] text-sm"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#282a2c] flex justify-end shrink-0 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-8 py-2.5 text-white font-semibold rounded-full flex items-center gap-2 transition-all shadow-lg active:scale-95"
            style={{ backgroundColor: !name.trim() ? '#94a3b8' : themeColor }}
          >
            <Save size={18} />
            {agentToEdit ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
