import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    children: React.ReactNode;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    children,
    className = '',
    ...props
}) => {
    const base = 'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed font-inter';

    const variants: Record<string, string> = {
        primary: 'bg-maroon-600 text-white hover:bg-maroon-700 active:bg-maroon-800',
        secondary: 'bg-transparent border border-intel-600 text-intel-800 hover:bg-intel-800 hover:text-white',
        ghost: 'bg-transparent text-gray-600 hover:text-maroon-600 hover:underline',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};
