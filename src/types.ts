export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type BlockType = 'title' | 'slug' | 'excerpt' | 'markdown' | 'image' | 'gallery' | 'author' | 'tags' | 'publishDate' | 'category' | 'meta' | 'embed' | 'divider' | 'html' | 'pdf';


export type NewsStatus = 'draft' | 'pending_approval' | 'published' | 'rejected' | 'archived';

export interface LayoutBlock {
  id: string;
  type: BlockType;
  label?: string;
  required?: boolean;
  helpText?: string;
  settings?: Record<string, any>;
  grid?: { colStart?: number; colSpan: number }; // 1..12
  visible?: boolean;
}

export interface LayoutTemplate {
  templateId: string;
  name: string;
  gridColumns: number;
  blocks: LayoutBlock[];
  meta?: Record<string, any>;
}

export interface NewsBlockValue {
  blockId: string;
  type: string;
  value: any;
}

export interface NewsItem {
  id: string;
  templateId?: string;
  blocks: NewsBlockValue[];
  author?: string;
  tags?: string[];
  category?: string;
  severity?: SeverityLevel;
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: string;
  featured?: boolean;
  slug?: string;
  readingTime?: number;
  viewCount?: number;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string | null;
  status: NewsStatus;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  meta?: Record<string, any>;
}

export interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role?: 'admin' | 'editor';
}

export interface Label {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Email {
  id: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'scheduled' | 'starred';
  sender_email?: string;
  sender_name?: string;
  to_recipients: { email: string; name?: string }[];
  cc_recipients?: { email: string; name?: string }[];
  bcc_recipients?: { email: string; name?: string }[];
  subject: string;
  body_html: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'delivered';
  is_read: boolean;
  is_starred: boolean;
  labels: string[] | any[]; // Array of label IDs or objects
  template_id?: string;
  parent_id?: string;
  thread_id?: string;
  opened_at?: string;
  scheduled_for?: string;
  created_at: string;
  updated_at?: string;
  sent_at?: string;
}
