import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // We list your files here so the PWA knows to cache them
      includeAssets: ['favicon.ico', 'morphoadmin-pwa-192x192.png', 'morphoadmin-pwa-512x512.png'],
      manifest: {
        name: 'Morpho Admin',
        short_name: 'MorphoAdmin',
        description: 'Admin Dashboard for Morpho Coffee',
        theme_color: '#013E37',
        background_color: '#F4F3F2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'morphoadmin-pwa-192x192.png', // Your 192px file
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'morphoadmin-pwa-512x512.png', // Your 512px file
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'morphoadmin-pwa-512x512.png', // Your 512px file (used as maskable)
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})