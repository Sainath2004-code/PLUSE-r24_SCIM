import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-inter">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
                <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-6">Terms of Use</h1>
                <p className="text-gray-600 leading-relaxed mb-4">
                    The intelligence briefs provided here are for informational and situational awareness purposes only.
                    Use of this portal does not create an advisory or contractual relationship.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                    Content may be updated or removed at any time. Redistribution of content should follow
                    internal policies and applicable regulations.
                </p>
                <p className="text-gray-600 leading-relaxed">
                    By using this portal, you agree to use the content responsibly and in accordance with local laws.
                </p>
            </main>
            <Footer />
        </div>
    );
};
