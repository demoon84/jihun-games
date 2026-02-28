import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const appTarget = String(process.env.VITE_APP_TARGET || 'studio').trim().toLowerCase();
const appEntry = appTarget === 'game'
    ? '/src/apps/game/GameApp.jsx'
    : '/src/apps/studio/StudioApp.jsx';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@app-entry': appEntry,
        }
    },
    server: {
        port: 5173,
        host: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
});
