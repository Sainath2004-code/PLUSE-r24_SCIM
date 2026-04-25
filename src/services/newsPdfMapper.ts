import { NewsItem } from '../types';
import type { PdfNewsArticle } from './newsPdfCore';

function getBlockString(item: NewsItem, type: string): string {
  const value = item.blocks.find((block) => block.type === type)?.value;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function getCategory(item: NewsItem): string {
  return item.category || getBlockString(item, 'category') || 'General';
}

function getSource(item: NewsItem): string {
  if (typeof item.meta?.sourceLabel === 'string' && item.meta.sourceLabel.trim()) {
    return item.meta.sourceLabel.trim();
  }

  if (item.meta?.source === 'osint_feed') {
    const authorSource = (item.author || '').split('|')[0]?.trim();
    return authorSource || 'OSINT Feed';
  }

  if (item.meta?.source === 'pdf_upload') {
    return 'PDF Upload';
  }

  return item.author || 'PULSE-R24 Desk';
}

function buildArticleUrl(item: NewsItem, baseUrl?: string): string {
  if (typeof item.meta?.externalLink === 'string' && /^https?:\/\//i.test(item.meta.externalLink)) {
    return item.meta.externalLink;
  }

  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/#/news/${item.id}`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}#/news/${item.id}`;
  }

  return '';
}

export function mapNewsItemToPdfArticle(item: NewsItem, baseUrl?: string): PdfNewsArticle {
  return {
    id: item.id,
    title: getBlockString(item, 'title') || 'Untitled',
    summary: getBlockString(item, 'excerpt'),
    content: getBlockString(item, 'markdown'),
    source: getSource(item),
    url: buildArticleUrl(item, baseUrl),
    publishedAt: item.publishedAt || item.createdAt,
    category: getCategory(item),
  };
}

export function mapNewsItemsToPdfArticles(items: NewsItem[], baseUrl?: string): PdfNewsArticle[] {
  return items.map((item) => mapNewsItemToPdfArticle(item, baseUrl));
}

export function getPdfScopeLabel(selectedDomain: string, activeTag: string): string {
  if (selectedDomain && selectedDomain !== 'All') return selectedDomain;
  if (activeTag) return activeTag;
  return 'India';
}

export function getPdfDateString(items: NewsItem[], startDate?: string, endDate?: string): string {
  if (endDate) return endDate;
  if (startDate) return startDate;

  const datedItems = items
    .map((item) => item.publishedAt || item.createdAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (datedItems[0]) return datedItems[0].slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export function buildPdfFilename(scopeLabel: string, dateStr: string): string {
  const safeScope = scopeLabel.replace(/[^\w\-]+/g, '_').slice(0, 60) || 'India';
  return `PULSE-R_${safeScope}_${dateStr}.pdf`;
}
