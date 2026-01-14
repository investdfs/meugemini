
import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { FuturisticLogo } from './FuturisticLogo';

interface MasterPasswordModalProps {
  onUnlock: (password: string) => void;
  error?: string | null;
}

export const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({ onUnlock, error }) => {
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock(password);
      setIsUnlocking(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-gemini-dark flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/30 blur-[120px] rounded-full animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative animate-message">
        <div className="flex flex-col items-center mb-10">
          <FuturisticLogo size={80} isProcessing={isUnlocking} />
          <h1 className="text-3xl font-black text-white mt-6 tracking-tighter">Cofre de Segurança</h1>
          <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Acesso Restrito - EB10-IG</p>
        </div>

        <form onSubmit={handleSubmit} className="glass border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Senha Mestra</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite para descriptografar..."
                className="w-full bg-white/5 border border-white/5 focus:border-blue-500/50 text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-gray-600 text-lg"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-shake">
              <ShieldAlert size={14} className="text-red-500" />
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={!password || isUnlocking}
            className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            {isUnlocking ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
            Desbloquear Cofre
          </button>

          <p className="text-center text-[9px] text-gray-600 font-bold uppercase leading-relaxed tracking-widest">
            Suas chaves API são mantidas em memória apenas enquanto a sessão estiver ativa.
          </p>
        </form>

        <button 
          onClick={() => { if(confirm("Isso apagará todos os dados locais. Deseja continuar?")) { localStorage.clear(); window.location.reload(); }}}
          className="w-full mt-8 text-[10px] text-gray-700 hover:text-red-500 font-black uppercase tracking-widest transition-colors"
        >
          Esqueceu a senha? Limpar todos os dados
        </button>
      </div>
    </div>
  );
};
