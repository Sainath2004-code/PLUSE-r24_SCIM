import React from 'react';
import { Globe, Linkedin, Youtube, Instagram, Facebook, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
    const today = new Date();

    return (
        <footer className="bg-gray-50 border-t border-gray-200 mt-20 pt-16 pb-8 font-inter">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand & Newsletter */}
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="font-clarendon text-3xl font-black text-maroon-600 mb-4">PULSE-R<sup className="text-xl">24</sup></h2>
                        <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-sm">
                            Where the nation's security pulse meets insight. Delivers forward-looking updates on emerging risks and developments impacting business continuity and organizational resilience.
                        </p>

                        <div className="mt-6">
                            <p className="font-medium text-gray-900 mb-3 text-sm">Subscribe to Intelligence Briefs</p>
                            <div className="flex items-end max-w-sm">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="bg-transparent border-0 border-b border-gray-300 rounded-none px-0 py-2 w-full text-sm focus:ring-0 focus:border-maroon-600 transition-colors"
                                />
                                <button className="ml-4 px-4 py-2 border border-maroon-600 text-maroon-600 hover:bg-maroon-50 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Institutional Links */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-maroon-500"></div>
                            <h3 className="font-semibold text-gray-900 tracking-wide uppercase text-xs">Initiative By</h3>
                        </div>
                        <ul className="space-y-4">
                            <li>
                                <span className="block text-sm font-medium text-gray-800">PGDSCIM (2025–26)</span>
                                <span className="block text-xs text-gray-500 mt-1">Rashtriya Raksha University, Puducherry</span>
                            </li>
                            <li className="pt-2">
                                <span className="block text-xs text-gray-500 mb-1">Guided By</span>
                                <span className="block text-sm font-medium text-gray-800">International Society for Security Professionals</span>
                                <span className="block text-xs font-mono text-maroon-600 mt-1">ISSP</span>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Social Links */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-intel-600"></div>
                            <h3 className="font-semibold text-gray-900 tracking-wide uppercase text-xs">Connect</h3>
                        </div>
                        <ul className="space-y-3 mb-8">
                            <li><a href="#" className="text-sm text-gray-600 hover:text-maroon-600 transition-colors">Contact Editorial</a></li>
                            <li><a href="#" className="text-sm text-gray-600 hover:text-maroon-600 transition-colors">Submission Guidelines</a></li>
                            <li><a href="#" className="text-sm text-gray-600 hover:text-maroon-600 transition-colors">Admin Portal</a></li>
                        </ul>
                        <div className="flex gap-3">
                            <a href="#" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-maroon-600 hover:border-maroon-600 transition-all"><Globe size={14} /></a>
                            <a href="#" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-maroon-600 hover:border-maroon-600 transition-all"><Linkedin size={14} /></a>
                            <a href="#" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-maroon-600 hover:border-maroon-600 transition-all"><Twitter size={14} /></a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500 text-center md:text-left">
                        © {today.getFullYear()} PULSE-R24 Intelligence Network. All rights reserved. <br className="md:hidden" />
                        For informational and awareness purposes only.
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500">
                        <a href="#" className="hover:text-gray-800">Privacy Policy</a>
                        <span>|</span>
                        <a href="#" className="hover:text-gray-800">Terms of Use</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
