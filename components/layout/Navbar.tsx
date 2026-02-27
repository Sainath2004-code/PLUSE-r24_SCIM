import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex flex-col">
                            <h1 className={`font-clarendon text-2xl md:text-3xl font-black tracking-tight leading-none ${scrolled ? 'text-maroon-600' : 'text-intel-900'}`}>
                                PULSE-R<sup className="text-lg">24</sup>
                            </h1>
                            <span className="text-[10px] uppercase font-inter font-semibold tracking-widest text-gray-500 mt-1">
                                ISSP | RRU Puducherry
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-gray-600 hover:text-maroon-600 font-inter text-sm font-medium transition-colors">
                            Intelligence Feed
                        </Link>
                        <a href="#about" className="text-gray-600 hover:text-maroon-600 font-inter text-sm font-medium transition-colors">
                            About Us
                        </a>

                        {/* CTA / Admin Access */}
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-maroon-600 rounded-full"></div>
                            <Link to="/admin" className="text-intel-800 font-inter text-sm font-bold uppercase tracking-wider hover:text-maroon-600 transition-colors">
                                Admin Access
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button - simple stub for now */}
                    <div className="md:hidden flex items-center">
                        <button className="text-gray-600 hover:text-gray-900 p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
