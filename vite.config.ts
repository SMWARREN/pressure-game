import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'robots.txt'],
      manifest: {
        name: 'PRESSURE - Pipe Puzzle',
        short_name: 'PRESSURE',
        description: 'A challenging pipe puzzle game with wall compression mechanics',
        theme_color: '#6366f1',
        background_color: '#06060f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        categories: ['games', 'puzzle'],
        screenshots: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split React into its own chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Split Zustand into its own chunk
          if (id.includes('node_modules/zustand/')) {
            return 'zustand';
          }
          
          // Chunk game modes by menu group (from src/game/modes/index.ts MODE_GROUPS)
          // Pressure Series: classic, blitz, zen
          if (id.includes('/src/game/modes/classic/') || id.includes('/src/game/modes/blitz/') || id.includes('/src/game/modes/zen/')) {
            return 'modes-pressure';
          }
          // Arcade: candy, shoppingSpree
          if (id.includes('/src/game/modes/candy/') || id.includes('/src/game/modes/shoppingSpree/')) {
            return 'modes-arcade';
          }
          // Strategy: quantum_chain, outbreak
          if (id.includes('/src/game/modes/quantumChain/') || id.includes('/src/game/modes/outbreak/')) {
            return 'modes-strategy';
          }
          // Brain Games: memoryMatch
          if (id.includes('/src/game/modes/memoryMatch/')) {
            return 'modes-brain';
          }
          // Arcade+: gravityDrop, mirrorForge
          if (id.includes('/src/game/modes/gravityDrop/') || id.includes('/src/game/modes/mirrorForge/')) {
            return 'modes-arcade-plus';
          }
          // Experimental: laserRelay, voltage, fuse
          if (id.includes('/src/game/modes/laserRelay/') || id.includes('/src/game/modes/voltage/') || id.includes('/src/game/modes/fuse/')) {
            return 'modes-experimental';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    hmr: {
      host: '0.0.0.0',
      port: 3000,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})
