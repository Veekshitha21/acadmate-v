import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Dependency optimization
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  // Dev server configuration
  server: {
    port: 5174, // frontend port
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
