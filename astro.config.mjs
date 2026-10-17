import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  // Deployed as a project page: https://oriebalzyuot96.github.io/alaman-fund/
  site: process.env.SITE_URL || 'https://oriebalzyuot96.github.io',
  base: process.env.BASE_PATH || '/',
  integrations: [react()],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
    ssr: { noExternal: ['three'] },
  },
});
