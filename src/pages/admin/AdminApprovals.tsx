import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Eye, XCircle } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Admin, NewsItem, NewsStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const AdminApprovals: React.FC = () => {
    const [pending, setPending] = useState<NewsItem[]>([]);
    const [currentUser, setCurrentUser] = useState<Admin | null>(null);
    const { addToast } = useToast();

    const fetchPending = async () => {
        const user = await storageService.getAuth();
        setCurrentUser(user);
        const items = await storageService.getNewsItems();
        setPending(items.filter(i => i.status === 'pending_approval'));
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (item: NewsItem, newStatus: NewsStatus) => {
        const approved = newStatus === 'published';
        const updated = {
            ...item,
            status: newStatus,
            publishedAt: approved ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
            rejectionReason: approved ? null : 'Rejected by admin',
            approvedBy: approved ? 'Admin' : null
        };

        await storageService.saveNewsItem(updated);
        fetchPending();
        addToast(approved ? 'Intelligence Disseminated' : 'Record Expunged', approved ? 'success' : 'info');
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="h-px w-8 bg-maroon-600"></div>
                <div>
                    <h1 className="text-2xl font-black text-intel-900 dark:text-white uppercase tracking-tight font-clarendon">Verification Queue</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{pending.length} Intelligence Briefs Awaiting Dissemination</p>
                </div>
            </div>

            {pending.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                    <div className="max-w-xs mx-auto">
                        <CheckCircle size={40} className="text-emerald-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-intel-900 dark:text-white">Protocol Clear</h3>
                        <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-wider">All intelligence streams have been processed.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {pending.map(item => {
                        const isOwnArticle = item.author === currentUser?.email || item.author === currentUser?.name;
                        const canApprove = currentUser?.role === 'admin' || !isOwnArticle;

                        const title = item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
                        const category = item.blocks.find(b => b.type === 'category')?.value || 'General';
                        const image = item.blocks.find(b => b.type === 'image')?.value;

                        return (
                            <Card key={item.id} className="p-6 flex items-center justify-between gap-6 border-t-2 border-t-intel-900 shadow-lg hover:shadow-xl transition-all">
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    {image?.src && (
                                        <div className="w-20 h-20 rounded bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                            <img src={image.src} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="px-1.5 py-0.5 bg-intel-50 text-intel-900 border border-intel-100 rounded text-[9px] font-black uppercase tracking-widest">
                                                {category}
                                            </span>
                                            <span className="text-[9px] text-gray-300 font-mono tracking-tighter">ID: {item.id.slice(0, 8)}…</span>
                                        </div>
                                        <h3 className="text-base font-black text-intel-900 dark:text-white font-clarendon line-clamp-1">{title}</h3>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Reported by {item.author || 'Pulse-R24 System'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Link to={`/admin/edit/${item.id}`}>
                                        <Button
                                            variant="secondary"
                                            className="!text-slate-600 !border-slate-100 hover:!bg-slate-50 !text-[10px] !font-black !px-4"
                                        >
                                            Edit Protocol
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleAction(item, 'rejected')}
                                        disabled={!canApprove && currentUser?.role !== 'admin'}
                                        className="!text-red-600 !border-red-100 hover:!bg-red-50 !text-[10px] !font-black !px-4"
                                    >
                                        Expunge
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(item, 'published')}
                                        disabled={!canApprove}
                                        className="!bg-maroon-600 hover:!bg-maroon-500 !text-[10px] !font-black !px-6"
                                    >
                                        Approve & Disseminate
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
