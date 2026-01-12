import React, { useState, useEffect, useRef } from 'react';
import { X, User, FileText, Link as LinkIcon, Save, Bot, Palette, Tag, Camera, Smile, Plus } from 'lucide-react';
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
      setAvatar(agentToEdit.avatar || '🤖');
      setThemeColor(agentToEdit.themeColor || THEME_COLORS[0]);
      setTags(agentToEdit.tags || []);
    } else {
      setName('');
      setDescription('');
      setInstruction('');
      setDriveLink('');
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
      createdAt: agentToEdit ? agentToEdit.createdAt : Date.now(),
      avatar,
      themeColor,
      tags
    };

    onSaveAgent(newAgent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#1e1f20] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0 bg-[#282a2c]">
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
            <h2 className="text-xl font-semibold text-white">
              {agentToEdit ? 'Customizar Agente' : 'Novo Agente Customizado'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Customization */}
            <div className="space-y-4 p-4 bg-[#131314] rounded-xl border border-gray-800">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Smile size={14} /> Avatar (Emoji ou Foto)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {EMOJI_PRESETS.map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${avatar === emoji ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-dashed border-gray-700 hover:border-blue-500 transition-colors"
                      title="Upload Foto"
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
                        className={`w-6 h-6 rounded-full border-2 transition-all transform hover:scale-110 ${themeColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <div className="relative w-8 h-8 ml-2">
                      <button 
                        onClick={() => colorInputRef.current?.click()}
                        className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center bg-[#282a2c] hover:border-gray-500 transition-colors"
                        title="Escolher cor personalizada"
                      >
                        <Palette size={14} className="text-gray-400" />
                      </button>
                      <input 
                        type="color" 
                        ref={colorInputRef} 
                        value={themeColor} 
                        onChange={(e) => setThemeColor(e.target.value)} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Tag size={14} /> Categorias (Tags)
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Adicionar..."
                      className="flex-1 bg-[#1e1f20] text-sm text-white px-3 py-1.5 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
                    />
                    <button onClick={addTag} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-gray-300 text-[10px] font-medium rounded-full border border-gray-700">
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
               </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <User size={16} /> Nome do Agente
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Especialista em Marketing"
                  className="w-full bg-[#131314] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <FileText size={16} /> Descrição Curta
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Ajuda a criar campanhas e copys"
                  className="w-full bg-[#131314] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* System Instruction */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Bot size={16} /> Contexto e Personalidade (System Prompt)
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Descreva como o agente deve se comportar, o que ele sabe e como deve responder..."
              className="w-full bg-[#131314] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 outline-none min-h-[120px] text-sm"
            />
          </div>

          {/* Drive Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <LinkIcon size={16} /> Link da Pasta do Google Drive (Repositório)
            </label>
            <input
              type="text"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-[#131314] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 outline-none text-sm font-mono"
            />
            <p className="text-xs text-gray-500">
              O agente usará este link como referência de contexto.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#282a2c] flex justify-end shrink-0 border-t border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className={`px-8 py-2.5 text-white font-semibold rounded-full flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                !name.trim() ? 'bg-gray-600 cursor-not-allowed' : 'hover:brightness-110 shadow-lg'
            }`}
            style={{ backgroundColor: !name.trim() ? undefined : themeColor }}
          >
            <Save size={18} />
            {agentToEdit ? 'Atualizar Agente' : 'Salvar Agente'}
          </button>
        </div>
      </div>
    </div>
  );
};