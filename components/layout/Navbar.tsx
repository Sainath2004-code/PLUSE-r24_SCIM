import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);

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

                    {/* LEFT — RRU Logo */}
                    <a href="https://rru.ac.in/campuses/puducherry" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 md:gap-3 order-1 md:order-none group hover:opacity-90 transition-all cursor-pointer">
                        <img
                            src="/logos/rru-logo.png"
                            alt="Rashtriya Raksha University"
                            className="h-10 w-10 md:h-14 md:w-14 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
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

                    {/* CENTER — PULSE-R24 brand */}
                    <div className="flex justify-center flex-1 min-w-[50%] md:min-w-0 order-3 md:order-none w-full md:w-auto mt-2 md:mt-0">
                        <Link to="/" className="flex flex-col items-center">
                            <h1 className={`font-clarendon text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-none text-center ${scrolled ? 'text-maroon-600' : 'text-intel-900'}`}>
                                PULSE-R<sup className="text-base sm:text-lg">24</sup>
                            </h1>
                            <span className="text-[8px] sm:text-[9px] uppercase font-inter font-semibold tracking-widest text-gray-500 mt-1 text-center">
                                ISSP | RRU Puducherry
                            </span>
                        </Link>
                    </div>

                    {/* RIGHT — PGDSCIM Logo + Nav links */}
                    <div className="flex items-center justify-end gap-3 md:gap-4 order-2 md:order-none">
                        {/* Desktop nav links */}
                        <div className="hidden lg:flex items-center gap-6">
                            <Link to="/" className="text-gray-600 hover:text-maroon-600 font-inter text-sm font-medium transition-colors">
                                Intelligence Feed
                            </Link>
                            <a href="#about" className="text-gray-600 hover:text-maroon-600 font-inter text-sm font-medium transition-colors">
                                About Us
                            </a>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-maroon-600 rounded-full"></div>
                                <Link to="/admin" className="text-intel-800 font-inter text-sm font-bold uppercase tracking-wider hover:text-maroon-600 transition-colors">
                                    Admin
                                </Link>
                            </div>
                        </div>

                        {/* PGDSCIM Logo */}
                        <div className="flex items-center gap-2">
                            <div className="hidden lg:block text-right">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-700 leading-tight">
                                    PGDSCIM
                                </p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">
                                    RRU Puducherry
                                </p>
                            </div>
                            <img
                                src="/logos/pgdscim-logo.png"
                                alt="PGDSCIM – Security & Corporate Intelligence Management"
                                className="h-10 w-10 md:h-14 md:w-14 object-contain drop-shadow-sm"
                            />
                        </div>

                        {/* Mobile hamburger */}
                        <button className="lg:hidden text-gray-600 hover:text-gray-900 ml-1">
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
