import { defineConfig, type UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import * as path from 'path';

export default defineConfig((): UserConfig => {
    const config: UserConfig = {
        plugins: [vue()],
        build: {
            target: 'esnext',
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                input: path.resolve(__dirname, 'index.html'),
                output: {
                    format: 'es'
                }
            }
        },
        resolve: {
            dedupe: ['vscode'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                'node:path': path.resolve(__dirname, 'src/shims/node-path.ts'),
                'node:fs/promises': path.resolve(__dirname, 'src/shims/node-fs-promises.ts'),
                'node:fs': path.resolve(__dirname, 'src/shims/node-fs.ts'),
                'node:os': path.resolve(__dirname, 'src/shims/node-os.ts'),
                'node:worker_threads': path.resolve(__dirname, 'src/shims/node-worker-threads.ts'),
                'node:util': path.resolve(__dirname, 'src/shims/node-util.ts'),
                'node:child_process': path.resolve(__dirname, 'src/shims/node-child-process.ts')
            }
        },
        optimizeDeps: {
            exclude: [
                'node:fs',
                'node:path',
                'node:os',
                'node:child_process',
                'node:util',
                'node:worker_threads'
            ]
        },
        worker: {
            format: 'es'
        },
        server: {
            port: 5173
        },
        base: '/DomainLang/demo/',
    };
    return config;
});
