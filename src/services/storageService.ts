import { supabase } from './supabaseClient';
import { NewsItem, LayoutTemplate, Admin, Email, Label } from '../types';
import { MOCK_NEWS_ITEMS, MOCK_LAYOUTS } from '../constants';

// Helper to safely extract error message
const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  return JSON.stringify(error);
};

const buildMeta = (item: NewsItem) => ({
  ...(item.meta || {}),
  severity: item.severity,
  seoTitle: item.seoTitle ?? item.meta?.seoTitle,
  seoDescription: item.seoDescription ?? item.meta?.seoDescription,
  scheduledAt: item.scheduledAt ?? item.meta?.scheduledAt,
  featured: item.featured ?? item.meta?.featured,
  slug: item.slug ?? item.meta?.slug,
  readingTime: item.readingTime ?? item.meta?.readingTime,
  viewCount: item.viewCount ?? item.meta?.viewCount,
});

export const storageService = {
  checkConnection: async (): Promise<{ connected: boolean; error?: any }> => {
    try {
      // Check if we can select from the news_items table, which should exist after setup
      const { error } = await supabase.from('news_items').select('id').limit(1);
      if (error) {
        // If table doesn't exist, code is usually 42P01 (Postgres) or PGRST205 (PostgREST)
        if (error.code === 'PGRST205' || error.code === '42P01') {
          return { connected: false, error };
        }
        // Other errors (like network/auth) might technically mean connected but failing to query
        return { connected: true, error };
      }
      return { connected: true };
    } catch (e) {
      return { connected: false, error: e };
    }
  },

  searchNews: async (query: string): Promise<NewsItem[]> => {
    if (!query) return storageService.getNewsItems();
    try {
      const { data, error } = await supabase.rpc('search_published_news', { search_term: query });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getNewsItems: async (): Promise<NewsItem[]> => {
    const { data, error } = await supabase
      .from('news_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Suppress table missing errors in console to avoid noise before setup
      if (error.code !== 'PGRST205' && error.code !== '42P01') {
        console.error('Error fetching news:', error);
      }
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      templateId: item.template_id,
      blocks: item.blocks,
      author: item.author,
      tags: item.tags,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      publishedAt: item.published_at,
      status: item.status,
      severity: item.severity || item.meta?.severity || 'info',
      seoTitle: item.seo_title ?? item.meta?.seoTitle,
      seoDescription: item.seo_description ?? item.meta?.seoDescription,
      scheduledAt: item.scheduled_at ?? item.meta?.scheduledAt,
      featured: item.featured ?? item.meta?.featured,
      slug: item.slug ?? item.meta?.slug,
      readingTime: item.reading_time ?? item.meta?.readingTime,
      viewCount: item.view_count ?? item.meta?.viewCount,
      rejectionReason: item.rejection_reason,
      approvedBy: item.approved_by,
      meta: item.meta
    }));
  },

  saveNewsItems: async (items: NewsItem[]): Promise<void> => {
    const dbItems = items.map(item => ({
      id: item.id,
      template_id: item.templateId,
      blocks: item.blocks,
      author: item.author,
      tags: item.tags,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      published_at: item.publishedAt,
      status: item.status,
      rejection_reason: item.rejectionReason,
      approved_by: item.approvedBy,
      meta: buildMeta(item)
    }));

    const { error } = await supabase.from('news_items').upsert(dbItems);
    if (error) console.error('Error saving news:', error);
  },

  saveNewsItem: async (item: NewsItem): Promise<void> => {
    const dbItem = {
      id: item.id,
      template_id: item.templateId,
      blocks: item.blocks,
      author: item.author,
      tags: item.tags,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      published_at: item.publishedAt,
      status: item.status,
      rejection_reason: item.rejectionReason,
      approved_by: item.approvedBy,
      // Keep optional fields in meta for schema compatibility
      meta: buildMeta(item)
    };
    const { error } = await supabase.from('news_items').upsert(dbItem);
    if (error) throw error;
  },

  deleteNewsItem: async (id: string): Promise<void> => {
    const { error } = await supabase.from('news_items').delete().eq('id', id);
    if (error) throw error;
  },

  getLayouts: async (): Promise<LayoutTemplate[]> => {
    const { data, error } = await supabase.from('news_layout_templates').select('*');
    if (error) {
      if (error.code !== 'PGRST205' && error.code !== '42P01') {
        console.error('Error fetching layouts:', error);
      }
      return [];
    }
    return data.map((t: any) => ({
      templateId: t.template_id,
      name: t.name,
      gridColumns: t.grid_columns,
      blocks: t.blocks,
      meta: t.meta
    }));
  },

  incrementViewCount: async (id: string) => {
    try {
      await supabase.rpc('increment_view_count', { article_id: id });
    } catch (e) {
      console.warn('View count increment failed', e);
    }
  },

  saveLayout: async (template: LayoutTemplate): Promise<void> => {
    const dbTemplate = {
      template_id: template.templateId,
      name: template.name,
      grid_columns: template.gridColumns,
      blocks: template.blocks,
      meta: template.meta
    };
    const { error } = await supabase.from('news_layout_templates').upsert(dbTemplate);
    if (error) console.error('Error saving layout:', error);
  },

  loginAdmin: async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  },

  signUpAdmin: async (email: string, pass: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  },

  getAuth: async (): Promise<Admin | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Admin',
      passwordHash: ''
    };
  },

  logoutAdmin: async () => {
    await supabase.auth.signOut();
  },

  seedIfEmpty: async () => {
    console.log("Attempting to seed database...");
    try {
      const { count: layoutCount } = await supabase.from('news_layout_templates').select('*', { count: 'exact', head: true });
      if (layoutCount === 0 || layoutCount === null) {
        for (const t of MOCK_LAYOUTS) {
          await storageService.saveLayout(t);
        }
        console.log('Seeded Layouts');
      }

      const { count: newsCount } = await supabase.from('news_items').select('*', { count: 'exact', head: true });
      if (newsCount === 0 || newsCount === null) {
        await storageService.saveNewsItems(MOCK_NEWS_ITEMS);
        console.log('Seeded News Items');
      }

      return { success: true };
    } catch (e: any) {
      console.error('Seeding process failed:', e);
      return { success: false, error: e };
    }
  },

  uploadImage: async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const { data, error } = await supabase.storage
      .from('news-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('news-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  },

  uploadPdf: async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data, error } = await supabase.storage
      .from('news-pdfs')
      .upload(fileName, file, { contentType: 'application/pdf' });

    if (error) {
      console.warn('PDF upload skipped (bucket may not exist):', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('news-pdfs')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  },
  syncOsint: async (items: NewsItem[]): Promise<{ added: number; error?: any }> => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('news_items')
        .select('meta');
      
      if (fetchError) throw fetchError;

      const existingGuids = new Set(existing?.map(e => e.meta?.guid).filter(Boolean) || []);
      const newItems = items.filter(item => !existingGuids.has(item.meta?.guid));

      if (newItems.length === 0) return { added: 0 };

      const dbItems = newItems.map(item => ({
        id: item.id,
        // Ensure template_id is valid to avoid FK constraint violations
        template_id: item.templateId && item.templateId !== 'tpl-standard' 
          ? item.templateId 
          : 'tpl-1764398847255',
        blocks: item.blocks,
        author: item.author,
        tags: item.tags,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        published_at: item.publishedAt,
        status: item.status,
        // Move severity to meta to avoid schema errors if column missing
        meta: { ...item.meta, severity: item.severity, guid: item.meta?.guid }
      }));

      const { error } = await supabase.from('news_items').upsert(dbItems);
      if (error) throw error;

      return { added: newItems.length };
    } catch (e) {
      console.error('OSINT Sync Error:', e);
      return { added: 0, error: e };
    }
  },

  getEmails: async (folder: string): Promise<Email[]> => {
    let query = supabase.from('emails').select('*');
    
    if (folder === 'starred') {
      query = query.eq('is_starred', true);
    } else if (folder !== 'all') {
      query = query.eq('folder', folder);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching emails:', error);
      return [];
    }
    return data as Email[];
  },

  updateEmail: async (id: string, updates: Partial<Email>): Promise<void> => {
    const { error = null } = await supabase.from('emails').update(updates).eq('id', id);
    if (error) throw error;
  },

  updateDraft: async (id: string, updates: Partial<Email>): Promise<void> => {
    // Specialized for auto-save, ensures folder remains 'drafts'
    const { error = null } = await supabase
      .from('emails')
      .update({ ...updates, folder: 'drafts', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  deleteEmails: async (ids: string[]): Promise<void> => {
    const { error = null } = await supabase.from('emails').delete().in('id', ids);
    if (error) throw error;
  },

  sendEmail: async (email: Partial<Email>): Promise<void> => {
    try {
      const toAddresses = email.to_recipients?.map((r: any) => r.email).join(',') || '';

      // Read SMTP credentials saved by EmailSettings UI
      let smtpConfig: any = {};
      try {
        const stored = localStorage.getItem('pulse_email_settings');
        if (stored) smtpConfig = JSON.parse(stored);
      } catch {}

      const response = await fetch('http://localhost:4000/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toAddresses,
          subject: email.subject || '',
          body: email.body_html || '',
          smtp: {
            host:      smtpConfig.host      || '',
            port:      smtpConfig.port      || 587,
            user:      smtpConfig.username  || '',
            pass:      smtpConfig.password  || '',
            fromEmail: smtpConfig.fromEmail || smtpConfig.username || '',
            fromName:  smtpConfig.fromName  || 'PULSE-R24',
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to send email via service');
      }

      // Delete the draft if it was one
      if (email.id) {
        await supabase.from('emails').delete().eq('id', email.id).eq('folder', 'drafts');
      }
    } catch (e: any) {
      // Re-throw so the UI shows a useful error (no silent fallback)
      throw new Error(e.message || 'Failed to send email');
    }
  },


  createEmail: async (email: Partial<Email>): Promise<void> => {
    const { error = null } = await supabase.from('emails').upsert(email);
    if (error) throw error;
  },

  // Label Management
  getLabels: async (): Promise<Label[]> => {
    const { data, error } = await supabase.from('email_labels').select('*').order('name');
    if (error) {
      console.error('Error fetching labels:', error);
      return [];
    }
    return data as Label[];
  },

  createLabel: async (label: Partial<Label>): Promise<Label | null> => {
    const { data, error } = await supabase.from('email_labels').insert(label).select().single();
    if (error) throw error;
    return data as Label;
  },

  deleteLabel: async (id: string): Promise<void> => {
    const { error = null } = await supabase.from('email_labels').delete().eq('id', id);
    if (error) throw error;
  },

  getErrorMessage
};
