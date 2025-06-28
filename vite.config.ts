import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Ensure public assets are properly copied
  publicDir: 'public',
  build: {
    // Copy all files from public directory to dist
    copyPublicDir: true,
    assetsDir: 'assets',
  },
});