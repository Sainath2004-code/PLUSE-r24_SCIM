import React, { useState } from 'react';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FileText, PlusCircle, CheckSquare,
    Settings, LogOut, FileUp, Image, Sun, Moon,
    Bell, ChevronDown, BarChart2, Menu, X
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
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950 font-inter overflow-hidden">

            {/* ── SIDEBAR ── */}
            <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-200 bg-intel-950 border-r border-intel-800 flex flex-col shrink-0`}>

                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-intel-900 shrink-0">
                    {sidebarOpen ? (
                        <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded bg-maroon-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">P</div>
                            <div className="overflow-hidden">
                                <p className="text-white font-black text-sm leading-none truncate font-clarendon tracking-tight">PULSE-R24</p>
                                <p className="text-intel-400 text-[9px] uppercase tracking-[0.2em] mt-1 font-mono font-bold">Intelligence CMS</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="w-7 h-7 rounded bg-maroon-600 flex items-center justify-center text-white font-bold text-xs mx-auto shadow-sm">P</div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label}>
                            {sidebarOpen && (
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-intel-500 px-3 mb-2.5">{section.label}</p>
                            )}
                            <div className="space-y-1">
                                {section.items.map(item => {
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={item.path + item.label}
                                            to={item.path}
                                            title={!sidebarOpen ? item.label : undefined}
                                            className={`flex items-center gap-3 px-3 py-2 rounded transition-all group ${active
                                                    ? 'bg-maroon-600 text-white shadow-md'
                                                    : 'text-intel-300 hover:bg-intel-900 hover:text-white'
                                                }`}
                                        >
                                            <item.icon size={16} className={`shrink-0 ${active ? 'text-white' : 'text-intel-500 group-hover:text-maroon-400 transition-colors'}`} />
                                            {sidebarOpen && <span className="text-sm font-semibold truncate tracking-tight">{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div className="p-3 border-t border-intel-900 shrink-0 bg-intel-950/50">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="w-8 h-8 rounded bg-intel-800 border border-intel-700 flex items-center justify-center text-maroon-400 font-bold text-sm shrink-0">
                                {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[13px] font-bold text-white truncate">{admin.name}</p>
                                <p className="text-[10px] text-intel-500 truncate font-mono">{admin.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-intel-500 hover:text-maroon-400 transition-colors p-1"
                                title="Sign out"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center text-intel-500 hover:text-maroon-400 py-2 transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </aside>

            {/* ── MAIN CONTENT AREA ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* ── TOPBAR ── */}
                <header className="h-14 bg-white dark:bg-intel-900 border-b border-gray-200 dark:border-intel-800 flex items-center px-6 gap-4 shrink-0 z-10">
                    {/* Sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(s => !s)}
                        className="text-intel-400 hover:text-intel-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    {/* Breadcrumb / page title */}
                    <div className="flex-1">
                        <p className="text-sm font-black text-intel-900 uppercase tracking-widest font-inter">
                            {NAV_SECTIONS.flatMap(s => s.items).find(i => isActive(i.path))?.label ?? 'Admin'}
                        </p>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {/* Dark mode */}
                        <button
                            onClick={toggle}
                            className="p-2 rounded-lg text-intel-400 hover:text-intel-900 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Notifications stub */}
                        <button className="p-2 rounded-lg text-intel-400 hover:text-intel-900 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-maroon-600 rounded-full"></span>
                        </button>

                        <div className="w-px h-6 bg-gray-200 mx-2"></div>

                        {/* Profile dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(o => !o)}
                                className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-7 h-7 rounded bg-intel-900 flex items-center justify-center text-white text-xs font-black shadow-sm">
                                    {admin.name.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-intel-900 hidden sm:block">{admin.name}</span>
                                <ChevronDown size={14} className="text-intel-300" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-xl py-1 z-50 animate-scale-in">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                        <p className="text-xs font-black text-intel-900 uppercase tracking-tighter">{admin.name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{admin.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-maroon-600 hover:bg-maroon-50 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut size={14} /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── PAGE CONTENT ── */}
                <main className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-slate-950">
                    <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="list" element={<AdminList />} />
                        <Route path="create" element={<AdminCreate />} />
                        <Route path="edit/:id" element={<AdminCreate />} />
                        <Route path="approvals" element={<AdminApprovals />} />
                        <Route path="layouts" element={<AdminLayouts />} />
                        <Route path="pdf-upload" element={<AdminPdfUpload />} />
                        <Route path="media" element={<AdminMedia />} />
                    </Routes>
                </main>
            </div>

            {/* Close profile dropdown when clicking outside */}
            {profileOpen && (
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
            )}
        </div>
    );
};

