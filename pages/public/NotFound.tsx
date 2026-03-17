import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, Home, ArrowLeft } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6 pt-28 pb-20">
                <div className="max-w-md w-full text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-maroon-100 rounded-2xl mb-6">
                        <AlertOctagon size={40} className="text-maroon-600" strokeWidth={1.5} />
                    </div>

                    {/* Code */}
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-maroon-500 mb-3 font-mono">
                        Error 404 - Not Found
                    </p>

                    {/* Headline */}
                    <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        Intelligence Brief<br />Not Located
                    </h1>

                    {/* Description */}
                    <p className="text-gray-500 text-base leading-relaxed mb-8">
                        The article or page you requested could not be found in our intelligence database.
                        It may have been moved, archived, or never existed.
                    </p>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Navigate</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-maroon-600 hover:bg-maroon-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-maroon-900/20"
                        >
                            <Home size={15} />
                            Intelligence Feed
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl border border-gray-200 transition-all"
                        >
                            <ArrowLeft size={15} />
                            Go Back
                        </button>
                    </div>

                    {/* Footer note */}
                    <p className="mt-10 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        PULSE-R24 - Intelligence Access Portal
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};
