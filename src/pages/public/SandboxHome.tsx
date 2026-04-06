import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, ChevronRight, AlertTriangle, MapPin, Clock, ExternalLink } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NewsItem } from '../../types';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ThreatMap } from '../../components/ui/ThreatMap';

// National Intelligence Domains
const DOMAINS = ['All', 'Fire incidents', 'Political Violence', 'Civil Disturbances', 'Terrorist attack / incident', 'Cyber attacks', 'National Threat', 'Monitoring'];

const isDomainTag = (tag: string) => DOMAINS.some(domain => domain.toLowerCase() === tag.toLowerCase());

export const SandboxHome: React.FC = () => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDomain, setSelectedDomain] = useState('All');
    const [activeMapFocus, setActiveMapFocus] = useState<[number, number] | null>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const allItems = await storageService.getNewsItems();
            setItems(allItems.filter(i => i.status === 'published'));
            setLoading(false);
        };
        init();
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter(i => {
            return selectedDomain === 'All' || i.tags?.some(t => t.toLowerCase() === selectedDomain.toLowerCase());
        }).sort((a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime());
    }, [items, selectedDomain]);

    const getTitle = (item: NewsItem) => item.blocks.find(b => b.type === 'title')?.value || 'Untitled';
    const getDomain = (item: NewsItem) => item.tags?.find(t => isDomainTag(t)) || 'General';
    const getSeverityColor = (sev?: string) => {
        switch(sev) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-blue-500';
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-100 font-inter">
            <Navbar />
            
            <main className="pt-24 pb-12 px-6 max-w-[1600px] mx-auto">
                <div className="mb-8 border-b border-gray-800 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-px w-8 bg-maroon-500"></div>
                        <span className="text-xs font-mono uppercase tracking-[0.3em] text-maroon-500 font-bold">Divided Intelligence View (Sandbox)</span>
                    </div>
                    <h1 className="text-3xl font-clarendon font-black">Strategic Response Dashboard</h1>
                </div>

                {/* THE DIVIDED SECTION (Command Center Style) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[700px]">
                    
                    {/* LEFT: STRATEGIC FEED (3/12 columns) */}
                    <div className="xl:col-span-3 flex flex-col bg-[#11141d] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-gray-800 bg-[#161b26] flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Incident Stream</span>
                            <span className="px-2 py-0.5 rounded-full bg-intel-800 text-[10px] text-intel-300 font-mono">{filteredItems.length} ACTIVE</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {filteredItems.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => {
                                        // Logic to trigger flyTo would go through identifying coordinates
                                        // For sandbox, we simulate identifying lat/lon
                                        // This is the "Division" part - user clicks here, map reacts.
                                    }}
                                    className="group cursor-pointer p-4 bg-[#1a1f2b] border border-transparent hover:border-maroon-500/50 rounded-xl transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${getSeverityColor(item.severity)}`}></div>
                                        <span className="text-[10px] font-mono text-gray-500">{new Date(item.publishedAt || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <h4 className="text-sm font-bold leading-snug text-gray-200 group-hover:text-white transition-colors mb-3 line-clamp-2">
                                        {getTitle(item)}
                                    </h4>
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800/50">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-maroon-500">{getDomain(item)}</span>
                                        <div className="flex gap-2">
                                            <button className="text-gray-500 hover:text-white transition-colors" title="Locate on Map">
                                                <MapPin size={12} />
                                            </button>
                                            <Link to={`/news/${item.id}`} className="text-gray-500 hover:text-white transition-colors">
                                                <ExternalLink size={12} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: INTERACTIVE MAP (9/12 columns) */}
                    <div className="xl:col-span-9 relative bg-[#11141d] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                        <ThreatMap items={filteredItems} flyToArea={activeMapFocus} />
                        
                        {/* Map Overlay Stats */}
                        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
                            <div className="bg-[#1a1f2b]/80 backdrop-blur-md border border-gray-700/50 p-4 rounded-xl shadow-xl min-w-[200px]">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 underline decoration-maroon-500 underline-offset-4">Sector Status</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">Critical Alerts</span>
                                        <span className="text-red-500 font-bold">{filteredItems.filter(i => i.severity === 'critical').length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">High Risk</span>
                                        <span className="text-orange-500 font-bold">{filteredItems.filter(i => i.severity === 'high').length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2d3748;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4a5568;
                }
            `}</style>
        </div>
    );
};
