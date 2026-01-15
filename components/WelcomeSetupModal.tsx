
import React from 'react';
import { Key, ShieldCheck, ArrowRight, ExternalLink, X, Sparkles } from 'lucide-react';

interface WelcomeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onSelectFreeMode: () => void;
}

export const WelcomeSetupModal: React.FC<WelcomeSetupModalProps> = ({ isOpen, onClose, onOpenSettings, onSelectFreeMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#161618] rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(78,149,255,0.15)] overflow-hidden flex flex-col animate-message ring-1 ring-white/5">
        
        {/* Banner Superior */}
        <div className="relative h-44 bg-gradient-to-br from-[#4e95ff] via-[#8b5cf6] to-[#06b6d4] flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)]"></div>
          
          <div className="relative w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
             <div className="w-12 h-12 rounded-full bg-white/40 blur-sm animate-pulse"></div>
             <div className="absolute inset-0 rounded-full border border-white/30 border-dashed animate-[spin_10s_linear_infinite]"></div>
          </div>

          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all">
             <X size={20} />
          </button>
        </div>

        <div className="p-8 text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-white tracking-tighter">
              Bem-vindo ao Léo
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed font-medium px-4">
              Sua central avançada de IA. Para começar, conecte sua chave ou use o acesso livre.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-3xl border border-white/5 text-left transition-all hover:bg-white/[0.05]">
              <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 shrink-0 border border-blue-500/20">
                <Key size={20} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Controle Total</h3>
                <p className="text-[10px] text-gray-500 font-medium leading-snug">Use suas próprias chaves do Google AI Studio ou OpenRouter.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-3xl border border-white/5 text-left transition-all hover:bg-white/[0.05]">
              <div className="p-3 rounded-2xl bg-violet-600/20 text-violet-400 shrink-0 border border-violet-500/20">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Privacidade Local</h3>
                <p className="text-[10px] text-gray-500 font-medium leading-snug">Dados criptografados no seu navegador.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button 
              onClick={onOpenSettings}
              className="w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              Configurar Minhas Chaves
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button 
              onClick={onSelectFreeMode}
              className="w-full py-4 bg-white/5 text-gray-300 border border-white/10 font-bold text-[11px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 group shadow-inner"
            >
              <Sparkles size={16} className="text-blue-500 animate-pulse" />
              Usar modelos grátis (Acesso Público)
            </button>
            
            <div className="flex items-center justify-center gap-4 pt-2">
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                OpenRouter <ExternalLink size={10} />
              </a>
              <span className="w-px h-2 bg-white/10"></span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                Google AI <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        <div className="p-4 bg-black/40 text-center border-t border-white/5">
           <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.4em]">Tecnologia Segura de Ponta a Ponta</p>
        </div>
      </div>
    </div>
  );
};
