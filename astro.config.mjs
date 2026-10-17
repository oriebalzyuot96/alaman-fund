import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://alamanfund.jo',
  integrations: [react()],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    css: { preprocessorOptions: { scss: { api: 'modern-compiler' } } },
    ssr: { noExternal: ['three'] },
  },
});
