/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './source/**/*.blade.php',
        './source/**/*.js',
        './source/**/*.php',
        './source/**/*.html',
        './source/**/*.md',
    ],
    theme: {
        screens: {
            'md': '800px',
            'lg': '1200px',
        },
        extend: {
            colors: {
                brand: '#FFC800',
                brand2: '#E0AC7E',
                red: '#EF4444',
                green: '#00845F',
                gray5: '#2F3131',
                gray4: '#636568',
                gray3: '#969CA6',
                gray2: '#C2C6CD',
                gray1: '#EFF0F2',
                bg: '#F3F4F5',
                bg2: '#FBFBFC',
            },
            fontFamily: {
                sans: ['Noto Sans TC', 'sans-serif'],
                en: ['Rajdhani', 'Noto Sans TC', 'sans-serif'],
            },
            boxShadow: {
                card: '0 0 40px 0 #0000000A',
            },
        },
    },
    plugins: [],
};
