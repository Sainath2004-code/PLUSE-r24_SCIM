import React, { useState, useEffect } from 'react';
import { Send, Paperclip, X, Image, FileText, Check, Minus, PlusCircle, Bold, Italic, List, ListOrdered, Link, Type, Palette } from 'lucide-react';

interface EmailComposeProps {
  onClose?: () => void;
  replyTo?: Email | null;
}
import { storageService } from '../../../services/storageService';
import { Email } from '../../../types';

export const EmailCompose: React.FC<EmailComposeProps> = ({ onClose, replyTo }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [to, setTo] = useState(replyTo ? replyTo.sender_email || '' : '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (replyTo && !body) {
      const replyBody = `<br><br><div class="gmail_quote">--- Original Message ---<br>From: ${replyTo.sender_email}<br>Subject: ${replyTo.subject}<br><br>${replyTo.body_html}</div>`;
      setBody(replyBody);
      const editor = document.getElementById('email-rich-editor');
      if (editor) editor.innerHTML = replyBody;
    }
  }, [replyTo]);

  // Auto-save logic
  useEffect(() => {
    if (!subject && !body && !to) return;

    const saveTimer = setTimeout(async () => {
      try {
        const id = draftId || crypto.randomUUID();
        const draftData = {
          id,
          subject: subject || '(No Subject)',
          body_html: body,
          to_recipients: to.split(',').map(e => ({ email: e.trim() })),
          folder: 'drafts' as const,
          created_at: new Date().toISOString()
        };

        if (draftId) {
          await storageService.updateDraft(id, draftData);
        } else {
          await storageService.createEmail({ ...draftData, status: 'draft' }); // Insert as draft
          setDraftId(id);
        }
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 3000);

    return () => clearTimeout(saveTimer);
  }, [subject, body, to, draftId]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    const editor = document.getElementById('email-rich-editor');
    if (editor) setBody(editor.innerHTML);
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      alert('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await storageService.sendEmail({
        id: draftId || crypto.randomUUID(),
        to_recipients: to.split(',').map(email => ({ email: email.trim() })),
        subject,
        body_html: body,
        folder: 'sent',
        status: 'sent',
        created_at: new Date().toISOString(),
        is_read: true,
        is_starred: false
      });
      onClose?.();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-8 w-80 bg-slate-900 text-white rounded-t-xl shadow-2xl z-50 flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setIsMinimized(false)}>
        <span className="text-sm font-bold truncate">Draft: {subject || 'New Message'}</span>
        <div className="flex gap-2">
          <PlusCircle size={18} className="text-slate-400 hover:text-white" />
          <X size={18} className="text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); onClose?.(); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-8 w-[600px] h-[650px] bg-white dark:bg-slate-900 rounded-t-2xl shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] z-50 flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between rounded-t-2xl shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-tight">New Message</span>
          {lastSaved && <span className="text-[10px] text-slate-400 font-bold uppercase animate-pulse">Saved at {lastSaved}</span>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><Minus size={18} /></button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center px-6 py-3 border-b border-slate-100 dark:border-slate-800 gap-4">
          <span className="text-slate-400 text-xs font-bold w-4">To</span>
          <input 
            type="text" 
            placeholder="Recipients (comma separated)" 
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white placeholder-slate-500 font-medium"
          />
        </div>
        <div className="flex items-center px-6 py-3 border-b border-slate-100 dark:border-slate-800 gap-4">
          <span className="text-slate-400 text-xs font-bold w-4">Re</span>
          <input 
            type="text" 
            placeholder="Subject" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white placeholder-slate-500 font-medium"
          />
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-1">
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('bold')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Bold size={16} /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('italic')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Italic size={16} /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><List size={16} /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><ListOrdered size={16} /></button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
            const url = prompt('Enter URL:');
            if (url) execCommand('createLink', url);
          }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Link size={16} /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('removeFormat')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Type size={16} /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
            const color = prompt('Enter color hex (e.g. #ff0000) or name:', '#maroon');
            if (color) execCommand('foreColor', color);
          }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"><Palette size={16} /></button>
        </div>
        
        <div 
          id="email-rich-editor"
          contentEditable
          onInput={(e) => setBody(e.currentTarget.innerHTML)}
          className="flex-1 px-8 py-6 bg-transparent text-sm focus:outline-none overflow-y-auto dark:text-slate-300 leading-relaxed premium-scrollbar font-normal min-h-[200px]"
          data-placeholder="Write your message here..."
        />
      </div>

      <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            disabled={sending}
            onClick={handleSend}
            className="bg-maroon-600 hover:bg-maroon-700 text-white px-8 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-maroon-900/40 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
            {sending ? 'Sending...' : 'Send Now'}
          </button>
          <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><Paperclip size={20} /></button>
          <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"><Image size={20} /></button>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
           <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Professional Mode</span>
           <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <Check size={14} className="text-maroon-600" />
           </div>
        </div>
      </div>
    </div>
  );
};
