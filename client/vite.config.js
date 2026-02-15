import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // 👈 Import added

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // 👈 Plugin added here
  ],
  define: {
    // Ye simple-peer ke liye zaroori hai
    global: 'window', 
  },
})