import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Mail, Inbox, Send, FileEdit, Trash2, ShieldAlert, Cpu, Settings, Clock, Users, Star, PlusCircle } from 'lucide-react';
import { EmailInbox } from './email/EmailInbox';
import { EmailCompose } from './email/EmailCompose';
import { EmailTemplates } from './email/EmailTemplates';
import { EmailAutomation } from './email/EmailAutomation';
import { EmailSettings } from './email/EmailSettings';
import { storageService } from '../../services/storageService';
import { Email, Label } from '../../types';

const SIDEBAR_ITEMS = [
  { label: 'Inbox', path: '', icon: Inbox },
  { label: 'Starred', path: 'starred', icon: Star },
  { label: 'Sent', path: 'sent', icon: Send },
  { label: 'Drafts', path: 'drafts', icon: FileEdit },
  { label: 'Scheduled', path: 'scheduled', icon: Clock },
  { label: 'Spam', path: 'spam', icon: ShieldAlert },
  { label: 'Trash', path: 'trash', icon: Trash2 },
  { divider: true },
  { label: 'Templates', path: 'templates', icon: FileEdit },
  { label: 'Automation', path: 'automation', icon: Cpu },
  { label: 'Audience', path: 'audience', icon: Users },
  { label: 'Settings', path: 'settings', icon: Settings },
];

export const AdminEmail: React.FC = () => {
  const location = useLocation();
  const [showCompose, setShowCompose] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);

  React.useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    const data = await storageService.getLabels();
    setLabels(data);
  };

  const handleCreateLabel = async () => {
    const name = prompt('Label name:');
    if (!name) return;
    const color = prompt('Color (hex):', '#64748b');
    try {
      await storageService.createLabel({ name, color: color || '#64748b' });
      fetchLabels();
    } catch (err) {
      alert('Failed to create label');
    }
  };

  const [replyTo, setReplyTo] = useState<Email | null>(null);

  const handleReply = (email: Email) => {
    setReplyTo(email);
    setShowCompose(true);
  };

  const handleCloseCompose = () => {
    setShowCompose(false);
    setReplyTo(null);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden flex-col md:flex-row relative">
      
      {/* Email Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 p-5 flex flex-col gap-2 shrink-0">
        <button 
          onClick={() => { setReplyTo(null); setShowCompose(true); }}
          className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black py-4 px-6 rounded-2xl flex items-center gap-4 transition-all justify-center md:justify-start shadow-lg shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 mb-6 active:scale-95 group"
        >
          <div className="p-2 bg-maroon-50 rounded-xl dark:bg-maroon-500/10 text-maroon-600 dark:text-maroon-400 group-hover:scale-110 transition-transform">
            <Mail size={20} />
          </div>
          <span className="tracking-tight">Compose</span>
        </button>
        
        <nav className="flex-1 overflow-y-auto premium-scrollbar pr-1 -mr-1 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {SIDEBAR_ITEMS.map((item, idx) => {
            if (item.divider) return <div key={idx} className="h-px bg-slate-200 dark:bg-slate-800 mx-4 my-4 hidden md:block opacity-50"></div>;
            
            const fullPath = item.path === '' ? '/admin/email' : `/admin/email/${item.path}`;
            const isActive = location.pathname === fullPath || (item.path !== '' && location.pathname.startsWith(fullPath + '/'));
            const Icon = item.icon as any;
            
            return (
              <Link
                key={item.label}
                to={fullPath}
                className={`flex items-center gap-4 px-5 py-3 rounded-2xl transition-all font-bold text-[13px] whitespace-nowrap group ${
                  isActive 
                    ? 'bg-maroon-600 text-white shadow-lg shadow-maroon-600/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-maroon-500 transition-colors'} />
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          <div className="h-px bg-slate-200 dark:bg-slate-800 mx-4 my-6 hidden md:block opacity-50"></div>
          
          <div className="px-5 mb-2 justify-between hidden md:flex items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Labels</span>
            <button onClick={handleCreateLabel} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-maroon-600"><PlusCircle size={14} /></button>
          </div>

          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {labels.map(label => (
              <Link
                key={label.id}
                to={`/admin/email/label/${label.name.toLowerCase()}`}
                className="flex items-center gap-4 px-5 py-2 rounded-xl transition-all font-bold text-[12px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 group"
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                <span className="tracking-tight">{label.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative">
        <Routes>
          <Route path="" element={<EmailInbox folder="inbox" onReply={handleReply} />} />
          <Route path="starred" element={<EmailInbox folder="starred" onReply={handleReply} />} />
          <Route path="sent" element={<EmailInbox folder="sent" onReply={handleReply} />} />
          <Route path="drafts" element={<EmailInbox folder="drafts" onReply={handleReply} />} />
          <Route path="scheduled" element={<EmailInbox folder="scheduled" onReply={handleReply} />} />
          <Route path="spam" element={<EmailInbox folder="spam" onReply={handleReply} />} />
          <Route path="trash" element={<EmailInbox folder="trash" onReply={handleReply} />} />
          <Route path="label/:labelName" element={<EmailInbox folder="all" onReply={handleReply} />} />
          <Route path="templates" element={<EmailTemplates />} />
          <Route path="automation" element={<EmailAutomation />} />
          <Route path="settings" element={<EmailSettings />} />
        </Routes>
      </div>

      {/* Floating Compose Modal (Gmail Style) */}
      {showCompose && (
        <div className="fixed bottom-0 right-10 z-[100] w-[540px] shadow-2xl animate-slide-up">
           <EmailCompose 
             onClose={handleCloseCompose} 
             replyTo={replyTo}
           />
        </div>
      )}

    </div>
  );
};
