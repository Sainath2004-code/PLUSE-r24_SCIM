import React, { useState } from 'react';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FileText, PlusCircle, CheckSquare,
    Settings, LogOut, FileUp, Image, Sun, Moon,
    Bell, ChevronDown, BarChart2, Menu, X, Mail
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Admin } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminList } from './AdminList';
import { AdminCreate } from './AdminCreate';
import { AdminApprovals } from './AdminApprovals';
import { AdminLayouts } from './AdminLayouts';
import { AdminPdfUpload } from './AdminPdfUpload';
import { AdminMedia } from './AdminMedia';
import { AdminEmail } from './AdminEmail';
import { useDarkMode } from '../../hooks/useDarkMode';

const NAV_SECTIONS = [
    {
        label: 'Content',
        items: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
            { label: 'All Articles', path: '/admin/list', icon: FileText },
            { label: 'Add Article', path: '/admin/create', icon: PlusCircle },
            { label: 'Approvals', path: '/admin/approvals', icon: CheckSquare },
        ]
    },
    {
        label: 'Media & Tools',
        items: [
            { label: 'PDF Import', path: '/admin/pdf-upload', icon: FileUp },
            { label: 'Media Library', path: '/admin/media', icon: Image },
            { label: 'Analytics', path: '/admin/dashboard', icon: BarChart2 },
            { label: 'Email Dashboard', path: '/admin/email', icon: Mail },
        ]
    },
    {
        label: 'System',
        items: [
            { label: 'Layouts', path: '/admin/layouts', icon: Settings },
        ]
    }
];

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, toggle } = useDarkMode();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const [admin] = useState<Admin | null>(() => {
        const token = localStorage.getItem('news_auth_token');
        if (!token) return null;
        return storageService.getAuth(token);
    });

    // Redirect if no auth
    React.useEffect(() => {
        const token = localStorage.getItem('news_auth_token');
        if (!token || !storageService.getAuth(token)) {
            navigate('/admin');
        }
    }, [navigate]);

    if (!admin) return null;

    const handleLogout = () => {
        localStorage.removeItem('news_auth_token');
        navigate('/admin');
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-inter overflow-hidden premium-scrollbar">

            {/* ── SIDEBAR ── */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-slate-900 dark:bg-slate-950/50 backdrop-blur-sm border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0 z-20`}>

                {/* Logo */}
                <div className="h-16 flex items-center px-5 shrink-0">
                    {sidebarOpen ? (
                        <Link to="/admin/dashboard" className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maroon-500 to-maroon-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-maroon-900/40">P</div>
                            <div className="overflow-hidden">
                                <p className="text-white font-black text-sm tracking-tighter leading-none">PULSE-R24</p>
                                <p className="text-slate-500 dark:text-slate-400 text-[9px] uppercase tracking-[0.25em] mt-1 font-bold">Commander</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-maroon-500 to-maroon-700 flex items-center justify-center text-white font-black text-sm mx-auto shadow-lg shadow-maroon-900/40">P</div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-6 space-y-7 px-3 premium-scrollbar">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label}>
                            {sidebarOpen && (
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 px-4 mb-3">{section.label}</p>
                            )}
                            <div className="space-y-1.5">
                                {section.items.map(item => {
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={item.path + item.label}
                                            to={item.path}
                                            title={!sidebarOpen ? item.label : undefined}
                                            className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${active
                                                    ? 'bg-white/5 dark:bg-white/10 text-white shadow-sm'
                                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {active && <div className="absolute left-1 w-1 h-5 bg-maroon-500 rounded-full" />}
                                            <item.icon size={18} className={`shrink-0 transition-colors ${active ? 'text-maroon-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                            {sidebarOpen && <span className="text-[13px] font-bold truncate tracking-tight">{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User footer - display only, logout is in header */}
                <div className="p-4 border-t border-slate-200 dark:border-white/5 shrink-0 bg-white/5 dark:bg-black/20">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 px-2 py-1">
                            <div className="w-9 h-9 rounded-full bg-slate-800 dark:bg-white/10 border border-slate-700 dark:border-white/10 flex items-center justify-center text-maroon-400 font-black text-sm shrink-0">
                                {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[13px] font-bold text-white truncate">{admin.name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono tracking-tight font-bold">{admin.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-white/10 border border-slate-700 dark:border-white/10 flex items-center justify-center text-maroon-400 font-black text-sm">
                                {admin.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── MAIN CONTENT AREA ── */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* ── TOPBAR ── */}
                <header className="h-16 glass dark:glass-dark border-b border-white/10 dark:border-white/5 flex items-center px-8 gap-6 shrink-0 z-40 mx-6 mt-4 rounded-2xl">
                    {/* Sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(s => !s)}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {/* Breadcrumb / page title */}
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-inter mb-0.5">Navigation Context</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter font-inter uppercase">
                            {NAV_SECTIONS.flatMap(s => s.items).find(i => isActive(i.path))?.label ?? 'Command Center'}
                        </p>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-3">
                        {/* Dark mode */}
                        <button
                            onClick={toggle}
                            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95"
                            title={isDark ? 'Switch to daylight' : 'Switch to stealth mode'}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Notifications stub */}
                        <button className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all relative active:scale-95">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-maroon-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></span>
                        </button>

                        <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-2"></div>

                        {/* Profile dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(o => !o)}
                                className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white/10 flex items-center justify-center text-white text-xs font-black shadow-md border border-white/5">
                                    {admin.name.charAt(0)}
                                </div>
                                <div className="text-left hidden lg:block">
                                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Admin Profile</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-none">{admin.name}</p>
                                </div>
                                <ChevronDown size={14} className="text-slate-400 ml-1" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-3 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-200/80 dark:shadow-black/60 z-[100] animate-scale-in overflow-hidden">
                                    {/* User info header */}
                                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
                                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight line-clamp-1">{admin.name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{admin.email}</p>
                                    </div>
                                    {/* Actions */}
                                    <div className="p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-maroon-600 dark:text-maroon-400 hover:bg-maroon-50 dark:hover:bg-maroon-500/10 rounded-xl flex items-center gap-3 transition-all"
                                        >
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── PAGE CONTENT ── */}
                <main className="flex-1 overflow-auto p-8 pt-4 premium-scrollbar">
                    <div className="max-w-[1600px] mx-auto animate-slide-up">
                        <Routes>
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="list" element={<AdminList />} />
                            <Route path="create" element={<AdminCreate />} />
                            <Route path="edit/:id" element={<AdminCreate />} />
                            <Route path="approvals" element={<AdminApprovals />} />
                            <Route path="layouts" element={<AdminLayouts />} />
                            <Route path="pdf-upload" element={<AdminPdfUpload />} />
                            <Route path="media" element={<AdminMedia />} />
                            <Route path="email/*" element={<AdminEmail />} />
                        </Routes>
                    </div>
                </main>
            </div>

            {profileOpen && (
                <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
            )}
        </div>
    );
};

