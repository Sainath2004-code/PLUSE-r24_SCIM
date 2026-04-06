import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ChevronLeft, Clock, Share2, Printer, Copy, CheckCheck, ChevronRight,
    Twitter, AlertTriangle, BookOpen
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem, LayoutTemplate, SeverityLevel } from '../../types';
import { BlockRenderer } from '../../components/BlockRenderer';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

const CITIES = ['All', 'Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune'];

function getIssueNumber(): string {
    const base = 89;
    const baseDate = new Date('2026-02-27');
    const diff = Math.floor((new Date().getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return `ISSP_RRUPY/Issue No.${base + diff}/2026`;
}

function estimateReadTime(text: string): string {
    const words = text.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `${mins} min read`;
}

const SEVERITY_CONFIG: Record<SeverityLevel, { cls: string; bg: string; label: string }> = {
    critical: { cls: 'text-red-700 border-red-300 bg-red-50',     bg: 'bg-red-600',     label: 'CRITICAL' },
    high:     { cls: 'text-orange-700 border-orange-300 bg-orange-50', bg: 'bg-orange-500', label: 'HIGH'    },
    medium:   { cls: 'text-amber-700 border-amber-300 bg-amber-50', bg: 'bg-amber-400',  label: 'MEDIUM'  },
    low:      { cls: 'text-emerald-700 border-emerald-300 bg-emerald-50', bg: 'bg-emerald-500', label: 'LOW' },
    info:     { cls: 'text-blue-700 border-blue-300 bg-blue-50',   bg: 'bg-blue-500',    label: 'INFO'    },
};

export const PublicDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<NewsItem | null>(null);
    const [allItems, setAllItems] = useState<NewsItem[]>([]);
    const [template, setTemplate] = useState<LayoutTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const issueNumber = getIssueNumber();

    useEffect(() => {
        const fetchItem = async () => {
            if (!id) return;
            setLoading(true);
            const items = await storageService.getNewsItems();
            const published = items.filter(i => i.status === 'published');
            setAllItems(published);
            const found = published.find(i => i.id === id);
            if (found) {
                setItem(found);
                const templates = await storageService.getLayouts();
                const t = templates.find(temp => temp.templateId === found.templateId);
                setTemplate(t || null);

                // Analytics
                if (!sessionStorage.getItem(`viewed_${id}`)) {
                    sessionStorage.setItem(`viewed_${id}`, 'true');
                    storageService.incrementViewCount(id);
                }

                // SEO: set document title + meta description
                const title = found.blocks.find(b => b.type === 'title')?.value?.toString() || 'Intelligence Brief';
                const excerpt = found.blocks.find(b => b.type === 'excerpt')?.value?.toString() || '';
                document.title = `${title} | PULSE-R24`;
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) metaDesc.setAttribute('content', excerpt);
                else {
                    const m = document.createElement('meta');
                    m.name = 'description'; m.content = excerpt;
                    document.head.appendChild(m);
                }
            }
            setLoading(false);
        };
        fetchItem();
        return () => { document.title = 'PULSE-R24 Intelligence Portal'; };
    }, [id]);

    const getTitle   = (i: NewsItem) => i.blocks.find(b => b.type === 'title')?.value?.toString() || 'Untitled';
    const getExcerpt = (i: NewsItem) => i.blocks.find(b => b.type === 'excerpt')?.value?.toString() || '';
    const getCover   = (i: NewsItem) => {
        const raw = i.blocks.find(b => b.type === 'image')?.value;
        if (typeof raw === 'string') return { src: raw };
        return raw;
    };
    const getCity    = (i: NewsItem) => i.tags?.find(t => CITIES.includes(t)) || '';
    const getBody    = (i: NewsItem) => i.blocks.find(b => b.type === 'markdown')?.value?.toString() || '';
    const getDate    = (i: NewsItem) => i.publishedAt
        ? new Date(i.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const handlePrint = () => window.print();

    if (loading) return (
        <div className="min-h-screen bg-white font-inter">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 pt-40 pb-20 animate-pulse">
                <div className="h-3 w-20 bg-gray-200 rounded mb-8"></div>
                <div className="h-10 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 w-1/2 bg-gray-200 rounded mb-10"></div>
                <div className="space-y-4 mb-10">
                    {[1,2,3,4].map(i => <div key={i} className="h-4 w-full bg-gray-200 rounded"></div>)}
                </div>
                <div className="h-64 w-full bg-gray-200 rounded"></div>
            </div>
        </div>
    );

    if (!item) return (
        <div className="min-h-screen bg-white flex items-center justify-center font-inter">
            <div className="text-center">
                <p className="text-gray-500 text-lg">Intelligence brief not found.</p>
                <Link to="/" className="text-maroon-600 font-medium hover:underline mt-4 inline-block">Return to Bulletin Feed</Link>
            </div>
        </div>
    );

    const coverImage = getCover(item);
    const excerpt = getExcerpt(item);
    const body = getBody(item);
    const readTime = estimateReadTime(body || excerpt);
    const severity = item.severity;
    const severityConf = severity ? SEVERITY_CONFIG[severity] : null;

    const coverBlockId = item.blocks.find(b => b.type === 'image')?.blockId;
    const bodyBlocks = item.blocks.filter(b =>
        b.type !== 'title' &&
        b.type !== 'excerpt' &&
        b.type !== 'category' &&
        !(b.type === 'image' && b.blockId === coverBlockId)
    );

    // Related articles: same tags, exclude current
    const nonCityTags = item.tags?.filter(t => !CITIES.includes(t)) || [];
    const related = allItems
        .filter(i => i.id !== item.id && i.tags?.some(t => nonCityTags.includes(t)))
        .slice(0, 3);

    return (
        <div className="min-h-screen bg-white font-inter print:bg-white">
            <Navbar />

            {/* ─── BREADCRUMB ─── */}
            <div className="pt-28 pb-0 bg-gray-50 border-b border-gray-100 print:hidden">
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-gray-400 font-mono">
                    <Link to="/" className="hover:text-maroon-600 transition-colors">Home</Link>
                    <ChevronRight size={12} />
                    <span className="text-gray-500">Intelligence Brief</span>
                    <ChevronRight size={12} />
                    <span className="text-gray-700 font-semibold truncate max-w-xs">{getTitle(item)}</span>
                </div>
            </div>

            {/* ─── ARTICLE HEADER ─── */}
            <div className="pt-6 pb-10 bg-gray-50 border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6">

                    {/* Back link */}
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-maroon-600 transition-colors mb-6 group print:hidden">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Return to Intelligence Feed
                    </Link>

                    {/* Issue + severity */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className="flex items-center gap-2">
                            <div className="h-px w-6 bg-maroon-500"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-maroon-500"></div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold">{issueNumber}</span>
                        </div>
                        {severityConf && (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${severityConf.cls}`}>
                                {severityConf.label}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
                        {getTitle(item)}
                    </h1>

                    {/* Excerpt */}
                    {excerpt && (
                        <p className="text-lg text-gray-600 leading-relaxed mb-6 max-w-3xl font-light border-l-4 border-maroon-400 pl-5">
                            {excerpt}
                        </p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm border-t border-gray-200 pt-5">
                        {getCity(item) && (
                            <span className="text-maroon-600 font-bold uppercase tracking-wider text-xs">{getCity(item)}</span>
                        )}
                        {item.tags?.filter(t => !CITIES.includes(t)).slice(0, 5).map(tag => (
                            <Link
                                key={tag}
                                to={`/?tag=${encodeURIComponent(tag)}`}
                                className="text-[11px] font-mono uppercase tracking-wider text-gray-500 bg-gray-200 hover:bg-maroon-100 hover:text-maroon-700 px-2 py-0.5 transition-colors"
                            >
                                {tag}
                            </Link>
                        ))}
                        {item.author && (
                            <span className="text-gray-500 text-sm">By <span className="font-semibold text-gray-700">{item.author}</span></span>
                        )}
                        {/* Reading time */}
                        <span className="flex items-center gap-1 text-gray-400 text-xs font-mono">
                            <Clock size={12} /> {readTime}
                        </span>
                        <span className="text-gray-400 text-xs font-mono ml-auto">{getDate(item)}</span>
                    </div>

                    {/* Share bar */}
                    <div className="flex items-center gap-2 mt-4 print:hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1">Share</span>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-maroon-400 hover:text-maroon-600 transition-all"
                        >
                            {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getTitle(item))}&url=${encodeURIComponent(window.location.href)}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-black hover:text-white hover:border-black transition-all"
                        >
                            <Twitter size={13} /> Twitter
                        </a>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-maroon-400 hover:text-maroon-600 transition-all"
                        >
                            <Printer size={13} /> Print
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── COVER IMAGE ─── */}
            {coverImage?.src && (
                <div className="max-w-4xl mx-auto px-6 pt-10">
                    <figure>
                        <img
                            src={coverImage.src}
                            alt={coverImage.caption || getTitle(item)}
                            className="w-full max-h-[480px] object-cover rounded-xl shadow-lg"
                        />
                        {coverImage.caption && (
                            <figcaption className="mt-3 text-center text-sm text-gray-500 italic">{coverImage.caption}</figcaption>
                        )}
                    </figure>
                </div>
            )}

            {/* ─── ARTICLE BODY ─── */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {bodyBlocks.length > 0 ? (
                    bodyBlocks.map((blockValue, index) => {
                        const definition = template?.blocks.find(b => b.id === blockValue.blockId) || {
                            id: blockValue.blockId,
                            type: blockValue.type as any,
                            grid: { colSpan: 12, colStart: 1 }
                        };
                        return (
                            <div key={index}>
                                <BlockRenderer block={definition} value={blockValue.value} />
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-400 italic text-center py-10">No body content available for this article.</p>
                )}

                {/* Original PDF link */}
                {item.meta?.pdfUrl && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <a
                            href={item.meta.pdfUrl}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-maroon-700 hover:text-maroon-900 font-medium underline underline-offset-4"
                        >
                            View Original PDF Bulletin
                        </a>
                    </div>
                )}

                {/* Tags footer */}
                {item.tags && item.tags.filter(t => !CITIES.includes(t)).length > 0 && (
                    <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                        <BookOpen size={14} className="text-gray-400" />
                        {item.tags.filter(t => !CITIES.includes(t)).map(tag => (
                            <Link
                                key={tag}
                                to={`/?tag=${encodeURIComponent(tag)}`}
                                className="text-[11px] font-mono uppercase tracking-wider text-gray-500 bg-gray-100 hover:bg-maroon-100 hover:text-maroon-700 px-2 py-0.5 transition-colors rounded"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* ─── RELATED ARTICLES ─── */}
            {related.length > 0 && (
                <section className="bg-gray-50 border-t border-gray-200 py-14 print:hidden">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-px flex-1 bg-gray-200"></div>
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Related Intelligence</h2>
                            <div className="h-px flex-1 bg-gray-200"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {related.map(rel => {
                                const relCover = getCover(rel);
                                const relSev = rel.severity ? SEVERITY_CONFIG[rel.severity] : null;
                                return (
                                    <Link
                                        key={rel.id}
                                        to={`/news/${rel.id}`}
                                        className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-maroon-200 transition-all"
                                    >
                                        {relCover?.src && (
                                            <img src={relCover.src} alt="" className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                                        )}
                                        <div className="p-4">
                                            {relSev && (
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${relSev.cls} mb-2 inline-block`}>
                                                    {relSev.label}
                                                </span>
                                            )}
                                            <p className="text-[13px] font-bold text-gray-900 group-hover:text-maroon-700 transition-colors leading-snug line-clamp-2">{getTitle(rel)}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-2 flex items-center gap-1">
                                                <Clock size={10} /> {estimateReadTime(getBody(rel) || getExcerpt(rel))}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
};











