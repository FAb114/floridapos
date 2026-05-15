import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: siempre './' para que Electron encuentre los assets
  // tanto en dev:electron como en el instalador
  base: './',
  build: { outDir: 'dist', assetsDir: 'assets' },
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['xlsx'],
  },
})
