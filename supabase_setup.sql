-- Create tables in Supabase SQL Editor

-- 1. Layout Templates
create table if not exists news_layout_templates (
  template_id text primary key,
  name text,
  grid_columns int default 12,
  blocks jsonb,
  meta jsonb
);

-- 2. News Items
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

-- 3. Admin Users (Simple Custom Auth)
create table if not exists news_admins (
  id text primary key,
  email text,
  password_hash text,
  name text
);

-- 4. Enable RLS
alter table news_layout_templates enable row level security;
alter table news_items enable row level security;
alter table news_admins enable row level security;

-- 5. Create Policies (Public Access for Demo)
-- Note: In a production app, you should restrict these policies.

drop policy if exists "Public access" on news_layout_templates;
create policy "Public access" on news_layout_templates for all using (true) with check (true);

drop policy if exists "Public access" on news_items;
create policy "Public access" on news_items for all using (true) with check (true);

drop policy if exists "Public access" on news_admins;
create policy "Public access" on news_admins for all using (true) with check (true);

-- 6. Insert Demo Admin
insert into news_admins (id, email, password_hash, name)
values ('admin-1', 'admin@demo.local', 'demo123', 'Demo Admin')
on conflict (id) do nothing;

-- 7. Storage Setup (Simplified to avoid ownership errors)
-- Attempt to create bucket
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('news-pdfs', 'news-pdfs', true)
on conflict (id) do nothing;

-- Create Policy safely (skipping ALTER TABLE which causes errors)
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
end $$;
