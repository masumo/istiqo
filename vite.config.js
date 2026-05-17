import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'nur-master.png', 'nur-master.jpg'],
      manifest: {
        name: 'Istiqo - Quran Vocab Journey',
        short_name: 'Istiqo',
        description: 'Gamified Quranic Arabic Vocabulary Learning App',
        theme_color: '#F6F3E6',
        background_color: '#F6F3E6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/assets/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}']
      }
    })
  ],
  server: {
    port: 5173,
    // Pakai localhost di browser agar cocok dengan Google OAuth "Authorized JavaScript origins"
    host: 'localhost',
    proxy: {
      // All /api/* requests are forwarded to the Express backend.
      // This ensures the frontend NEVER calls external APIs directly.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
