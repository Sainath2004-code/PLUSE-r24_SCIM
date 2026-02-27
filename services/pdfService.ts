// PDF text extraction service using pdfjs-dist (client-side, no API key needed)
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface ParsedPdfFields {
    title: string;
    excerpt: string;
    body: string;
    tags: string[];
    category: string;
}

interface PdfTextItem {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontName: string;
    width: number;
}

interface PdfLine {
    y: number;
    fontSize: number;
    text: string;
    isHeading: boolean;
    isBold: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Extract layout-aware text items (preserving positions & font size)
// ─────────────────────────────────────────────────────────────────────────────
async function extractLayoutItems(file: File): Promise<PdfTextItem[][]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: PdfTextItem[][] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });

        const items: PdfTextItem[] = textContent.items
            .filter((item: any) => 'str' in item && item.str.trim())
            .map((item: any) => {
                const [, , , , x, y] = item.transform;
                return {
                    text: item.str,
                    x: Math.round(x),
                    y: Math.round(viewport.height - y), // flip Y (PDF Y is bottom-up)
                    fontSize: Math.round(item.height || item.transform[3] || 12),
                    fontName: (item.fontName || '').toLowerCase(),
                    width: Math.round(item.width || 0),
                };
            });

        pages.push(items);
    }

    return pages;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Group items into visual lines by Y position proximity
