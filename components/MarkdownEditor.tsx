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
    <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col h-80 bg-white">
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1">
        <div className="flex bg-slate-200 rounded p-0.5 mr-4">
           <button 
             onClick={() => setTab('write')} 
             className={`px-3 py-1 text-xs font-medium rounded ${tab === 'write' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Write
           </button>
           <button 
             onClick={() => setTab('preview')} 
             className={`px-3 py-1 text-xs font-medium rounded ${tab === 'preview' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Preview
           </button>
        </div>
        <div className="h-4 w-px bg-slate-300 mx-2"></div>
        <button onClick={() => insert('**bold** ')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><Bold size={16}/></button>
        <button onClick={() => insert('*italic* ')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><Italic size={16}/></button>
        <button onClick={() => insert('# Heading ')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><Type size={16}/></button>
        <button onClick={() => insert('\n- List item ')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><List size={16}/></button>
        <button onClick={() => insert('[Link](url) ')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><LinkIcon size={16}/></button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {tab === 'write' ? (
          <textarea
            className="w-full h-full p-4 outline-none resize-none font-mono text-sm"
            placeholder="Type your markdown content here..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <div className="w-full h-full p-4 overflow-y-auto prose prose-sm max-w-none">
            {value ? <ReactMarkdown>{value}</ReactMarkdown> : <span className="text-slate-400 italic">Nothing to preview</span>}
          </div>
        )}
      </div>
    </div>
  );
};
