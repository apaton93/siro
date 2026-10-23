import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin to IPv4 so the SWA CLI (which checks 127.0.0.1) sees it on Windows
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
