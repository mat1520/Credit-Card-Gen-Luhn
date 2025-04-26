import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                binLookup: resolve(__dirname, 'bin-lookup.html')
            }
        }
    },
    server: {
        port: 3000,
        open: true
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    optimizeDeps: {
        include: ['jest-environment-jsdom']
    }
}); 