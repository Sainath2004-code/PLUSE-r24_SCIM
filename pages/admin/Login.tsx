import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { SetupInstructions } from '../../components/SetupInstructions';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('admin@demo.local');
    const [password, setPassword] = useState('demo123');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const check = async () => {
            const conn = await storageService.checkConnection();
            if (!conn.connected && conn.error) {
                setErrorDetails(storageService.getErrorMessage(conn.error));
            }
        };
        check();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorDetails(null);

        const result = await storageService.loginAdmin(email, password);
        setLoading(false);

        if (result.success && result.token) {
            localStorage.setItem('news_auth_token', result.token);
            addToast('Welcome back!', 'success');
            navigate('/admin/dashboard');
        } else {
            const err = result.error;
            const msg = storageService.getErrorMessage(err);
            if (err && (err.code === 'PGRST205' || err.code === '42P01' || msg.includes('relation "news_admins" does not exist'))) {
                setErrorDetails(msg);
                addToast('Database tables missing.', 'error');
            } else {
                addToast(msg, 'error');
            }
        }
    };

    const handleManualSeed = async () => {
        setSeeding(true);
        setErrorDetails(null);
        const result = await storageService.seedIfEmpty();
        setSeeding(false);
        if (result.success) {
            addToast('Database seeded successfully. Try logging in.', 'success');
        } else {
            if (result.error) {
                const msg = storageService.getErrorMessage(result.error);
                setErrorDetails(msg);
                addToast('Seeding failed. See instructions.', 'error');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-maroon-600/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-400/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)', backgroundSize: '48px 48px' }}
                />
            </div>

            <div className="w-full max-w-sm relative z-10">
                {/* Back link */}
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 font-semibold text-xs uppercase tracking-widest group">
                    <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Portal
                </Link>

                {/* Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 overflow-hidden">
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-maroon-700 via-maroon-500 to-maroon-700" />

                    <div className="p-8">
                        {/* Logo + Brand */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-maroon-600 rounded-xl shadow-lg shadow-maroon-900/30 mb-5">
                                <Shield size={26} className="text-white" strokeWidth={2.5} />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                PULSE-R<sup className="text-base">24</sup>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1.5 uppercase tracking-[0.3em] font-bold">
                                Admin Control Panel
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="admin@demo.local"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || seeding}
                                className="w-full py-3.5 mt-2 rounded-xl bg-maroon-600 hover:bg-maroon-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg shadow-maroon-900/20 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        Authenticating…
                                    </>
                                ) : 'Sign In'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Demo</span>
                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                        </div>

                        {/* Error / Credentials */}
                        {errorDetails ? (
                            <div className="space-y-3">
                                <SetupInstructions errorDetails={errorDetails} />
                                <button
                                    onClick={handleManualSeed}
                                    disabled={seeding}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700"
                                >
                                    <RefreshCw size={13} className={seeding ? 'animate-spin' : ''} />
                                    {seeding ? 'Initializing…' : 'Initialize Database'}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center space-y-1">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Default Credentials</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 dark:text-slate-500 font-semibold">Email</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">admin@demo.local</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 dark:text-slate-500 font-semibold">Password</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">demo123</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-center text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-relaxed">
                            Unauthorized access is strictly prohibited
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
