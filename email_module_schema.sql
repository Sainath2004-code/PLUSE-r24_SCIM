-- Email Management Module Schema
-- 1. Email Settings
create table if not exists email_settings (
    id text primary key,
    smtp_provider text,
    -- 'smtp', 'sendgrid', 'mailgun', 'ses', 'gmail'
    smtp_host text,
    smtp_port int,
    smtp_user text,
    smtp_pass text,
    default_from_email text,
    default_from_name text,
    updated_at timestamptz default now()
);
-- 2. Email Templates
create table if not exists email_templates (
    id text primary key default gen_random_uuid()::text,
    name text not null,
    category text,
    -- 'marketing', 'notifications', 'system', 'onboarding'
    subject text not null,
    body_html text not null,
    placeholders jsonb,
    created_by text references news_admins(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- 3. Emails (Inbox, Sent, Drafts, Scheduled, Trash)
create table if not exists emails (
    id text primary key default gen_random_uuid()::text,
    folder text default 'drafts',
    -- 'inbox', 'sent', 'drafts', 'spam', 'trash', 'scheduled'
    sender_email text,
    sender_name text,
    to_recipients jsonb,
    -- Array of {email, name}
    cc_recipients jsonb,
    bcc_recipients jsonb,
    subject text not null,
    body_html text,
    attachments jsonb,
    -- Array of media library URLs
    status text default 'draft',
    -- 'draft', 'scheduled', 'sending', 'sent', 'failed', 'delivered'
    is_read boolean default false,
    is_starred boolean default false,
    labels jsonb default '[]'::jsonb,
    parent_id text references emails(id),
    thread_id uuid,
    opened_at timestamptz,
    template_id text references email_templates(id),
    scheduled_for timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    sent_at timestamptz
);

-- 4. Custom Labels Table
create table if not exists email_labels (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    color text not null default '#64748b',
    created_at timestamptz default now()
);

-- Performance Indexes
create index if not exists idx_emails_thread_id on emails(thread_id);
create index if not exists idx_emails_folder on emails(folder);
create index if not exists idx_emails_parent_id on emails(parent_id);

-- 5. Email Workflows (Automation)
create table if not exists email_workflows (
    id text primary key default gen_random_uuid()::text,
    name text not null,
    trigger_event text not null,
    -- 'signup', 'password_reset', 'order_created', 'custom'
    conditions jsonb,
    actions jsonb,
    -- E.g. [{type: 'send_email', template_id: '...', delay: '1h'}]
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
-- 5. Email Logs
create table if not exists email_logs (
    id text primary key default gen_random_uuid()::text,
    email_id text references emails(id),
    event_type text not null,
    -- 'sent', 'delivered', 'bounced', 'opened', 'clicked', 'failed'
    event_data jsonb,
    created_at timestamptz default now()
);
-- Enable RLS
alter table email_settings enable row level security;
alter table email_templates enable row level security;
alter table emails enable row level security;
alter table email_workflows enable row level security;
alter table email_logs enable row level security;
-- Create Policies (Public Access for Demo)
drop policy if exists "Public access" on email_settings;
create policy "Public access" on email_settings for all using (true) with check (true);
drop policy if exists "Public access" on email_templates;
create policy "Public access" on email_templates for all using (true) with check (true);
drop policy if exists "Public access" on emails;
create policy "Public access" on emails for all using (true) with check (true);
drop policy if exists "Public access" on email_workflows;
create policy "Public access" on email_workflows for all using (true) with check (true);
drop policy if exists "Public access" on email_logs;
create policy "Public access" on email_logs for all using (true) with check (true);
-- Insert Default Settings
insert into email_settings (
        id,
        smtp_provider,
        default_from_email,
        default_from_name
    )
values (
        'default',
        'smtp',
        'admin@pulse-r.local',
        'PULSE-R Admin'
    ) on conflict (id) do nothing;