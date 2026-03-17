import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Star, Clock, MoreVertical, Trash2, MailOpen, AlertCircle, ArrowLeft, Mail, ChevronLeft, ChevronRight } from 'lucide-react';

interface EmailInboxProps {
  folder: string;
  onReply?: (email: Email) => void;
}
import { storageService } from '../../../services/storageService';
import { Email, Label } from '../../../types';

export const EmailInbox: React.FC<EmailInboxProps> = ({ folder, onReply }) => {
  const { labelName } = useParams();
  const [emails, setEmails] = useState<Email[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const filteredEmails = emails.filter(e => 
    e.sender_name?.toLowerCase().includes(search.toLowerCase()) || 
    e.subject.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'j': // Next
          setSelectedIndex(prev => Math.min(prev + 1, filteredEmails.length - 1));
          break;
        case 'k': // Previous
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'enter': // Open
          if (selectedIndex >= 0) setSelectedEmail(filteredEmails[selectedIndex]);
          break;
        case '/': // Search
          e.preventDefault();
          document.getElementById('email-search-input')?.focus();
          break;
        case 'x': // Select
          if (selectedIndex >= 0) toggleChecked(filteredEmails[selectedIndex].id);
          break;
        case 's': // Star
           if (selectedIndex >= 0) {
             const email = filteredEmails[selectedIndex];
             handleStar(email, { stopPropagation: () => {} } as any);
           }
           break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEmails, selectedIndex]);

  const fetchEmails = async () => {
    setLoading(true);
    // If we have a labelName, fetch all and filter client-side for label simplicity, 
    // or we could add a getEmailsByLabel in storageService.
    const allEmails = await storageService.getEmails(labelName ? 'all' : folder);
    
    let filtered = allEmails;
    if (labelName) {
      filtered = allEmails.filter(e => 
        e.labels?.some((l: any) => 
          (typeof l === 'string' ? l.toLowerCase() : l.name?.toLowerCase()) === labelName.toLowerCase()
        )
      );
    }
    
    setEmails(filtered);
    const labelsData = await storageService.getLabels();
    setAvailableLabels(labelsData);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchEmails();
  }, [folder, labelName]);

  const toggleChecked = (id: string) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleStar = async (email: Email, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await storageService.updateEmail(email.id, { is_starred: !email.is_starred });
      setEmails(prev => prev.map(item => item.id === email.id ? { ...item, is_starred: !item.is_starred } : item));
    } catch (err) {
      console.error('Failed to star email:', err);
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await storageService.deleteEmails(ids);
      setEmails(prev => prev.filter(item => !ids.includes(item.id)));
      if (selectedEmail && ids.includes(selectedEmail.id)) setSelectedEmail(null);
      setCheckedIds([]);
    } catch (err) {
      console.error('Failed to delete emails:', err);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Mail List Pane */}
      <div className={`flex flex-col border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ${selectedEmail ? 'w-1/2 hidden md:flex' : 'w-full'}`}>
        
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button 
               onClick={() => setCheckedIds(checkedIds.length === filteredEmails.length ? [] : filteredEmails.map(e => e.id))}
               className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all"
            >
              <div className={`w-4 h-4 border-2 rounded transition-all ${checkedIds.length > 0 ? 'bg-maroon-600 border-maroon-600' : 'border-slate-300 dark:border-slate-600'}`} />
            </button>
            {checkedIds.length > 0 && (
              <button 
                onClick={() => handleDelete(checkedIds)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition-all animate-in zoom-in-95"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all"><MailOpen size={18} /></button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all"><Clock size={18} /></button>
            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-2" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search mail..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl text-xs w-48 focus:w-64 focus:ring-2 focus:ring-maroon-500/30 transition-all text-slate-900 dark:text-white"
                id="email-search-input"
              />
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
            <Filter size={18} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto premium-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-12 h-full">
                <div className="w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Fetching Mail...</p>
             </div>
          ) : filteredEmails.length > 0 ? (
            <div className="flex flex-col">
              {filteredEmails.map((email, idx) => (
                <div 
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    setSelectedIndex(idx);
                  }}
                  className={`group flex items-center gap-4 px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all hover:bg-white dark:hover:bg-white/5 ${email.id === selectedEmail?.id ? 'bg-white dark:bg-slate-800 shadow-sm z-10 scale-[1.01] border-l-4 border-l-maroon-600' : 'border-l-4 border-l-transparent'} ${idx === selectedIndex ? 'ring-2 ring-inset ring-maroon-500/50 bg-maroon-50/10' : ''} ${!email.is_read ? 'font-black' : ''}`}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleChecked(email.id); }}
                    className="shrink-0 text-slate-300 hover:text-maroon-600 transition-colors"
                  >
                    <div className={`w-4 h-4 border-2 rounded transition-all ${checkedIds.includes(email.id) ? 'bg-maroon-600 border-maroon-600' : 'border-slate-300 dark:border-slate-600'}`} />
                  </button>
                  <button onClick={(e) => handleStar(email, e)} className="shrink-0 transition-colors">
                    <Star size={18} className={email.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 hover:text-yellow-400'} />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-slate-900 dark:text-slate-100 truncate pr-4">
                        {folder === 'sent' 
                          ? (email.to_recipients?.[0]?.email ? `To: ${email.to_recipients[0].email}` : 'No Recipient')
                          : (email.sender_name || email.sender_email)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate flex items-center gap-2">
                      <span className={!email.is_read ? 'text-slate-900 dark:text-white' : ''}>{email.subject}</span>
                      {email.labels && email.labels.length > 0 && (
                        <div className="flex gap-1 shrink-0">
                          {email.labels.map((lbl: any) => {
                            const labelObj = availableLabels.find(al => 
                              al.id === (typeof lbl === 'string' ? lbl : lbl.id) || 
                              al.name === (typeof lbl === 'string' ? lbl : lbl.name)
                            );
                            return (
                              <span 
                                key={labelObj?.id || (typeof lbl === 'string' ? lbl : lbl.name)} 
                                className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white shadow-sm"
                                style={{ backgroundColor: labelObj?.color || '#64748b' }}
                              >
                                {labelObj?.name || (typeof lbl === 'string' ? lbl : lbl.name)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <span className="text-slate-400 dark:text-slate-500"> — {email.body_html?.replace(/<[^>]*>/g, '').substring(0, 100)}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6 border border-slate-200 dark:border-slate-700 shadow-inner">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-slate-900 dark:text-white font-black text-xl mb-2">Inbox Zen</h3>
              <p className="text-sm text-slate-500 max-w-[240px]">No emails found. Enjoy the quiet while it lasts!</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Detail Pane */}
      {selectedEmail && (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-right-4 duration-300 z-20 shadow-2xl">
          <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
             <div className="flex items-center gap-4">
                <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
                   <ArrowLeft size={18} />
                </button>
                <div className="flex gap-2">
                   <button 
                     onClick={() => handleDelete([selectedEmail.id])}
                     className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                   >
                     <Trash2 size={18} />
                   </button>
                   <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><Mail size={18} /></button>
                   <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><MoreVertical size={18} /></button>
                </div>
             </div>
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <div className="flex gap-1 ml-2">
                   <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={16} /></button>
                   <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={16} /></button>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 premium-scrollbar bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-10 leading-tight tracking-tight">{selectedEmail.subject}</h1>
              
              <div className="flex items-center gap-5 mb-12 border-b border-slate-100 dark:border-slate-800 pb-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-maroon-600 to-maroon-800 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-maroon-900/20">
                  {selectedEmail.sender_name?.[0] || selectedEmail.sender_email?.[0] || '?' }
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-900 dark:text-white text-lg">{selectedEmail.sender_name || selectedEmail.sender_email}</span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{new Date(selectedEmail.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    to me <span className="text-xs py-0.5 px-2 bg-slate-100 dark:bg-slate-800 rounded-md">&lt;admin@pulse-r.local&gt;</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleStar(selectedEmail, e)}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                   <Star size={20} className={selectedEmail.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} />
                </button>
              </div>

              <div className="prose dark:prose-invert prose-slate max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-lg bg-slate-50 dark:bg-slate-950/30 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 min-h-[400px]">
                 <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || '' }} />
              </div>

              <div className="mt-12 flex gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                 <button 
                   onClick={() => selectedEmail && onReply?.(selectedEmail)}
                   className="flex-1 bg-maroon-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-maroon-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    <Mail size={20} /> Reply to Thread
                 </button>
                 <button className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black py-5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3">
                    Forward Message
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
