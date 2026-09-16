/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './source/**/*.blade.php',
        './source/**/*.js',
        './source/**/*.php',
        './source/**/*.html',
        './source/**/*.md',
        './config.php',
    ],
    theme: {
        screens: {
            'md': '800px',
            'lg': '1200px',
        },
        extend: {
            colors: {
                brand: 'rgb(from var(--color-brand) r g b / <alpha-value>)',
                brand2: 'rgb(from var(--color-brand2) r g b / <alpha-value>)',
                red: 'rgb(from var(--color-red) r g b / <alpha-value>)',
                green: 'rgb(from var(--color-green) r g b / <alpha-value>)',
                blue: 'rgb(from var(--color-blue) r g b / <alpha-value>)',
                gray5: 'rgb(from var(--color-gray5) r g b / <alpha-value>)',
                gray4: 'rgb(from var(--color-gray4) r g b / <alpha-value>)',
                gray3: 'rgb(from var(--color-gray3) r g b / <alpha-value>)',
                gray2: 'rgb(from var(--color-gray2) r g b / <alpha-value>)',
                gray1: 'rgb(from var(--color-gray1) r g b / <alpha-value>)',
                bg: 'rgb(from var(--color-bg) r g b / <alpha-value>)',
                bg2: 'rgb(from var(--color-bg2) r g b / <alpha-value>)',
            },
            fontFamily: {
                sans: ['Noto Sans TC','Rajdhani','sans-serif'],
                en: ['Rajdhani', 'Noto Sans TC', 'sans-serif'],
            },
            boxShadow: {
                card: '0 0 40px 0 #00000008',
            },
        },
    },
    plugins: [],
};
