import React, { useState } from 'react';
import { Settings, Save, Server, ShieldCheck, Mail } from 'lucide-react';

export const EmailSettings: React.FC = () => {
  const [provider, setProvider] = useState('smtp');
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Email Settings</h2>
        <button className="bg-maroon-600 hover:bg-maroon-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm">
          <Save size={16} /> Save Settings
        </button>
      </div>
      
      <div className="flex-1 p-8 overflow-y-auto premium-scrollbar">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <h3 className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-lg mb-6">
              <Server size={20} className="text-maroon-600 dark:text-maroon-400" />
              SMTP Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Provider</label>
                <select 
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-maroon-500 font-medium"
                >
                  <option value="smtp">Custom SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="ses">Amazon SES</option>
                  <option value="gmail">Gmail</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SMTP Host</label>
                  <input type="text" placeholder="smtp.example.com" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-maroon-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">SMTP Port</label>
                  <input type="number" placeholder="587" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-maroon-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                <input type="text" placeholder="user@example.com" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-maroon-500" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password / API Key</label>
                <input type="password" placeholder="••••••••" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-maroon-500" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <h3 className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-lg mb-6">
              <Mail size={20} className="text-maroon-600 dark:text-maroon-400" />
              Sender Identities
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Default 'From' Email</label>
                <input type="email" placeholder="noreply@pulse-r.local" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-maroon-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Default 'From' Name</label>
                <input type="text" placeholder="PULSE-R Security Team" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-maroon-500" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
