import React from 'react';
import { NewsItem } from '../../types';
import { CITY_COORDINATES } from '../../constants';

const SEV_CLS_MAP: Record<string, string> = {
    critical: 'text-red-500 bg-red-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    medium: 'text-yellow-600 bg-yellow-500/10',
    low: 'text-blue-500 bg-blue-500/10',
    info: 'text-slate-500 bg-slate-500/10'
};

interface LiveTickerProps {
  items: NewsItem[];
  onFlyTo: (coords: [number, number]) => void;
}

export function LiveTicker({ items, onFlyTo }: LiveTickerProps) {
  // Show up to 10 recent items in the live ticker, acting as a national feed.
  const tickerItems = items.slice(0, 10);

  if (tickerItems.length === 0) return null;

  const handleFlyTo = (locTag: string) => {
    const rawCoords = CITY_COORDINATES[locTag.toLowerCase()] || CITY_COORDINATES['national'];
    // Const is [lon, lat], Leaflet wants [lat, lon]
    onFlyTo([rawCoords[1], rawCoords[0]]);
  };

  return (
    <div className="w-full bg-slate-950 border-y border-slate-800 flex items-center shadow-inner overflow-hidden relative h-10 mt-2 md:mt-4 rounded-xl">
      {/* Static Label Left - Clickable to Reset View */}
      <div 
        className="absolute left-0 top-0 bottom-0 z-10 bg-slate-900 border-r border-slate-800 px-4 flex items-center shadow-[10px_0_20px_-5px_rgba(0,0,0,0.8)] backdrop-blur cursor-pointer hover:bg-slate-800 transition-colors group"
        onClick={() => handleFlyTo('national')}
        title="Reset Map to National View"
      >
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2 group-hover:scale-125 transition-transform"></div>
        <span className="font-mono text-xs font-bold text-slate-200 tracking-[0.2em] group-hover:text-white transition-colors">BREAKING</span>
      </div>

      {/* Scrolling Tape */}
      <div className="flex-1 overflow-hidden relative h-full">
        <div className="animate-marquee whitespace-nowrap flex items-center h-full absolute pl-[120px]">
          {tickerItems.map((item, idx) => {
            const locTag = item.tags?.find(tag => CITY_COORDINATES[tag.toLowerCase()] !== undefined) || 'NATIONAL';
            const title = item.blocks.find(b => b.type === 'title')?.value as string || 'Untitled Intel';
            const sevColor = SEV_CLS_MAP[item.severity || 'info'] || 'text-slate-500';
            const isOsint = item.tags?.includes('OSINT');

            return (
              <span key={`${item.id}-${idx}`} className="inline-flex items-center mx-6 cursor-pointer hover:bg-slate-800/50 px-3 py-1 rounded transition-colors" onClick={() => handleFlyTo(locTag)}>
                <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${sevColor} mr-3 flex-shrink-0`}>
                  {item.severity}
                </span>
                {isOsint && (
                  <span className="text-blue-400 font-mono text-[10px] uppercase font-bold mr-2 border border-blue-500/30 px-1 rounded bg-blue-500/10 flex-shrink-0">
                    OSINT
                  </span>
                )}
                <span className="text-maroon-300 font-mono text-xs uppercase tracking-wider font-bold mr-2 flex-shrink-0">
                  [{locTag}]
                </span>
                <span className="text-slate-300 text-sm font-playfair hover:text-white transition-colors truncate max-w-md">
                  {title}
                </span>
                <span className="mx-6 text-slate-700 flex-shrink-0">//</span>
              </span>
            );
          })}
          {/* Duplicate for seamless infinite scroll */}
          {tickerItems.map((item, idx) => {
            const locTag = item.tags?.find(tag => CITY_COORDINATES[tag.toLowerCase()] !== undefined) || 'NATIONAL';
            const title = item.blocks.find(b => b.type === 'title')?.value as string || 'Untitled Intel';
            const sevColor = SEV_CLS_MAP[item.severity || 'info'] || 'text-slate-500';
            const isOsint = item.tags?.includes('OSINT');

            return (
              <span key={`dup-${item.id}-${idx}`} className="inline-flex items-center mx-6 cursor-pointer hover:bg-slate-800/50 px-3 py-1 rounded transition-colors" onClick={() => handleFlyTo(locTag)}>
                <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${sevColor} mr-3 flex-shrink-0`}>
                  {item.severity}
                </span>
                {isOsint && (
                  <span className="text-blue-400 font-mono text-[10px] uppercase font-bold mr-2 border border-blue-500/30 px-1 rounded bg-blue-500/10 flex-shrink-0">
                    OSINT
                  </span>
                )}
                <span className="text-maroon-300 font-mono text-xs uppercase tracking-wider font-bold mr-2 flex-shrink-0">
                  [{locTag}]
                </span>
                <span className="text-slate-300 text-sm font-playfair hover:text-white transition-colors truncate max-w-md">
                  {title}
                </span>
                <span className="mx-6 text-slate-700 flex-shrink-0">//</span>
              </span>
            );
          })}
        </div>
      </div>
      
      {/* Right Gradient Mask */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-10"></div>
    </div>
  );
}
