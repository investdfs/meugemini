
import React, { useState } from 'react';
import { X, Play, ChevronRight, Loader2, CheckCircle2, ListChecks, FileText, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Workflow, WorkflowStep } from '../types';
import { WORKFLOW_LIBRARY } from '../constants';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (workflow: Workflow) => void;
  isExecuting: boolean;
  currentStepIndex: number;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({ 
  isOpen, 
  onClose, 
  onExecute, 
  isExecuting, 
  currentStepIndex 
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f20] rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-message">
        
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#282a2c]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Fluxos de Trabalho (Workflows)</h2>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">Orquestração e Chaining de Prompts</p>
            </div>
          </div>
          {!isExecuting && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              <X size={22} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {isExecuting ? (
            <div className="space-y-8 py-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                    <Loader2 size={32} className="text-indigo-500 animate-spin" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Executando Orquestração</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Passo {currentStepIndex + 1} de {selectedWorkflow?.steps.length}</p>
                </div>
              </div>

              <div className="space-y-4 max-w-sm mx-auto">
                {selectedWorkflow?.steps.map((step, idx) => (
                  <div key={step.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${idx === currentStepIndex ? 'bg-indigo-600/5 border-indigo-500/30' : idx < currentStepIndex ? 'bg-green-500/5 border-green-500/20 opacity-60' : 'bg-gray-50 dark:bg-white/5 border-transparent opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${idx === currentStepIndex ? 'bg-indigo-600 text-white animate-pulse' : idx < currentStepIndex ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-400'}`}>
                      {idx < currentStepIndex ? <CheckCircle2 size={16} /> : <span className="text-xs font-black">{idx + 1}</span>}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${idx === currentStepIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>{step.name}</span>
                      <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">
                        {idx === currentStepIndex ? 'Em processamento...' : idx < currentStepIndex ? 'Concluído' : 'Aguardando'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedWorkflow ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setSelectedWorkflow(null)}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-500 transition-colors"
              >
                <ArrowRight size={12} className="rotate-180" /> Voltar para Biblioteca
              </button>

              <div className="bg-indigo-600/5 rounded-3xl border border-indigo-500/10 p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{selectedWorkflow.icon}</div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{selectedWorkflow.name}</h3>
                    <p className="text-sm text-gray-500">{selectedWorkflow.description}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-indigo-500/10">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Sequência do Motor</span>
                  {selectedWorkflow.steps.map((step, idx) => (
                    <div key={step.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                        {idx < selectedWorkflow.steps.length - 1 && <div className="w-0.5 h-full bg-indigo-600/20 my-1" />}
                      </div>
                      <div className="pb-4">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block mb-1">{step.name}</span>
                        <p className="text-[11px] text-gray-500 italic line-clamp-2">"{step.prompt}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                 <ShieldCheck size={20} className="text-amber-500 shrink-0" />
                 <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                   Certifique-se de anexar os documentos necessários no chat antes de iniciar. O Workflow usará o contexto do último arquivo enviado.
                 </p>
              </div>

              <button 
                onClick={() => onExecute(selectedWorkflow)}
                className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-indigo-600/20"
              >
                <Play size={18} fill="currentColor" />
                Iniciar Motor de Workflow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORKFLOW_LIBRARY.map(wf => (
                <button
                  key={wf.id}
                  onClick={() => setSelectedWorkflow(wf)}
                  className="group flex flex-col items-start p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all text-left relative overflow-hidden"
                >
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-500">{wf.icon}</div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{wf.name}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-4 line-clamp-2">{wf.description}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex -space-x-1">
                      {wf.steps.map((_, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white dark:border-[#1e1f20]" />
                      ))}
                    </div>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{wf.steps.length} Passos</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-4 bg-gray-50 dark:bg-[#282a2c] border-t border-gray-100 dark:border-white/5">
          <p className="text-[9px] text-gray-500 uppercase font-black text-center tracking-[0.3em]">
             Tecnologia de Encadeamento de Contexto EB10-IG v3.0
          </p>
        </div>
      </div>
    </div>
  );
};
