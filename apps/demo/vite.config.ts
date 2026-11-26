import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['@valance-ui/vue'],
  },
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
  },
})
