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
        <div className="min-h-screen bg-intel-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link to="/" className="inline-flex items-center gap-2 text-intel-300 hover:text-white transition-colors mb-6 font-medium">
                    <ArrowLeft size={18} /> Back to News Portal
                </Link>
                <Card className="w-full p-8 shadow-2xl border-intel-800 bg-intel-800/50 backdrop-blur text-white">
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-maroon-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-maroon-900/50 font-clarendon">P</div>
                        <h1 className="text-2xl font-bold text-white font-clarendon">PULSE-R24</h1>
                        <p className="text-intel-300 text-sm mt-1 uppercase tracking-widest font-inter">Admin Portal</p>
                        <p className="text-intel-400 mt-2 text-sm">Enter your credentials to access the dashboard.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-intel-200 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2 bg-intel-900 text-white border border-intel-700 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition-shadow placeholder-intel-500"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-intel-200 mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full px-4 py-2 bg-intel-900 text-white border border-intel-700 rounded-lg focus:ring-2 focus:ring-maroon-500 outline-none transition-shadow"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={loading || seeding} className="w-full py-3 rounded-lg bg-maroon-600 hover:bg-maroon-500 text-white font-semibold text-base transition-colors disabled:opacity-50">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    {errorDetails ? (
                        <>
                            <SetupInstructions errorDetails={errorDetails} />
                            <button
                                onClick={handleManualSeed}
                                disabled={seeding}
                                className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-intel-700 hover:bg-intel-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {seeding ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                {seeding ? 'Initializing...' : '2. Initialize Database Data'}
                            </button>
                        </>
                    ) : (
                        <div className="mt-6 text-center text-xs text-intel-400 bg-intel-900 p-3 rounded border border-intel-700">
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
