import { jsPDF } from 'jspdf';

const NAVY: [number, number, number] = [15, 30, 60];
const ACCENT_RED: [number, number, number] = [180, 40, 40];
const ACCENT_BLUE: [number, number, number] = [40, 100, 180];
const WHITE: [number, number, number] = [255, 255, 255];
const TEXT_DARK: [number, number, number] = [30, 30, 40];
const TEXT_MED: [number, number, number] = [80, 80, 95];

export interface PdfNewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  url: string;
  publishedAt: string;
  category?: string;
  rank?: number;
  relevanceScore?: number;
  isUploaded?: boolean;
}

export type LoadedImage = { dataUrl: string; width: number; height: number };

export function cleanBodyText(input: string): string {
  return (input || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/<a[^>]*href=['"][^'"]+['"][^>]*>(.*?)<\/a>/gi, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/www\.\S+/g, ' ')
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDisplaySummary(article: PdfNewsArticle): string {
  const summary = cleanBodyText(article.summary || '');
  if (summary) return summary;

  const fallback = cleanBodyText(article.content || '');
  if (fallback) return fallback;

  return 'Summary unavailable for this article. Use the source link for the full report.';
}

function truncateSummary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '').trim()}...`;
}

function truncateTitle(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, '').trim()}...`;
}

function getOrdinal(day: number): string {
  const remainder = day % 10;
  const teens = day % 100;
  if (teens >= 11 && teens <= 13) return `${day}th`;
  if (remainder === 1) return `${day}st`;
  if (remainder === 2) return `${day}nd`;
  if (remainder === 3) return `${day}rd`;
  return `${day}th`;
}

function formatPdfDate(dateStr: string): string {
  const parsedDate = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return dateStr;

  const month = parsedDate.toLocaleDateString('en-GB', { month: 'short' });
  const year = parsedDate.getFullYear();
  const weekday = parsedDate.toLocaleDateString('en-GB', { weekday: 'long' });
  return `${getOrdinal(parsedDate.getDate())} ${month}, ${year} | ${weekday}`;
}

export async function loadPngFromUrl(url: string): Promise<LoadedImage> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
  };
}

function drawHeaderImage(doc: jsPDF, header: LoadedImage) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = (pageWidth * header.height) / header.width;
  doc.addImage(header.dataUrl, 'PNG', 0, 0, pageWidth, headerHeight);
  return headerHeight;
}

function drawFooterImage(doc: jsPDF, footer: LoadedImage) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerHeight = (pageWidth * footer.height) / footer.width;
  doc.addImage(footer.dataUrl, 'PNG', 0, pageHeight - footerHeight, pageWidth, footerHeight);
  return footerHeight;
}

export async function generateNewsPdfDoc(
  articles: PdfNewsArticle[],
  state: string,
  dateStr: string,
  assets: { header: LoadedImage; footer: LoadedImage },
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const headerHeight = (pageWidth * assets.header.height) / assets.header.width;
  const footerHeight = (pageWidth * assets.footer.height) / assets.footer.width;
  const headerTextY = headerHeight + 13;
  const footerLimit = pageHeight - footerHeight - 10;
  const columnGap = 8;
  const columnWidth = (contentWidth - columnGap) / 2;
  const cardsPerPage = 4;
  const rowGap = 8;
  const cardStartY = headerTextY + 16;
  const rowHeight = (footerLimit - cardStartY - rowGap) / 2;

  const drawPageChrome = () => {
    drawHeaderImage(doc, assets.header);
    drawFooterImage(doc, assets.footer);

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...ACCENT_RED);
    doc.text(`Daily Intel Pulse | ${formatPdfDate(dateStr)}`, margin, headerTextY);

    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(`State: ${state} | Top ${Math.min(articles.length, 10)} headlines`, margin, headerTextY + 6);

    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...ACCENT_RED);
    doc.text('Ranked by state relevance with concise summaries', pageWidth - margin, headerTextY + 3, { align: 'right' });
  };

  const drawArticleCard = (
    article: PdfNewsArticle,
    rankNum: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const titleFontSize = 11.4;
    const titleStartX = x + 18;
    const titleWrapWidth = width - (titleStartX - x) - 7;

    doc.setFont('times', 'bold');
    doc.setFontSize(titleFontSize);
    const titleText = truncateTitle(cleanBodyText(article.title), 82);
    const titleLines = doc.splitTextToSize(titleText, titleWrapWidth).slice(0, 3);

    doc.setFont('times', 'normal');
    doc.setFontSize(8.8);
    const summaryLines = doc
      .splitTextToSize(truncateSummary(getDisplaySummary(article), 180), width - 10)
      .slice(0, 5);

    const buttonHeight = 7;
    const titleLineHeight = 4.8;
    const summaryLineHeight = 4;

    doc.setFillColor(...WHITE);
    doc.roundedRect(x, y, width, height, 2.5, 2.5, 'F');
    doc.setDrawColor(218, 223, 232);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, width, height, 2.5, 2.5, 'S');

    doc.setFillColor(...(rankNum <= 3 ? ACCENT_RED : ACCENT_BLUE));
    doc.circle(x + 7, y + 7, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(rankNum), x + 7, y + 9, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(titleFontSize);
    doc.setTextColor(...TEXT_DARK);
    let cursorY = y + 9;
    for (const line of titleLines) {
      doc.text(line, titleStartX, cursorY);
      cursorY += titleLineHeight;
    }

    const chipY = cursorY + 1;
    const sourceLabel = article.source || 'Source unavailable';
    const categoryLabel = article.category || 'General';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);

    const sourceWidth = Math.max(16, doc.getTextWidth(sourceLabel) + 6);
    doc.setFillColor(234, 238, 246);
    doc.roundedRect(x + 4, chipY, sourceWidth, 5.2, 1.3, 1.3, 'F');
    doc.setTextColor(...ACCENT_BLUE);
    doc.text(sourceLabel, x + 7, chipY + 3.5);

    const categoryWidth = Math.max(15, doc.getTextWidth(categoryLabel) + 6);
    const categoryX = x + 4 + sourceWidth + 3;
    doc.setFillColor(246, 234, 234);
    doc.roundedRect(categoryX, chipY, categoryWidth, 5.2, 1.3, 1.3, 'F');
    doc.setTextColor(...ACCENT_RED);
    doc.text(categoryLabel, categoryX + 3, chipY + 3.5);

    cursorY = chipY + 9;
    doc.setTextColor(...TEXT_MED);
    for (const line of summaryLines) {
      doc.text(line, x + 4, cursorY);
      cursorY += summaryLineHeight;
    }

    const buttonY = y + height - 10;
    doc.setFillColor(...ACCENT_BLUE);
    doc.roundedRect(x + 4, buttonY, 29, buttonHeight, 1.8, 1.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('Read more', x + 18.5, buttonY + 4.7, { align: 'center' });
    if (/^https?:\/\//i.test(article.url)) {
      doc.link(x + 4, buttonY, 29, buttonHeight, { url: article.url });
    }
  };

  const startNewPage = () => {
    doc.addPage();
    drawPageChrome();
  };

  drawPageChrome();

  articles.slice(0, 10).forEach((article, index) => {
    if (index > 0 && index % cardsPerPage === 0) {
      startNewPage();
    }

    const positionInPage = index % cardsPerPage;
    const columnIndex = positionInPage % 2;
    const rowIndex = Math.floor(positionInPage / 2);
    const x = margin + columnIndex * (columnWidth + columnGap);
    const y = cardStartY + rowIndex * (rowHeight + rowGap);
    drawArticleCard(article, index + 1, x, y, columnWidth, rowHeight);
  });

  return doc;
}
