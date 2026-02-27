import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, ChevronRight, AlertTriangle } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem } from '../../types';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

// Tier-1 cities as per bulletin
const CITIES = ['All', 'Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Pune'];

function getIssueNumber(): string {
    const base = 89;
    const baseDate = new Date('2026-02-27');
    const today = new Date();
    const diff = Math.floor((today.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return `ISSP_RRUPY/Issue No.${base + diff}/2026`;
}

function formatBulletinDate(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} | ${days[date.getDay()]}`;
}

export const PublicHome: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbConnected, setDbConnected] = useState(true);
    const [selectedCity, setSelectedCity] = useState('All');
    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState('');
    const [endDateInput, setEndDateInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [activeStartDate, setActiveStartDate] = useState('');
    const [activeEndDate, setActiveEndDate] = useState('');

    const today = new Date();
    const issueNumber = getIssueNumber();

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
            const published = allItems.filter(i =>
                i.status === 'published' && i.publishedAt && new Date(i.publishedAt) <= now
            ).sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());
            setItems(published);
            setLoading(false);
        };
        init();
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter(i => {
            const title = i.blocks.find(b => b.type === 'title')?.value?.toString().toLowerCase() || '';
            const body = i.blocks.find(b => b.type === 'markdown')?.value?.toString().toLowerCase() || '';
            const term = activeSearch.toLowerCase();
            const matchesSearch = !term || title.includes(term) || body.includes(term);

            const pubDate = i.publishedAt ? new Date(i.publishedAt) : null;
            let matchesDate = true;
            if (pubDate) {
                if (activeStartDate) {
                    const [y, m, d] = activeStartDate.split('-').map(Number);
                    if (pubDate < new Date(y, m - 1, d)) matchesDate = false;
                }
                if (activeEndDate) {
                    const [y, m, d] = activeEndDate.split('-').map(Number);
                    if (pubDate > new Date(y, m - 1, d, 23, 59, 59)) matchesDate = false;
                }
            }

            const matchesCity = selectedCity === 'All' ||
                i.tags?.some(t => t.toLowerCase() === selectedCity.toLowerCase());

            return matchesSearch && matchesDate && matchesCity;
        });
    }, [items, activeSearch, activeStartDate, activeEndDate, selectedCity]);

    const handleSearch = () => {
        setActiveSearch(searchInput);
        setActiveStartDate(startDateInput);
        setActiveEndDate(endDateInput);
    };

    const handleClear = () => {
        setSearchInput(''); setStartDateInput(''); setEndDateInput('');
        setActiveSearch(''); setActiveStartDate(''); setActiveEndDate('');
    };

    const featuredItem = filteredItems[0];
    const remainingItems = filteredItems.slice(1);

    const getTitle = (item: NewsItem) => item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
    const getExcerpt = (item: NewsItem) => item.blocks.find(b => b.type === 'excerpt')?.value || '';
    const getImage = (item: NewsItem) => item.blocks.find(b => b.type === 'image')?.value;
    const getDate = (item: NewsItem) => item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
    const getCity = (item: NewsItem) => {
        const cityTag = item.tags?.find(t => CITIES.includes(t));
        return cityTag || '';
    };

    return (
        <div className="min-h-screen bg-white font-inter">
            <Navbar />

            {/* ─── HERO SECTION ─── */}
            <section className="min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text Content */}
                        <div className="relative z-10">
                            {/* Section Label */}
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-px w-10 bg-maroon-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-maroon-500"></div>
                                <span className="text-xs font-mono uppercase tracking-widest text-gray-500 font-semibold">
                                    Daily Threat Intelligence
                                </span>
                            </div>

                            <h1 className="font-clarendon text-5xl md:text-6xl xl:text-7xl font-black text-intel-900 leading-none mb-8">
                                Intelligence,<br />
                                <span className="text-maroon-600">Risk</span> and<br />
                                Resilience
                            </h1>

                            <p className="text-gray-600 text-lg leading-relaxed max-w-md mb-10">
                                A forward-looking security intelligence bulletin delivering situational awareness on emerging threats across India's Tier-1 cities.
                            </p>

                            {/* Issue Info */}
                            <div className="flex flex-col gap-2 mb-10 text-sm font-mono text-gray-400">
                                <span>{formatBulletinDate(today)}</span>
                                <span className="text-[11px]">{issueNumber}</span>
                            </div>

                            {/* CTA Button */}
                            <div className="flex items-center gap-4">
                                <div className="h-px w-10 bg-maroon-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-maroon-500"></div>
                                <a href="#feed" className="text-intel-900 font-bold text-sm uppercase tracking-widest hover:text-maroon-600 transition-colors">
                                    View Intelligence Feed
                                </a>
                            </div>
                        </div>

                        {/* Right: Visual Orb / Decorative element */}
                        <div className="relative flex items-center justify-center lg:justify-end">
                            {/* Large decorative square background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gray-100 rounded-full opacity-60 -z-10"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-maroon-100 rounded-full opacity-40 -z-10"></div>

                            {/* Main visual card with featured news */}
                            {featuredItem && !loading ? (
                                <Link to={`/news/${featuredItem.id}`} className="group relative w-full max-w-sm">
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                        {getImage(featuredItem) ? (
                                            <img
                                                src={getImage(featuredItem).src}
                                                alt={getImage(featuredItem).caption}
                                                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-80 bg-intel-800 flex items-center justify-center">
                                                <div className="text-center text-white p-8">
                                                    <div className="font-clarendon text-3xl font-black mb-2">PULSE-R<sup>24</sup></div>
                                                    <div className="text-intel-200 text-sm">Intelligence Brief</div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-intel-900 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-maroon-300 text-xs font-mono uppercase tracking-widest">Featured Brief</span>
                                                {getCity(featuredItem) && (
                                                    <span className="text-maroon-300 font-bold text-xs">· {getCity(featuredItem)}</span>
                                                )}
                                            </div>
                                            <h2 className="font-playfair text-lg font-bold text-white leading-tight line-clamp-2">
                                                {getTitle(featuredItem)}
                                            </h2>
                                            <div className="flex items-center gap-2 mt-3 text-white text-xs group-hover:text-maroon-200 transition-colors font-semibold">
                                                Read Full Brief <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Small accent card */}
                                    <div className="absolute -bottom-4 -left-6 w-24 h-24 bg-maroon-600 rounded-xl flex flex-col items-center justify-center text-white shadow-lg">
                                        <span className="font-clarendon font-black text-2xl leading-none">{today.getDate()}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1">
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][today.getMonth()]}
                                        </span>
                                    </div>
                                </Link>
                            ) : (
                                <div className="w-full max-w-sm h-80 bg-gray-100 rounded-2xl flex items-center justify-center animate-pulse">
                                    <div className="text-center p-8">
                                        <div className="font-clarendon text-4xl font-black text-intel-900 mb-2">PULSE-R<sup>24</sup></div>
                                        <div className="text-gray-400 text-sm">Loading latest brief...</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── STATUS STRIP ─── */}
            <div className="bg-intel-800 py-4 px-6">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-inter">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-maroon-400 animate-pulse"></div>
                        <span className="text-maroon-300 font-bold uppercase tracking-widest">Live Intelligence Feed</span>
                    </div>
                    <span className="text-intel-300 font-mono text-[11px]">{issueNumber}</span>
                    <span className="text-intel-300 italic hidden md:block">Ranked by incident impact timeline across Tier-1 cities</span>
                </div>
            </div>

            {/* ─── SEARCH & CITY FILTER ─── */}
            <div id="feed" className="bg-gray-50 border-b border-gray-200 py-6 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        {/* Search */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search bulletins..."
                                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500 w-52 placeholder-gray-400"
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input type="date" className="pl-9 pr-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-maroon-500" value={startDateInput} onChange={e => setStartDateInput(e.target.value)} />
                            </div>
                            <span className="text-gray-400 text-sm">to</span>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input type="date" className="pl-9 pr-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-maroon-500" value={endDateInput} onChange={e => setEndDateInput(e.target.value)} />
                            </div>
                            <button onClick={handleSearch} className="px-5 py-2 bg-maroon-600 hover:bg-maroon-700 text-white text-sm font-semibold uppercase tracking-wider transition-colors">
                                Search
                            </button>
                            {(activeSearch || activeStartDate || activeEndDate) && (
                                <button onClick={handleClear} className="px-3 py-2 border border-gray-300 text-gray-500 hover:text-gray-800 text-sm transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* City Tabs */}
                        <div className="flex gap-0 overflow-x-auto">
                            {CITIES.map(city => (
                                <button
                                    key={city}
                                    onClick={() => setSelectedCity(city)}
                                    className={`px-3 py-2 text-xs font-inter font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${selectedCity === city
                                        ? 'border-maroon-600 text-maroon-600'
                                        : 'border-transparent text-gray-400 hover:text-intel-800 hover:border-gray-300'
                                        }`}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── MAIN CONTENT ─── */}
            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16">

                {/* Section Header */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="h-px w-10 bg-maroon-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-maroon-500"></div>
                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500 font-semibold">Latest Intelligence Briefs</span>
                    {!loading && <span className="ml-auto text-xs font-mono text-gray-400">{filteredItems.length} bulletins</span>}
                </div>

                {/* Error / Loading states */}
                {!dbConnected ? (
                    <div className="text-center py-20 border border-dashed border-red-200 bg-red-50">
                        <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                        <h2 className="text-xl font-playfair font-bold text-gray-800">System Maintenance</h2>
                        <p className="text-gray-500 mt-2">The intelligence portal is currently undergoing database setup.</p>
                        <Link to="/admin" className="text-maroon-600 font-medium hover:underline mt-4 inline-block">Go to Admin Setup</Link>
                    </div>
                ) : loading ? (
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col gap-4">
                                    <div className="aspect-video bg-gray-200 rounded-sm"></div>
                                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-6 w-full bg-gray-200 rounded"></div>
                                    <div className="h-6 w-4/5 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-200">
                        <p className="text-gray-500">No bulletins found matching your criteria.</p>
                        <button onClick={() => { handleClear(); setSelectedCity('All'); }} className="mt-4 text-maroon-600 font-medium hover:underline">
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
                        {filteredItems.map((item, idx) => {
                            const image = getImage(item);
                            const city = getCity(item);
                            const isFeatured = idx === 0;
                            return (
                                <Link
                                    key={item.id}
                                    to={`/news/${item.id}`}
                                    className={`group flex flex-col ${isFeatured ? 'md:col-span-3 md:grid md:grid-cols-2 md:gap-8 md:items-center' : ''}`}
                                >
                                    {/* Image */}
                                    <div className={`overflow-hidden rounded-sm mb-5 ${isFeatured ? 'mb-0' : ''}`}>
                                        {image ? (
                                            <img
                                                src={image.src}
                                                alt={image.caption}
                                                className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${isFeatured ? 'h-72 md:h-80' : 'h-52'}`}
                                            />
                                        ) : (
                                            <div className={`w-full bg-intel-800 flex items-center justify-center ${isFeatured ? 'h-72 md:h-80' : 'h-52'}`}>
                                                <span className="font-mono text-intel-400 text-sm uppercase tracking-widest">Intelligence Brief</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Text */}
                                    <div className={`flex flex-col ${isFeatured ? 'py-4' : ''}`}>
                                        {isFeatured && (
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="h-px w-8 bg-maroon-500"></div>
                                                <div className="w-2 h-2 rounded-full bg-maroon-500"></div>
                                                <span className="text-xs text-maroon-600 font-mono uppercase tracking-widest font-semibold">Featured Report</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mb-3">
                                            {city && <span className="text-maroon-600 font-bold text-xs uppercase tracking-wider">{city}</span>}
                                            {item.tags?.filter(t => !CITIES.includes(t)).slice(0, 1).map(tag => (
                                                <span key={tag} className="text-[10px] font-mono uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5">{tag}</span>
                                            ))}
                                            <span className="text-xs font-mono text-gray-400 ml-auto">{getDate(item)}</span>
                                        </div>
                                        <h3 className={`font-playfair font-bold text-gray-900 leading-tight mb-3 group-hover:text-maroon-700 transition-colors ${isFeatured ? 'text-3xl md:text-4xl' : 'text-xl line-clamp-3'}`}>
                                            {getTitle(item)}
                                        </h3>
                                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-5">{getExcerpt(item)}</p>
                                        {/* MitKat style "read more" link */}
                                        <div className="flex items-center gap-3 text-maroon-600 group-hover:text-maroon-800 transition-colors">
                                            <div className="h-px w-8 bg-maroon-500 group-hover:w-12 transition-all duration-300"></div>
                                            <div className="w-2 h-2 rounded-full bg-maroon-500"></div>
                                            <span className="text-xs font-semibold uppercase tracking-widest">Read Full Brief</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};
