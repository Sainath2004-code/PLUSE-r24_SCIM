/** Average adult reading speed (words per minute) */
const WPM = 200;

/**
 * Estimates reading time in minutes from a plain-text or markdown string.
 * Returns at least 1 minute.
 */
export function estimateReadingTime(text: string): number {
    if (!text) return 1;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(wordCount / WPM));
}

/**
 * Count words in a string.
 */
export function countWords(text: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
}
