export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type BlockType = 'title' | 'slug' | 'excerpt' | 'markdown' | 'image' | 'gallery' | 'author' | 'tags' | 'publishDate' | 'category' | 'meta' | 'embed' | 'divider' | 'html';


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
}
