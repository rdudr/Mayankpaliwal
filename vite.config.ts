import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // three.js lives in its own lazy chunk (desktop loader only), so its size is expected.
  build: { chunkSizeWarningLimit: 900 },
})
