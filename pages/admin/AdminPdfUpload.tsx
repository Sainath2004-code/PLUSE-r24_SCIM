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
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            addToast('Please upload a PDF file.', 'error');
            return;
        }
        const maxBytes = 15 * 1024 * 1024;
        if (file.size > maxBytes) {
            addToast('PDF is too large (max 15MB).', 'error');
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
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-slide-up">
                <div className="flex items-center gap-5">
                    <Link to="/admin/dashboard" className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-maroon-500 transition-all shadow-sm">
                        <ChevronLeft size={20} className="stroke-[3px]" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                            Intelligence Generator
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-maroon-500 animate-pulse"></div>
                             <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">PDF Archive Digitalization Pipeline</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                        Protocol: Pulse-X1
                    </div>
                </div>
            </header>

            {/* ── Stage: Upload ── */}
            {stage === 'upload' && (
                <div className="animate-scale-in">
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
                        <div className="flex flex-col items-center gap-8 text-center pointer-events-none p-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-maroon-600/20 rounded-3xl blur-2xl group-hover:bg-maroon-600/40 transition-all duration-500"></div>
                                <div className="relative w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-2xl transition-transform group-hover:scale-110 duration-500">
                                    <FileUp size={42} className="text-maroon-600 stroke-[2.5px]" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Transmit Intelligence Source</h3>
                                <p className="text-[11px] text-gray-400 mt-3 font-bold uppercase tracking-[0.3em] leading-relaxed">Drag & Drop Encrypted PDF or <span className="text-maroon-500 underline decoration-2 underline-offset-4">Securely Browse Archvies</span></p>
                            </div>
                            <div className="grid grid-cols-3 gap-8 w-full max-w-lg mt-4 border-t border-slate-200 dark:border-white/5 pt-10">
                                {[
                                    { icon: FileText, label: 'Standard PDF' },
                                    { icon: Sparkles, label: 'AI Extraction' },
                                    { icon: CheckCircle, label: 'Verification' }
                                ].map((step, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3">
                                        <div className="p-2.5 bg-slate-100 dark:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10">
                                            <step.icon size={16} className="text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DropZone>
                </div>
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
                <div className="space-y-8 animate-slide-up">
                    <Card variant="glass" className="p-8 border-l-[6px] border-l-maroon-600">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-maroon-600/10 rounded-2xl border border-maroon-500/20">
                                    <FileText size={28} className="text-maroon-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Extracted Intelligence</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Source Asset: {pdfFile?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5"
                            >
                                <X size={14} className="inline mr-2" /> Re-Transmit
                            </button>
                        </div>
                    </Card>

                    <div className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-relaxed">
                        <AlertTriangle size={20} className="shrink-0 text-amber-500" />
                        <span>AI Warning: Extraction complete. Manual verification of intelligence accuracy is mandated before final dissemination.</span>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-8 space-y-8">
                        {/* Title */}
                            <Card variant="glass" className="p-6">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4"> Headline Indicator </label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xl font-black border border-slate-300 dark:border-slate-600 rounded-xl p-4 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none transition placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </Card>

                            {/* Body */}
                            <Card variant="glass" className="p-6">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4"> Intelligence Body Content </label>
                                <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                    <MarkdownEditor value={body} onChange={setBody} />
                                </div>
                            </Card>
                        </div>

                        <div className="col-span-12 lg:col-span-4 space-y-8">
                            {/* Summary */}
                            <Card variant="glass" className="p-6">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4"> Executive Summary </label>
                                <textarea
                                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-xl p-4 text-sm font-semibold focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none resize-none leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    rows={6}
                                    value={excerpt}
                                    onChange={e => setExcerpt(e.target.value)}
                                    placeholder="Brief executive summary..."
                                />
                            </Card>

                            {/* Tags */}
                            <Card variant="glass" className="p-6">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4"> Classification </label>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-xl p-3.5 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        value={tags}
                                        onChange={e => setTags(e.target.value)}
                                        placeholder="Tags: malware, apt, india..."
                                    />
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-xl p-3.5 focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        placeholder="Category..."
                                    />
                                </div>
                            </Card>

                             {/* Cover Asset */}
                            <Card variant="glass" className="p-6">
                                 <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300 mb-4"> Visual Evidence </label>
                                 {imageUrl ? (
                                     <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-xl">
                                         <img src={imageUrl} alt="" className="w-full grayscale group-hover:grayscale-0 transition-all duration-700" />
                                         <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 backdrop-blur-sm">
                                             <p className="text-[9px] font-black text-white uppercase tracking-widest truncate">{imageCaption}</p>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-8 text-center">
                                         <Image size={24} className="mx-auto text-slate-400 dark:text-slate-500 mb-3" />
                                         <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">No Visual Evidence</p>
                                     </div>
                                 )}
                            </Card>
                        </div>
                    </div>

                    {/* Final Actions */}
                    <div className="flex items-center justify-end gap-4 pt-10 border-t border-slate-100 dark:border-white/5">
                        <button
                            onClick={() => handleSave('draft')}
                            disabled={saving || !title.trim()}
                            className="px-8 py-4 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                        >
                            {saving ? 'Transmitting…' : 'Save Protocol'}
                        </button>
                        <button
                            onClick={() => handleSave('published')}
                            disabled={saving || !title.trim()}
                            className="px-10 py-4 bg-maroon-600 hover:bg-maroon-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-maroon-900/30 flex items-center gap-3"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Disseminate Intelligence</>}
                        </button>
                    </div>
                </div>
        )}

            {/* Stage: Done */}
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




