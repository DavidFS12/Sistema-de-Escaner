import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import mkcert from "vite-plugin-mkcert"
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mkcert(),
    tailwindcss(),
  ],
  server: {
    https: true,
    http: true,
  },
  resolve: {
    "@": path.resolve(__dirname, "./src"),
  },
  assetsInclude: ['**/*.glb'],
})
