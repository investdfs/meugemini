
import React, { useEffect, useState, useCallback } from 'react';
import { X, Settings2, Key, ChevronDown, ShieldCheck, AlertTriangle, Loader2, Rocket, ShieldAlert, Plus, Trash2, BrainCircuit, CheckCircle2, Wifi, WifiOff, Globe, Lock, LayoutTemplate, MessageSquareQuote, Info, RefreshCcw, Edit3, Save, RotateCcw } from 'lucide-react';
import { AppSettings, Provider, SystemConfig, NotebookSource } from '../types';
import { PROVIDER_LABELS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  masterPassword: string | null;
  onUpdateMasterPassword: (password: string | null) => void;
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (config: SystemConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSave, 
  masterPassword, 
  onUpdateMasterPassword, 
  systemConfig, 
  onUpdateSystemConfig 
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeProviderTab, setActiveProviderTab] = useState<Provider>('google');
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState(false);
  
  const [localSystemConfig, setLocalSystemConfig] = useState<SystemConfig>(systemConfig);
  const [newNotebookLink, setNewNotebookLink] = useState('');
  const [newNotebookName, setNewNotebookName] = useState('');

  // Estados para Edição Manual
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testUrlConnectivity = async (url: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      await fetch(url, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      return true;
    } catch (e) {
      return false;
    }
  };

  const testSingleSource = async (id: string) => {
    setLocalSystemConfig(prev => ({
      ...prev,
      notebookSources: prev.notebookSources.map(s => s.id === id ? { ...s, status: 'checking' } : s)
    }));

    const source = localSystemConfig.notebookSources.find(s => s.id === id);
    if (!source) return;

    const isOk = await testUrlConnectivity(source.url);
    
    setLocalSystemConfig(prev => ({
      ...prev,
      notebookSources: prev.notebookSources.map(s => 
        s.id === id ? { ...s, status: isOk ? 'success' : 'error' } : s
      )
    }));
  };

  const runAllTests = useCallback(async (sources: NotebookSource[]) => {
    if (sources.length === 0) return;
    setLocalSystemConfig(prev => ({
      ...prev,
      notebookSources: prev.notebookSources.map(s => ({ ...s, status: 'checking' as const }))
    }));

    const results = await Promise.all(
      sources.map(async (s) => {
        const isOk = await testUrlConnectivity(s.url);
        return { ...s, status: (isOk ? 'success' : 'error') as 'success' | 'error' };
      })
    );
    setLocalSystemConfig(prev => ({ ...prev, notebookSources: results }));
  }, []);

  useEffect(() => { 
    if (isOpen) {
      setLocalSettings(settings);
      setActiveProviderTab(settings.provider);
      setLocalSystemConfig(systemConfig);
      setSaveStatus('idle');
      if (isAdminUnlocked) runAllTests(systemConfig.notebookSources);
    }
  }, [isOpen, isAdminUnlocked]);

  if (!isOpen) return null;

  const handleAdminUnlock = () => {
    if (adminPassword === '212300') {
      setIsAdminUnlocked(true);
      setAdminError(false);
      runAllTests(localSystemConfig.notebookSources);
    } else {
      setAdminError(true);
      setTimeout(() => setAdminError(false), 2000);
    }
  };

  const startEditing = (source: NotebookSource) => {
    setEditingId(source.id);
    setEditName(source.name);
    setEditUrl(source.url);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim() || !editUrl.trim()) return;
    
    setLocalSystemConfig(prev => ({
      ...prev,
      notebookSources: prev.notebookSources.map(s => 
        s.id === editingId ? { ...s, name: editName, url: editUrl, status: 'idle' } : s
      )
    }));
    setEditingId(null);
  };

  const addNotebookSource = async () => {
    const url = newNotebookLink.trim();
    const name = newNotebookName.trim() || "Nova Fonte de Conhecimento";
    if (!url) return;
    
    const tempId = Math.random().toString(36).substring(2, 9);
    const newSource: NotebookSource = {
      id: tempId,
      url,
      name,
      addedAt: Date.now(),
      isFixed: true, // Qualquer nova fonte do admin é considerada FIXA/MESTRE
      status: 'checking'
    };

    setLocalSystemConfig(prev => ({
      ...prev,
      notebookSources: [...prev.notebookSources, newSource]
    }));
    setNewNotebookLink('');
    setNewNotebookName('');

    const isOk = await testUrlConnectivity(url);
    setLocalSystemConfig(prev => ({
      ...prev,
      notebookSources: prev.notebookSources.map(s => 
        s.id === tempId ? { ...s, status: isOk ? 'success' : 'error' } : s
      )
    }));
  };

  const removeNotebookSource = (id: string) => {
    setLocalSystemConfig({
      ...localSystemConfig,
      notebookSources: localSystemConfig.notebookSources.filter(s => s.id !== id)
    });
  };

  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      onSave(localSettings);
      // Remove status temporários de validação antes de persistir
      const cleanSources = localSystemConfig.notebookSources.map(({ status, ...rest }) => rest);
      onUpdateSystemConfig({ ...localSystemConfig, notebookSources: cleanSources as NotebookSource[] });
      setSaveStatus('success');
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f20] rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-message">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg">
              <Settings2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Configurações</h2>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">Gestão de Sistema e Conhecimento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5">
            <X size={22} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Credenciais */}
          <div className="bg-gray-50 dark:bg-[#131314] rounded-2xl border border-gray-100 dark:border-white/5 p-6 space-y-4">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Key size={14} /> Minhas Credenciais
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select 
                value={activeProviderTab}
                onChange={(e) => setActiveProviderTab(e.target.value as Provider)}
                className="w-full bg-white dark:bg-[#1e1f20] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold"
              >
                {Object.entries(PROVIDER_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
              
              {activeProviderTab === 'google' ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                   <Info size={14} className="text-blue-600" />
                   <span className="text-[10px] font-bold text-blue-600 uppercase">Ambiente Nativo Detectado</span>
                </div>
              ) : (
                <input 
                  type="password" 
                  placeholder="Chave API..."
                  value={(localSettings[activeProviderTab + 'ApiKey' as keyof AppSettings] as string) || ''} 
                  onChange={e => setLocalSettings({...localSettings, [activeProviderTab + 'ApiKey']: e.target.value})} 
                  className="w-full bg-white dark:bg-[#1e1f20] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-mono"
                />
              )}
            </div>
          </div>

          {/* Admin e Conhecimento */}
          <div className="pt-6 border-t border-gray-100 dark:border-white/5">
            {!isAdminOpen ? (
              <button onClick={() => setIsAdminOpen(true)} className="w-full p-4 flex items-center justify-between bg-amber-600/5 hover:bg-amber-600/10 border border-amber-600/20 rounded-2xl transition-all">
                <div className="flex items-center gap-4">
                  <ShieldAlert size={20} className="text-amber-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Controle Administrativo</span>
                </div>
                <ChevronDown size={16} className="text-amber-600" />
              </button>
            ) : !isAdminUnlocked ? (
              <div className="p-6 bg-amber-600/5 border border-amber-600/20 rounded-2xl space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    placeholder="Senha do Administrador"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdminUnlock()}
                    className={`flex-1 bg-white dark:bg-[#1e1f20] border ${adminError ? 'border-red-500' : 'border-amber-600/20'} rounded-xl px-4 py-2.5 text-xs outline-none transition-all`}
                  />
                  <button onClick={handleAdminUnlock} className="px-6 py-2.5 bg-amber-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-amber-700 transition-all">Acessar</button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-600/5 border border-amber-600/20 rounded-2xl space-y-6 animate-message">
                
                {/* Identidade */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                    <LayoutTemplate size={14} /> Marca do Sistema
                  </span>
                  <input 
                    type="text" 
                    value={localSystemConfig.globalAppName}
                    onChange={e => setLocalSystemConfig({...localSystemConfig, globalAppName: e.target.value})}
                    placeholder="Nome do App"
                    className="w-full bg-white dark:bg-[#1e1f20] border border-amber-600/20 rounded-xl px-4 py-2 text-xs font-bold"
                  />
                  <textarea 
                    value={localSystemConfig.adminWelcomeMessage}
                    onChange={e => setLocalSystemConfig({...localSystemConfig, adminWelcomeMessage: e.target.value})}
                    rows={2}
                    placeholder="Mensagem do Popup inicial..."
                    className="w-full bg-white dark:bg-[#1e1f20] border border-amber-600/20 rounded-xl px-4 py-2 text-xs font-medium resize-none"
                  />
                </div>

                {/* Gestão de Notebooks */}
                <div className="space-y-4 pt-4 border-t border-amber-600/10">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                      <BrainCircuit size={14} /> Fontes Mestres de Conhecimento
                    </span>
                    <button 
                      onClick={() => runAllTests(localSystemConfig.notebookSources)}
                      className="text-[9px] font-black text-amber-600 bg-amber-600/10 px-2 py-1 rounded-md hover:bg-amber-600/20 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCcw size={10} className={localSystemConfig.notebookSources.some(s => s.status === 'checking') ? 'animate-spin' : ''} /> 
                      Validar Conexões
                    </button>
                   </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text" 
                        placeholder="Identificador da Fonte (ex: Manual EB)"
                        value={newNotebookName}
                        onChange={(e) => setNewNotebookName(e.target.value)}
                        className="w-full bg-white dark:bg-[#1e1f20] border border-amber-600/20 rounded-xl px-4 py-2 text-xs font-bold"
                      />
                      <input 
                        type="text" 
                        placeholder="URL NotebookLM"
                        value={newNotebookLink}
                        onChange={(e) => setNewNotebookLink(e.target.value)}
                        className="w-full bg-white dark:bg-[#1e1f20] border border-amber-600/20 rounded-xl px-4 py-2 text-xs font-mono"
                      />
                    </div>
                    <button onClick={addNotebookSource} className="px-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all text-[9px] font-black uppercase self-end h-20">Vincular</button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {localSystemConfig.notebookSources.map(source => (
                      <div key={source.id} className="bg-white/50 dark:bg-black/20 border border-amber-600/10 p-3 rounded-xl space-y-2">
                        {editingId === source.id ? (
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-white dark:bg-black/40 border border-blue-500/40 rounded-lg px-2 py-1.5 text-xs font-bold"
                            />
                            <input 
                              type="text" 
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="w-full bg-white dark:bg-black/40 border border-blue-500/40 rounded-lg px-2 py-1.5 text-xs font-mono"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                              <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 dark:bg-white/5 rounded-md text-[9px] font-black uppercase">Cancelar</button>
                              <button onClick={saveEdit} className="px-3 py-1 bg-green-600 text-white rounded-md text-[9px] font-black uppercase flex items-center gap-1"><Save size={10} /> Aplicar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                               <div className="flex items-center gap-1.5">
                                 <Lock size={12} className="text-blue-500" />
                                 <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[150px]">{source.name}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                {source.status === 'checking' ? <Loader2 size={10} className="animate-spin text-gray-400" /> : 
                                 source.status === 'success' ? <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded-md"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div><span className="text-[8px] font-black text-green-500 uppercase">Online</span></div> :
                                 <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 rounded-md"><WifiOff size={10} className="text-red-500"/><span className="text-[8px] font-black text-red-500 uppercase">Falha</span></div>}
                               </div>
                            </div>
                            <div className="flex items-center gap-1">
                               <button onClick={() => startEditing(source)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-all" title="Editar Manualmente"><Edit3 size={14} /></button>
                               <button onClick={() => testSingleSource(source.id)} className="p-1.5 text-gray-400 hover:text-amber-500 transition-all"><RefreshCcw size={14}/></button>
                               <button onClick={() => removeNotebookSource(source.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 dark:bg-[#282a2c] border-t border-gray-100 dark:border-white/5">
           <button 
             onClick={handleGlobalSave} 
             disabled={isSaving || saveStatus === 'success'}
             className={`w-full py-3.5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest ${
               saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white shadow-blue-500/20'
             }`}
           >
             {isSaving ? <Loader2 size={18} className="animate-spin" /> : 
              saveStatus === 'success' ? <CheckCircle2 size={18} /> : <Rocket size={16} />}
             {isSaving ? 'Gravando Alterações...' : 
              saveStatus === 'success' ? 'Configurações Salvas!' : 'Finalizar Configuração'}
           </button>
        </div>
      </div>
    </div>
  );
};
