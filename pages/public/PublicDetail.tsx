import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, LayoutTemplate } from '../../types';
import { BlockRenderer } from '../../components/BlockRenderer';

export const PublicDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<NewsItem | null>(null);
    const [template, setTemplate] = useState<LayoutTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;
            setLoading(true);
            const items = await storageService.getNewsItems();
            const found = items.find(i => i.id === id);
            if (found) {
                setItem(found);
                const templates = await storageService.getLayouts();
                const t = templates.find(temp => temp.templateId === found.templateId);
                setTemplate(t || null);
            }
            setLoading(false);
        };
        fetchItem();
    }, [id]);

    if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;
    if (!item) return <div className="p-12 text-center text-slate-500">Article not found</div>;

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-20">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
                    <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors">
                        <ChevronLeft size={20} /> Back to News
                    </Link>
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="grid grid-cols-12 gap-6">
                    {item.blocks.map((blockValue, index) => {
                        const definition = template?.blocks.find(b => b.id === blockValue.blockId) || {
                            id: blockValue.blockId,
                            type: blockValue.type as any,
                            grid: { colSpan: 12, colStart: 1 }
                        };

                        return (
                            <div
                                key={index}
                                className={`col-span-12 md:col-span-${definition.grid?.colSpan || 12}`}
                            >
                                <BlockRenderer block={definition} value={blockValue.value} />
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};
