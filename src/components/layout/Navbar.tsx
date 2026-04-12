import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">

                {/* Responsive Header Layout */}
                <div className="flex flex-wrap md:grid md:grid-cols-3 items-center justify-between gap-y-3">

                    {/* LEFT - RRU Logo */}
                    <a href="https://rru.ac.in/campuses/puducherry" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 md:gap-3 order-1 md:order-none group hover:opacity-90 transition-all cursor-pointer">
                        <img
                            src="/logos/rru-logo.png"
                            alt="Rashtriya Raksha University"
                            className="h-12 w-12 md:h-16 md:w-16 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                        />
                        <div className="hidden lg:block text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest leading-tight text-intel-900 group-hover:text-intel-700 transition-colors">
                                Rashtriya Raksha University
                            </p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5 group-hover:text-intel-600 transition-colors">
                                Puducherry Campus
                            </p>
                        </div>
                    </a>

                    {/* CENTER - PULSE-R24 brand */}
                    <div className="flex justify-center flex-1 min-w-[50%] md:min-w-0 order-3 md:order-none w-full md:w-auto mt-2 md:mt-0">
                        <Link to="/" className="flex flex-col items-center">
                            <h1 className="font-clarendon text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-none text-center text-maroon-600">
                                PULSE-R<sup className="text-base sm:text-lg">24</sup>
                            </h1>
                        </Link>
                    </div>

                    {/* RIGHT - Admin link + ISSP Logo */}
                    <div className="flex items-center justify-end gap-3 md:gap-5 order-2 md:order-none">
                        {/* Desktop nav links */}
                        <div className="hidden lg:flex items-center gap-8">
                            <Link to="/?section=feed" className="text-gray-600 hover:text-maroon-600 font-inter text-sm font-medium transition-all hover:scale-105">
                                Intelligence Feed
                            </Link>
                            <Link to="/?section=about" className="text-gray-600 hover:text-maroon-600 font-inter text-sm font-medium transition-all hover:scale-105">
                                About Us
                            </Link>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-maroon-50 rounded-full border border-maroon-100">
                                <Link to="/admin" className="text-maroon-800 font-inter text-xs font-black uppercase tracking-widest hover:text-maroon-600 transition-colors">
                                    Admin
                                </Link>
                            </div>
                        </div>

                        {/* ISSP Logo */}
                        <div className="flex items-center pl-2 border-l border-gray-100">
                            <img
                                src="/logos/issp-logo.png"
                                alt="ISSP - International Society for Security Professionals"
                                className="h-16 w-auto md:h-24 md:w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
                            />
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            className="lg:hidden text-gray-600 hover:text-gray-900 ml-1"
                            onClick={() => setMobileOpen(o => !o)}
                            aria-label="Toggle navigation menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="lg:hidden border-t border-gray-200 bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
                        <Link
                            to="/?section=feed"
                            onClick={() => setMobileOpen(false)}
                            className="text-gray-700 hover:text-maroon-600 font-inter text-sm font-semibold"
                        >
                            Intelligence Feed
                        </Link>
                        <Link
                            to="/?section=about"
                            onClick={() => setMobileOpen(false)}
                            className="text-gray-700 hover:text-maroon-600 font-inter text-sm font-semibold"
                        >
                            About Us
                        </Link>
                        <Link
                            to="/admin"
                            onClick={() => setMobileOpen(false)}
                            className="text-intel-800 font-inter text-sm font-bold uppercase tracking-wider hover:text-maroon-600 transition-colors"
                        >
                            Admin
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};
