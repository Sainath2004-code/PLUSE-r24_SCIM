import React from 'react';
import { PlusCircle, LayoutTemplate } from 'lucide-react';

export const EmailTemplates: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Email Templates</h2>
        <button className="bg-maroon-600 hover:bg-maroon-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm">
          <PlusCircle size={16} /> New Template
        </button>
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-maroon-50 dark:bg-maroon-500/10 flex items-center justify-center text-maroon-600 dark:text-maroon-400 mb-6 shadow-inner">
            <LayoutTemplate size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No templates yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Create reusable email templates with dynamic placeholders like {'{{name}}'} and use them in workflows or manual sending.</p>
        </div>
      </div>
    </div>
  );
};
