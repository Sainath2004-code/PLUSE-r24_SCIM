import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Filter, Grid as GridIcon, List as ListIcon, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem } from '../../types';
import { Button } from '../../components/ui/Button';

export const PublicHome: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [loading, setLoading] = useState(true);
    const [dbConnected, setDbConnected] = useState(true);

    // Filter States (Inputs)
    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState('');
    const [endDateInput, setEndDateInput] = useState('');
    const [selectedTagInput, setSelectedTagInput] = useState('');

    // Active Filters (Applied on Search)
    const [activeFilters, setActiveFilters] = useState({
        search: '',
        startDate: '',
        endDate: '',
        tag: ''
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const conn = await storageService.checkConnection();
            if (!conn.connected) {
                setDbConnected(false);
                setLoading(false);
                return;
            }

            const allItems = await storageService.getNewsItems();
            const now = new Date();
            // Only show published items in the past or now
            const published = allItems.filter(i =>
                i.status === 'published' && i.publishedAt && new Date(i.publishedAt) <= now
            ).sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());

            setItems(published);
            setLoading(false);
        };
        init();
    }, []);

    // Extract all unique tags for the filter dropdown
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        items.forEach(item => {
            item.tags?.forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(i => {
            // 1. Search Text
            const term = activeFilters.search.toLowerCase();
            const titleBlock = i.blocks.find(b => b.type === 'title')?.value?.toString().toLowerCase() || '';
            const bodyBlock = i.blocks.find(b => b.type === 'markdown')?.value?.toString().toLowerCase() || '';
            const matchesSearch = !term || titleBlock.includes(term) || bodyBlock.includes(term);

            // 2. Date Range
            const pubDate = i.publishedAt ? new Date(i.publishedAt) : null;
            let matchesDate = true;
            if (pubDate) {
                if (activeFilters.startDate) {
                    const [y, m, d] = activeFilters.startDate.split('-').map(Number);
                    const start = new Date(y, m - 1, d); // Local midnight
                    if (pubDate < start) matchesDate = false;
                }
                if (activeFilters.endDate) {
                    const [y, m, d] = activeFilters.endDate.split('-').map(Number);
                    const end = new Date(y, m - 1, d, 23, 59, 59, 999); // Local end of day
                    if (pubDate > end) matchesDate = false;
                }
            }

            // 3. Tags
            let matchesTag = true;
            if (activeFilters.tag) {
                matchesTag = i.tags?.includes(activeFilters.tag) || false;
            }

            return matchesSearch && matchesDate && matchesTag;
        });
    }, [items, activeFilters]);

    const handleSearch = () => {
        setActiveFilters({
            search: searchInput,
            startDate: startDateInput,
            endDate: endDateInput,
            tag: selectedTagInput
        });
    };

    const handleClear = () => {
        setSearchInput('');
        setStartDateInput('');
        setEndDateInput('');
        setSelectedTagInput('');
        setActiveFilters({ search: '', startDate: '', endDate: '', tag: '' });
    };

    const hasInputFilters = searchInput || startDateInput || endDateInput || selectedTagInput;
    const hasActiveFilters = activeFilters.search || activeFilters.startDate || activeFilters.endDate || activeFilters.tag;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">N</div>
                        <span className="text-xl font-bold text-slate-900">Pulse R32</span>
                    </div>
                    <Link to="/admin">
                        <Button variant="secondary" className="text-sm">Admin Login</Button>
                    </Link>
                </div>

                {/* Filters Bar */}
                <div className="bg-white border-b border-slate-200 py-3">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-end md:items-center">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search news..."
                                    className="pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 w-full"
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="date"
                                        className="pl-9 pr-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                        value={startDateInput}
                                        onChange={e => setStartDateInput(e.target.value)}
                                    />
                                </div>
                                <span className="text-slate-400 text-sm">to</span>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        type="date"
                                        className="pl-9 pr-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                        value={endDateInput}
                                        onChange={e => setEndDateInput(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="relative w-full md:w-40">
                                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <select
                                    className="pl-9 pr-8 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 w-full appearance-none"
                                    value={selectedTagInput}
                                    onChange={e => setSelectedTagInput(e.target.value)}
                                >
                                    <option value="">All Tags</option>
                                    {allTags.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
                            </div>

                            <Button
                                onClick={handleSearch}
                                disabled={!hasInputFilters}
                                className="h-[38px]"
                            >
                                Search
                            </Button>

                            {hasActiveFilters && (
                                <Button variant="ghost" onClick={handleClear} className="h-[38px] text-red-500 hover:bg-red-50 hover:text-red-600">
                                    Clear
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setView('grid')}
                                className={`p-2 rounded ${view === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <GridIcon size={18} />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`p-2 rounded ${view === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Latest News</h1>
                    <p className="text-slate-500 mt-1">Updates, insights, and stories.</p>
                </div>

                {!dbConnected ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-red-200">
                        <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                        <h2 className="text-xl font-bold text-slate-800">System Maintenance</h2>
                        <p className="text-slate-500 mt-2">The news portal is currently undergoing database setup.</p>
                        <Link to="/admin" className="text-brand-600 font-medium hover:underline mt-4 inline-block">Go to Admin Setup</Link>
                    </div>
                ) : loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading articles...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No news found matching your criteria.</p>
                        <button
                            onClick={handleClear}
                            className="mt-4 text-brand-600 font-medium hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                        {filteredItems.map(item => {
                            const title = item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
                            const excerpt = item.blocks.find(b => b.type === 'excerpt')?.value || '';
                            const image = item.blocks.find(b => b.type === 'image')?.value;
                            const date = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '';

                            return (
                                <Link key={item.id} to={`/news/${item.id}`} className="group">
                                    <article className={`bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex ${view === 'list' ? 'flex-row items-center' : 'flex-col'}`}>
                                        {image && (
                                            <div className={`bg-slate-100 overflow-hidden ${view === 'list' ? 'w-48 h-32 shrink-0' : 'h-48 w-full'}`}>
                                                <img src={image.src} alt={image.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 mb-2">
                                                {item.tags?.slice(0, 1).map(t => <span key={t} className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{t}</span>)}
                                                <span className="text-xs text-slate-400 ml-auto">{date}</span>
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">{title}</h2>
                                            <p className="text-slate-600 text-sm line-clamp-2 mb-4 flex-1">{excerpt}</p>
                                            <div className="text-brand-600 text-sm font-medium flex items-center gap-1 mt-auto">
                                                Read more <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};
