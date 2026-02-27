import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { storageService } from '../../services/storageService';
import { NewsItem } from '../../types';
import { FileUp, Eye, TrendingUp, FileText, Clock, CheckCircle } from 'lucide-react';
import { SkeletonStatCard } from '../../components/ui/SkeletonCard';

const STATUS_COLORS: Record<string, string> = {
    published: '#10b981',
    draft: '#94a3b8',
    pending_approval: '#f59e0b',
    rejected: '#ef4444',
};

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
        <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 border-l-4 ${color}`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
                <Icon size={16} className="text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}

export const AdminDashboard: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        storageService.getNewsItems().then(data => {
            setItems(data);
            setLoading(false);
        });
    }, []);

    const stats = {
        total: items.length,
        published: items.filter(i => i.status === 'published').length,
        draft: items.filter(i => i.status === 'draft').length,
        pending: items.filter(i => i.status === 'pending_approval').length,
        pdfImports: items.filter(i => i.meta?.source === 'pdf_upload').length,
    };

    const chartData = [
        { name: 'Published', value: stats.published, fill: '#10b981' },
        { name: 'Draft', value: stats.draft, fill: '#94a3b8' },
        { name: 'Pending', value: stats.pending, fill: '#f59e0b' },
        { name: 'PDF Import', value: stats.pdfImports, fill: '#8b5cf6' },
    ];

    const topArticle = items
        .filter(i => i.status === 'published')
        .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())[0];

    const recent = [...items]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8);

    return (
        <div className="space-y-6 max-w-7xl">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Overview of your newsroom CMS</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Total" value={stats.total} color="border-l-brand-500" icon={FileText} loading={loading} />
                <StatCard label="Published" value={stats.published} color="border-l-emerald-500" icon={CheckCircle} loading={loading} />
                <StatCard label="Draft" value={stats.draft} color="border-l-slate-400" icon={Clock} loading={loading} />
                <StatCard label="Pending" value={stats.pending} color="border-l-amber-400" icon={Eye} loading={loading} />
                <StatCard label="PDF Imports" value={stats.pdfImports} color="border-l-violet-400" icon={FileUp} loading={loading} />
            </div>

            {/* Charts + Top article */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Bar chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <TrendingUp size={15} className="text-brand-400" /> Content Status Distribution
                    </h3>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top article */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <TrendingUp size={15} className="text-emerald-400" /> Latest Published
                    </h3>
                    {topArticle ? (
                        <div className="flex-1 flex flex-col gap-3">
                            {(() => {
                                const img = topArticle.blocks.find(b => b.type === 'image')?.value;
                                return img?.src ? (
                                    <img src={img.src} alt="" className="w-full h-28 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-full h-28 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                        <FileText size={24} className="text-slate-400" />
                                    </div>
                                );
                            })()}
                            <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">
                                {topArticle.blocks.find(b => b.type === 'title')?.value || 'Untitled'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {topArticle.publishedAt
                                    ? new Date(topArticle.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : ''}
                            </p>
                            <Link
                                to={`/admin/edit/${topArticle.id}`}
                                className="mt-auto text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                            >
                                View / Edit →
                            </Link>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                            No published articles yet
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Recent Activity</h3>
                    <Link to="/admin/list" className="text-xs text-brand-500 hover:text-brand-600 font-medium">View all →</Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                                <div className="w-10 h-8 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                                </div>
                                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            </div>
                        ))
                    ) : recent.map(item => {
                        const title = item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
                        const img = item.blocks.find(b => b.type === 'image')?.value;
                        const status = item.status;
                        const badgeColor =
                            status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                status === 'pending_approval' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                    status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
                        return (
                            <Link
                                key={item.id}
                                to={`/admin/edit/${item.id}`}
                                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                {img?.src ? (
                                    <img src={img.src} alt="" className="w-10 h-8 rounded object-cover shrink-0" />
                                ) : (
                                    <div className="w-10 h-8 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center shrink-0">
                                        <FileText size={12} className="text-slate-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{title}</p>
                                    <p className="text-xs text-slate-400">{item.author} · {new Date(item.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${badgeColor}`}>
                                    {STATUS_LABELS[status] ?? status}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
