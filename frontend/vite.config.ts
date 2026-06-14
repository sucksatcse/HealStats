import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'HealthStats',
        short_name: 'HealthStats',
        description: 'Offline-first EHR for rural hospitals in Bangladesh',
        theme_color: '#0EA5E9',
        background_color: '#0f172a',
        display: 'standalone',
        lang: 'en',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});