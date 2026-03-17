import React, { useState } from 'react';
import { Globe, Linkedin, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
    const today = new Date();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        if (!valid) {
            setIsError(true);
            setMessage('Please enter a valid email address.');
            return;
        }
        setIsError(false);
        setMessage('Subscription request received.');
        setEmail('');
    };

    return (
        <footer style={{ backgroundColor: '#0D1542' }} className="border-t border-white/10 mt-20 pt-16 pb-8 font-inter">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand & Newsletter */}
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="font-clarendon text-3xl font-black text-maroon-600 mb-4">PULSE-R<sup className="text-xl">24</sup></h2>
                        <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm">
                            Where the nation's security pulse meets insight. Delivers forward-looking updates on emerging risks and developments impacting business continuity and organizational resilience.
                        </p>

                        <div className="mt-6">
                            <p className="font-medium text-white/80 mb-3 text-sm">Subscribe to Intelligence Briefs</p>
                            <form onSubmit={handleSubscribe} className="flex items-end max-w-sm">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="bg-transparent border-0 border-b border-white/30 rounded-none px-0 py-2 w-full text-sm text-white placeholder-white/40 focus:ring-0 focus:border-red-400 transition-colors outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="ml-4 px-4 py-2 border border-red-400 text-red-400 hover:bg-red-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
                                >
                                    Subscribe
                                </button>
                            </form>
                            {message && (
                                <p className={`mt-3 text-xs ${isError ? 'text-red-300' : 'text-emerald-300'}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Institutional Links */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <h3 className="font-semibold text-white/50 tracking-wide uppercase text-xs">Initiative By</h3>
                        </div>
                        <ul className="space-y-4">
                            <li>
                                <span className="block text-sm font-medium text-white/90">PGDSCIM (2025-26)</span>
                                <span className="block text-xs text-white/50 mt-1">Rashtriya Raksha University, Puducherry</span>
                            </li>
                            <li className="pt-2">
                                <span className="block text-xs text-white/40 mb-1">Guided By</span>
                                <span className="block text-sm font-medium text-white/90">International Society for Security Professionals</span>
                                <span className="block text-xs font-mono text-red-400 mt-1">ISSP</span>
                            </li>
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <h3 className="font-semibold text-white/50 tracking-wide uppercase text-xs">Connect</h3>
                        </div>
                        <ul className="space-y-3 mb-8">
                            <li><a href="mailto:editorial@pulser24.in" className="text-sm text-white/60 hover:text-red-400 transition-colors">Contact Editorial</a></li>
                            <li><a href="mailto:editorial@pulser24.in?subject=Submission%20Guidelines" className="text-sm text-white/60 hover:text-red-400 transition-colors">Submission Guidelines</a></li>
                            <li><a href="#/admin" className="text-sm text-white/60 hover:text-red-400 transition-colors">Admin Portal</a></li>
                        </ul>
                        <div className="flex gap-3">
                            <a href="https://rru.ac.in" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-400 transition-all"><Globe size={14} /></a>
                            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-400 transition-all"><Linkedin size={14} /></a>
                            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-400 transition-all"><Twitter size={14} /></a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/40 text-center md:text-left">
                        (c) {today.getFullYear()} PULSE-R24 Intelligence Network. All rights reserved. <br className="md:hidden" />
                        For informational and awareness purposes only.
                    </p>
                    <div className="flex gap-4 text-xs text-white/40">
                        <a href="#/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</a>
                        <span>|</span>
                        <a href="#/terms" className="hover:text-white/80 transition-colors">Terms of Use</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
