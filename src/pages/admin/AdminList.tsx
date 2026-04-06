import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Edit3, Trash2, Search, Eye, ChevronUp, ChevronDown,
    FileText, CheckSquare, Square, AlertCircle, FileUp, Archive
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, NewsStatus, SeverityLevel } from '../../types';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { SkeletonRow } from '../../components/ui/SkeletonCard';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';

type SortField = 'title' | 'status' | 'author' | 'createdAt' | 'category';
type SortDir = 'asc' | 'desc';

const STATUS_STYLES: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    archived: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};
const STATUS_LABELS: Record<string, string> = {
    published: 'Published',
    draft: 'Draft',
    pending_approval: 'Pending',
    rejected: 'Rejected',
    archived: 'Archived',
};

const SEVERITY_CONFIG: Record<SeverityLevel, { cls: string; label: string }> = {
    critical: { cls: 'bg-red-600 text-white',           label: 'CRITICAL' },
    high:     { cls: 'bg-orange-500 text-white',         label: 'HIGH'     },
    medium:   { cls: 'bg-amber-400 text-slate-900',      label: 'MEDIUM'   },
    low:      { cls: 'bg-emerald-500 text-white',        label: 'LOW'      },
    info:     { cls: 'bg-blue-500 text-white',           label: 'INFO'     },
};

