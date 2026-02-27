/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./App.tsx"
    ],
    theme: {
        extend: {
            colors: {
                // Intelligence Navy palette
                intel: {
                    950: '#000d1a',
                    900: '#001428',
                    800: '#001f3f',
                    700: '#002d5c',
                    600: '#003c7a',
                    500: '#004d99',
                    400: '#2170c4',
                    300: '#5b9bd5',
                    200: '#9fc3e8',
                    100: '#d4e8f7',
                },
                // Maroon accent (matches PDF brand color)
                maroon: {
                    900: '#4a0000',
                    800: '#6b0000',
                    700: '#7d0000',
                    600: '#8b0000',
                    500: '#a10000',
                    400: '#c41e1e',
                    300: '#e05252',
                    200: '#f5aaaa',
                    100: '#fde8e8',
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
            fontFamily: {
                cinzel: ['"Cinzel Decorative"', 'Cinzel', 'Georgia', 'serif'],
                playfair: ['"Playfair Display"', 'Georgia', 'serif'],
                inter: ['Inter', 'system-ui', 'sans-serif'],
                clarendon: ['"Besley"', 'Clarendon', 'Rockwell', '"Zilla Slab"', 'serif'],
            }
        }
    },
    plugins: [],
}
