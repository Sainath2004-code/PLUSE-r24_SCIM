import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, Upload, Trash2, Clock, BookOpen, ChevronDown,
    Calendar, Save, Image as ImageIcon, Tag, AlignLeft, FileText, Loader2,
    Sparkles, Zap, Hash, Shield, Search, Wand2, AlertCircle, ChevronUp
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, LayoutTemplate, NewsStatus, SeverityLevel } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { countWords, estimateReadingTime } from '../../utils/readingTime';
import {
    generateArticleBody,
    generateExcerpt,
    suggestTags,
    detectSeverity,
    generateSEO,
    improveText,
} from '../../services/groqService';

// ── Fixed standard fields (same as PDF upload review form) ────────────────────
// These fields are always shown regardless of which template was used.
// On save, they map to block type names so both PDF-imported and manually-created
// articles are stored consistently.

export const AdminCreate: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const imageFileRef = useRef<HTMLInputElement>(null);

    // ── Form fields ──────────────────────────────────────────────────────────
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageCaption, setImageCaption] = useState('');
    const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
    const [imageUploading, setImageUploading] = useState(false);
    const [tags, setTags] = useState('');
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState<SeverityLevel>('medium');

    // ── Metadata ─────────────────────────────────────────────────────────────
    const [itemStatus, setItemStatus] = useState<NewsStatus>('draft');
    const [scheduledAt, setScheduledAt] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDesc, setSeoDesc] = useState('');

    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!id);
    const [lastSavedLabel, setLastSavedLabel] = useState<string | null>(null);
    const [existingItem, setExistingItem] = useState<NewsItem | undefined>();
    const [template, setTemplate] = useState<LayoutTemplate | null>(null);

    // ── AI assistant state ─────────────────────────────────────────────────────
    type AiTask = 'body' | 'excerpt' | 'tags' | 'severity' | 'seo' | 'improve' | null;
    const [aiLoading, setAiLoading] = useState<AiTask>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiPanelOpen, setAiPanelOpen] = useState(true);

    const wordCount = countWords(body);
    const readingTime = estimateReadingTime(body);

    // Mark dirty on any field change
    const markDirty = () => setIsDirty(true);

    // ── Load existing article when editing ────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            const allTemplates = await storageService.getLayouts();
            setTemplate(allTemplates[0] || null);

            if (id) {
                setInitialLoading(true);
                const items = await storageService.getNewsItems();
                const item = items.find(i => i.id === id);
                if (item) {
                    setExistingItem(item);
                    setItemStatus(item.status);

                    // Extract field values by type (works for both PDF and normal articles)
                    const byType: Record<string, any> = {};
                    item.blocks.forEach(b => {
                        if (!(b.type in byType)) byType[b.type] = b.value;
                    });

                    setTitle(byType['title']?.toString() || '');
                    setExcerpt(byType['excerpt']?.toString() || '');
                    setBody(byType['markdown']?.toString() || '');
                    setTags(
                        Array.isArray(byType['tags'])
                            ? byType['tags'].join(', ')
                            : (byType['tags']?.toString() || '')
                    );
                    setCategory(byType['category']?.toString() || '');

                    // Image: handle both { src, caption } object and plain string
                    const imgVal = byType['image'];
                    if (imgVal?.src) {
                        setImageUrl(imgVal.src);
                        setImageCaption(imgVal.caption || '');
                    } else if (typeof imgVal === 'string' && imgVal) {
                        setImageUrl(imgVal);
                    }

                    const existingScheduled = (item as any).scheduledAt || item.meta?.scheduledAt;
                    if (existingScheduled) setScheduledAt(String(existingScheduled).slice(0, 16));
                    const existingSeoTitle = (item as any).seoTitle || item.meta?.seoTitle;
                    if (existingSeoTitle) setSeoTitle(existingSeoTitle);
                    const existingSeoDesc = (item as any).seoDescription || item.meta?.seoDescription;
                    if (existingSeoDesc) setSeoDesc(existingSeoDesc);
                }
                setInitialLoading(false);
            }
        };
        init();
    }, [id]);

    useUnsavedChanges(isDirty);

    // ── Handle image upload ──────────────────────────────────────────────────
    const handleImageUpload = async (file: File) => {
        const maxBytes = 2 * 1024 * 1024;
        if (!file.type.startsWith('image/')) {
            addToast('Only image files are allowed.', 'error');
            return;
        }
        if (file.size > maxBytes) {
            addToast('Image is too large (max 2MB).', 'error');
            return;
        }
        setImageUploading(true);
        addToast('Uploading image…', 'info');
        const url = await storageService.uploadImage(file);
        setImageUploading(false);
        if (url) {
            setImageUrl(url);
            markDirty();
            addToast('Image uploaded!', 'success');
        } else {
            addToast('Upload failed. Ensure "news-images" bucket exists in Supabase.', 'error');
        }
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = useCallback(async (status: NewsStatus) => {
        if (!title.trim()) { addToast('Title is required', 'error'); return; }
        setLoading(true);
        setItemStatus(status);

        try {
            // Build the template-compatible block list
            // Use existing block IDs from the article if available, else fall back to type strings
            const findBlockId = (type: string) => {
                // Try matching from existing article's blocks
                const existing = existingItem?.blocks.find(b => b.type === type);
                if (existing) return existing.blockId;
                // Try from template
                const tplBlock = template?.blocks.find(b => b.type === type);
                if (tplBlock) return tplBlock.id;
                // Fallback to type string (PDF convention)
                return type;
            };

            const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

            const blocks = [
                { blockId: findBlockId('title'), type: 'title', value: title },
                { blockId: findBlockId('excerpt'), type: 'excerpt', value: excerpt },
                ...(imageUrl ? [{ blockId: findBlockId('image'), type: 'image', value: { src: imageUrl, caption: imageCaption } }] : []),
                { blockId: findBlockId('markdown'), type: 'markdown', value: body },
                { blockId: findBlockId('tags'), type: 'tags', value: tagArray },
                ...(category ? [{ blockId: findBlockId('category'), type: 'category', value: category }] : []),
            ].filter(b => b.value !== '' && b.value !== undefined && !(Array.isArray(b.value) && b.value.length === 0));

            const meta: Record<string, any> = { ...(existingItem?.meta || {}) };
            if (scheduledAt) meta.scheduledAt = new Date(scheduledAt).toISOString();
            if (seoTitle) meta.seoTitle = seoTitle;
            if (seoDesc) meta.seoDescription = seoDesc;

            const newItem: NewsItem = {
                id: id || `news-${Date.now()}`,
                templateId: existingItem?.templateId || template?.templateId,
                blocks,
                createdAt: existingItem?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: existingItem?.author || 'Admin',
                tags: tagArray,
                category: category || undefined,
                severity,
                status,
                publishedAt: status === 'published'
                    ? new Date().toISOString()
                    : (existingItem?.publishedAt ?? undefined),
                meta,
                scheduledAt: meta.scheduledAt,
                seoTitle: meta.seoTitle,
                seoDescription: meta.seoDescription,
            } as any;

            await storageService.saveNewsItem(newItem);
            setIsDirty(false);
            setLastSavedLabel(`Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            addToast(id ? 'Article updated ✓' : 'Article created ✓', 'success');
            if (status !== 'draft') navigate('/admin/list');
        } catch (err: any) {
            addToast(`Save failed: ${err?.message || 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [title, excerpt, body, imageUrl, imageCaption, tags, category, itemStatus, scheduledAt, seoTitle, seoDesc, existingItem, template, id, addToast, navigate]);

    // Auto-save draft every 30s when dirty
    useAutoSave(useCallback(async () => {
        if (!isDirty || !title.trim()) return;
        await handleSave('draft');
    }, [isDirty, title, handleSave]));

    if (initialLoading) return (
        <div className="max-w-6xl mx-auto pb-20 flex items-center justify-center pt-32 gap-3 text-intel-400 font-mono text-xs uppercase tracking-widest">
            <Loader2 size={18} className="animate-spin text-maroon-600" />
            <span>Decrypting Intelligence…</span>
        </div>
    );

    const inputCls = "w-full px-4 py-2.5 bg-white dark:bg-slate-700 text-intel-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-maroon-500 focus:border-maroon-500 outline-none transition-all text-sm";

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/admin/list" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-500 transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-clarendon">
                            {id ? 'Refine Intelligence Brief' : 'Draft New Brief'}
                        </h1>
                        {lastSavedLabel
                            ? <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1"><Save size={10} /> {lastSavedLabel}</p>
                            : isDirty ? <p className="text-[10px] text-maroon-500 font-bold uppercase tracking-widest mt-1">Unsaved changes detected</p> : null
                        }
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSave(itemStatus)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm"
                    >
                        <Save size={14} /> {loading ? 'Saving…' : 'Save Protocol'}
                    </button>
                    <Button onClick={() => handleSave('pending_approval')} disabled={loading} className="!text-[10px] !font-black !px-6">
                        {loading ? 'Submitting…' : 'Finalize for Review'}
                    </Button>
                    <Button onClick={() => handleSave('published')} disabled={loading} className="!bg-maroon-600 hover:!bg-maroon-500 !text-[10px] !font-black !px-8 shadow-lg shadow-maroon-900/20">
                        {loading ? 'Disseminating…' : 'Disseminate Brief'}
                    </Button>
                </div>
            </div>

            {/* ── Stats bar ── */}
            <div className="flex items-center gap-8 mb-8 px-4 py-3 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit border border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <Clock size={14} className="text-maroon-500" /> {wordCount.toLocaleString()} DATA POINTS
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-white/10"></div>
                <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <BookOpen size={14} className="text-maroon-500" /> {readingTime} MIN ENGAGEMENT
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* ══ MAIN CONTENT AREA ══════════════════════════════════════ */}
                <div className="col-span-12 lg:col-span-9 space-y-5">

                    {/* ── Title ── */}
                    <Card variant="glass" className="p-6">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4">
                            <FileText size={15} className="text-maroon-500" /> Archive Identity & Headline
                        </label>
                        <input
                            type="text"
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-2xl font-black border border-slate-300 dark:border-slate-600 rounded-xl p-5 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none transition placeholder:text-slate-300 dark:placeholder:text-slate-600 tracking-tight"
                            placeholder="OPERATIONAL HEADLINE…"
                            value={title}
                            onChange={e => { setTitle(e.target.value); markDirty(); }}
                        />
                    </Card>

                    {/* ── Excerpt / Summary ── */}
                    <Card variant="glass" className="p-6">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4">
                            <AlignLeft size={15} className="text-maroon-500" /> Executive Digest
                        </label>
                        <textarea
                            rows={3}
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-xl p-4 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none resize-none transition text-sm leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder="Brief operational summary overview…"
                            value={excerpt}
                            onChange={e => { setExcerpt(e.target.value); markDirty(); }}
                        />
                    </Card>

                    {/* ── Cover Image ── */}
                    <Card variant="glass" className="p-6">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4">
                            <ImageIcon size={15} className="text-maroon-500" /> Visual Intelligence Asset
                        </label>

                        {/* Mode switcher */}
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl w-fit mb-5">
                            {['url', 'upload'].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setImageMode(m as 'url' | 'upload')}
                                    className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-lg transition-all ${imageMode === m ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    {m === 'url' ? 'External URL' : 'Upload File'}
                                </button>
                            ))}
                        </div>

                        {imageMode === 'url' ? (
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-4 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none transition"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={e => { setImageUrl(e.target.value); markDirty(); }}
                            />
                        ) : (
                            <div
                                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
                                onClick={() => imageFileRef.current?.click()}
                            >
                                <input
                                    ref={imageFileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                                />
                                {imageUploading ? (
                                    <div className="flex flex-col items-center gap-3 text-maroon-500">
                                        <Loader2 size={28} className="animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Processing Asset…</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500 group-hover:text-maroon-500 transition-all">
                                        <Upload size={30} />
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Click to Upload</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">JPG, PNG, WebP · Max 2MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Caption */}
                        <input
                            type="text"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-4 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none transition mt-3"
                            placeholder="Image caption (optional)…"
                            value={imageCaption}
                            onChange={e => { setImageCaption(e.target.value); markDirty(); }}
                        />

                        {/* Preview */}
                        {imageUrl && (
                            <div className="mt-4 h-56 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group shadow-lg">
                                <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{imageCaption || 'Cover Preview'}</p>
                                </div>
                                <button
                                    className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                                    onClick={() => { setImageUrl(''); setImageCaption(''); markDirty(); }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </Card>

                    {/* ── Body Content ── */}
                    <Card variant="glass" className="p-6">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4">
                            <AlignLeft size={15} className="text-maroon-500" /> Primary Intelligence Data
                        </label>
                        <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                            <MarkdownEditor
                                value={body}
                                onChange={v => { setBody(v); markDirty(); }}
                            />
                        </div>
                    </Card>



                    {/* ── Tags & Category ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-6">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-intel-700 dark:text-slate-200 mb-4">
                                <Tag size={14} className="text-maroon-600" /> Classification Tags
                            </label>
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="Geopolitics, Defense, Cyber (comma separated)"
                                value={tags}
                                onChange={e => { setTags(e.target.value); markDirty(); }}
                            />
                        </Card>
                        <Card className="p-6">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-intel-700 dark:text-slate-200 mb-4">
                                Strategic Category
                            </label>
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="e.g. Intelligence, Malware, APT"
                                value={category}
                                onChange={e => { setCategory(e.target.value); markDirty(); }}
                            />
                        </Card>
                    </div>
                </div>

                {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
                <div className="col-span-12 lg:col-span-3 space-y-4">

                {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
                <div className="col-span-12 lg:col-span-3 space-y-6">


                    {/* Severity */}
                    <Card variant="glass" className="p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-3">Threat Severity</p>
                        <div className="grid grid-cols-1 gap-1.5">
                            {([
                                { v: 'critical', label: 'Critical', cls: 'bg-red-600 text-white border-red-700' },
                                { v: 'high',     label: 'High',     cls: 'bg-orange-500 text-white border-orange-600' },
                                { v: 'medium',   label: 'Medium',   cls: 'bg-amber-400 text-slate-900 border-amber-500' },
                                { v: 'low',      label: 'Low',      cls: 'bg-emerald-500 text-white border-emerald-600' },
                                { v: 'info',     label: 'Info',     cls: 'bg-blue-500 text-white border-blue-600' },
                            ] as const).map(({ v, label, cls }) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => { setSeverity(v); markDirty(); }}
                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border transition-all ${
                                        severity === v ? cls : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >{label}</button>
                            ))}
                        </div>
                    </Card>

                    {/* Publish Status */}
                    <Card variant="glass" className="p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4">Archive Status</p>
                        <div className="relative">
                            <select
                                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-xl p-3.5 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none appearance-none cursor-pointer pr-8"
                                value={itemStatus}
                                onChange={e => { setItemStatus(e.target.value as NewsStatus); markDirty(); }}
                            >
                                <option value="draft">Draft</option>
                                <option value="pending_approval">Pending Review</option>
                                <option value="published">Published</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </Card>

                    {/* Schedule */}
                    <Card variant="glass" className="p-5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <Calendar size={14} className="text-maroon-500" /> Temporal Marker
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-xl p-3.5 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none"
                            value={scheduledAt}
                            onChange={e => { setScheduledAt(e.target.value); markDirty(); }}
                        />
                    </Card>

                    {/* SEO */}
                    <Card variant="glass" className="p-5 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">SEO / Presence</p>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">SEO Title</label>
                            <input
                                type="text"
                                className="w-full bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-xl p-3 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={seoTitle}
                                onChange={e => { setSeoTitle(e.target.value); markDirty(); }}
                                placeholder="Override title for search engines…"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">Meta Description</label>
                            <textarea
                                rows={3}
                                className="w-full bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-xl p-3 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={seoDesc}
                                onChange={e => { setSeoDesc(e.target.value); markDirty(); }}
                                placeholder="Short description for search engine snippets…"
                            />
                        </div>
                    </Card>

                    {/* AI Assistant */}
                    <Card variant="glass" className="p-5 border border-purple-200 dark:border-purple-900/40">
                        <button
                            type="button"
                            onClick={() => setAiPanelOpen(o => !o)}
                            className="w-full flex items-center justify-between mb-1"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                                    <Sparkles size={12} className="text-white" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-300">AI Assistant</p>
                            </div>
                            {aiPanelOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </button>

                        {aiPanelOpen && (
                            <div className="space-y-2 mt-3">
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-3">Powered by Groq · llama-3.3-70b</p>

                                {/* Error display */}
                                {aiError && (
                                    <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-2">
                                        <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-[9px] text-red-600 dark:text-red-400 font-semibold">
                                            {aiError === 'GROQ_API_KEY_MISSING'
                                                ? <span>API key not set. <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline">Get free key →</a> then add to .env</span>
                                                : aiError}
                                        </p>
                                    </div>
                                )}

                                {/* 1. Generate article */}
                                <button
                                    type="button"
                                    disabled={!!aiLoading || !title.trim()}
                                    onClick={async () => {
                                        setAiLoading('body'); setAiError(null);
                                        try {
                                            const result = await generateArticleBody(title, excerpt);
                                            setBody(result); markDirty();
                                            addToast('Article body generated!', 'success');
                                        } catch (e: any) {
                                            setAiError(e.message);
                                        } finally { setAiLoading(null); }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all disabled:opacity-40 text-left"
                                >
                                    {aiLoading === 'body' ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                                    Generate Article Body
                                </button>

                                {/* 2. Summarize */}
                                <button
                                    type="button"
                                    disabled={!!aiLoading || !body.trim()}
                                    onClick={async () => {
                                        setAiLoading('excerpt'); setAiError(null);
                                        try {
                                            const result = await generateExcerpt(title, body);
                                            setExcerpt(result); markDirty();
                                            addToast('Excerpt generated!', 'success');
                                        } catch (e: any) {
                                            setAiError(e.message);
                                        } finally { setAiLoading(null); }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all disabled:opacity-40 text-left"
                                >
                                    {aiLoading === 'excerpt' ? <Loader2 size={13} className="animate-spin" /> : <AlignLeft size={13} />}
                                    Summarize → Excerpt
                                </button>

                                {/* 3. Suggest tags */}
                                <button
                                    type="button"
                                    disabled={!!aiLoading || (!title.trim() && !body.trim())}
                                    onClick={async () => {
                                        setAiLoading('tags'); setAiError(null);
                                        try {
                                            const result = await suggestTags(title, body);
                                            setTags(result.join(', ')); markDirty();
                                            addToast(`${result.length} tags suggested!`, 'success');
                                        } catch (e: any) {
                                            setAiError(e.message);
                                        } finally { setAiLoading(null); }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all disabled:opacity-40 text-left"
                                >
                                    {aiLoading === 'tags' ? <Loader2 size={13} className="animate-spin" /> : <Hash size={13} />}
                                    Suggest Tags
                                </button>

                                {/* 4. Detect severity */}
                                <button
                                    type="button"
                                    disabled={!!aiLoading || (!title.trim() && !body.trim())}
                                    onClick={async () => {
                                        setAiLoading('severity'); setAiError(null);
                                        try {
                                            const result = await detectSeverity(title, body);
                                            setSeverity(result); markDirty();
                                            addToast(`Severity detected: ${result.toUpperCase()}`, 'success');
                                        } catch (e: any) {
                                            setAiError(e.message);
                                        } finally { setAiLoading(null); }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-40 text-left"
                                >
                                    {aiLoading === 'severity' ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
                                    Detect Severity
                                </button>

                                {/* 5. Generate SEO */}
                                <button
                                    type="button"
                                    disabled={!!aiLoading || !title.trim()}
                                    onClick={async () => {
                                        setAiLoading('seo'); setAiError(null);
                                        try {
                                            const result = await generateSEO(title, body);
                                            setSeoTitle(result.seoTitle);
                                            setSeoDesc(result.seoDesc);
                                            markDirty();
                                            addToast('SEO metadata generated!', 'success');
                                        } catch (e: any) {
                                            setAiError(e.message);
                                        } finally { setAiLoading(null); }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all disabled:opacity-40 text-left"
                                >
                                    {aiLoading === 'seo' ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                                    Generate SEO Meta
                                </button>

                                {/* 6. Improve body */}
                                <button
                                    type="button"
                                    disabled={!!aiLoading || !body.trim()}
                                    onClick={async () => {
                                        setAiLoading('improve'); setAiError(null);
                                        try {
                                            const result = await improveText(body);
                                            setBody(result); markDirty();
                                            addToast('Content improved!', 'success');
                                        } catch (e: any) {
                                            setAiError(e.message);
                                        } finally { setAiLoading(null); }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-40 text-left"
                                >
                                    {aiLoading === 'improve' ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                                    Improve Body Text
                                </button>
                            </div>
                        )}
                    </Card>

                    {/* Article Stats */}
                    <Card variant="glass" className="p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-5 font-inter">Brief Metrics</p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Complexity</span>
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{wordCount.toLocaleString()} Blocks</span>
                            </div>
                            <div className="flex justify-between items-center bg-maroon-500/5 p-3 rounded-xl border border-maroon-500/10">
                                <span className="text-[9px] font-black text-maroon-500/60 uppercase tracking-widest">Visibility</span>
                                <span className="text-[10px] font-black text-maroon-500 uppercase tracking-widest px-2 py-0.5 bg-maroon-500/10 rounded-lg">
                                    {itemStatus.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
                </div>
            </div>
        </div>
    );
};


