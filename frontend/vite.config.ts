import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const api = { '/api': { target: 'http://localhost:4000', changeOrigin: true } }

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: api },
  preview: { port: 5173, strictPort: true, proxy: api },
})
