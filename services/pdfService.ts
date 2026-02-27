// PDF text extraction service using pdfjs-dist (client-side, no API key needed)
import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker from the pdfjs-dist package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

/**
 * Extract raw text from a PDF File object.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pageTexts: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');
        pageTexts.push(pageText);
    }

    return pageTexts.join('\n\n');
}

export interface ParsedPdfFields {
    title: string;
    excerpt: string;
    body: string;
    tags: string[];
    category: string;
}

/**
 * Heuristically parse extracted PDF text into news article fields.
 */
export function parsePdfToNewsFields(rawText: string): ParsedPdfFields {
    // Clean up: collapse excessive whitespace, normalize newlines
    const cleaned = rawText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

    // ── Title: first substantive line (skip very short ones like page headers)
    let title = '';
    for (const line of lines) {
        if (line.length > 10) {
            title = line.replace(/\s+/g, ' ');
            break;
        }
    }
    if (!title) title = 'Untitled Intelligence Brief';

    // ── Excerpt: first paragraph (first ~2-3 sentences, max 300 chars)
    const bodyTextStart = cleaned.indexOf('\n\n');
    const firstParagraph = bodyTextStart > 0
        ? cleaned.substring(0, bodyTextStart)
        : cleaned.substring(0, 400);

    let excerpt = firstParagraph.replace(/\s+/g, ' ').trim();
    if (excerpt.length > 300) {
        // Cut at last sentence boundary within 300 chars
        const cutPoint = excerpt.lastIndexOf('. ', 300);
        excerpt = cutPoint > 50 ? excerpt.substring(0, cutPoint + 1) : excerpt.substring(0, 300) + '…';
    }

    // ── Body: full text as markdown paragraphs
    const paragraphs = cleaned.split('\n\n').map(p => p.replace(/\n/g, ' ').trim()).filter(Boolean);
    const body = paragraphs.join('\n\n');

    // ── Tags: extract common intel/security keywords
    const tagKeywords = [
        'malware', 'ransomware', 'phishing', 'ddos', 'vulnerability', 'exploit',
        'threat', 'attack', 'breach', 'incident', 'cyber', 'intelligence',
        'apt', 'campaign', 'actor', 'india', 'pakistan', 'china', 'russia',
        'critical', 'high', 'medium', 'low', 'cve', 'zero-day',
        'network', 'infrastructure', 'data', 'espionage', 'financial',
    ];
    const lowerText = cleaned.toLowerCase();
    const foundTags = tagKeywords.filter(kw => lowerText.includes(kw));
    // Deduplicate and limit
    const tags = [...new Set(foundTags)].slice(0, 6);

    // ── Category guess
    let category = 'General';
    if (lowerText.includes('ransomware') || lowerText.includes('malware')) category = 'Malware';
    else if (lowerText.includes('phishing')) category = 'Phishing';
    else if (lowerText.includes('vulnerability') || lowerText.includes('cve')) category = 'Vulnerability';
    else if (lowerText.includes('apt') || lowerText.includes('espionage')) category = 'APT';
    else if (lowerText.includes('ddos')) category = 'DDoS';
    else if (lowerText.includes('intelligence') || lowerText.includes('bulletin')) category = 'Intelligence';

    return { title, excerpt, body, tags, category };
}
