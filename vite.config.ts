import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Proxy cadangan: kalau browser memblokir request langsung ke Remotive (CORS),
// jobService mencoba lewat /remotive-api yang diteruskan oleh server Vite.
const remotiveProxy = {
  '/remotive-api': {
    target: 'https://remotive.com/api',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/remotive-api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: remotiveProxy },
  preview: { proxy: remotiveProxy },
})
