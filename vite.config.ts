import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative build assets support both the /Memory_Atlas/ GitHub Pages path
  // and a future custom domain. Runtime JSON media paths are normalized too.
  base: './',
})
