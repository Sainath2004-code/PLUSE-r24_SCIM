import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

export const AdminList: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const load = async () => {
            const all = await storageService.getNewsItems();
            setItems(all);
        };
        load();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this article?')) {
            await storageService.deleteNewsItem(id);
            const remaining = await storageService.getNewsItems();
            setItems(remaining);
            addToast('Article deleted', 'info');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">News Articles</h1>
                <Link to="/admin/create"><Button><Plus size={18} /> Create New</Button></Link>
            </div>
            <Card className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Author</th>
                            <th className="px-6 py-4">Created</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-[200px]">
                                    {item.blocks.find(b => b.type === 'title')?.value || 'Untitled'}
                                </td>
                                <td className="px-6 py-4"><Badge status={item.status} /></td>
                                <td className="px-6 py-4 text-slate-500">{item.author}</td>
                                <td className="px-6 py-4 text-slate-500 text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <Button variant="ghost" className="p-2" onClick={() => navigate(`/admin/edit/${item.id}`)}><Edit3 size={16} /></Button>
                                    <Button variant="ghost" className="p-2 text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};
