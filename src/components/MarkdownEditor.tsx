import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bold, Italic, List, Type, Link as LinkIcon, Image, Eye, Edit2 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const insert = (syntax: string) => {
    // Simple append for demo purposes. Real implementations use refs to insert at cursor.
    onChange(value + syntax);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col h-80 bg-white dark:bg-slate-900 shadow-sm">
      <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 py-2 flex items-center gap-1">
        <div className="flex bg-slate-200 dark:bg-slate-700 rounded p-0.5 mr-4">
           <button 
             onClick={() => setTab('write')} 
             className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-all ${tab === 'write' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             Write
           </button>
           <button 
             onClick={() => setTab('preview')} 
             className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-all ${tab === 'preview' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             Preview
           </button>
        </div>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
        <button onClick={() => insert('**bold** ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Bold"><Bold size={14}/></button>
        <button onClick={() => insert('*italic* ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Italic"><Italic size={14}/></button>
        <button onClick={() => insert('# Heading ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Heading"><Type size={14}/></button>
        <button onClick={() => insert('\n- List item ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Bullet List"><List size={14}/></button>
        <button onClick={() => insert('[Link](url) ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400" title="Hyperlink"><LinkIcon size={14}/></button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {tab === 'write' ? (
          <textarea
            className="w-full h-full p-4 outline-none resize-none font-mono text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
            placeholder="Type your markdown content here..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <div className="w-full h-full p-4 overflow-y-auto prose prose-sm dark:prose-invert max-w-none text-slate-900 dark:text-slate-100">
            {value ? <ReactMarkdown>{value}</ReactMarkdown> : <span className="text-slate-400 dark:text-slate-600 italic">Nothing to preview</span>}
          </div>
        )}
      </div>
    </div>
  );
};
