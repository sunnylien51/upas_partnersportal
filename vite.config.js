import jigsaw from '@tighten/jigsaw-vite-plugin';
import { defineConfig } from 'vite';
import { spawn } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';

const root = process.cwd();
const localBuildDir = path.join(root, 'build_local');
const hotFile = path.join(root, 'source', 'hot');

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
};

function resolveLocalFile(url) {
    const pathname = decodeURIComponent(String(url || '').split('?')[0]);
    const filePath = path.join(localBuildDir, pathname);

    if (!filePath.startsWith(localBuildDir)) {
        return null;
    }

    if (existsSync(filePath) && statSync(filePath).isFile()) {
        return filePath;
    }

    const indexPath = path.join(filePath, 'index.html');
    if (existsSync(indexPath)) {
        return indexPath;
    }

    return null;
}

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
                if (normalized.includes('/source/_assets/') && normalized.endsWith('.css')) {
                    server.ws.send({ type: 'full-reload' });
                    return;
                }
                if (
                    (normalized.includes('/source/') && (normalized.endsWith('.blade.php') || normalized.endsWith('.md') || normalized.endsWith('.php'))) ||
                    normalized.endsWith('config.php')
                ) {
                    triggerBuild();
                }
            });

            // 直接從 build_local 提供頁面，避免官方外掛把目錄路徑導成說明頁
            server.middlewares.use((req, res, next) => {
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                    next();
                    return;
                }

                const pathname = String(req.url || '').split('?')[0];
                if (!pathname.endsWith('/') && !path.extname(pathname) && resolveLocalFile(`${pathname}/`)) {
                    res.statusCode = 301;
                    res.setHeader('Location', `${pathname}/`);
                    res.end();
                    return;
                }

                const filePath = resolveLocalFile(req.url);
                if (!filePath) {
                    next();
                    return;
                }

                const extension = path.extname(filePath).toLowerCase();
                let body = readFileSync(filePath);

                if (extension === '.html' && existsSync(hotFile)) {
                    const devServerUrl = readFileSync(hotFile, 'utf8').trim();
                    if (devServerUrl) {
                        body = Buffer.from(body.toString().replaceAll(`${devServerUrl}/`, '/'));
                    }
                }

                res.setHeader('Content-Type', mimeTypes[extension] ?? 'application/octet-stream');
                res.setHeader('Cache-Control', 'no-store');
                res.end(req.method === 'HEAD' ? undefined : body);
            });
        },
    };
}

// 拿掉官方 jigsaw 外掛的 configureServer（會把 / 與子頁導成 Vite 說明頁）
function officialJigsawPlugin() {
    return jigsaw({
        input: [
            'source/_assets/js/main.js',
            'source/_assets/css/main.css',
        ],
        refresh: false,
        outDir: 'source/static',
        publicDirectory: 'source',
        buildDirectory: 'static',
    }).map((plugin) => {
        if (plugin.name !== 'jigsaw') {
            return plugin;
        }

        const { configureServer, ...rest } = plugin;
        return rest;
    });
}

export default defineConfig({
    build: {
        assetsDir: '',
    },
    server: {
        host: true,
        port: 5174,
        strictPort: true,
        cors: true,
        hmr: {
            host: 'localhost',
        },
        watch: {
            usePolling: true,
            interval: 200,
        },
    },
    plugins: [
        ...officialJigsawPlugin(),
        asyncJigsawBuildPlugin(),
    ],
});
