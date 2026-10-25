import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

// base './' = percorsi relativi: funziona sia in locale sia su
// GitHub Pages (https://lamaslamas.github.io/sony-settings-app/).
export default defineConfig({
  base: './',
  plugins: [preact()],
  test: { environment: 'node' },
});
