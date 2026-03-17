/**
 * Groq AI Service — Intelligence Article Assistant
 * Uses the free Groq API (llama-3.3-70b-versatile model)
 * Get your free key at https://console.groq.com
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function getKey(): string {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    if (!key || key === 'your_groq_api_key_here') {
        console.error('CRITICAL: VITE_GROQ_API_KEY is missing!');
        throw new Error('GROQ_API_KEY_MISSING');
    }
    return key;
}

async function chat(systemPrompt: string, userMessage: string): Promise<string> {
    const key = getKey();
    const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(err?.error?.message || `Groq API error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}

// ─── System context for all prompts ───────────────────────────────────────────
const INTEL_SYSTEM = `You are an expert National Intelligence analyst and writer for PULSE-R24, India's leading 
strategic intelligence portal. You write concise, factual, authoritative briefs covering geopolitics, 
defense, internal security, cyber threats, and macroeconomics. 
Style: Formal intelligence report, authoritative, factual. Avoid filler phrases. Be direct and precise.`;

// ─── 1. Generate full article body ────────────────────────────────────────────
export async function generateArticleBody(title: string, context?: string): Promise<string> {
    const prompt = `Write a professional intelligence brief article body for the following headline:

Title: "${title}"
${context ? `Additional context: ${context}` : ''}

Requirements:
- Write in markdown format (use ## for sections, **bold** for key terms, bullet lists where appropriate)
- Length: 3–5 paragraphs + key points list
- Style: formal intelligence report, authoritative, factual
- Include sections like: Overview, Key Developments, Analysis, Implications
- Do NOT include the title itself in the body
- Do NOT use placeholder text like [Insert...]`;

    return chat(INTEL_SYSTEM, prompt);
}

// ─── 2. Generate excerpt/summary ──────────────────────────────────────────────
export async function generateExcerpt(title: string, body: string): Promise<string> {
    const prompt = `Write a 1–2 sentence executive summary/excerpt for this intelligence article.
Keep it under 200 characters. Be precise and impactful. No fluff.

Title: ${title}
Body: ${body.slice(0, 2000)}`;

    return chat(INTEL_SYSTEM, prompt);
}

// ─── 3. Suggest tags ──────────────────────────────────────────────────────────
export async function suggestTags(title: string, body: string): Promise<string[]> {
    const prompt = `Suggest 4–8 relevant intelligence tags for this article. 
AT LEAST ONE tag MUST be from this primary domain list: Geopolitics, Defense, Internal Security, Cyber, Economy, Terrorism, Border Intelligence.
Return ONLY a JSON array of string tags, no explanation.
Example: ["Geopolitics", "China", "Border Intrusion", "PLA"]

Title: ${title}
Body: ${body.slice(0, 1500)}`;

    const raw = await chat(INTEL_SYSTEM, prompt);
    try {
        const match = raw.match(/\[.*\]/s);
        if (match) return JSON.parse(match[0]);
    } catch {}
    // Fallback: split by commas
    return raw.replace(/[\[\]"']/g, '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

// ─── 4. Detect severity ───────────────────────────────────────────────────────
export async function detectSeverity(title: string, body: string): Promise<'critical' | 'high' | 'medium' | 'low' | 'info'> {
    const prompt = `Assess the threat severity of this intelligence article.
Return ONLY one word from: critical, high, medium, low, info
No explanation, just the single word.

Title: ${title}
Body: ${body.slice(0, 1000)}`;

    const raw = await chat(INTEL_SYSTEM, prompt);
    const severity = raw.toLowerCase().trim().split(/\s+/)[0];
    const valid = ['critical', 'high', 'medium', 'low', 'info'];
    return (valid.includes(severity) ? severity : 'medium') as any;
}

// ─── 5. Generate SEO title + description ──────────────────────────────────────
export async function generateSEO(title: string, body: string): Promise<{ seoTitle: string; seoDesc: string }> {
    const prompt = `Generate SEO metadata for this intelligence article.
Return ONLY valid JSON in this exact format:
{"seoTitle": "...", "seoDesc": "..."}

Rules:
- seoTitle: max 60 characters, clear keyword-rich title
- seoDesc: max 155 characters, compelling description for search snippets

Title: ${title}
Body: ${body.slice(0, 800)}`;

    const raw = await chat(INTEL_SYSTEM, prompt);
    try {
        const match = raw.match(/\{.*\}/s);
        if (match) return JSON.parse(match[0]);
    } catch {}
    return { seoTitle: title.slice(0, 60), seoDesc: '' };
}

// ─── 6. Improve/expand a paragraph ────────────────────────────────────────────
export async function improveText(text: string): Promise<string> {
    const prompt = `Improve and expand the following text for a professional intelligence report. 
Make it more authoritative, precise, and informative. Keep the same key facts.
Return only the improved text, no explanation.

Text: "${text}"`;

    return chat(INTEL_SYSTEM, prompt);
}
