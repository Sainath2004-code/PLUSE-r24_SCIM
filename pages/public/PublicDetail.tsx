import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, LayoutTemplate } from '../../types';
import { BlockRenderer } from '../../components/BlockRenderer';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

const CITIES = ['All', 'Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune'];

function getIssueNumber(): string {
    const base = 89;
    const baseDate = new Date('2026-02-27');
    const today = new Date();
    const diff = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return `ISSP_RRUPY/Issue No.${base + diff}/2026`;
}

export const PublicDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<NewsItem | null>(null);
    const [template, setTemplate] = useState<LayoutTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    const issueNumber = getIssueNumber();

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

    const getCity = (item: NewsItem) => item.tags?.find(t => CITIES.includes(t)) || '';
    const getTitle = (item: NewsItem) => item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
    const getDate = (item: NewsItem) => item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    if (loading) return (
        <div className="min-h-screen bg-white font-inter">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 pt-40 pb-20 animate-pulse">
                <div className="h-3 w-20 bg-gray-200 rounded mb-8"></div>
                <div className="h-10 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 w-1/2 bg-gray-200 rounded mb-10"></div>
                <div className="flex gap-4 mb-10 pb-6 border-b border-gray-100">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded ml-auto"></div>
                </div>
                <div className="space-y-4 mb-10">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                </div>
                <div className="h-64 w-full bg-gray-200 rounded"></div>
            </div>
        </div>
    );

    if (!item) return (
        <div className="min-h-screen bg-white flex items-center justify-center font-inter">
            <div className="text-center">
                <p className="text-gray-500 text-lg font-playfair">Intelligence brief not found.</p>
                <Link to="/" className="text-maroon-600 font-medium hover:underline mt-4 inline-block">← Return to Bulletin Feed</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-inter">
            <Navbar />

            {/* ─── ARTICLE HERO HEADER ─── */}
            <div className="pt-32 pb-12 bg-gray-50 border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Back Link */}
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-maroon-600 transition-colors mb-8 group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Return to Intelligence Feed
                    </Link>

                    {/* Issue Number */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px w-8 bg-maroon-500"></div>
                        <div className="w-2 h-2 rounded-full bg-maroon-500"></div>
                        <span className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold">Intelligence Brief</span>
                        <span className="text-xs font-mono text-gray-400">·</span>
                        <span className="text-xs font-mono text-gray-400">{issueNumber}</span>
                    </div>

                    {/* Title */}
                    <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-8">
                        {getTitle(item)}
                    </h1>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        {getCity(item) && (
                            <span className="text-maroon-600 font-bold uppercase tracking-wider text-xs">{getCity(item)}</span>
                        )}
                        {item.tags?.filter(t => !CITIES.includes(t)).map(tag => (
                            <span key={tag} className="text-[11px] font-mono uppercase tracking-wider text-gray-500 bg-gray-200 px-2 py-0.5">{tag}</span>
                        ))}
                        {item.author && (
                            <span className="text-gray-500 text-sm">By <span className="font-semibold text-gray-700">{item.author}</span></span>
                        )}
                        <span className="text-gray-400 text-xs font-mono ml-auto">{getDate(item)}</span>
                    </div>
                </div>
            </div>

            {/* ─── ARTICLE CONTENT ─── */}
            <main className="max-w-4xl mx-auto px-6 py-14">
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

            <Footer />
        </div>
    );
};
