import React from 'react';
import { Cpu, Plus } from 'lucide-react';

export const EmailAutomation: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Email Automation</h2>
        <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm">
          <Plus size={16} /> Create Workflow
        </button>
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
         <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Automate Everything</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Trigger emails based on events like user signups, password resets, or custom webhooks. Build visual workflows here.</p>
        </div>
      </div>
    </div>
  );
};
