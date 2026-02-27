import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Edit3, Trash2, Search, Eye, ChevronUp, ChevronDown,
    FileText, CheckSquare, Square, AlertCircle
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem } from '../../types';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { SkeletonRow } from '../../components/ui/SkeletonCard';
import { useToast } from '../../context/ToastContext';

type SortField = 'title' | 'status' | 'author' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_STYLES: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const STATUS_LABELS: Record<string, string> = {
    published: 'Published',
    draft: 'Draft',
    pending_approval: 'Pending',
    rejected: 'Rejected',
};

export const AdminList: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        const all = await storageService.getNewsItems();
        setItems(all);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        let list = [...items];
        // Search
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(i => {
                const title = i.blocks.find(b => b.type === 'title')?.value?.toString().toLowerCase() ?? '';
                const author = i.author?.toLowerCase() ?? '';
                return title.includes(q) || author.includes(q);
            });
        }
        // Status filter
        if (statusFilter !== 'all') {
            list = list.filter(i => i.status === statusFilter);
        }
        // Sort
        list.sort((a, b) => {
            let va = '', vb = '';
            if (sortField === 'title') {
                va = a.blocks.find(bl => bl.type === 'title')?.value?.toString() ?? '';
                vb = b.blocks.find(bl => bl.type === 'title')?.value?.toString() ?? '';
            } else if (sortField === 'createdAt') {
                va = a.createdAt; vb = b.createdAt;
            } else {
                va = (a as any)[sortField] ?? '';
                vb = (b as any)[sortField] ?? '';
            }
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });
        return list;
    }, [items, query, statusFilter, sortField, sortDir]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronDown size={13} className="text-slate-300" />;
        return sortDir === 'asc' ? <ChevronUp size={13} className="text-brand-500" /> : <ChevronDown size={13} className="text-brand-500" />;
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(i => i.id)));
    };

    const handleDelete = async (id: string) => {
        try {
            await storageService.deleteNewsItem(id);
            setItems(prev => prev.filter(i => i.id !== id));
            setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
            addToast('Article deleted', 'info');
        } catch (err: any) {
            addToast(`Delete failed: ${err?.message ?? 'Unknown error'}`, 'error');
        }
        setDeleteTarget(null);
    };

    const handleBulkDelete = async () => {
        const ids = [...selected];
        let failed = 0;
        for (const id of ids) {
            try { await storageService.deleteNewsItem(id); }
            catch { failed++; }
        }
        await load();
        setSelected(new Set());
        setBulkDeleteOpen(false);
        addToast(failed > 0 ? `Deleted ${ids.length - failed}, ${failed} failed` : `${ids.length} articles deleted`, failed > 0 ? 'error' : 'info');
    };

    return (
        <div className="space-y-4 max-w-7xl">
            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Article"
                message="This action cannot be undone. The article will be permanently removed."
                confirmLabel="Delete"
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
                onCancel={() => setDeleteTarget(null)}
            />
            <ConfirmModal
                isOpen={bulkDeleteOpen}
                title={`Delete ${selected.size} Articles`}
                message={`You are about to permanently delete ${selected.size} articles. This cannot be undone.`}
                confirmLabel={`Delete ${selected.size}`}
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteOpen(false)}
            />

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">All Articles</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} total articles</p>
                </div>
                <Link
                    to="/admin/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    <Plus size={16} /> Add Article
                </Link>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        className="pl-8 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-400 outline-none w-52 transition"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                            ✕
                        </button>
                    )}
                </div>

                {/* Status filter */}
                <select
                    className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-400 outline-none"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending</option>
                    <option value="rejected">Rejected</option>
                </select>

                {/* Results count */}
                <p className="text-xs text-slate-400 ml-1">
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>

                {/* Bulk actions */}
                {selected.size > 0 && (
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{selected.size} selected</span>
                        <button
                            onClick={() => setBulkDeleteOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors"
                        >
                            <Trash2 size={13} /> Delete Selected
                        </button>
                        <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2">
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <button onClick={toggleAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    {selected.size === filtered.length && filtered.length > 0
                                        ? <CheckSquare size={16} className="text-brand-500" />
                                        : <Square size={16} />}
                                </button>
                            </th>
                            <th className="px-3 py-3 w-14 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Img</th>
                            <th className="px-3 py-3">
                                <button onClick={() => toggleSort('title')} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                    Title <SortIcon field="title" />
                                </button>
                            </th>
                            <th className="px-3 py-3">
                                <button onClick={() => toggleSort('status')} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                    Status <SortIcon field="status" />
                                </button>
                            </th>
                            <th className="px-3 py-3">
                                <button onClick={() => toggleSort('author')} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                    Author <SortIcon field="author" />
                                </button>
                            </th>
                            <th className="px-3 py-3">
                                <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                    Date <SortIcon field="createdAt" />
                                </button>
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <AlertCircle size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No articles found</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search or filter</p>
                                </td>
                            </tr>
                        ) : filtered.map(item => {
                            const title = item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
                            const img = item.blocks.find(b => b.type === 'image')?.value;
                            const isSelected = selected.has(item.id);
                            return (
                                <tr
                                    key={item.id}
                                    className={`transition-colors ${isSelected ? 'bg-brand-50 dark:bg-brand-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                                >
                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleSelect(item.id)} className="text-slate-400 hover:text-brand-500 transition-colors">
                                            {isSelected ? <CheckSquare size={16} className="text-brand-500" /> : <Square size={16} />}
                                        </button>
                                    </td>
                                    <td className="px-3 py-3">
                                        {img?.src ? (
                                            <img src={img.src} alt="" className="w-12 h-9 object-cover rounded" />
                                        ) : (
                                            <div className="w-12 h-9 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                                                <FileText size={12} className="text-slate-400" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs">{title}</p>
                                        {item.meta?.source === 'pdf_upload' && (
                                            <span className="text-[10px] text-violet-500 font-mono">PDF import</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
                                            {STATUS_LABELS[item.status] ?? item.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">{item.author}</td>
                                    <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={`#/news/${item.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                                title="Preview"
                                            >
                                                <Eye size={15} />
                                            </a>
                                            <button
                                                onClick={() => navigate(`/admin/edit/${item.id}`)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit3 size={15} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(item.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
