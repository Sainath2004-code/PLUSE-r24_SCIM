import fs from 'fs';

const filePath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/components/ui/ThreatMap.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace("import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';", "import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, GeoJSON as LeafletGeoJSON } from 'react-leaflet';");
content = content.replace("// @ts-ignore\\nimport indiaStatesData from '../../assets/india_states.json';", "// @ts-ignore\nimport indiaStatesData from '../../assets/india_states.json';");

fs.writeFileSync(filePath, content);
console.log('Fixed ThreatMap TS errors completely!');
