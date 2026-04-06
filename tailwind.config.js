/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                // Intelligence Navy palette (Refined for Enterprise Professional look)
                intel: {
                    950: '#020617', // Deep Sea Slate
                    900: '#0f172a', // Navy Night
                    800: '#1e293b', 
                    700: '#334155',
                    600: '#475569',
                    500: '#64748b',
                    400: '#94a3b8',
                    300: '#cbd5e1',
                    200: '#e2e8f0',
                    100: '#f1f5f9',
                },
                // Maroon accent (Premium shade)
                maroon: {
                    950: '#2d0000',
                    900: '#450000',
                    800: '#600000',
                    700: '#7a0000',
                    600: '#8b0000',
                    500: '#a30000',
                    400: '#c51e1e',
                    300: '#e05252',
                    200: '#f5aaaa',
                    100: '#fde8e8',
                },
                // Enterprise Slate Override (for high-density UI)
                slate: {
                    950: '#020617',
                    900: '#0f172a',
                    850: '#111827', // Mid-tone for depth
                    800: '#1e293b',
                },
                // Keep brand for admin panel
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                }
            },
            boxShadow: {
                'premium': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'glass': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
            },
            fontFamily: {
                cinzel: ['"Cinzel Decorative"', 'Cinzel', 'Georgia', 'serif'],
                playfair: ['"Playfair Display"', 'Georgia', 'serif'],
                inter: ['Inter', 'system-ui', 'sans-serif'],
                clarendon: ['"Besley"', 'Clarendon', 'Rockwell', '"Zilla Slab"', 'serif'],
            },
            animation: {
                'marquee': 'marquee 40s linear infinite',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' }, // Half because of duplicated content
                }
            }
        }
    },
    plugins: [],
}
