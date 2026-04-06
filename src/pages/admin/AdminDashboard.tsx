import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { storageService } from '../../services/storageService';
import { osintService } from '../../services/osintService';
import { NewsItem } from '../../types';
import { FileUp, Eye, TrendingUp, FileText, Clock, CheckCircle, RefreshCcw, Zap } from 'lucide-react';
import { SkeletonStatCard } from '../../components/ui/SkeletonCard';

const STATUS_LABELS: Record<string, string> = {
    published: 'Published',
    draft: 'Draft',
    pending_approval: 'Pending',
    rejected: 'Rejected',
};

function StatCard({ label, value, color, icon: Icon, loading }: {
    label: string; value: number; color: string; icon: React.ElementType; loading: boolean;
}) {
    if (loading) return <SkeletonStatCard />;
    return (
        <div className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-[3px] border-t border-r border-b border-slate-200 dark:border-slate-700 ${color} shadow-md hover:shadow-lg transition-shadow animate-scale-in`}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">{label}</p>
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <Icon size={14} className="text-slate-500 dark:text-slate-300" />
                </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
        </div>
    );
}

export const AdminDashboard: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const data = await storageService.getNewsItems();
        setItems(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSyncOsint = async () => {
        setIsSyncing(true);
        try {
            const liveNews = await osintService.fetchLiveNationalNews();
            const result = await storageService.syncOsint(liveNews);
            alert(`Strategic Intelligence Scan Complete.\nInfiltrated ${result.added} new intelligence nodes.`);
            await loadData();
        } catch (e) {
            console.error('Sync failed:', e);
            alert('Strategic Intelligence Scan Failed. Check orbital sensors.');
        } finally {
            setIsSyncing(false);
        }
    };

    const stats = {
        total: items.length,
        published: items.filter(i => i.status === 'published').length,
        draft: items.filter(i => i.status === 'draft').length,
        pending: items.filter(i => i.status === 'pending_approval').length,
        pdfImports: items.filter(i => i.meta?.source === 'pdf_upload').length,
    };

    const chartData = [
        { name: 'Published', value: stats.published, fill: '#8b0000' },
        { name: 'Draft', value: stats.draft, fill: '#1e293b' },
        { name: 'Pending', value: stats.pending, fill: '#475569' },
        { name: 'PDF Import', value: stats.pdfImports, fill: '#c51e1e' },
    ];

    const topArticle = items
        .filter(i => i.status === 'published')
        .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())[0];

    const recent = [...items]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

    return (
        <div className="space-y-8 max-w-7xl animate-slide-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-5">
                    <div className="h-10 w-1.5 bg-maroon-600 rounded-full shadow-lg shadow-maroon-900/40"></div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Strategic Intelligence</h1>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Global Dashboard Node</p>
                    </div>
                </div>

                <button 
                    onClick={handleSyncOsint}
                    disabled={isSyncing}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-premium border border-white/10 ${
                        isSyncing 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-intel-900 hover:bg-intel-800 text-white hover:scale-105 active:scale-95'
                    }`}
                >
                    <RefreshCcw size={16} className={`${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Scanning Orbital Nodes...' : 'Fetch Strategic Intel'}
                    {!isSyncing && <Zap size={14} className="text-maroon-500 fill-maroon-500" />}
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                <StatCard label="Total Intelligence" value={stats.total} color="border-l-maroon-600" icon={FileText} loading={loading} />
                <StatCard label="Disseminated" value={stats.published} color="border-l-emerald-500" icon={CheckCircle} loading={loading} />
                <StatCard label="Draft Protocol" value={stats.draft} color="border-l-slate-400" icon={Clock} loading={loading} />
                <StatCard 
                    label="Verification" 
                    value={stats.pending} 
                    color={stats.pending > 0 ? "border-l-maroon-600 bg-maroon-50/50 dark:bg-maroon-900/10" : "border-l-amber-500"} 
                    icon={Eye} 
                    loading={loading} 
                />
                <StatCard label="Digital Extractions" value={stats.pdfImports} color="border-l-maroon-400" icon={FileUp} loading={loading} />
            </div>

            {/* Charts + Top article */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass dark:glass-dark rounded-2xl p-8 shadow-premium">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-8 flex items-center gap-3">
                        <TrendingUp size={16} className="text-maroon-500" /> Operational Distribution
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b', textAnchor: 'middle' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#64748b' }} />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', fontSize: 10, fontWeight: 800, color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass dark:glass-dark rounded-2xl p-6 shadow-premium flex flex-col border border-maroon-500/10">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5 flex items-center gap-3">
                        <TrendingUp size={16} className="text-emerald-500" /> High Impact Bulletin
                    </h3>
                    {topArticle ? (
                        <div className="flex-1 flex flex-col gap-4">
                            {(() => {
                                const img = topArticle.blocks.find(b => b.type === 'image')?.value;
                                return img?.src ? (
                                    <div className="relative group">
                                        <img src={img.src} alt="" className="w-full h-32 object-cover rounded-xl shadow-inner border border-white/5" />
                                        <div className="absolute inset-0 bg-maroon-900/20 group-hover:bg-transparent transition-all duration-300 rounded-xl" />
                                    </div>
                                ) : (
                                    <div className="w-full h-32 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center border border-dashed border-slate-300 dark:border-white/10">
                                        <FileText size={32} className="text-slate-300 dark:text-slate-700" />
                                    </div>
                                );
                            })()}
                            <p className="font-black text-slate-900 dark:text-white text-base tracking-tighter line-clamp-2 leading-tight">
                                {topArticle.blocks.find(b => b.type === 'title')?.value || 'Untitled'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {topArticle.publishedAt ? new Date(topArticle.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </p>
                            <Link to={`/admin/edit/${topArticle.id}`} className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-3 bg-maroon-600 hover:bg-maroon-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-maroon-900/30">
                                Initiate Protocol →
                            </Link>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest italic opacity-50">No Active Records</div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass dark:glass-dark rounded-2xl shadow-premium overflow-hidden">
                <div className="px-8 py-5 border-b border-white/10 dark:border-white/5 flex items-center justify-between bg-white/5">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Stream Activity Log</h3>
                    <Link to="/admin/list" className="text-[10px] font-black uppercase tracking-[0.15em] text-maroon-500 hover:text-maroon-400 transition-colors">Audit All Archive →</Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-5 px-8 py-4 animate-pulse">
                                <div className="w-12 h-10 bg-slate-200 dark:bg-white/5 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-lg w-1/2" />
                                    <div className="h-3 bg-slate-200 dark:bg-white/5 rounded-lg w-1/4" />
                                </div>
                                <div className="h-6 w-20 bg-slate-200 dark:bg-white/5 rounded-full" />
                            </div>
                        ))
                    ) : recent.map(item => {
                        const title = item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
                        const img = item.blocks.find(b => b.type === 'image')?.value;
                        const status = item.status;
                        const badgeColor =
                            status === 'published' ? 'bg-maroon-500/10 text-maroon-400 border-maroon-500/20' :
                                status === 'pending_approval' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-slate-500/10 text-slate-400 border-white/5';
                        return (
                            <Link key={item.id} to={`/admin/edit/${item.id}`} className="flex items-center gap-5 px-8 py-4 hover:bg-white/5 transition-all duration-300 group">
                                {img?.src ? (
                                    <img src={img.src} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0 shadow-md grayscale group-hover:grayscale-0 transition-all border border-white/5" />
                                ) : (
                                    <div className="w-12 h-10 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0 border border-white/5"><FileText size={16} className="text-slate-400" /></div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-black text-slate-800 dark:text-slate-100 truncate tracking-tight">{title}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.author} <span className="mx-2 text-slate-700">|</span> {new Date(item.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border shrink-0 ${badgeColor}`}>{STATUS_LABELS[status] ?? status}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
