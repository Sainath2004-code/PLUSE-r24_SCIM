import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'dark' | 'featured' | 'glass';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default' }) => {
    const base = 'overflow-hidden transition-colors duration-150';

    const variants: Record<string, string> = {
        default: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 shadow-premium text-slate-800 dark:text-slate-100 backdrop-blur-sm',
        dark: 'bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-white/5 text-slate-100 shadow-2xl',
        featured: 'bg-white dark:bg-slate-900/50 border-l-[3px] border-l-maroon-500 border border-slate-200 dark:border-white/5 shadow-xl backdrop-blur-sm',
        glass: 'glass dark:glass-dark shadow-premium',
    };

    return (
        <div className={`${base} ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
};
