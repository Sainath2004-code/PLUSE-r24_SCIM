import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { storageService } from '../../services/storageService';
import { NewsItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ total: 0, draft: 0, pending: 0, published: 0 });
    const [recent, setRecent] = useState<NewsItem[]>([]);

    useEffect(() => {
        const loadStats = async () => {
            const items = await storageService.getNewsItems();
            setStats({
                total: items.length,
                draft: items.filter(i => i.status === 'draft').length,
                pending: items.filter(i => i.status === 'pending_approval').length,
                published: items.filter(i => i.status === 'published').length
            });
            setRecent(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
        };
        loadStats();
    }, []);

    const data = [
        { name: 'Drafts', value: stats.draft },
        { name: 'Pending', value: stats.pending },
        { name: 'Published', value: stats.published },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
            <span>HELLO</span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-l-brand-500">
                    <p className="text-sm text-slate-500 font-medium uppercase">Total News</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </Card>
                <Card className="p-6 border-l-4 border-l-amber-500">
                    <p className="text-sm text-slate-500 font-medium uppercase">Pending Review</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.pending}</p>
                </Card>
                <Card className="p-6 border-l-4 border-l-emerald-500">
                    <p className="text-sm text-slate-500 font-medium uppercase">Published</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.published}</p>
                </Card>
                <Card className="p-6 border-l-4 border-l-slate-300">
                    <p className="text-sm text-slate-500 font-medium uppercase">Drafts</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.draft}</p>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-bold text-slate-800 mb-6">Content Status Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 pb-4">
                        <h3 className="font-bold text-slate-800">Recent Activity</h3>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Title</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recent.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 font-medium text-slate-900 truncate max-w-[200px]">
                                            {item.blocks.find(b => b.type === 'title')?.value || 'Untitled'}
                                        </td>
                                        <td className="px-6 py-3"><Badge status={item.status} /></td>
                                        <td className="px-6 py-3 text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
