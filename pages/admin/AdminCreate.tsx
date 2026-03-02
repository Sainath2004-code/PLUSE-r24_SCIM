import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, Upload, Trash2, Clock, BookOpen,
    Calendar, Save, Image as ImageIcon, Tag, AlignLeft, FileText, Loader2
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, LayoutTemplate, NewsStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { countWords, estimateReadingTime } from '../../utils/readingTime';

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

                    if ((item as any).scheduledAt) setScheduledAt((item as any).scheduledAt.slice(0, 16));
                    if ((item as any).seoTitle) setSeoTitle((item as any).seoTitle);
                    if ((item as any).seoDescription) setSeoDesc((item as any).seoDescription);
                }
                setInitialLoading(false);
            }
        };
        init();
    }, [id]);

    useUnsavedChanges(isDirty);

    // ── Handle image upload ──────────────────────────────────────────────────
    const handleImageUpload = async (file: File) => {
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

            const newItem: NewsItem = {
                id: id || `news-${Date.now()}`,
                templateId: existingItem?.templateId || template?.templateId,
                blocks,
                createdAt: existingItem?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: existingItem?.author || 'Admin',
                tags: tagArray,
                status,
                publishedAt: status === 'published'
                    ? (existingItem?.publishedAt || new Date().toISOString())
                    : (existingItem?.publishedAt ?? undefined),
                meta: existingItem?.meta,
                ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
                ...(seoTitle ? { seoTitle } : {}),
                ...(seoDesc ? { seoDescription: seoDesc } : {}),
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
        <div className="max-w-6xl mx-auto pb-20 flex items-center justify-center pt-20 gap-3 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading article…</span>
        </div>
    );

    const inputCls = "w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition text-sm";

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <Link to="/admin/list" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {id ? 'Edit Article' : 'Create Article'}
                        </h1>
                        {lastSavedLabel
                            ? <p className="text-xs text-emerald-500 flex items-center gap-1 mt-0.5"><Save size={10} /> {lastSavedLabel}</p>
                            : isDirty ? <p className="text-xs text-amber-500 mt-0.5">Unsaved changes</p> : null
                        }
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={14} /> {loading ? 'Saving…' : 'Save Draft'}
                    </button>
                    <Button onClick={() => handleSave('pending_approval')} disabled={loading}>
                        {loading ? 'Submitting…' : 'Submit for Approval'}
                    </Button>
                    <Button onClick={() => handleSave('published')} disabled={loading} className="!bg-emerald-600 hover:!bg-emerald-700">
                        {loading ? 'Publishing…' : 'Publish'}
                    </Button>
                </div>
            </div>

            {/* ── Stats bar ── */}
            <div className="flex items-center gap-6 mb-6 px-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock size={13} /> {wordCount.toLocaleString()} words
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <BookOpen size={13} /> {readingTime} min read
                </span>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* ══ MAIN CONTENT AREA ══════════════════════════════════════ */}
                <div className="col-span-12 lg:col-span-9 space-y-5">

                    {/* ── Title ── */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                            <FileText size={15} className="text-brand-500" /> Headline / Title
                            <span className="ml-auto text-xs text-slate-400 font-normal">required</span>
                        </label>
                        <input
                            type="text"
                            className={inputCls + ' text-base font-semibold'}
                            placeholder="e.g. PULSE-R24 Daily Threat Intelligence Bulletin"
                            value={title}
                            onChange={e => { setTitle(e.target.value); markDirty(); }}
                        />
                    </Card>

                    {/* ── Excerpt / Summary ── */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                            <AlignLeft size={15} className="text-brand-500" /> Excerpt / Summary
                        </label>
                        <textarea
                            rows={3}
                            className={inputCls + ' resize-none'}
                            placeholder="Brief summary shown on the homepage feed…"
                            value={excerpt}
                            onChange={e => { setExcerpt(e.target.value); markDirty(); }}
                        />
                    </Card>

                    {/* ── Cover Image ── */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                            <ImageIcon size={15} className="text-brand-500" /> Cover Image
                            <span className="ml-auto text-xs text-slate-400 font-normal">optional</span>
                        </label>

                        {/* Mode switcher */}
                        <div className="flex gap-2 mb-3">
                            {['url', 'upload'].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setImageMode(m as 'url' | 'upload')}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${imageMode === m ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'}`}
                                >
                                    {m === 'url' ? 'Image URL' : 'Upload File'}
                                </button>
                            ))}
                        </div>

                        {imageMode === 'url' ? (
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={e => { setImageUrl(e.target.value); markDirty(); }}
                            />
                        ) : (
                            <div
                                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
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
                                    <div className="flex flex-col items-center gap-2 text-brand-500">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="text-xs">Uploading…</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-brand-500 transition-colors">
                                        <Upload size={24} />
                                        <span className="text-sm font-medium">Click to upload image</span>
                                        <span className="text-xs text-slate-300">PNG, JPG, GIF (max 2MB)</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Caption */}
                        <input
                            type="text"
                            className={inputCls + ' mt-3'}
                            placeholder="Image caption (optional)"
                            value={imageCaption}
                            onChange={e => { setImageCaption(e.target.value); markDirty(); }}
                        />

                        {/* Preview */}
                        {imageUrl && (
                            <div className="mt-3 h-52 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                                <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                                <button
                                    className="absolute top-2 right-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow hover:bg-red-50"
                                    onClick={() => { setImageUrl(''); setImageCaption(''); markDirty(); }}
                                    title="Remove image"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </Card>

                    {/* ── Body Content ── */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                            <AlignLeft size={15} className="text-brand-500" /> Body Content
                            <span className="ml-auto text-xs text-slate-400 font-normal">Markdown supported</span>
                        </label>
                        <MarkdownEditor
                            value={body}
                            onChange={v => { setBody(v); markDirty(); }}
                        />
                    </Card>

                    {/* ── Tags & Category ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-5">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                <Tag size={15} className="text-brand-500" /> Tags
                            </label>
                            <input
                                type="text"
                                className={inputCls}
                                placeholder="threat, malware, india (comma separated)"
                                value={tags}
                                onChange={e => { setTags(e.target.value); markDirty(); }}
                            />
                        </Card>
                        <Card className="p-5">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                Category
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

                    {/* Publish Status */}
                    <Card className="p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Publish Status</p>
                        <select
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                            value={itemStatus}
                            onChange={e => { setItemStatus(e.target.value as NewsStatus); markDirty(); }}
                        >
                            <option value="draft">Draft</option>
                            <option value="pending_approval">Pending Approval</option>
                            <option value="published">Published</option>
                        </select>
                    </Card>

                    {/* Schedule */}
                    <Card className="p-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                            <Calendar size={12} /> Schedule
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none mt-2"
                            value={scheduledAt}
                            onChange={e => { setScheduledAt(e.target.value); markDirty(); }}
                        />
                        {scheduledAt && (
                            <p className="text-xs text-slate-400 mt-1.5">Publishes on {new Date(scheduledAt).toLocaleString()}</p>
                        )}
                    </Card>

                    {/* SEO */}
                    <Card className="p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">SEO (optional)</p>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                                SEO Title <span className={`ml-1 font-normal ${seoTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>({seoTitle.length}/60)</span>
                            </label>
                            <input
                                type="text"
                                maxLength={70}
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                                value={seoTitle}
                                onChange={e => { setSeoTitle(e.target.value); markDirty(); }}
                                placeholder="Override page title for Google"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                                Meta Description <span className={`ml-1 font-normal ${seoDesc.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>({seoDesc.length}/160)</span>
                            </label>
                            <textarea
                                rows={3}
                                maxLength={175}
                                className="w-full px-3 pb-2 pt-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none resize-none"
                                value={seoDesc}
                                onChange={e => { setSeoDesc(e.target.value); markDirty(); }}
                                placeholder="Search engine description"
                            />
                        </div>
                    </Card>

                    {/* Article Stats */}
                    <Card className="p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Article Stats</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Words</span>
                                <span className="font-semibold text-slate-800 dark:text-white">{wordCount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Read time</span>
                                <span className="font-semibold text-slate-800 dark:text-white">{readingTime} min</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Status</span>
                                <span className={`font-semibold capitalize ${itemStatus === 'published' ? 'text-emerald-600' : itemStatus === 'pending_approval' ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {itemStatus.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
