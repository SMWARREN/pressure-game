import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    // PWA DISABLED: causing slow dev server startup
    // VitePWA({
    //   selfDestroying: true,
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: [],
    //   },
    //   devOptions: { enabled: false },
    // }),
  ],
  resolve: {
    alias: {
      '@/game': path.resolve(__dirname, '../../src/game'),
      '@/utils': path.resolve(__dirname, '../../src/utils'),
      '@/config': path.resolve(__dirname, '../../src/config'),
      '@/shared': path.resolve(__dirname, '../../src'),
      '@/components': path.resolve(__dirname, './components'),
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
          if (
            id.includes('game/modes/classic/') ||
            id.includes('game/modes/blitz/') ||
            id.includes('game/modes/zen/')
          ) {
            return 'modes-pressure';
          }
          // Arcade: candy, shoppingSpree
          if (id.includes('game/modes/candy/') || id.includes('game/modes/shoppingSpree/')) {
            return 'modes-arcade';
          }
          // Strategy: quantum_chain, outbreak
          if (id.includes('game/modes/quantumChain/') || id.includes('game/modes/outbreak/')) {
            return 'modes-strategy';
          }
          // Brain Games: memoryMatch
          if (id.includes('game/modes/memoryMatch/')) {
            return 'modes-brain';
          }
          // Arcade+: gravityDrop, mirrorForge
          if (id.includes('game/modes/gravityDrop/') || id.includes('game/modes/mirrorForge/')) {
            return 'modes-arcade-plus';
          }
          // Experimental: laserRelay, voltage, fuse
          if (
            id.includes('game/modes/laserRelay/') ||
            id.includes('game/modes/voltage/') ||
            id.includes('game/modes/fuse/')
          ) {
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
    hmr: false, // Disable HMR to prevent reload hangs
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    middlewareMode: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});
