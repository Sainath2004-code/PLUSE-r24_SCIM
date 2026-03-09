import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';
import { SetupInstructions } from '../../components/SetupInstructions';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('admin@demo.local');
    const [password, setPassword] = useState('demo123');
    const [loading, setLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        // Attempt silent connection check on load
        const check = async () => {
            const conn = await storageService.checkConnection();
            if (!conn.connected && conn.error) {
                // Automatically show setup if tables are missing immediately
                setErrorDetails(storageService.getErrorMessage(conn.error));
            }
        };
        check();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorDetails(null); // Clear previous errors

        const result = await storageService.loginAdmin(email, password);
        setLoading(false);

        if (result.success && result.token) {
            localStorage.setItem('news_auth_token', result.token);
            addToast('Welcome back!', 'success');
            navigate('/admin/dashboard');
        } else {
            const err = result.error;
            const msg = storageService.getErrorMessage(err);

            // Check if it's a critical missing table error
            if (err && (err.code === 'PGRST205' || err.code === '42P01' || msg.includes('relation "news_admins" does not exist'))) {
                setErrorDetails(msg);
                addToast('Database tables missing.', 'error');
            } else {
                // It's just a regular login failure (wrong pass) or network error
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
        <div className="min-h-screen bg-intel-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-maroon-900/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-intel-800/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

            <div className="w-full max-w-md relative z-10">
                <Link to="/" className="inline-flex items-center gap-2 text-intel-400 hover:text-white transition-colors mb-8 font-bold text-xs uppercase tracking-widest font-mono group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to News Portal
                </Link>

                <Card className="w-full p-10 shadow-3xl border-intel-800 bg-intel-900/40 backdrop-blur-xl text-white rounded-none border-t-4 border-t-maroon-600">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-maroon-600 rounded mx-auto flex items-center justify-center text-white font-black text-3xl mb-6 shadow-2xl shadow-maroon-900/40 font-clarendon">P</div>
                        <h1 className="text-3xl font-black text-white font-clarendon tracking-tight">PULSE-R<sup>24</sup></h1>
                        <p className="text-intel-400 text-[10px] mt-2 uppercase tracking-[0.3em] font-mono font-bold">Intelligence Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-intel-400 mb-2 font-mono">Terminal ID (Email)</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-intel-950/50 text-white border border-intel-800 rounded focus:ring-1 focus:ring-maroon-500 focus:border-maroon-500 outline-none transition-all placeholder-intel-700 text-sm font-mono"
                                placeholder="name@intel.r24"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-intel-400 mb-2 font-mono">Access Code (Password)</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-intel-950/50 text-white border border-intel-800 rounded focus:ring-1 focus:ring-maroon-500 focus:border-maroon-500 outline-none transition-all text-sm font-mono"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || seeding}
                            className="w-full py-4 rounded bg-maroon-600 hover:bg-maroon-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg shadow-maroon-900/20 active:scale-[0.98]"
                        >
                            {loading ? 'Authenticating...' : 'Establish Secure Connection'}
                        </button>
                    </form>

                    {errorDetails ? (
                        <div className="mt-8">
                            <SetupInstructions errorDetails={errorDetails} />
                            <button
                                onClick={handleManualSeed}
                                disabled={seeding}
                                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded bg-intel-800 hover:bg-intel-700 text-white text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 border border-intel-700"
                            >
                                {seeding ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                                {seeding ? 'Initializing System...' : 'Emergency DB Initialization'}
                            </button>
                        </div>
                    ) : (
                        <div className="mt-8 text-center text-[10px] text-intel-500 bg-intel-950/50 p-4 rounded border border-intel-800 font-mono">
                            <span className="text-intel-400 font-bold">Standard Credentials:</span><br />
                            User: <span className="text-intel-300">admin@demo.local</span><br />
                            Pass: <span className="text-intel-300">demo123</span>
                        </div>
                    )}
                </Card>

                <p className="text-center mt-8 text-intel-600 text-[10px] font-mono leading-relaxed px-8">
                    UNAUTHORIZED ACCESS TO THIS TERMINAL IS STRICTLY PROHIBITED. ALL ACTIVITIES ARE MONITORED AND LOGGED.
                </p>
            </div>
        </div>
    );
};
