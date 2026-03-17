import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Calendar, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { osintService } from '../../services/osintService';
import { NewsItem } from '../../types';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ThreatMap } from '../../components/ui/ThreatMap';
import { LiveTicker } from '../../components/ui/LiveTicker';

// National Intelligence Domains
const DOMAINS = ['All', 'Geopolitics', 'Defense', 'Internal Security', 'Cyber', 'Economy', 'Terrorism', 'Border Intelligence'];

const isDomainTag = (tag: string) =>
    DOMAINS.some(domain => domain.toLowerCase() === tag.toLowerCase());

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
    const [selectedDomain, setSelectedDomain] = useState('All');
    const [searchInput, setSearchInput] = useState('');
    const [startDateInput, setStartDateInput] = useState('');
    const [endDateInput, setEndDateInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [activeStartDate, setActiveStartDate] = useState('');
    const [activeEndDate, setActiveEndDate] = useState('');
    const [activeTag, setActiveTag] = useState('');
    const [activeMapFocus, setActiveMapFocus] = useState<[number, number] | null>(null);

    const location = useLocation();
    const today = new Date();
    const issueNumber = getIssueNumber();

    const scrollToSection = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    // Pick up ?tag= and ?section= from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tag = params.get('tag');
        setActiveTag(tag ? decodeURIComponent(tag) : '');

        const section = params.get('section');
        if (section) {
            setTimeout(() => scrollToSection(section), 50);
        }
    }, [location.search, scrollToSection]);

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

            const matchesDomain = selectedDomain === 'All' ||
                i.tags?.some(t => t.toLowerCase() === selectedDomain.toLowerCase());

            const matchesTag = !activeTag || i.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase());

            return matchesSearch && matchesDate && matchesDomain && matchesTag;
        });
    }, [items, activeSearch, activeStartDate, activeEndDate, selectedDomain, activeTag]);

    const handleSearch = () => {
        setActiveSearch(searchInput);
        setActiveStartDate(startDateInput);
        setActiveEndDate(endDateInput);
    };

    const handleClear = () => {
        setSearchInput(''); setStartDateInput(''); setEndDateInput('');
        setActiveSearch(''); setActiveStartDate(''); setActiveEndDate('');
        setActiveTag('');
    };

    const featuredItem = filteredItems[0];
    const remainingItems = filteredItems.slice(1);

    const getTitle = (item: NewsItem) => item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
    const getExcerpt = (item: NewsItem) => item.blocks.find(b => b.type === 'excerpt')?.value || '';
    const getImage = (item: NewsItem) => {
        const raw = item.blocks.find(b => b.type === 'image')?.value;
        if (typeof raw === 'string') return { src: raw };
        return raw;
    };
    const getDate = (item: NewsItem) => item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
    const getDomain = (item: NewsItem) => {
        const domainTag = item.tags?.find(t => isDomainTag(t));
        if (!domainTag) return '';
        return DOMAINS.find(d => d.toLowerCase() === domainTag.toLowerCase()) || domainTag;
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
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('feed')}
                                    className="text-intel-900 font-bold text-sm uppercase tracking-widest hover:text-maroon-600 transition-colors"
                                >
                                    View Intelligence Feed
                                </button>
                            </div>
                        </div>

                        {/* Right: Live Interactive Threat Map */}
                        <div className="relative flex flex-col items-center justify-center lg:justify-end w-full h-full min-h-[500px]">
                            <ThreatMap items={filteredItems} flyToArea={activeMapFocus} />
                            
                            {/* Live News Ticker Strip attached right beneath the map */}
                            <div className="w-full mt-4">
                                <LiveTicker items={filteredItems} onFlyTo={setActiveMapFocus} />
                            </div>
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
                    <span className="text-intel-300 italic hidden md:block">Ranked by national incident impact and strategic significance</span>
                </div>
            </div>

            {/* ─── SEARCH & DOMAIN FILTER ─── */}
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

                        {/* Domain Filter Bar */}
                    <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-gray-100">
                        {DOMAINS.map(domain => (
                            <button
                                key={domain}
                                onClick={() => setSelectedDomain(domain)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${selectedDomain === domain
                                        ? 'bg-maroon-600 text-white shadow-md'
                                        : 'bg-white text-gray-500 hover:bg-maroon-50 hover:text-maroon-700 border border-gray-200'
                                    }`}
                            >
                                {domain}
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
                        <button onClick={() => { handleClear(); setSelectedDomain('All'); }} className="mt-4 text-maroon-600 font-medium hover:underline">
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
                        {filteredItems.map((item, idx) => {
                            const image = getImage(item);
                            const domain = getDomain(item);
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
                                            {domain && <span className="text-maroon-600 font-bold text-xs uppercase tracking-wider">{domain}</span>}
                                            {item.tags?.filter(t => !isDomainTag(t)).slice(0, 1).map(tag => (
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

            {/* About section */}
            <section id="about" className="bg-white border-t border-gray-100 py-16">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px w-10 bg-maroon-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-maroon-500"></div>
                        <span className="text-xs font-mono uppercase tracking-widest text-gray-500 font-semibold">About PULSE-R24</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="md:col-span-2">
                            <h2 className="font-clarendon text-3xl font-black text-intel-900 mb-4">
                                Strategic situational awareness for decision makers
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                PULSE-R24 delivers concise, actionable intelligence briefs across geopolitics,
                                defense, internal security, cyber threats, and economic risk. The platform
                                supports rapid dissemination and structured approvals so the latest updates
                                reach stakeholders without delay.
                            </p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Key Focus</p>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li>National and regional threat intelligence</li>
                                <li>Verified reporting and approval workflow</li>
                                <li>OSINT-assisted monitoring and alerts</li>
                                <li>Operational dashboards and analytics</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};
