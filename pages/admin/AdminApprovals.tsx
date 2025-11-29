import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Eye, XCircle } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, NewsStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const AdminApprovals: React.FC = () => {
    const [pending, setPending] = useState<NewsItem[]>([]);
    const { addToast } = useToast();

    const fetchPending = async () => {
        const items = await storageService.getNewsItems();
        setPending(items.filter(i => i.status === 'pending_approval'));
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleDecision = async (id: string, approved: boolean) => {
        const items = await storageService.getNewsItems();
        const item = items.find(i => i.id === id);
        if (!item) return;

        const updated = {
            ...item,
            status: (approved ? 'published' : 'rejected') as NewsStatus,
            publishedAt: approved ? new Date().toISOString() : null,
            rejectionReason: approved ? null : 'Rejected by admin'
        };

        await storageService.saveNewsItem(updated);
        fetchPending();
        addToast(approved ? 'Article published' : 'Article rejected', approved ? 'success' : 'info');
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Pending Approvals</h1>
            {pending.length === 0 ? (
                <Card className="p-12 text-center text-slate-400 border-dashed">
                    <CheckCircle className="mx-auto mb-4 opacity-50" size={48} />
                    No items waiting for approval.
                </Card>
            ) : (
                <div className="space-y-4">
                    {pending.map(item => (
                        <Card key={item.id} className="p-6 flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Draft from {item.author}</span>
                                    <span className="text-xs text-slate-300">•</span>
                                    <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2">
                                    {item.blocks.find(b => b.type === 'title')?.value || 'Untitled'}
                                </h2>
                                <p className="text-slate-600 line-clamp-2">
                                    {item.blocks.find(b => b.type === 'excerpt')?.value || item.blocks.find(b => b.type === 'markdown')?.value || 'No content preview available.'}
                                </p>
                            </div>
                            <div className="flex gap-3 shrink-0">
                                <Link to={`/admin/edit/${item.id}`} target="_blank">
                                    <Button variant="secondary"><Eye size={16} /> Review</Button>
                                </Link>
                                <Button variant="danger" onClick={() => handleDecision(item.id, false)}><XCircle size={16} /> Reject</Button>
                                <Button onClick={() => handleDecision(item.id, true)} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle size={16} /> Approve</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