export const AdminList: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sourceTab, setSourceTab] = useState<'user' | 'osint'>('user');
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
        
        // Source Filter
        if (sourceTab === 'osint') {
            list = list.filter(i => i.meta?.source === 'osint_feed');
        } else {
            list = list.filter(i => i.meta?.source !== 'osint_feed');
        }

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
    }, [items, query, statusFilter, sortField, sortDir, sourceTab]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
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
        <div className="space-y-8 max-w-7xl animate-slide-up">
            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Expunge Protocol"
                message="This will permanently redact the intelligence asset from global archives."
                confirmLabel="Confirm Purge"
                onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
                onCancel={() => setDeleteTarget(null)}
            />
            <ConfirmModal
                isOpen={bulkDeleteOpen}
                title={`Purge ${selected.size} Assets`}
                message={`You are about to permanently delete ${selected.size} intelligence records. This action is terminal.`}
                confirmLabel={`Purge Selected`}
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteOpen(false)}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="h-10 w-1.5 bg-maroon-600 rounded-full shadow-lg shadow-maroon-900/40"></div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Information Archive</h1>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">{items.length} Intelligence Assets Logged</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/create"
                        className="inline-flex items-center gap-2.5 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] transition-all shadow-xl"
                    >
                        <Plus size={14} className="stroke-[3px]" /> New Intelligence
                    </Link>
                    <Link
                        to="/admin/pdf-upload"
                        className="inline-flex items-center gap-2.5 px-6 py-3 bg-maroon-600 hover:bg-maroon-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-maroon-900/30"
                    >
                        <FileUp size={14} className="stroke-[3px]" /> Pulse Extraction
                    </Link>
                </div>
            </div>

            {/* Source Tabs */}
            <div className="flex border-b border-slate-200 dark:border-white/10 mb-6 w-full gap-8 pl-2">
                <button 
                    onClick={() => { setSourceTab('user'); setSelected(new Set()); setQuery(''); }}
                    className={`pb-4 text-[13px] font-black uppercase tracking-widest transition-all ${sourceTab === 'user' ? 'text-maroon-600 border-b-2 border-maroon-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                    User Uploads
                </button>
                <button 
                    onClick={() => { setSourceTab('osint'); setSelected(new Set()); setQuery(''); }}
                    className={`pb-4 text-[13px] font-black uppercase tracking-widest transition-all ${sourceTab === 'osint' ? 'text-maroon-600 border-b-2 border-maroon-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                    OSINT Feed
                </button>
            </div>

            {/* Toolbar */}
            <Card variant="glass" className="p-3">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-maroon-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Query Archive by Title, ID, or Subject..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl py-3 pl-12 pr-4 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 transition-all"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-1 shrink-0 overflow-x-auto">
                            {[
                                { id: 'all', label: 'All Assets' },
                                { id: 'published', label: 'Disseminated' },
                                { id: 'pending_approval', label: 'Review' },
                                { id: 'draft', label: 'Drafts' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setStatusFilter(filter.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        statusFilter === filter.id
                                            ? 'bg-slate-900 dark:bg-maroon-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {selected.size > 0 && (
                            <button
                                onClick={() => setBulkDeleteOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-900/10"
                            >
                                <Trash2 size={14} /> Purge {selected.size}
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Table */}
            <div className="glass dark:glass-dark rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                <div className="overflow-x-auto premium-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-white/10">
                                <th className="px-5 py-4 w-10">
                                    <button onClick={toggleAll} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
                                        {selected.size === filtered.length && filtered.length > 0
                                            ? <CheckSquare size={18} className="text-maroon-500" />
                                            : <Square size={18} />}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.3em]">
                                    <button onClick={() => toggleSort('title')} className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors">
                                        Identity & Origin {sortField === 'title' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.3em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.3em]">
                                    <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors">
                                        Temporal Marker {sortField === 'createdAt' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                    </button>
                                </th>
                                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.3em]">Commands</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl p-12 max-w-md mx-auto">
                                            <Search size={32} className="text-slate-300 dark:text-slate-700" />
                                            <p className="text-slate-900 dark:text-white font-black text-lg tracking-tight uppercase">Null Records Returned</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => {
                                    const title = item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
                                    const img = item.blocks.find(b => b.type === 'image')?.value;
                                    const isSelected = selected.has(item.id);
                                    return (
                                        <tr key={item.id} className={`group hover:bg-white/5 transition-all duration-300 ${isSelected ? 'bg-maroon-500/5' : ''}`}>
                                            <td className="px-5 py-5">
                                                <button onClick={() => toggleSelect(item.id)} className="text-slate-500 hover:text-white transition-colors">
                                                    {isSelected ? <CheckSquare size={18} className="text-maroon-500" />
                                                                : <Square size={18} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-5">
                                                    {img?.src ? (
                                                        <img src={img.src} alt="" className="w-16 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500 border border-white/5 shadow-lg" />
                                                    ) : (
                                                        <div className="w-16 h-12 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
                                                            <FileText size={20} className="text-slate-300 dark:text-slate-700" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight group-hover:text-maroon-500 transition-colors truncate max-w-sm font-inter uppercase">{title}</p>
                                            {item.severity && SEVERITY_CONFIG[item.severity] && (
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${SEVERITY_CONFIG[item.severity].cls}`}>
                                                    {SEVERITY_CONFIG[item.severity].label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.author}</p>
                                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                            <p className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase">{item.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight">{new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                <p className="text-[10px] font-mono text-slate-400 mt-0.5 tracking-tighter">{new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <Link
                                                        to={`/admin/edit/${item.id}`}
                                                        className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl hover:text-maroon-500 hover:border-maroon-500/50 hover:shadow-lg transition-all shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={16} />
                                                    </Link>
                                                    {item.status !== 'archived' && (
                                                        <button
                                                            onClick={async () => {
                                                                await storageService.saveNewsItem({ ...item, status: 'archived', updatedAt: new Date().toISOString() });
                                                                addToast('Article archived', 'success');
                                                                load();
                                                            }}
                                                            className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all shadow-sm"
                                                            title="Archive"
                                                        >
                                                            <Archive size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setDeleteTarget(item.id)}
                                                        className="p-2.5 bg-white dark:bg-red-500/10 text-slate-600 dark:text-red-400 border border-slate-200 dark:border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: NewsStatus }> = ({ status }) => {
    const config: Record<string, { color: string; label: string }> = {
        published:        { color: 'bg-maroon-500/10 text-maroon-500 border-maroon-500/20',   label: 'Published'  },
        draft:            { color: 'bg-slate-500/10 text-slate-500 border-white/5',            label: 'Draft'      },
        pending_approval: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',       label: 'Pending'    },
        rejected:         { color: 'bg-red-500/10 text-red-500 border-red-500/20',             label: 'Rejected'   },
        archived:         { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',   label: 'Archived'   },
    };
    const { color, label } = config[status] || config.draft;
    return (
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border flex items-center gap-2 justify-center w-fit ${color}`}>
            <span className={`w-1 h-1 rounded-full bg-current`} />
            {label}
        </span>
    );
};


