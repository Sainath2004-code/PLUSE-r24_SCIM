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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors mb-6 font-medium">
                    <ArrowLeft size={18} /> Back to News Portal
                </Link>
                <Card className="w-full p-8 shadow-lg">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-brand-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-brand-500/30">N</div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
                        <p className="text-slate-500 mt-2">Enter your credentials to access the dashboard.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full justify-center py-3 text-base" disabled={loading || seeding}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>

                    {errorDetails ? (
                        <>
                            <SetupInstructions errorDetails={errorDetails} />
                            <Button
                                onClick={handleManualSeed}
                                variant="secondary"
                                className="w-full mt-4 flex items-center gap-2"
                                disabled={seeding}
                            >
                                {seeding ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                {seeding ? 'Initializing...' : '2. Initialize Database Data'}
                            </Button>
                        </>
                    ) : (
                        <div className="mt-6 text-center text-xs text-slate-400 bg-slate-50 p-3 rounded border border-slate-200">
                            Demo Credentials:<br />
                            User: admin@demo.local<br />
                            Pass: demo123
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
