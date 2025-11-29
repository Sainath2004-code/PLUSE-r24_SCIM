import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, Trash2 } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, LayoutTemplate, NewsStatus, NewsBlockValue } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { MarkdownEditor } from '../../components/MarkdownEditor';

export const AdminCreate: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [template, setTemplate] = useState<LayoutTemplate | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
    const [itemStatus, setItemStatus] = useState<NewsStatus>('draft');

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
                }
            } else if (allTemplates.length > 0) {
                setTemplate(allTemplates[0]);
            }
        };
        init();
    }, [id]);

    const handleSave = async (status: NewsStatus) => {
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
            status: status,
            publishedAt: status === 'published' ? new Date().toISOString() : undefined,
            author: 'Admin'
        };

        await storageService.saveNewsItem(newItem);
        setLoading(false);
        addToast(id ? 'Article updated successfully' : 'Article created successfully', 'success');
        navigate('/admin/list');
    };

    const updateField = (blockId: string, value: any) => {
        setFormData(prev => ({ ...prev, [blockId]: value }));
    };

    if (!template && !loading) return <div>No templates found. Create one first.</div>;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/admin/list" className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft /></Link>
                    <h1 className="text-2xl font-bold text-slate-900">{id ? 'Edit News' : 'Create News'}</h1>
                    {!id && (
                        <select
                            className="ml-4 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={template?.templateId}
                            onChange={e => {
                                const t = templates.find(tpl => tpl.templateId === e.target.value);
                                if (t) {
                                    setTemplate(t);
                                    setFormData({});
                                }
                            }}
                        >
                            {templates.map(t => <option key={t.templateId} value={t.templateId}>{t.name}</option>)}
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => handleSave('draft')} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button onClick={() => handleSave('pending_approval')} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                </div>
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
            </div>
        </div>
    );
};
