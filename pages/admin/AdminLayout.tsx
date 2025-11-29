import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Routes, Route } from 'react-router-dom';
import { Layout, FileText, Plus, CheckCircle, Settings, LogOut } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Admin } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminList } from './AdminList';
import { AdminCreate } from './AdminCreate';
import { AdminApprovals } from './AdminApprovals';
import { AdminLayouts } from './AdminLayouts';

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState<Admin | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('news_auth_token');
        if (!token) {
            navigate('/admin');
            return;
        }
        const user = storageService.getAuth(token);
        if (!user) {
            navigate('/admin');
        } else {
            setAdmin(user);
        }
    }, [navigate]);

    if (!admin) return null;

    const handleLogout = () => {
        localStorage.removeItem('news_auth_token');
        navigate('/admin');
    };

    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: Layout },
        { label: 'All News', path: '/admin/list', icon: FileText },
        { label: 'Create New', path: '/admin/create', icon: Plus },
        { label: 'Approvals', path: '/admin/approvals', icon: CheckCircle },
        { label: 'Layouts', path: '/admin/layouts', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3 text-white">
                    <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center font-bold">A</div>
                    <span className="font-bold text-lg">AdminPanel</span>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <item.icon size={18} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center text-brand-400 font-bold">
                            {admin.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{admin.name}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-auto p-8">
                    <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="list" element={<AdminList />} />
                        <Route path="create" element={<AdminCreate />} />
                        <Route path="edit/:id" element={<AdminCreate />} />
                        <Route path="approvals" element={<AdminApprovals />} />
                        <Route path="layouts" element={<AdminLayouts />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};
