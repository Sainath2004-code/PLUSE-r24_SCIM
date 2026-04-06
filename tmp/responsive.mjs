import fs from 'fs';

// 1. ThreatMap
let tmPath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/components/ui/ThreatMap.tsx';
let tmText = fs.readFileSync(tmPath, 'utf8');
tmText = tmText.replace('className="relative w-full h-[500px]', 'className="relative w-full h-[350px] md:h-[500px]');
fs.writeFileSync(tmPath, tmText);

// 2. LiveTicker
let ltPath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/components/ui/LiveTicker.tsx';
let ltText = fs.readFileSync(ltPath, 'utf8');
ltText = ltText.replace('h-10 mt-4 rounded-xl', 'h-10 mt-2 md:mt-4 rounded-xl');
fs.writeFileSync(ltPath, ltText);

// 3. AdminLayout
let alPath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/pages/admin/AdminLayout.tsx';
let alText = fs.readFileSync(alPath, 'utf8');
alText = alText.replace('<aside className={`${sidebarOpen ? \'w-64\' : \'w-20\'} transition-all duration-300 bg-slate-900', '<aside className={`${sidebarOpen ? \'translate-x-0 w-64\' : \'-translate-x-full w-0 md:translate-x-0 md:w-20\'} absolute md:relative h-full transition-all duration-300 bg-slate-900');
alText = alText.replace('{/* ── SIDEBAR ── */}', '{/* ── SIDEBAR ── */}\n            {sidebarOpen && <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}\n');
alText = alText.replace('shrink-0 z-20`}>', 'shrink-0 z-[60]`}>');
fs.writeFileSync(alPath, alText);

// 4. AdminCreate
let acPath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/pages/admin/AdminCreate.tsx';
let acText = fs.readFileSync(acPath, 'utf8');
acText = acText.replace('className="grid grid-cols-2 gap-4"', 'className="grid grid-cols-1 md:grid-cols-2 gap-4"');
fs.writeFileSync(acPath, acText);

// 5. PublicHome featured
let phPath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/pages/public/PublicHome.tsx';
let phText = fs.readFileSync(phPath, 'utf8');
phText = phText.replaceAll('h-72 md:h-80', 'h-64 sm:h-72 md:h-80');
fs.writeFileSync(phPath, phText);

console.log('Mobile responsiveness applied');
