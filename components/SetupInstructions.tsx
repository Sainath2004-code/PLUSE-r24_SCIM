import React, { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';

export const SetupInstructions: React.FC<{ errorDetails: string }> = ({ errorDetails }) => {
    const [copied, setCopied] = useState(false);

    const setupSQL = `-- Create tables in Supabase SQL Editor
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
  created_at timestamptz,
  updated_at timestamptz,
  published_at timestamptz,
  status text,
  rejection_reason text,
  approved_by text,
  meta jsonb
);

create table if not exists news_admins (
  id text primary key,
  email text,
  password_hash text,
  name text
);

-- Reset and Enable public access policies (Safe re-run)
alter table news_layout_templates enable row level security;
alter table news_items enable row level security;
alter table news_admins enable row level security;

drop policy if exists "Public access" on news_layout_templates;
create policy "Public access" on news_layout_templates for all using (true) with check (true);

drop policy if exists "Public access" on news_items;
create policy "Public access" on news_items for all using (true) with check (true);

drop policy if exists "Public access" on news_admins;
create policy "Public access" on news_admins for all using (true) with check (true);

-- Insert Demo Admin (Required for login)
insert into news_admins (id, email, password_hash, name)
values ('admin-1', 'admin@demo.local', 'demo123', 'Demo Admin')
on conflict (id) do nothing;

-- 7. Storage Setup (Bucket & Policies)
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('news-pdfs', 'news-pdfs', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Public Access News Images'
  ) then
    create policy "Public Access News Images" 
    on storage.objects 
    for all 
    using ( bucket_id = 'news-images' ) 
    with check ( bucket_id = 'news-images' );
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Public Access News PDFs'
  ) then
    create policy "Public Access News PDFs" 
    on storage.objects 
    for all 
    using ( bucket_id = 'news-pdfs' ) 
    with check ( bucket_id = 'news-pdfs' );
  end if;
end $$;`;

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
            <p className="text-slate-600 mb-2 font-medium">1. Run this SQL in your Supabase Dashboard:</p>
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
            <p className="text-slate-600 mb-2 font-medium">2. After running SQL, click below to initialize:</p>
        </div>
    );
};
