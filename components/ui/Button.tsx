import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> =
    ({ className = '', variant = 'primary', ...props }) => {
        const base = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
        const variants = {
            primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
            secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm",
            danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
            ghost: "text-slate-600 hover:bg-slate-100"
        };
        return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
    };
