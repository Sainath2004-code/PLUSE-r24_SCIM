import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const Privacy: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-inter">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
                <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                <p className="text-gray-600 leading-relaxed mb-4">
                    This portal is intended for intelligence brief distribution and operational awareness.
                    We do not intentionally collect personal data beyond what is required for contact and
                    subscription requests.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                    If you submit an email address through the subscription form, it is used only to deliver
                    updates and may be removed on request. No data is sold or shared with third parties.
                </p>
                <p className="text-gray-600 leading-relaxed">
                    For questions or removal requests, contact the editorial team using the links in the footer.
                </p>
            </main>
            <Footer />
        </div>
    );
};
