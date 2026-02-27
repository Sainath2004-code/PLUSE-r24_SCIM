import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, FileUp, FileText, X, Loader2, Image,
    Sparkles, CheckCircle, AlertTriangle, Tag, AlignLeft, Type, Upload, Trash2
} from 'lucide-react';
import { extractTextFromPdf, parsePdfToNewsFields } from '../../services/pdfService';
import { storageService } from '../../services/storageService';
import { NewsItem, LayoutTemplate, NewsStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { MarkdownEditor } from '../../components/MarkdownEditor';

// Thin wrapper so the drop zone div keeps Card styling but passes drag events
const DropZone: React.FC<{ isDragging: boolean; onDragOver: React.DragEventHandler; onDragLeave: React.DragEventHandler; onDrop: React.DragEventHandler; onClick: () => void; children: React.ReactNode }> = ({
    isDragging, onDragOver, onDragLeave, onDrop, onClick, children
}) => (
    <div
        className={`overflow-hidden transition-all duration-200 border-2 border-dashed rounded-xl p-12 cursor-pointer ${isDragging
            ? 'border-brand-400 bg-brand-50 scale-[1.01]'
            : 'border-slate-300 hover:border-brand-300 hover:bg-slate-50 bg-white'
            }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
    >
        {children}
    </div>
);

type Stage = 'upload' | 'extracting' | 'review' | 'done';

export const AdminPdfUpload: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stage, setStage] = useState<Stage>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [extractProgress, setExtractProgress] = useState('');
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [body, setBody] = useState('');
    const [tags, setTags] = useState('');
    const [category, setCategory] = useState('');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    // Cover image
    const imageUploadRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imageCaption, setImageCaption] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');

    const handleImageUpload = useCallback(async (file: File) => {
        setImageUploading(true);
        addToast('Uploading image…', 'info');
        try {
            const url = await storageService.uploadImage(file);
            if (url) {
                setImageUrl(url);
                addToast('Image uploaded!', 'success');
            } else {
                addToast('Image upload failed. Ensure "news-images" bucket exists.', 'error');
            }
        } finally {
            setImageUploading(false);
        }
    }, [addToast]);

    const processPdf = useCallback(async (file: File) => {
        if (!file.name.endsWith('.pdf')) {
            addToast('Please upload a PDF file.', 'error');
            return;
        }
        setPdfFile(file);
        setStage('extracting');

        try {
            setExtractProgress('Reading PDF pages…');
            const rawText = await extractTextFromPdf(file);

            setExtractProgress('Analysing content…');
            await new Promise(r => setTimeout(r, 600)); // brief pause for UX

            const fields = parsePdfToNewsFields(rawText);
            setTitle(fields.title);
            setExcerpt(fields.excerpt);
            setBody(fields.body);
            setTags(fields.tags.join(', '));
            setCategory(fields.category);

            // Optionally upload the PDF to storage for reference link
            setExtractProgress('Uploading PDF to storage…');
            const url = await storageService.uploadPdf(file);
            if (url) setPdfUrl(url);

            setStage('review');
        } catch (err: any) {
            console.error('PDF processing error:', err);
            addToast(`Failed to process PDF: ${err?.message || 'Unknown error'}`, 'error');
            setStage('upload');
        }
    }, [addToast]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processPdf(file);
    }, [processPdf]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processPdf(file);
    }, [processPdf]);

    const handleSave = async (status: NewsStatus) => {
        setSaving(true);
        try {
            const templates: LayoutTemplate[] = await storageService.getLayouts();
            const tpl = templates[0];

            // Build blocks — we map fields to the first template's block IDs
            // with a graceful fallback if block IDs vary
            const findBlockId = (type: string) =>
                tpl?.blocks.find(b => b.type === type)?.id ?? type;

            const blocks = [
                { blockId: findBlockId('title'), type: 'title', value: title },
                { blockId: findBlockId('excerpt'), type: 'excerpt', value: excerpt },
                // Cover image block — only include if a URL was provided
                ...(imageUrl ? [{ blockId: findBlockId('image'), type: 'image', value: { src: imageUrl, caption: imageCaption } }] : []),
                { blockId: findBlockId('markdown'), type: 'markdown', value: body },
                { blockId: findBlockId('tags'), type: 'tags', value: tags.split(',').map(t => t.trim()).filter(Boolean) },
                { blockId: findBlockId('category'), type: 'category', value: category },
            ].filter(b => b.value !== '' && b.value !== undefined);

            const newsItem: NewsItem = {
                id: `pdf-${Date.now()}`,
                templateId: tpl?.templateId,
                blocks,
                author: 'Admin (PDF Import)',
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                publishedAt: status === 'published' ? new Date().toISOString() : null,
                status,
                meta: {
                    source: 'pdf_upload',
                    pdfName: pdfFile?.name,
                    pdfUrl: pdfUrl ?? undefined,
                }
            };

            await storageService.saveNewsItem(newsItem);
            setStage('done');
            addToast(
                status === 'pending_approval'
                    ? 'Article submitted for approval!'
                    : 'Article saved as draft!',
                'success'
            );
            setTimeout(() => navigate('/admin/list'), 1200);
        } catch (err: any) {
            addToast(`Save failed: ${err?.message ?? 'Unknown error'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        setStage('upload');
        setPdfFile(null);
        setTitle(''); setExcerpt(''); setBody(''); setTags(''); setCategory('');
        setPdfUrl(null);
        setImageUrl(''); setImageCaption(''); setImageMode('url');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageUploadRef.current) imageUploadRef.current.value = '';
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link to="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileUp size={22} className="text-brand-500" />
                        PDF → News Generator
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Upload a PDF bulletin and we'll automatically extract the content into a news article.</p>
                </div>
            </div>

            {/* ── Stage: Upload ── */}
            {stage === 'upload' && (
                <DropZone
                    isDragging={isDragging}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                            <FileUp size={36} className="text-brand-600" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-slate-700">Drop your PDF here</p>
                            <p className="text-sm text-slate-400 mt-1">or <span className="text-brand-500 font-medium">click to browse</span></p>
                        </div>
                        <div className="flex items-center gap-6 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><FileText size={14} /> PDF files only</span>
                            <span className="flex items-center gap-1.5"><Sparkles size={14} /> Auto-extract text</span>
                            <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Review before publish</span>
                        </div>
                    </div>
                </DropZone>
            )}

            {/* ── Stage: Extracting ── */}
            {stage === 'extracting' && (
                <Card className="p-16 flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                            <FileText size={40} className="text-brand-500" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border border-slate-100 flex items-center justify-center shadow">
                            <Loader2 size={18} className="text-brand-500 animate-spin" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-slate-800 text-lg">Processing: <span className="text-brand-600">{pdfFile?.name}</span></p>
                        <p className="text-sm text-slate-400 mt-1 animate-pulse">{extractProgress}</p>
                    </div>
                    <div className="w-64 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '70%' }} />
                    </div>
                </Card>
            )}

            {/* ── Stage: Review / Edit ── */}
            {stage === 'review' && (
                <div className="space-y-5">
                    {/* Source file badge */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
                            <Sparkles size={14} />
                            Auto-extracted from: <span className="font-bold">{pdfFile?.name}</span>
                        </div>
                        <button
                            onClick={reset}
                            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                            <X size={14} /> Upload different PDF
                        </button>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                        <span>Review and edit the auto-generated content below before submitting. AI extraction may not be perfect.</span>
                    </div>

                    {/* Title */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <Type size={15} className="text-brand-400" /> Headline / Title
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2.5 bg-white text-slate-900 text-lg font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none transition"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Article headline…"
                        />
                    </Card>

                    {/* Excerpt */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <AlignLeft size={15} className="text-brand-400" /> Excerpt / Summary
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none resize-none transition text-sm"
                            value={excerpt}
                            onChange={e => setExcerpt(e.target.value)}
                            placeholder="Short summary shown in news feed…"
                        />
                    </Card>

                    {/* Cover Image */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                            <Image size={15} className="text-brand-400" /> Cover Image
                            <span className="ml-auto text-xs text-slate-400 font-normal">Optional</span>
                        </label>

                        {/* Mode toggle */}
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setImageMode('url')}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${imageMode === 'url'
                                        ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                Image URL
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageMode('upload')}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${imageMode === 'upload'
                                        ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                Upload File
                            </button>
                        </div>

                        {imageMode === 'url' ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="https://example.com/image.jpg"
                                    className="flex-1 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none text-sm transition"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group"
                                onClick={() => imageUploadRef.current?.click()}
                            >
                                <input
                                    ref={imageUploadRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) handleImageUpload(f);
                                    }}
                                />
                                {imageUploading ? (
                                    <div className="flex flex-col items-center gap-2 text-brand-500">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="text-xs">Uploading…</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-brand-500 transition-colors">
                                        <Upload size={24} />
                                        <span className="text-xs font-medium">Click to upload image</span>
                                        <span className="text-xs text-slate-300">PNG, JPG, GIF (max 2MB)</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Preview + caption */}
                        {imageUrl && (
                            <div className="mt-3 space-y-2">
                                <div className="h-44 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group">
                                    <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => { setImageUrl(''); if (imageUploadRef.current) imageUploadRef.current.value = ''; }}
                                        className="absolute top-2 right-2 bg-white p-1.5 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-red-50"
                                        title="Remove image"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Image caption (optional)"
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none text-sm transition"
                                    value={imageCaption}
                                    onChange={e => setImageCaption(e.target.value)}
                                />
                            </div>
                        )}
                    </Card>

                    {/* Body */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                            <FileText size={15} className="text-brand-400" /> Body Content
                            <span className="ml-auto text-xs text-slate-400 font-normal">Markdown supported</span>
                        </label>
                        <MarkdownEditor value={body} onChange={setBody} />
                    </Card>

                    {/* Meta row */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-5">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                <Tag size={15} className="text-brand-400" /> Tags
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none text-sm transition"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                placeholder="threat, malware, india (comma separated)"
                            />
                        </Card>
                        <Card className="p-5">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-400 outline-none text-sm transition"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                placeholder="e.g. Intelligence, Malware, APT"
                            />
                        </Card>
                    </div>

                    {/* PDF Source link */}
                    {pdfUrl && (
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <FileText size={12} />
                            PDF stored at: <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-brand-500 underline truncate">{pdfUrl}</a>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={() => handleSave('draft')} disabled={saving || !title.trim()}>
                            {saving ? <><Loader2 size={14} className="animate-spin mr-1" /> Saving…</> : 'Save as Draft'}
                        </Button>
                        <Button onClick={() => handleSave('pending_approval')} disabled={saving || !title.trim()}>
                            {saving ? <><Loader2 size={14} className="animate-spin mr-1" /> Submitting…</> : 'Submit for Approval →'}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Stage: Done ── */}
            {stage === 'done' && (
                <Card className="p-16 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle size={40} className="text-emerald-500" />
                    </div>
                    <p className="text-xl font-bold text-slate-800">Article Saved!</p>
                    <p className="text-sm text-slate-400">Redirecting to news list…</p>
                </Card>
            )}
        </div>
    );
};
