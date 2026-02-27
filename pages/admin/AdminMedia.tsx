import React, { useState, useEffect, useCallback, useRef } from 'react';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { SkeletonMediaCard } from '../../components/ui/SkeletonCard';
import { Upload, Trash2, Copy, Search, Image as ImageIcon, FolderOpen } from 'lucide-react';

interface MediaFile {
    name: string;
    url: string;
    size?: number;
    createdAt?: string;
}

export const AdminMedia: React.FC = () => {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [query, setQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const { supabase } = await import('../../services/supabaseClient');
            const { data } = await supabase.storage.from('news-images').list('', { limit: 200 });
            if (data) {
                const withUrls: MediaFile[] = data
                    .filter(f => !f.name.startsWith('.'))
                    .map(f => {
                        const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(f.name);
                        return {
                            name: f.name,
                            url: urlData.publicUrl,
                            size: (f as any).metadata?.size,
                            createdAt: (f as any).created_at,
                        };
                    });
                setFiles(withUrls);
            }
        } catch (err) {
            addToast('Could not load media library', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const url = await storageService.uploadImage(file);
            if (url) {
                addToast('Image uploaded!', 'success');
                await loadFiles();
            } else {
                addToast('Upload failed. Check news-images bucket.', 'error');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (file: MediaFile) => {
        try {
            const { supabase } = await import('../../services/supabaseClient');
            const { error } = await supabase.storage.from('news-images').remove([file.name]);
            if (error) throw error;
            setFiles(prev => prev.filter(f => f.name !== file.name));
            addToast('Image deleted', 'info');
        } catch (err: any) {
            addToast(`Delete failed: ${err.message}`, 'error');
        }
        setDeleteTarget(null);
    };

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        addToast('URL copied to clipboard!', 'success');
    };

    const filtered = files.filter(f =>
        !query || f.name.toLowerCase().includes(query.toLowerCase())
    );

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        return bytes > 1024 * 1024
            ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
            : `${(bytes / 1024).toFixed(0)} KB`;
    };

    return (
        <div className="space-y-5 max-w-7xl">
            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Image"
                message={`"${deleteTarget?.name}" will be permanently deleted from storage.`}
                confirmLabel="Delete"
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FolderOpen size={20} className="text-brand-400" /> Media Library
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{files.length} files</p>
                </div>
                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        <Upload size={15} />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-60">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search files..."
                    className="pl-8 pr-4 py-2 text-sm w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-400 outline-none"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>

            {/* Drop zone */}
            <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-brand-400 hover:bg-brand-50/50 dark:hover:border-brand-500 dark:hover:bg-brand-900/10 transition-colors cursor-pointer"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f && f.type.startsWith('image/')) handleUpload(f);
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <ImageIcon size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-400 font-medium">Drop images here or click to upload</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">PNG, JPG, GIF, WebP</p>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <SkeletonMediaCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <ImageIcon size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {query ? 'No images match your search' : 'No images uploaded yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {filtered.map(file => (
                        <div
                            key={file.name}
                            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="relative h-32 bg-slate-100 dark:bg-slate-700">
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                                {/* Hover actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => copyUrl(file.url)}
                                        className="p-1.5 bg-white rounded-lg text-slate-700 hover:bg-brand-50 transition-colors"
                                        title="Copy URL"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(file)}
                                        className="p-1.5 bg-white rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2.5">
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={file.name}>{file.name}</p>
                                {file.size && (
                                    <p className="text-[10px] text-slate-400 mt-0.5">{formatSize(file.size)}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
