import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// base './' = percorsi relativi: funziona sia in locale sia su
// GitHub Pages (https://lamaslamas.github.io/sony-settings-app/).
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    // PWA: installabile e completamente offline. Tutto (app, dati JSON, analisi della foto) è nel pacchetto
    // e viene messo in cache al primo caricamento; gli aggiornamenti si installano quando li confermi (così non si ricarica a metà di una ripresa).
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Sony A7R V · Impostazioni',
        short_name: 'A7R V',
        description: 'Guida alle impostazioni della Sony A7R V per ogni situazione di ripresa.',
        lang: 'it',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111214',
        theme_color: '#111214',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { environment: 'node' },
});
