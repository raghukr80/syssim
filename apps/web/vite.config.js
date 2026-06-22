import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 3000,
        host: true,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
    },
    optimizeDeps: {
        exclude: ['sim-engine'],
    },
});
