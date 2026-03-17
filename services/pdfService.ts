/**
 * pdfService.ts — Professional PDF extraction for PULSE-R24 CMS
 *
 * Architecture:
 *  1. extractLayoutItems   → raw items with X/Y/fontSize per page
 *  2. splitIntoColumns     → separate left/right columns by X midpoint
 *  3. groupIntoLines       → reconstruct visual lines within each column
 *  4. detectHeadings       → mark lines as headings by font-size + ALLCAPS
 *  5. buildNewsFields      → assemble title / excerpt / body markdown
 *  6. renderPageToBlob     → render PDF page 1 as JPEG blob (for cover image)
 */

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────
export interface ParsedPdfFields {
    title: string;
    excerpt: string;
    body: string;
    tags: string[];
    category: string;
    /** Blob of the first page rendered as JPEG – upload and set as cover image */
    coverImageBlob?: Blob;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────────────────────────
interface RawItem {
    text: string;
    x: number;
    y: number;        // flipped (0 = top)
    fontSize: number;
    fontName: string;
    width: number;
}

interface DocLine {
    y: number;
    text: string;
    fontSize: number;
    isBold: boolean;
    isHeading: boolean;
    column: 'left' | 'right' | 'full'; // full = spans width (headings, titles)
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Extract raw text items with layout info (all pages)
// ─────────────────────────────────────────────────────────────────────────────
async function extractRawItems(file: File): Promise<{ pages: RawItem[][], pageWidth: number }> {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pages: RawItem[][] = [];
    let pageWidth = 612; // default A4-ish

    for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const vp = page.getViewport({ scale: 1 });
        pageWidth = vp.width;
        const tc = await page.getTextContent();

        const items: RawItem[] = tc.items
            .filter((i: any) => 'str' in i && i.str.trim().length > 0)
            .map((i: any) => {
                const [, , , , x, y] = i.transform;
                const fs = Math.round(Math.abs(i.transform[3]) || i.height || 10);
                return {
                    text: i.str,
                    x: Math.round(x),
                    y: Math.round(vp.height - y),  // flip: 0 = top of page
                    fontSize: fs,
                    fontName: (i.fontName || '').toLowerCase(),
                    width: Math.round(i.width || 0),
                };
            });

        pages.push(items);
    }
    return { pages, pageWidth };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Detect multi-column layout & split items accordingly
// A column split is detected if X distribution has a clear gap in the middle.
// ─────────────────────────────────────────────────────────────────────────────
function splitIntoColumns(items: RawItem[], pageWidth: number): {
    leftItems: RawItem[]; rightItems: RawItem[]; colSplit: number | null
} {
    if (items.length < 10) return { leftItems: items, rightItems: [], colSplit: null };

    // Build X histogram in 20 buckets
    const buckets = new Array(20).fill(0);
    items.forEach(i => {
        const bkt = Math.min(19, Math.floor((i.x / pageWidth) * 20));
        buckets[bkt]++;
    });

    // Find longest valley (gap zone with few items) in middle of page (25%–75%)
    let gapStart = -1;
    let gapEnd = -1;
    let longestGap = 0;
    let inGap = false;
    let gapS = -1;
    for (let b = 5; b <= 15; b++) {
        if (buckets[b] <= 1) {
            if (!inGap) { inGap = true; gapS = b; }
        } else {
            if (inGap) {
                const len = b - gapS;
                if (len > longestGap) { longestGap = len; gapStart = gapS; gapEnd = b - 1; }
            }
            inGap = false;
        }
    }

    // If no clear column gap found, treat as single column
    if (longestGap < 2) return { leftItems: items, rightItems: [], colSplit: null };

    const midBucket = Math.round((gapStart + gapEnd) / 2);
    const colSplit = Math.round((midBucket / 20) * pageWidth);

    const leftItems = items.filter(i => i.x + i.width / 2 < colSplit);
    const rightItems = items.filter(i => i.x + i.width / 2 >= colSplit);

    return { leftItems, rightItems, colSplit };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Group items into visual lines by Y proximity within a column
// ─────────────────────────────────────────────────────────────────────────────
function groupIntoLines(items: RawItem[], colLabel: 'left' | 'right' | 'full'): DocLine[] {
    if (!items.length) return [];

    // Sort by Y (top→bottom) then X (left→right)
    const sorted = [...items].sort((a, b) => Math.abs(a.y - b.y) > 2 ? a.y - b.y : a.x - b.x);

    const groups: { y: number; items: RawItem[] }[] = [];
    let cur: { y: number; items: RawItem[] } | null = null;

    for (const item of sorted) {
        if (!cur || Math.abs(item.y - cur.y) > 5) {
            cur = { y: item.y, items: [item] };
            groups.push(cur);
        } else {
            cur.items.push(item);
        }
    }

    return groups.map(g => {
        g.items.sort((a, b) => a.x - b.x);

        // Build text — add a space between items only when the gap is large enough
        // Use fontSize-relative threshold: gaps > fontSize*0.25 = word space, smaller = same word
        let text = '';
        const avgFontSize = g.items.reduce((s, i) => s + i.fontSize, 0) / g.items.length;
        const spaceThreshold = Math.max(3, avgFontSize * 0.25);
        for (let i = 0; i < g.items.length; i++) {
            const it = g.items[i];
            if (i === 0) {
                text = it.text;
            } else {
                const prev = g.items[i - 1];
                const gap = it.x - (prev.x + prev.width);
                // Negative gap = overlapping (ligatures) → no space
                // Small gap = same word → no space
                // Large gap = word boundary → space
                text += (gap > spaceThreshold ? ' ' : '') + it.text;
            }
        }
        text = text.replace(/\s+/g, ' ').trim();

        const maxFs = Math.max(...g.items.map(i => i.fontSize));
        const isBold = g.items.some(i =>
            i.fontName.includes('bold') ||
            i.fontName.includes('heavy') ||
            i.fontName.includes('black') ||
            i.fontName.includes('medium')
        );

        return { y: g.y, text, fontSize: maxFs, isBold, isHeading: false, column: colLabel };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Detect headings
// Rules: larger font than body median, OR ALL-CAPS short line, OR bold+large
// ─────────────────────────────────────────────────────────────────────────────
function detectHeadings(lines: DocLine[]): DocLine[] {
    if (!lines.length) return lines;

    const sizes = lines.map(l => l.fontSize).sort((a, b) => a - b);
    // Median = body font reference
    const median = sizes[Math.floor(sizes.length * 0.5)] || 10;

    const isAllCaps = (t: string) => /^[A-Z0-9\s\-–—:()\/\.&,]+$/.test(t) && t.replace(/\s/g, '').length > 3;

    return lines.map(line => ({
        ...line,
        isHeading:
            line.fontSize >= median * 1.25 ||               // significantly larger
            (isBoldOrLarge(line, median) && line.text.length < 80) ||  // bold + reasonable length
            (isAllCaps(line.text) && line.text.length < 100 && line.fontSize >= median) // ALL CAPS section title
    }));
}

function isBoldOrLarge(line: DocLine, median: number): boolean {
    return (line.isBold && line.fontSize >= median * 0.95) || line.fontSize >= median * 1.15;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — Extract the best image object from the PDF
// Looks for the largest embedded image (XObject) on the first 2 pages.
// Falls back to a page 1 render if no high-quality objects are found.
// ─────────────────────────────────────────────────────────────────────────────
export async function extractBestImageFromPdf(file: File): Promise<Blob | null> {
    try {
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        
        // Scan first 2 pages for image objects
        const maxPagesToScan = Math.min(2, pdf.numPages);
        let bestImage: { blob: Blob; area: number } | null = null;

        for (let n = 1; n <= maxPagesToScan; n++) {
            const page = await pdf.getPage(n);
            const ops = await page.getOperatorList();
            const commonObjs = page.commonObjs;

            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                    const objId = ops.argsArray[i][0];
                    const img = commonObjs.get(objId);
                    
                    if (img && img.width && img.height) {
                        const area = img.width * img.height;
                        if (area > 20000 && (!bestImage || area > bestImage.area)) {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                const imageData = ctx.createImageData(img.width, img.height);
                                imageData.data.set(img.data);
                                ctx.putImageData(imageData, 0, 0);
                                const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.9));
                                if (blob) bestImage = { blob, area };
                            }
                        }
                    }
                }
            }
        }

        if (bestImage) return bestImage.blob;

        // Fallback: Render first page at high scale
        const page = await pdf.getPage(1);
        const SCALE = 2.5;
        const vp = page.getViewport({ scale: SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport: vp } as any).promise;
        return await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.85));

    } catch (err) {
        console.warn('[pdfService] Image extraction failed:', err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — Build structured news fields from all document lines
// ─────────────────────────────────────────────────────────────────────────────
function buildNewsFields(allLines: DocLine[]): Omit<ParsedPdfFields, 'coverImageBlob'> {
    // Remove completely noise lines
    const lines = allLines.filter(l =>
        l.text.length > 2 &&
        !/^[\d\s\-–—·•|]+$/.test(l.text) &&   // pure number/bullet lines
        !/^(Page\s*\d+|www\.|http|©|\u00a9)/i.test(l.text)  // footers / URLs
    );

    if (!lines.length) {
        return { title: 'Untitled Bulletin', excerpt: '', body: '', tags: [], category: 'Intelligence' };
    }

    const sizes = lines.map(l => l.fontSize).sort((a, b) => a - b);
    const medianSize = sizes[Math.floor(sizes.length * 0.5)] || 10;
    const maxSize = Math.max(...sizes);

    // ── Title: Look for largest font in the top 20% that isn't metadata
    const topCutoff = Math.max(5, Math.ceil(lines.length * 0.20));
    const topLines = lines.slice(0, topCutoff);
    const candidateLines = topLines.filter(l => !isMetadataLine(l.text) && l.text.length > 5);
    
    // Sort candidates by font size descending
    const sortedCandidates = [...candidateLines].sort((a, b) => b.fontSize - a.fontSize);
    const bestTitleLine = sortedCandidates[0];
    
    let title = 'Untitled Bulletin';
    let lastTitleIdx = -1;

    if (bestTitleLine) {
        const titleParts = [bestTitleLine.text];
        lastTitleIdx = lines.indexOf(bestTitleLine);
        
        // Check if the line immediately following is also part of the title (similar font or following its y)
        const nextLine = lines[lastTitleIdx + 1];
        if (nextLine && !isMetadataLine(nextLine.text) && nextLine.fontSize > medianSize * 1.5) {
            titleParts.push(nextLine.text);
            lastTitleIdx++;
        }
        title = titleParts.join(' ').replace(/\s+/g, ' ').trim();
    }

    // ── Body: everything after the title section
    const bodyStart = lastTitleIdx + 1;
    const bodyLines = lines.slice(bodyStart > 0 ? bodyStart : 1);

    // ── Reconstruct body as markdown paragraphs
    // Y-gap > 1.5x line height = new paragraph; heading lines → ## Heading
    // Continuation rule: if a line doesn't end with sentence-terminating punctuation
    // and the next line is close, join them.
    const sections: string[] = [];
    let currentPara: string[] = [];
    let prevLine: DocLine | null = null;

    for (const line of bodyLines) {
        if (isMetadataLine(line.text) && sections.length === 0 && currentPara.length === 0) {
            continue;
        }

        const yGap = prevLine ? line.y - prevLine.y : 0;
        const isSignificantGap = prevLine && yGap > (prevLine.fontSize * 1.5);
        
        // Sentence termination check: ends with . ! ? or matches a list item pattern
        const endsSentence = /[.!?]$/.test(prevLine?.text || '');
        const isContinuing = prevLine && !endsSentence && !isSignificantGap && !line.isHeading;

        if (line.isHeading && line.text.length < 120) {
            // Flush current paragraph
            if (currentPara.length) {
                sections.push(currentPara.join(' '));
                currentPara = [];
            }
            // Add as ## heading
            if (!title.toLowerCase().includes(line.text.toLowerCase().slice(0, 20))) {
                sections.push(`## ${line.text}`);
            }
        } else if (isSignificantGap && currentPara.length > 0) {
            sections.push(currentPara.join(' '));
            currentPara = [line.text];
        } else if (isContinuing) {
            // Check for hyphenation at end of prev line
            if (prevLine!.text.endsWith('-')) {
                const head = currentPara.pop()!.slice(0, -1);
                currentPara.push(head + line.text);
            } else {
                currentPara.push(line.text);
            }
        } else {
            if (currentPara.length > 0 && !isContinuing) {
                 sections.push(currentPara.join(' '));
                 currentPara = [line.text];
            } else {
                currentPara.push(line.text);
            }
        }

        prevLine = line;
    }
    if (currentPara.length) sections.push(currentPara.join(' '));

    const body = sections
        .map(s => s.replace(/\s+/g, ' ').trim())
        .filter(s => s.length > 2)
        .join('\n\n');

    console.log(`Final sections count: ${sections.length}`);
    console.log(`Final body length: ${body.length} characters`);
    console.log(`=== END PDF DEBUG ===\n\n`);

    // ── Excerpt: first non-heading paragraph, max 350 chars
    const firstBodyPara = sections.find(s => !s.startsWith('#') && s.length > 30) || '';
    let excerpt = firstBodyPara.replace(/\s+/g, ' ').trim();
    if (excerpt.length > 350) {
        const cut = excerpt.lastIndexOf('. ', 350);
        excerpt = cut > 50 ? excerpt.substring(0, cut + 1) : excerpt.substring(0, 350) + '…';
    }

    // ── Auto-tags from keyword scan
    const fullText = (title + ' ' + body).toLowerCase();
    const tagKeywords = [
        'malware', 'ransomware', 'phishing', 'ddos', 'vulnerability', 'exploit',
        'threat', 'attack', 'breach', 'cyber', 'intelligence', 'apt',
        'india', 'pakistan', 'china', 'russia', 'cve', 'zero-day',
        'espionage', 'financial', 'fraud', 'terrorism', 'critical infrastructure',
        'data leak', 'botnet', 'trojan', 'spyware', 'network',
    ];
    const tags = [...new Set(tagKeywords.filter(k => fullText.includes(k)))].slice(0, 6);

    // ── Auto-category
    let category = 'Intelligence';
    if (fullText.includes('ransomware') || fullText.includes('malware') || fullText.includes('trojan')) category = 'Malware';
    else if (fullText.includes('phishing')) category = 'Phishing';
    else if (fullText.includes('vulnerability') || fullText.includes('cve')) category = 'Vulnerability';
    else if (fullText.includes('apt') || fullText.includes('espionage')) category = 'APT';
    else if (fullText.includes('ddos') || fullText.includes('botnet')) category = 'DDoS';

    return { title, excerpt, body, tags, category };
}

function isMetadataLine(text: string): boolean {
    return /^(vol\.|volume|issue|date[d]?:|tlp[:\s]|confidential|unclassified|classification|restricted|for official use|page\s*\d|www\.|copy|©|\u00a9|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i.test(text.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — Main entry point
// Extracts all pages, handles multi-column layout, returns structured fields
// + a cover image blob (rendered from page 1)
// ─────────────────────────────────────────────────────────────────────────────
export async function parsePdfToNewsFieldsFromFile(file: File): Promise<ParsedPdfFields> {
    const { pages, pageWidth } = await extractRawItems(file);

    const allLines: DocLine[] = [];

    for (let p = 0; p < pages.length; p++) {
        const items = pages[p];
        const { leftItems, rightItems, colSplit } = splitIntoColumns(items, pageWidth);

        if (colSplit !== null) {
            // Multi-column: read left column first, then right
            const leftLines = groupIntoLines(leftItems, 'left');
            const rightLines = groupIntoLines(rightItems, 'right');
            const withHeadings = detectHeadings([...leftLines, ...rightLines]);
            // Re-sort: left column fully, then right column
            const left = withHeadings.filter(l => l.column === 'left').sort((a, b) => a.y - b.y);
            const right = withHeadings.filter(l => l.column === 'right').sort((a, b) => a.y - b.y);
            allLines.push(...left, ...right);
        } else {
            // Single column
            const pageLines = groupIntoLines(items, 'full');
            const withHeadings = detectHeadings(pageLines);
            allLines.push(...withHeadings.sort((a, b) => a.y - b.y));
        }
    }

    const fields = buildNewsFields(allLines);

    // Dynamic Image Selection: Extract actual objects or fallback to high-quality render
    const coverImageBlob = await extractBestImageFromPdf(file);

    return { ...fields, coverImageBlob: coverImageBlob ?? undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD COMPAT shims
// ─────────────────────────────────────────────────────────────────────────────
export async function extractTextFromPdf(file: File): Promise<string> {
    const { pages } = await extractRawItems(file);
    return pages.map(pg => pg.map(i => i.text).join(' ')).join('\n\n');
}

export function parsePdfToNewsFields(rawText: string): Omit<ParsedPdfFields, 'coverImageBlob'> {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    let title = lines.find(l => l.length > 10) || 'Untitled';
    const body = lines.slice(1).join('\n\n');
    let excerpt = lines[1] || '';
    if (excerpt.length > 300) excerpt = excerpt.slice(0, 300) + '…';
    return { title, excerpt, body, tags: [], category: 'Intelligence' };
}
