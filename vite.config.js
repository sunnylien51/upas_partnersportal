import jigsaw from '@tighten/jigsaw-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        jigsaw({
            input: [
                'source/_assets/js/main.js',
                'source/_assets/css/main.css',
            ],
            // 改 Blade 會自動整站 rebuild + 重整頁面
            refresh: true,
        }),
    ],
});
