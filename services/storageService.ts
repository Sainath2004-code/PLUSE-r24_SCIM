import { supabase } from './supabaseClient';
import { NewsItem, LayoutTemplate, Admin } from '../types';
import { MOCK_NEWS_ITEMS, MOCK_LAYOUTS, MOCK_ADMIN } from '../constants';

// Helper to safely extract error message
const getErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  return JSON.stringify(error);
};

export const storageService = {
  checkConnection: async (): Promise<{ connected: boolean; error?: any }> => {
    try {
      // Just check if we can select from the admins table (limit 0 to be cheap)
      const { error } = await supabase.from('news_admins').select('id').limit(1);
      if (error) {
        // If table doesn't exist, code is usually 42P01 (Postgres) or PGRST205 (PostgREST)
        if (error.code === 'PGRST205' || error.code === '42P01') {
           return { connected: false, error };
        }
        // Other errors (like network) might technically mean connected but failing
        return { connected: true, error }; 
      }
      return { connected: true };
    } catch (e) {
      return { connected: false, error: e };
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
      meta: item.meta
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
      meta: item.meta
    };
    const { error } = await supabase.from('news_items').upsert(dbItem);
    if (error) throw error;
  },

  deleteNewsItem: async (id: string): Promise<void> => {
    const { error } = await supabase.from('news_items').delete().eq('id', id);
    if (error) console.error('Error deleting news:', error);
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
    const { data, error } = await supabase
      .from('news_admins')
      .select('*')
      .eq('email', email)
      .eq('password_hash', pass) 
      .single();

    if (error) {
      // PGRST116 is "JSON object requested, multiple (or no) rows returned"
      // In context of .single(), it means no user found with those creds
      if (error.code === 'PGRST116') {
        return { success: false, token: null, error: { message: 'Invalid credentials' } };
      }
      
      console.error('Login error:', error);
      return { success: false, token: null, error };
    }

    if (!data) {
      return { success: false, token: null, error: { message: 'Invalid credentials' } };
    }

    // Create a simple token
    const token = btoa(JSON.stringify(data));
    return { success: true, token, error: null };
  },

  getAuth: (token: string): Admin | null => {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  },

  seedIfEmpty: async () => {
    console.log("Attempting to seed database...");
    try {
      // 1. Ensure Admin User Exists (Upsert)
      const dbAdmin = {
        id: MOCK_ADMIN.id,
        email: MOCK_ADMIN.email,
        password_hash: MOCK_ADMIN.passwordHash,
        name: MOCK_ADMIN.name
      };
      
      const { error: adminError } = await supabase.from('news_admins').upsert(dbAdmin, { onConflict: 'id' });
      
      if (adminError) {
        // Critical error (missing table)
        if (adminError.code === '42P01' || adminError.message?.includes('not found') || adminError.code === 'PGRST205') {
          return { success: false, error: adminError };
        }
        console.warn('Admin upsert failed (non-critical if exists):', adminError);
      } else {
        console.log('Admin user verified/seeded.');
      }

      // 2. Check & Seed Layouts (Must be before News due to FK)
      const { count: layoutCount } = await supabase.from('news_layout_templates').select('*', { count: 'exact', head: true });
      if (layoutCount === 0 || layoutCount === null) {
         for (const t of MOCK_LAYOUTS) {
           await storageService.saveLayout(t);
         }
         console.log('Seeded Layouts');
      }

      // 3. Check & Seed News
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
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('news-images')
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  },
  
  getErrorMessage // Export helper
};