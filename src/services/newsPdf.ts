import headerPngUrl from '../assets/pdf/pdf-header.png';
import footerPngUrl from '../assets/pdf/pdf-footer.png';
import { NewsItem } from '../types';
import { buildPdfFilename, getPdfDateString, getPdfScopeLabel, mapNewsItemsToPdfArticles } from './newsPdfMapper';
import { generateNewsPdfDoc, loadPngFromUrl } from './newsPdfCore';

export async function generateNewsPDF(items: NewsItem[], scopeLabel: string, dateStr: string) {
  const articles = mapNewsItemsToPdfArticles(items);
  const [header, footer] = await Promise.all([loadPngFromUrl(headerPngUrl), loadPngFromUrl(footerPngUrl)]);
  return generateNewsPdfDoc(articles, scopeLabel, dateStr, { header, footer });
}

export async function downloadNewsPdf(
  items: NewsItem[],
  options: { selectedDomain: string; activeTag: string; activeStartDate?: string; activeEndDate?: string },
) {
  const scopeLabel = getPdfScopeLabel(options.selectedDomain, options.activeTag);
  const dateStr = getPdfDateString(items, options.activeStartDate, options.activeEndDate);
  const doc = await generateNewsPDF(items, scopeLabel, dateStr);
  doc.save(buildPdfFilename(scopeLabel, dateStr));
}
