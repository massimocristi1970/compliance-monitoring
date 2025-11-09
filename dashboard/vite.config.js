import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// These lines are necessary to get the correct path in a Node.js module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  base: '/compliance-monitoring/',

  // --- THIS IS THE FIX ---
  // This tells Vite that your 'public' folder is 
  // one directory UP from this config file.
  publicDir: path.resolve(__dirname, '../public'),
  // --- END OF FIX ---

  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
