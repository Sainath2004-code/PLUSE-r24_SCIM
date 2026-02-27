import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, Trash2, Clock, BookOpen, Calendar, Save } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, LayoutTemplate, NewsStatus, NewsBlockValue } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { countWords, estimateReadingTime } from '../../utils/readingTime';

export const AdminCreate: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [template, setTemplate] = useState<LayoutTemplate | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
    const [itemStatus, setItemStatus] = useState<NewsStatus>('draft');
    const [isDirty, setIsDirty] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDesc, setSeoDesc] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [readingTime, setReadingTime] = useState(1);
    const [lastSavedLabel, setLastSavedLabel] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const allTemplates = await storageService.getLayouts();
            setTemplates(allTemplates);

            if (id) {
                const items = await storageService.getNewsItems();
                const item = items.find(i => i.id === id);
                if (item) {
                    setItemStatus(item.status);
                    const tpl = allTemplates.find(t => t.templateId === item.templateId) || allTemplates[0];
                    setTemplate(tpl);
                    const data: Record<string, any> = {};
                    item.blocks.forEach(b => { data[b.blockId] = b.value; });
                    setFormData(data);
                    if ((item as any).scheduledAt) setScheduledAt((item as any).scheduledAt.slice(0, 16));
                    if ((item as any).seoTitle) setSeoTitle((item as any).seoTitle);
                    if ((item as any).seoDescription) setSeoDesc((item as any).seoDescription);
                }
            } else if (allTemplates.length > 0) {
                setTemplate(allTemplates[0]);
            }
        };
        init();
    }, [id]);

    // Live word count from markdown blocks
    useEffect(() => {
        const markdownBlock = template?.blocks.find(b => b.type === 'markdown');
        const text = markdownBlock ? (formData[markdownBlock.id] ?? '') : '';
        setWordCount(countWords(text));
        setReadingTime(estimateReadingTime(text));
    }, [formData, template]);

    // Warn on unsaved changes
    useUnsavedChanges(isDirty);

    const handleSave = useCallback(async (status: NewsStatus) => {
        setLoading(true);
        if (!template) return;

        const blocks: NewsBlockValue[] = template.blocks.map(b => ({
            blockId: b.id,
            type: b.type,
            value: formData[b.id]
        })).filter(b => b.value !== undefined || b.type === 'divider');

        let existingItem: NewsItem | undefined;
        if (id) {
            const items = await storageService.getNewsItems();
            existingItem = items.find(i => i.id === id);
        }

        const newItem: NewsItem = {
            id: id || `news-${Date.now()}`,
            templateId: template.templateId,
            blocks,
            createdAt: existingItem ? existingItem.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status,
            publishedAt: status === 'published' ? new Date().toISOString() : (existingItem?.publishedAt ?? undefined),
            author: 'Admin',
            // Extra CMS fields stored at top level for future schema
            ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
            ...(seoTitle ? { seoTitle } : {}),
            ...(seoDesc ? { seoDescription: seoDesc } : {}),
        } as any;

        await storageService.saveNewsItem(newItem);
        setLoading(false);
        setIsDirty(false);
        setLastSavedLabel(`Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        addToast(id ? 'Article updated' : 'Article created', 'success');
        if (status !== 'draft') navigate('/admin/list');
    }, [template, formData, id, scheduledAt, seoTitle, seoDesc, addToast, navigate]);

    // Auto-save draft every 30s
    useAutoSave(useCallback(async () => {
        if (!isDirty || !template) return;
        await handleSave('draft');
    }, [isDirty, template, handleSave]));

    const updateField = (blockId: string, value: any) => {
        setFormData(prev => ({ ...prev, [blockId]: value }));
        setIsDirty(true);
    };

    if (!template && !loading) return <div>No templates found. Create one first.</div>;

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <Link to="/admin/list" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{id ? 'Edit Article' : 'Create Article'}</h1>
                        {lastSavedLabel ? (
                            <p className="text-xs text-emerald-500 flex items-center gap-1 mt-0.5">
                                <Save size={10} /> {lastSavedLabel}
                            </p>
                        ) : isDirty ? (
                            <p className="text-xs text-amber-500 mt-0.5">Unsaved changes</p>
                        ) : null}
                    </div>
                    {!id && templates.length > 1 && (
                        <select
                            className="ml-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                            value={template?.templateId}
                            onChange={e => {
                                const t = templates.find(tpl => tpl.templateId === e.target.value);
                                if (t) { setTemplate(t); setFormData({}); }
                            }}
                        >
                            {templates.map(t => <option key={t.templateId} value={t.templateId}>{t.name}</option>)}
                        </select>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={14} /> {loading ? 'Saving...' : 'Save Draft'}
                    </button>
                    <Button onClick={() => handleSave('pending_approval')} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                    <Button
                        onClick={() => handleSave('published')}
                        disabled={loading}
                        className="!bg-emerald-600 hover:!bg-emerald-700"
                    >
                        Publish
                    </Button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6 mb-6 px-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock size={13} /> {wordCount.toLocaleString()} words
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <BookOpen size={13} /> {readingTime} min read
                </span>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {template?.blocks.map(block => (
                    <div key={block.id} className={`col-span-12 lg:col-span-${block.grid?.colSpan || 12}`}>
                        <Card className="p-6 h-full flex flex-col">
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                                {block.label}
                                <span className="text-xs text-slate-400 font-normal uppercase">{block.type}</span>
                            </label>

                            {block.type === 'markdown' ? (
                                <MarkdownEditor value={formData[block.id] || ''} onChange={(v) => updateField(block.id, v)} />
                            ) : block.type === 'image' ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2 mb-1">
                                        <button
                                            type="button"
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${!formData[block.id]?.useUpload ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            onClick={() => updateField(block.id, { ...formData[block.id], useUpload: false })}
                                        >
                                            Image URL
                                        </button>
                                        <button
                                            type="button"
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${formData[block.id]?.useUpload ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            onClick={() => updateField(block.id, { ...formData[block.id], useUpload: true })}
                                        >
                                            Upload Image
                                        </button>
                                    </div>

                                    {formData[block.id]?.useUpload ? (
                                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors relative group cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        addToast('Uploading image...', 'info');
                                                        const url = await storageService.uploadImage(file);
                                                        if (url) {
                                                            updateField(block.id, { ...formData[block.id], src: url });
                                                            addToast('Image uploaded successfully!', 'success');
                                                        } else {
                                                            addToast('Upload failed. Ensure "news-images" bucket exists and is public.', 'error');
                                                        }
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-brand-500 transition-colors">
                                                <Upload size={32} />
                                                <span className="text-sm font-medium">Click to upload or drag and drop</span>
                                                <span className="text-xs text-slate-400">SVG, PNG, JPG or GIF (max. 2MB)</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Image URL (e.g. https://picsum.photos/800/400)"
                                                className="flex-1 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                                value={formData[block.id]?.src || ''}
                                                onChange={(e) => updateField(block.id, { ...formData[block.id], src: e.target.value })}
                                            />
                                            <Button variant="secondary" onClick={() => updateField(block.id, { ...formData[block.id], src: `https://picsum.photos/800/400?r=${Math.random()}` })}>Random</Button>
                                        </div>
                                    )}

                                    <input
                                        type="text" placeholder="Caption"
                                        className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={formData[block.id]?.caption || ''}
                                        onChange={(e) => updateField(block.id, { ...formData[block.id], caption: e.target.value })}
                                    />
                                    {formData[block.id]?.src && (
                                        <div className="h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group">
                                            <img src={formData[block.id].src} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            <button
                                                className="absolute top-2 right-2 bg-white p-2 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:text-red-600 hover:bg-red-50 transform translate-y-2 group-hover:translate-y-0"
                                                onClick={() => updateField(block.id, { ...formData[block.id], src: '' })}
                                                title="Remove Image"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : block.type === 'tags' ? (
                                <input
                                    type="text"
                                    placeholder="tech, news, release (comma separated)"
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={Array.isArray(formData[block.id]) ? formData[block.id].join(', ') : (formData[block.id] || '')}
                                    onChange={(e) => updateField(block.id, e.target.value.split(',').map((s: string) => s.trim()))}
                                />
                            ) : block.type === 'publishDate' ? (
                                <input
                                    type="datetime-local"
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={formData[block.id] ? new Date(formData[block.id]).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => updateField(block.id, new Date(e.target.value).toISOString())}
                                />
                            ) : block.type === 'divider' ? (
                                <div className="py-4 px-2">
                                    <hr className="border-slate-300 border-dashed" />
                                    <p className="text-center text-xs text-slate-400 mt-2 font-mono">--- Divider Line ---</p>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={formData[block.id] || ''}
                                    onChange={(e) => updateField(block.id, e.target.value)}
                                />
                            )}
                        </Card>
                    </div>
                ))}

                {/* ── SIDEBAR PANEL ── */}
                <div className="col-span-12 lg:col-span-3 space-y-4">

                    {/* Publish status */}
                    <Card className="p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Publish Status</p>
                        <select
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                            value={itemStatus}
                            onChange={e => { setItemStatus(e.target.value as NewsStatus); setIsDirty(true); }}
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
                            onChange={e => { setScheduledAt(e.target.value); setIsDirty(true); }}
                        />
                        {scheduledAt && (
                            <p className="text-xs text-slate-400 mt-1.5">Publishes on {new Date(scheduledAt).toLocaleString()}</p>
                        )}
                    </Card>

                    {/* SEO */}
                    <Card className="p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">SEO</p>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                                SEO Title <span className={`ml-1 font-normal ${seoTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}`}>({seoTitle.length}/60)</span>
                            </label>
                            <input
                                type="text"
                                maxLength={70}
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                                value={seoTitle}
                                onChange={e => { setSeoTitle(e.target.value); setIsDirty(true); }}
                                placeholder="Override page title"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                                Meta Description <span className={`ml-1 font-normal ${seoDesc.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>({seoDesc.length}/160)</span>
                            </label>
                            <textarea
                                rows={3}
                                maxLength={180}
                                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none resize-none"
                                value={seoDesc}
                                onChange={e => { setSeoDesc(e.target.value); setIsDirty(true); }}
                                placeholder="Search engine description"
                            />
                        </div>
                    </Card>

                    {/* Stats */}
                    <Card className="p-4 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Article Stats</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Clock size={13} /> Words</span>
                            <span className="font-bold text-slate-800 dark:text-white">{wordCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><BookOpen size={13} /> Read time</span>
                            <span className="font-bold text-slate-800 dark:text-white">{readingTime} min</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
