import fs from 'fs';

const filePath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/components/ui/ThreatMap.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We will import the geojson at the top, and add a GeoJSON layer inside the map.
if (!content.includes(' GeoJSON')) {
    content = content.replace(/import \{ MapContainer, TileLayer, Marker, Popup, useMap \} from 'react-leaflet';/g, 'import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from \'react-leaflet\';');
}

if (!content.includes('indiaStatesData')) {
    content = content.replace(/import L from 'leaflet';/g, 'import L from \'leaflet\';\nimport indiaStatesData from \'../../assets/india_states.json\';\nimport * as React from \'react\';');
}

const patchReplace = `const CITY_TO_STATE: Record<string, string> = {
  'Chennai': 'Tamil Nadu',
  'Bengaluru': 'Karnataka',
  'Mumbai': 'Maharashtra',
  'Pune': 'Maharashtra',
  'Delhi': 'NCT of Delhi',
  'Hyderabad': 'Telangana',
  'Kolkata': 'West Bengal'
};

const SEVERITY_SCORES: Record<string, number> = {
  'critical': 5,
  'high': 4,
  'medium': 3,
  'low': 2,
  'info': 1
};

const SEVERITY_COLORS: Record<number, string> = {
  5: '#991b1b', // dark red
  4: '#ef4444', // red
  3: '#f97316', // orange
  2: '#eab308', // yellow
  1: '#3b82f6'  // blue
};

export function ThreatMap({ items, flyToArea }: ThreatMapProps) {
  const stateSeverity = React.useMemo(() => {
    const scores: Record<string, number> = {};
    items.forEach(item => {
      const activeCities = item.tags?.filter(t => Object.keys(CITY_TO_STATE).includes(t)) || [];
      const score = item.severity ? SEVERITY_SCORES[item.severity] : 0;
      if (score > 0) {
        activeCities.forEach(city => {
          const state = CITY_TO_STATE[city];
          if (!scores[state] || score > scores[state]) {
            scores[state] = score;
          }
        });
      }
    });
    if (scores['NCT of Delhi']) scores['Delhi'] = scores['NCT of Delhi']; 
    return scores;
  }, [items]);

  const geoJsonStyle = React.useCallback((feature: any) => {
    const stateName = feature.properties?.NAME_1;
    const score = stateSeverity[stateName];
    if (score) {
      return {
        fillColor: SEVERITY_COLORS[score],
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.6
      };
    }
    return {
      fillColor: '#cbd5e1',
      weight: 1,
      opacity: 0.5,
      color: 'white',
      fillOpacity: 0.1
    };
  }, [stateSeverity]);

  // Only plot items with exact geographic coordinate tags`;

const rx = /export function ThreatMap\(\{ items, flyToArea \}: ThreatMapProps\) \{\s*\/\/\s*Only plot items with exact geographic coordinate tags/m;

if (rx.test(content) && !content.includes('CITY_TO_STATE')) {
    content = content.replace(rx, patchReplace);
    content = content.replace(/<TileLayer[\s\S]*?\/>/m, (match) => { return match + '\n        <GeoJSON \n            data={indiaStatesData as any} \n            style={geoJsonStyle} \n        />'; });
    
    fs.writeFileSync(filePath, content);
    console.log('ThreatMap patched!');
} else {
    console.log('ThreatMap patch failed or already patched.');
}
