import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'city' | 'category' | 'status' | 'tag';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'tag', className = '' }) => {
    const base = 'inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 font-semibold';

    const variants: Record<string, string> = {
        city: 'text-maroon-600 font-bold text-xs',           // Just bold maroon text, no bg — matches PDF
        category: 'bg-intel-800 text-intel-100 px-2',        // Navy bg, light text
        status: 'bg-gray-100 text-gray-600',                  // Neutral status
        tag: 'bg-gray-100 text-gray-600 text-[10px]',        // Subtle tag
    };

    return (
        <span className={`${base} ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
