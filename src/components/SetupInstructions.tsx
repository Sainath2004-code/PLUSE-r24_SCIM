import React, { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';

export const SetupInstructions: React.FC<{ errorDetails: string }> = ({ errorDetails }) => {
    const [copied, setCopied] = useState(false);

    const setupSQL = `-- Create core tables in Supabase SQL Editor
create table if not exists news_layout_templates (
  template_id text primary key,
  name text,
  grid_columns int default 12,
  blocks jsonb,
  meta jsonb
);

create table if not exists news_items (
  id text primary key,
  template_id text references news_layout_templates(template_id),
  blocks jsonb,
  author text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  status text,
  rejection_reason text,
  approved_by text,
  meta jsonb
);

-- Enable public access policies for initial setup
alter table news_layout_templates enable row level security;
alter table news_items enable row level security;

drop policy if exists "Public access" on news_layout_templates;
create policy "Public access" on news_layout_templates for all using (true) with check (true);

drop policy if exists "Public access" on news_items;
create policy "Public access" on news_items for all using (true) with check (true);

-- Storage Buckets Setup
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true), ('news-pdfs', 'news-pdfs', true)
on conflict (id) do nothing;

create policy "Public Storage Access" on storage.objects for all using (true) with check (true);`;

    const copySQL = () => {
        navigator.clipboard.writeText(setupSQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-left animate-fade-in">
            <div className="flex items-start gap-2 text-red-600 mb-3 font-medium">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                    <p>Database Connection Required</p>
                    <p className="text-xs text-red-400 font-normal mt-1 opacity-80 break-all font-mono">{errorDetails}</p>
                </div>
            </div>
            <p className="text-slate-600 mb-2 font-medium">1. Create Database Tables:</p>
            <div className="relative group mb-4">
                <pre className="bg-slate-900 text-slate-50 p-3 rounded-md overflow-x-auto text-xs font-mono h-32 whitespace-pre">
                    {setupSQL}
                </pre>
                <button
                    onClick={copySQL}
                    className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                    title="Copy SQL"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
            </div>
            
            <div className="space-y-3 mt-4 text-slate-600">
                <p className="font-medium">2. Enable Authentication:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Go to <b>Authentication</b> → <b>Providers</b></li>
                    <li>Enable <b>Email</b> provider</li>
                    <li>Turn OFF <b>Confirm email</b> (for easy dev access)</li>
                </ul>
                
                <p className="font-medium pt-2">3. Finalize:</p>
                <p className="text-xs">Once tables are created, use the <b>Quick Demo Login</b> button to automatically establish your admin credentials.</p>
            </div>
            
            {/* Troubleshooting section for rate limits */}
            {errorDetails.includes('RATE_LIMIT_ERROR') && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 animate-pulse-subtle">
                    <p className="font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 leading-none">
                        <AlertTriangle size={12} />
                        Rate Limit Fix:
                    </p>
                    <p className="mb-2">Supabase has blocked new requests briefly. To fix this instantly:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                        <li>Go to <b>Authentication</b> → <b>Settings</b></li>
                        <li>Find <b>Rate Limits</b> section</li>
                        <li>Set <b>Max sign-ups</b> to a higher number (e.g., 100)</li>
                        <li>Wait 2-3 minutes and try again.</li>
                    </ol>
                </div>
            )}

        </div>
    );
};
