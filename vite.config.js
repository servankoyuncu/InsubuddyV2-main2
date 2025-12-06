import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // NEU - wichtig für Capacitor!
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})