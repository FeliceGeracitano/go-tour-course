import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  // GitHub Pages serves the site under /go-tour-course/; CI sets VITE_BASE.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // content/ lives one level above client/; allow Vite to serve it in dev.
    fs: { allow: [repoRoot] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return 'vendor-react'
          if (id.includes('/node_modules/shiki/') || id.includes('/node_modules/@shikijs/')) return 'vendor-shiki'
          if (id.includes('/node_modules/framer-motion/') || id.includes('/node_modules/motion')) return 'vendor-motion'
          if (/[\\/]node_modules[\\/](react-markdown|remark|mdast|micromark|hast|unist|vfile|unified|property-information|character-entities|decode-named|space-separated|comma-separated|trim-lines|devlop|bail|trough|is-plain-obj|html-url-attributes|estree|js-yaml)/.test(id)) {
            return 'vendor-markdown'
          }
        },
      },
    },
  },
})
