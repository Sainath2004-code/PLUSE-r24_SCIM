import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NewsItem } from '../../types';
import { CITY_COORDINATES } from '../../constants';

// Fix for default Leaflet icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom glowing divination icons using HTML element
const createPulseIcon = (color: string, isCritical: boolean) => {
  return L.divIcon({
    className: 'custom-pulse-icon',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ${isCritical ? `<div style="position: absolute; width: 100%; height: 100%; background-color: ${color}; border-radius: 50%; opacity: 0.6; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>` : ''}
        <div style="position: relative; width: 12px; height: 12px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px ${color}, 0 0 5px white;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10]
  });
};

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#94a3b8'
};

const SEV_CLS_MAP: Record<string, string> = {
    critical: 'border-red-500 text-red-500 bg-red-500/10',
    high: 'border-orange-500 text-orange-500 bg-orange-500/10',
    medium: 'border-yellow-500 text-yellow-600 bg-yellow-500/10',
    low: 'border-blue-500 text-blue-500 bg-blue-500/10',
    info: 'border-slate-400 text-slate-500 bg-slate-500/10'
};

const getCoordinatesForTags = (tags: string[] = []): [number, number] | null => {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (CITY_COORDINATES[key]) return CITY_COORDINATES[key];
  }
  return null;
};

// Sub-component to fly to bounds if needed (optional)
function MapEffect({ items, flyToArea }: { items: any[], flyToArea?: [number, number] | null }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (flyToArea) {
      // Leaflet flyTo uses [lat, lon]
      map.flyTo(flyToArea, 7, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [flyToArea, map]);
  
  return null;
}

interface ThreatMapProps {
  items: NewsItem[];
  flyToArea?: [number, number] | null;
}

export function ThreatMap({ items, flyToArea }: ThreatMapProps) {
  // Only plot items with exact geographic coordinate tags
  const plottedItems = useMemo(() => {
    return items
      .map(item => {
        const coords = getCoordinatesForTags(item.tags); // Note mapping expects [lon, lat] for d3, leaflet expects [lat, lon]
        // Convert [lon, lat] from constants to [lat, lon] for Leaflet
        const leafletCoords: [number, number] | null = coords ? [coords[1], coords[0]] : null;
        return { item, coords: leafletCoords };
      })
      .filter((plot): plot is { item: NewsItem; coords: [number, number] } => plot.coords !== null);
  }, [items]);

  return (
    <div className="relative w-full h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group isolate">
      {/* Decorative Radar Overlay underneath UI but over map */}
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(153,27,27,0.1)_180deg,transparent_360deg)] rounded-full animate-[spin_4s_linear_infinite] pointer-events-none opacity-40 blur-xl z-0"></div>
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCBMIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-30 pointer-events-none z-0"></div>

      <MapContainer 
        center={[22.5937, 78.9629]} 
        zoom={5} 
        minZoom={4}
        maxZoom={12}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ background: '#090b10' }} // Deep dark background
      >
        <ZoomControl position="bottomright" />
        {/* CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <MapEffect items={plottedItems} flyToArea={flyToArea} />

        {plottedItems.map(({ item, coords }) => {
          const isCritical = item.severity === 'critical';
          const sevColor = SEV_COLORS[item.severity || 'info'] || SEV_COLORS.info;
          
          return (
            <Marker 
              key={item.id} 
              position={coords}
              icon={createPulseIcon(sevColor, isCritical)}
            >
              <Popup className="intel-popup">
                <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg -m-3 max-w-xs shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${SEV_CLS_MAP[item.severity || 'info']}`}>
                        {item.severity}
                        </span>
                    </div>
                    <h4 className="font-playfair text-sm font-bold text-white leading-tight line-clamp-2 mb-1">
                        {item.blocks.find(b => b.type === 'title')?.value as string || 'Untitled'}
                    </h4>
                    <div className="text-xs font-mono text-slate-400 mt-2 flex justify-between">
                        <span>{coords[0].toFixed(2)}, {coords[1].toFixed(2)}</span>
                        <a href={`#/news/${item.id}`} className="text-maroon-400 hover:text-maroon-300 underline font-semibold">Open Brief</a>
                    </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Header Status */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 z-[400] shadow-2xl pointer-events-none">
        <div className="flex items-center gap-2 text-slate-300 text-xs font-mono uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          Live Sensor Grid
        </div>
        <div className="text-[10px] text-slate-500 mt-1 font-semibold">
          {plottedItems.length} ACTIVE GEOSPATIAL ALERTS
        </div>
      </div>
      
      {/* Global Style Override for Leaflet */}
      <style>{`
        @keyframes pulse-ring {
            0% { transform: scale(0.33); }
            80%, 100% { opacity: 0; }
        }
        .leaflet-control-zoom {
            border: 1px solid #334155 !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
            border-radius: 0.5rem !important;
            overflow: hidden;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
            background-color: #0f172a !important;
            color: #e2e8f0 !important;
            border-bottom: 1px solid #334155 !important;
        }
        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
            background-color: #1e293b !important;
            color: #ffffff !important;
        }
        .leaflet-popup-content-wrapper {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid #334155;
            border-radius: 0.75rem;
            color: white;
            padding: 0;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .leaflet-popup-tip {
            background: #0f172a;
            border-top: 1px solid #334155;
            border-left: 1px solid #334155;
        }
        .leaflet-container a.leaflet-popup-close-button {
            color: #94a3b8;
            padding: 4px 4px 0 0;
            z-index: 10;
        }
      `}</style>
    </div>
  );
}
