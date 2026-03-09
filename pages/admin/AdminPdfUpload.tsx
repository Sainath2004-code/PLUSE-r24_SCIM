import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, FileUp, FileText, X, Loader2, Image,
    Sparkles, CheckCircle, AlertTriangle, Tag, AlignLeft, Type, Upload, Trash2
} from 'lucide-react';
import { extractTextFromPdf, parsePdfToNewsFieldsFromFile } from '../../services/pdfService';
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
            ? 'border-maroon-400 bg-maroon-50 scale-[1.01]'
            : 'border-gray-200 hover:border-maroon-300 hover:bg-gray-50 bg-white dark:bg-slate-800'
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
    const [publishedId, setPublishedId] = useState<string | null>(null);

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
            setExtractProgress('📄 Reading PDF layout and detecting columns…');
            await new Promise(r => setTimeout(r, 80));

            setExtractProgress('🔍 Analysing headings, sections, and body text…');
            const fields = await parsePdfToNewsFieldsFromFile(file);

            setExtractProgress('✂️ Separating title, summary, and body content…');
            await new Promise(r => setTimeout(r, 200));

            setTitle(fields.title);
            setExcerpt(fields.excerpt);
            setBody(fields.body);
            setTags(fields.tags.join(', '));
            setCategory(fields.category);

            // ── Auto cover image: upload rendered page-1 JPEG
            if (fields.coverImageBlob) {
                setExtractProgress('🖼️ Uploading cover image (rendered from PDF page 1)…');
                const imageFile = new File(
                    [fields.coverImageBlob],
                    `pdf-cover-${Date.now()}.jpg`,
                    { type: 'image/jpeg' }
                );
                const uploadedUrl = await storageService.uploadImage(imageFile);
                if (uploadedUrl) {
                    setImageUrl(uploadedUrl);
                    setImageCaption('Cover image extracted from PDF');
                    addToast('📸 Cover image auto-extracted from PDF!', 'success');
                } else {
                    // Supabase bucket missing — use local blob URL as preview fallback
                    const blobUrl = URL.createObjectURL(fields.coverImageBlob);
                    setImageUrl(blobUrl);
                    setImageCaption('PDF page 1 preview');
                }
            }

            // Upload PDF itself for reference link
            setExtractProgress('☁️ Uploading PDF to storage…');
            const pdfUploadUrl = await storageService.uploadPdf(file);
            if (pdfUploadUrl) setPdfUrl(pdfUploadUrl);

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
                publishedAt: status === 'published' ? new Date().toISOString() : undefined,
                status,
                meta: {
                    source: 'pdf_upload',
                    pdfName: pdfFile?.name,
                    pdfUrl: pdfUrl ?? undefined,
                }
            };

            await storageService.saveNewsItem(newsItem);
            setStage('done');
            if (status === 'published') setPublishedId(newsItem.id);
            addToast(
                status === 'published'
                    ? '🎉 Article published! Now live on the bulletin.'
                    : status === 'pending_approval'
                        ? 'Article submitted for approval!'
                        : 'Article saved as draft!',
                'success'
            );
            if (status !== 'published') setTimeout(() => navigate('/admin/list'), 1200);
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
                <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-intel-900 dark:text-white flex items-center gap-3 uppercase tracking-tight font-clarendon">
                        <FileUp size={24} className="text-maroon-600" />
                        Intelligence Generator
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Convert PDF Intelligence Bulletins into Digital Records</p>
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
                    <div className="flex flex-col items-center gap-5 text-center pointer-events-none">
                        <div className="w-20 h-20 rounded-2xl bg-intel-50 flex items-center justify-center border border-intel-100">
                            <FileUp size={36} className="text-maroon-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-intel-900">Transmit Intelligence File</p>
                            <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-widest">Drag & Drop PDF or <span className="text-maroon-600 font-bold decoration-dotted underline">Securely Browse</span></p>
                        </div>
                        <div className="flex items-center gap-6 mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><FileText size={14} /> PDF Protocol</span>
                            <span className="flex items-center gap-1.5"><Sparkles size={14} /> Auto-Extraction</span>
                            <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Verification</span>
                        </div>
                    </div>
                </DropZone>
            )}

            {/* ── Stage: Extracting ── */}
            {stage === 'extracting' && (
                <Card className="p-16 flex flex-col items-center gap-6 border-t-2 border-t-intel-900 shadow-xl">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-2xl bg-intel-50 flex items-center justify-center border border-intel-100">
                            <FileText size={40} className="text-maroon-600" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border border-intel-100 flex items-center justify-center shadow-lg">
                            <Loader2 size={18} className="text-maroon-600 animate-spin" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-intel-900">Processing Stream: <span className="text-maroon-600">{pdfFile?.name}</span></p>
                        <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-widest animate-pulse">{extractProgress}</p>
                    </div>
                    <div className="w-64 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-intel-900 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '70%' }} />
                    </div>
                </Card>
            )}

            {/* ── Stage: Review / Edit ── */}
            {stage === 'review' && (
                <div className="space-y-5">
                    {/* Source file badge */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] bg-maroon-50 text-maroon-700 border border-maroon-100 px-3 py-1.5 rounded font-black uppercase tracking-widest">
                            <Sparkles size={14} />
                            Verified Extraction: <span className="text-intel-900">{pdfFile?.name}</span>
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
                    <Card className="p-6 border-t-2 border-t-maroon-600 shadow-lg">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-intel-900 mb-3">
                            <Type size={14} className="text-maroon-600" /> Intelligence Headline
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 text-intel-900 dark:text-white text-xl font-bold border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-maroon-600 outline-none transition font-clarendon"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Primary intelligence indicator…"
                        />
                    </Card>

                    {/* Excerpt */}
                    <Card className="p-6">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-intel-900 mb-3">
                            <AlignLeft size={14} className="text-maroon-600" /> Executive Summary
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 text-intel-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-maroon-600 outline-none resize-none transition text-sm leading-relaxed"
                            value={excerpt}
                            onChange={e => setExcerpt(e.target.value)}
                            placeholder="High-level briefing snapshot…"
                        />
                    </Card>

                    {/* Cover Image */}
                    <Card className="p-5">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-intel-900 mb-3">
                            <Image size={14} className="text-maroon-600" /> Visual Intelligence
                            <span className="ml-auto text-[9px] text-gray-400 font-mono tracking-normal uppercase">Reference Only</span>
                        </label>

                        {/* Mode toggle */}
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setImageMode('url')}
                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded transition-all ${imageMode === 'url'
                                    ? 'bg-maroon-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                Source URL
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageMode('upload')}
                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded transition-all ${imageMode === 'upload'
                                    ? 'bg-maroon-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                Media Upload
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
                                className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors relative cursor-pointer group"
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
                                    <div className="flex flex-col items-center gap-2 text-maroon-600">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Uploading…</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-maroon-600 transition-colors">
                                        <Upload size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initiate Secure Upload</span>
                                        <span className="text-[9px] font-mono text-gray-300 tracking-normal lowercase">Encrypted transfer (max 2MB)</span>
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
                    <Card className="p-6">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-intel-900 mb-3">
                            <FileText size={14} className="text-maroon-600" /> Detailed Report (MARC)
                        </label>
                        <MarkdownEditor value={body} onChange={setBody} />
                    </Card>

                    {/* Meta row */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-6">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-intel-900 mb-3">
                                <Tag size={14} className="text-maroon-600" /> Strategic Indicators
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold focus:ring-1 focus:ring-maroon-600 outline-none transition"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                placeholder="threat, malware, india…"
                            />
                        </Card>
                        <Card className="p-6">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-intel-900 mb-3">
                                Category
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold focus:ring-1 focus:ring-maroon-600 outline-none transition"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                placeholder="e.g. Intelligence, Malware…"
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
                    <div className="flex flex-wrap gap-3 pt-4">
                        <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saving || !title.trim()} className="!text-[10px] !font-black !px-6">
                            {saving ? 'Saving…' : 'Save Protocol'}
                        </Button>
                        <Button onClick={() => handleSave('pending_approval')} disabled={saving || !title.trim()} className="!bg-intel-900 !text-[10px] !font-black !px-6">
                            {saving ? 'Submitting…' : 'Submit for Verification'}
                        </Button>
                        <Button
                            onClick={() => handleSave('published')}
                            disabled={saving || !title.trim()}
                            className="!bg-maroon-600 hover:!bg-maroon-500 !text-[10px] !font-black !px-8 shadow-lg shadow-maroon-900/20"
                        >
                            {saving
                                ? 'Disseminating…'
                                : <><CheckCircle size={14} className="mr-2" /> Disseminate Intelligence</>}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Stage: Done ── */}
            {stage === 'done' && (
                <Card className="p-16 flex flex-col items-center gap-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle size={40} className="text-emerald-500" />
                    </div>
                    <p className="text-xl font-bold text-slate-800">
                        {publishedId ? '🎉 Article is Live!' : 'Article Saved!'}
                    </p>
                    {publishedId ? (
                        <>
                            <p className="text-sm text-slate-500">Your bulletin is now visible on the public intelligence feed.</p>
                            <div className="flex gap-3 mt-2">
                                <a
                                    href={`/#/news/${publishedId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-intel-800 text-white text-sm font-semibold rounded-lg hover:bg-intel-700 transition-colors"
                                >
                                    View Live Article →
                                </a>
                                <button
                                    onClick={() => navigate('/admin/list')}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Back to Articles
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-400">Redirecting to news list…</p>
                    )}
                </Card>
            )}
        </div>
    );
};
