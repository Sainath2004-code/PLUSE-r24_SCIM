import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'dark' | 'featured';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default' }) => {
    const base = 'overflow-hidden transition-colors duration-150';

    const variants: Record<string, string> = {
        default: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-maroon-300 dark:hover:border-slate-600',
        dark: 'bg-intel-800 dark:bg-slate-900 border border-intel-700 dark:border-slate-700 text-white',
        featured: 'bg-white dark:bg-slate-800 border-l-4 border-l-maroon-600 border border-gray-200 dark:border-slate-700 hover:border-maroon-200',
    };

    return (
        <div className={`${base} ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
};