// ─────────────────────────────────────────────────────────────────────────────
function groupIntoLines(items: PdfTextItem[]): PdfLine[] {
    if (!items.length) return [];

    // Sort by Y then X
    const sorted = [...items].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

    const lines: { y: number; items: PdfTextItem[] }[] = [];
    let currentGroup: { y: number; items: PdfTextItem[] } | null = null;

    for (const item of sorted) {
        if (!currentGroup || Math.abs(item.y - currentGroup.y) > 4) {
            currentGroup = { y: item.y, items: [item] };
            lines.push(currentGroup);
        } else {
            currentGroup.items.push(item);
        }
    }

    return lines.map(group => {
        // Sort items left to right
        group.items.sort((a, b) => a.x - b.x);

        // Build text: if gap between items is large, add space
        let text = '';
        for (let i = 0; i < group.items.length; i++) {
            const item = group.items[i];
            if (i === 0) {
                text = item.text;
            } else {
                const prev = group.items[i - 1];
                const gap = item.x - (prev.x + prev.width);
                text += (gap > 10 ? '  ' : '') + item.text;
            }
        }

        const maxFontSize = Math.max(...group.items.map(i => i.fontSize));
        const isBold = group.items.some(i =>
            i.fontName.includes('bold') || i.fontName.includes('heavy') || i.fontName.includes('black')
        );

        return {
            y: group.y,
            fontSize: maxFontSize,
            text: text.replace(/\s+/g, ' ').trim(),
            isHeading: false, // determined later
            isBold,
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Detect headings based on font size relative to body text median
// ─────────────────────────────────────────────────────────────────────────────
function detectHeadings(lines: PdfLine[]): PdfLine[] {
    if (!lines.length) return lines;

    const sizes = lines.map(l => l.fontSize).sort((a, b) => a - b);
    // Use ~70th percentile as "body" font size
    const bodySize = sizes[Math.floor(sizes.length * 0.5)] || 10;

    return lines.map(line => ({
        ...line,
        isHeading: line.fontSize > bodySize * 1.15 || (line.isBold && line.fontSize >= bodySize),
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — Extract text preserving structure
// ─────────────────────────────────────────────────────────────────────────────
export async function extractTextFromPdf(file: File): Promise<string> {
    const pages = await extractLayoutItems(file);
    const allLines: PdfLine[] = [];

    for (const pageItems of pages) {
        const lines = groupIntoLines(pageItems);
        const withHeadings = detectHeadings(lines);
        allLines.push(...withHeadings);
        allLines.push({ y: -1, fontSize: 10, text: '', isHeading: false, isBold: false }); // page break
    }

    return allLines
        .map(l => l.text)
        .filter(t => t.length > 0)
        .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — Parse into structured news article fields
// ─────────────────────────────────────────────────────────────────────────────
export async function parsePdfToNewsFieldsFromFile(file: File): Promise<ParsedPdfFields> {
    const pages = await extractLayoutItems(file);
    const allLines: PdfLine[] = [];

    for (const pageItems of pages) {
        const lines = groupIntoLines(pageItems);
        const withHeadings = detectHeadings(lines);
        allLines.push(...withHeadings);
    }

    return buildNewsFields(allLines);
}

function buildNewsFields(lines: PdfLine[]): ParsedPdfFields {
    // ── Remove blank / very short lines (page numbers, single chars)
    const meaningful = lines.filter(l => l.text.length > 2);
    if (!meaningful.length) {
        return { title: 'Untitled Bulletin', excerpt: '', body: '', tags: [], category: 'General' };
    }

    // ── Find the largest font size on the page (usually the main title)
    const maxFontSize = Math.max(...meaningful.map(l => l.fontSize));
    const bodyFontSizes = meaningful.map(l => l.fontSize).sort((a, b) => a - b);
    const medianBodySize = bodyFontSizes[Math.floor(bodyFontSizes.length * 0.5)] || 10;

    // ── Collect title candidates: large-font or heading lines at the top
    const titleLines: string[] = [];
    const titleSizeThreshold = Math.max(maxFontSize * 0.75, medianBodySize * 1.2);
    let firstBodyLine = 0;

    for (let i = 0; i < Math.min(meaningful.length, 20); i++) {
        const line = meaningful[i];
        // Skip very short lines (page numbers, labels like "Vol. 1", single words that are headers)
        if (isSkippableHeader(line.text)) continue;

        if (line.fontSize >= titleSizeThreshold || line.isHeading) {
            titleLines.push(line.text);
            firstBodyLine = i + 1;
        } else if (titleLines.length > 0) {
            // Once we've collected title lines and hit a normal-size line, stop
            break;
        } else if (i > 5) {
            // If no title found in first 5 lines, take the first meaningful line as title
            titleLines.push(line.text);
            firstBodyLine = i + 1;
            break;
        }
    }

    // Fallback: if still no title, take first line
    if (!titleLines.length) {
        titleLines.push(meaningful[0].text);
        firstBodyLine = 1;
    }

    const title = titleLines.join(' — ').replace(/\s+/g, ' ').trim();

    // ── Build body lines (everything after the title section)
    const bodyLines = meaningful.slice(firstBodyLine);

    // ── Reconstruct body as paragraphs
    // Lines that are headings become markdown headers; blank-y gaps become paragraph breaks
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];
    let prevY = -1;

    for (const line of bodyLines) {
        if (isSkippableHeader(line.text)) continue;

        const isNewParagraph = prevY >= 0 && line.y - prevY > 20;

        if (line.isHeading && line.text.length < 120) {
            // Save current paragraph
            if (currentParagraph.length) {
                paragraphs.push(currentParagraph.join(' '));
                currentParagraph = [];
            }
            // Add as markdown heading
            paragraphs.push(`## ${line.text}`);
        } else if (isNewParagraph && currentParagraph.length) {
            paragraphs.push(currentParagraph.join(' '));
            currentParagraph = [line.text];
        } else {
            currentParagraph.push(line.text);
        }

        prevY = line.y;
    }
    if (currentParagraph.length) {
        paragraphs.push(currentParagraph.join(' '));
    }

    const body = paragraphs
        .map(p => p.replace(/\s+/g, ' ').trim())
        .filter(p => p.length > 2)
        .join('\n\n');

    // ── Excerpt: first real paragraph (non-heading, 1–3 sentences, max 350 chars)
    const firstBodyParagraph = paragraphs.find(p => !p.startsWith('#') && p.length > 30) || '';
    let excerpt = firstBodyParagraph.replace(/\s+/g, ' ').trim();
    if (excerpt.length > 350) {
        const cut = excerpt.lastIndexOf('. ', 350);
        excerpt = cut > 50 ? excerpt.substring(0, cut + 1) : excerpt.substring(0, 350) + '…';
    }

    // ── Tags from keyword scan
    const lowerText = body.toLowerCase() + ' ' + title.toLowerCase();
    const tagKeywords = [
        'malware', 'ransomware', 'phishing', 'ddos', 'vulnerability', 'exploit',
        'threat', 'attack', 'breach', 'incident', 'cyber', 'intelligence',
        'apt', 'campaign', 'actor', 'india', 'pakistan', 'china', 'russia',
        'critical', 'cve', 'zero-day', 'network', 'infrastructure',
        'espionage', 'financial', 'fraud', 'terrorism', 'urban',
    ];
    const tags = [...new Set(tagKeywords.filter(kw => lowerText.includes(kw)))].slice(0, 6);

    // ── Category guess
    let category = 'Intelligence';
    if (lowerText.includes('ransomware') || lowerText.includes('malware')) category = 'Malware';
    else if (lowerText.includes('phishing')) category = 'Phishing';
    else if (lowerText.includes('vulnerability') || lowerText.includes('cve')) category = 'Vulnerability';
    else if (lowerText.includes('apt') || lowerText.includes('espionage')) category = 'APT';
    else if (lowerText.includes('ddos')) category = 'DDoS';
    else if (lowerText.includes('bulletin') || lowerText.includes('intelligence')) category = 'Intelligence';

    return { title, excerpt, body, tags, category };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Skip common PDF headers/footers/artifacts
// ─────────────────────────────────────────────────────────────────────────────
function isSkippableHeader(text: string): boolean {
    const t = text.trim();
    // Skip page numbers (digits only or "Page X of Y")
    if (/^(Page\s*)?\d+(\s*of\s*\d+)?$/i.test(t)) return true;
    // Skip typical bulletin metadata lines
    if (/^(vol\.|volume|issue|date:|dated?:|confidential|classification|tlp|restricted|unclassified)/i.test(t)) return false;
    // Skip very short artifacts
    if (t.length <= 2) return true;
    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPAT — Keep old sync signature for existing callers
// Replaced by parsePdfToNewsFieldsFromFile for full accuracy
// ─────────────────────────────────────────────────────────────────────────────
export function parsePdfToNewsFields(rawText: string): ParsedPdfFields {
    // Fallback simple parser for pre-extracted raw text
    const lines = rawText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    let title = '';
    for (const line of lines) {
        if (line.length > 10 && line.length < 200) { title = line; break; }
    }
    if (!title) title = 'Untitled Intelligence Brief';

    const firstDoubleBreak = rawText.indexOf('\n\n');
    const firstPara = firstDoubleBreak > 0
        ? rawText.substring(0, firstDoubleBreak)
        : rawText.substring(0, 400);
    let excerpt = firstPara.replace(/\s+/g, ' ').trim();
    if (excerpt === title) excerpt = '';
    if (excerpt.length > 300) excerpt = excerpt.substring(0, 300) + '…';

    const paras = rawText.split('\n\n').map(p => p.replace(/\n/g, ' ').trim()).filter(Boolean);
    const body = paras.join('\n\n');

    const lowerText = rawText.toLowerCase();
    const tagKeywords = ['malware', 'ransomware', 'phishing', 'ddos', 'vulnerability', 'exploit', 'threat',
        'attack', 'breach', 'cyber', 'intelligence', 'apt', 'india', 'cve', 'zero-day', 'espionage'];
    const tags = [...new Set(tagKeywords.filter(kw => lowerText.includes(kw)))].slice(0, 6);

    let category = 'Intelligence';
    if (lowerText.includes('ransomware')) category = 'Malware';
    else if (lowerText.includes('phishing')) category = 'Phishing';
    else if (lowerText.includes('vulnerability') || lowerText.includes('cve')) category = 'Vulnerability';

    return { title, excerpt, body, tags, category };
}
