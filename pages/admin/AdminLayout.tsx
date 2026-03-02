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
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-inter overflow-hidden">

            {/* ── SIDEBAR ── */}
            <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-200 bg-intel-900 dark:bg-intel-950 border-r border-intel-800 flex flex-col shrink-0`}>

                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-intel-800 shrink-0">
                    {sidebarOpen ? (
                        <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-maroon-600 flex items-center justify-center text-white font-bold text-xs shrink-0">P</div>
                            <div className="overflow-hidden">
                                <p className="text-white font-bold text-sm leading-none truncate font-clarendon">PULSE-R24</p>
                                <p className="text-intel-300 text-[10px] uppercase tracking-wider mt-0.5">Admin CMS</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="w-7 h-7 rounded-lg bg-maroon-600 flex items-center justify-center text-white font-bold text-xs mx-auto">P</div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label}>
                            {sidebarOpen && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-intel-400 px-2 mb-2">{section.label}</p>
                            )}
                            <div className="space-y-0.5">
                                {section.items.map(item => {
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={item.path + item.label}
                                            to={item.path}
                                            title={!sidebarOpen ? item.label : undefined}
                                            className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors group ${active
                                                    ? 'bg-maroon-600 text-white'
                                                    : 'text-intel-200 hover:bg-intel-800 hover:text-white'
                                                }`}
                                        >
                                            <item.icon size={17} className="shrink-0" />
                                            {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div className="p-3 border-t border-intel-800 shrink-0">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="w-8 h-8 rounded-full bg-maroon-700 flex items-center justify-center text-maroon-200 font-bold text-sm shrink-0">
                                {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">{admin.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{admin.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                title="Sign out"
                            >
                                <LogOut size={15} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center text-slate-500 hover:text-red-400 py-2 transition-colors"
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
                <header className="h-14 bg-white dark:bg-intel-900 border-b border-slate-200 dark:border-intel-800 flex items-center px-4 gap-4 shrink-0 z-10">
                    {/* Sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(s => !s)}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    {/* Breadcrumb / page title */}
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {NAV_SECTIONS.flatMap(s => s.items).find(i => isActive(i.path))?.label ?? 'Admin'}
                        </p>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-1">
                        {/* Dark mode */}
                        <button
                            onClick={toggle}
                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Notifications stub */}
                        <button className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                            <Bell size={18} />
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative ml-2">
                            <button
                                onClick={() => setProfileOpen(o => !o)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-maroon-600 flex items-center justify-center text-white text-xs font-bold">
                                    {admin.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{admin.name}</span>
                                <ChevronDown size={14} className="text-slate-400" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-scale-in">
                                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">{admin.name}</p>
                                        <p className="text-xs text-slate-400">{admin.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut size={14} /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── PAGE CONTENT ── */}
                <main className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-slate-950">
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
