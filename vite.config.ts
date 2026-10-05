import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore -- node types aren't installed; vite.config.ts only runs in Node
import { existsSync } from 'node:fs'

// The reference character + textures are git-ignored (no licence yet), so they only exist on
// Rishabh's machine. Anywhere else (Vercel) the build falls back to the committed jake.glb.
const hasPortfolioModel = existsSync('public/models/character/model.glb') && existsSync('public/textures/matcaps/shirt.jpg')

export default defineConfig({
  define: { __HAS_PORTFOLIO_MODEL__: JSON.stringify(hasPortfolioModel) },
  plugins: [react(), tailwindcss()],
  // three.js lives in its own lazy chunk (desktop loader only), so its size is expected.
  build: { chunkSizeWarningLimit: 900 },
})
