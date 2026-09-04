import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import base44 from '@base44/vite-plugin'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), base44()],
  resolve: { alias: { '@': path.resolve(process.cwd(), './src') } },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } },
  },
})