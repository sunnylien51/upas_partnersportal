import jigsaw from '@tighten/jigsaw-vite-plugin';
import { defineConfig } from 'vite';
import { spawn } from 'child_process';

function asyncJigsawBuildPlugin() {
    let building = false;
    let pending = false;
    let debounceTimer = null;

    return {
        name: 'async-jigsaw-build',
        apply: 'serve',
        configureServer(server) {
            const runBuild = () => {
                if (building) {
                    pending = true;
                    return;
                }

                building = true;
                // 勿加 -q：失敗時要看得到；避免並行重建把 build_local 清成空檔
                const child = spawn('php', ['vendor/bin/jigsaw', 'build', 'local'], {
                    shell: true,
                    stdio: ['ignore', 'pipe', 'pipe'],
                });

                let stderr = '';
                child.stderr?.on('data', (chunk) => {
                    stderr += chunk.toString();
                });

                child.on('exit', (code) => {
                    building = false;

                    if (code !== 0) {
                        console.error(`[jigsaw] build failed (exit ${code})`, stderr.trim());
                        // 失敗時再排一次，避免留下 0-byte 頁面
                        pending = true;
                    }

                    server.ws.send({ type: 'full-reload' });

                    if (pending) {
                        pending = false;
                        debounceTimer = setTimeout(runBuild, 400);
                    }
                });
            };

            const triggerBuild = () => {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                debounceTimer = setTimeout(runBuild, 400);
            };

            server.watcher.on('change', (file) => {
                const normalized = file.replace(/\\/g, '/');
                if (
                    (normalized.includes('/source/') && (normalized.endsWith('.blade.php') || normalized.endsWith('.md') || normalized.endsWith('.php'))) ||
                    normalized.endsWith('config.php')
                ) {
                    triggerBuild();
                }
            });
        },
    };
}

export default defineConfig({
    server: {
        host: true,
        port: 5173,
        strictPort: false,
        cors: true,
        hmr: {
            host: 'localhost',
            port: 5173,
        },
        watch: {
            usePolling: true,
            interval: 200,
        },
    },
    plugins: [
        jigsaw({
            input: [
                'source/_assets/js/main.js',
                'source/_assets/css/main.css',
            ],
            refresh: false,
        }),
        asyncJigsawBuildPlugin(),
    ],
});
