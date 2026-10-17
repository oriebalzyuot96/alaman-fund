# Al Aman Fund — Redesign Concept

A full redesign of [alamanfund.jo](https://alamanfund.jo) (Al Aman Fund for the Future of Orphans). All of the original content is kept: 22 pages and every news post, in English and Arabic (RTL), with their images and videos.

> This is a design concept. It is set to `noindex`, and every payment button sends the visitor to the official checkout on alamanfund.jo.

## Stack

- **Astro 5** for static pages and routing (100 pages, EN at `/`, AR at `/ar`)
- **React 19** islands for the interactive parts
- **Three.js / React Three Fiber**: a 3D hero with a shader sun rising over flowing teal ribbons (the logo's "path"), drifting embers, pointer parallax and a scroll dolly
- **Custom SCSS** design system (`src/styles`): tokens, mixins, dark mode, RTL; no CSS framework
- **Lenis** smooth scroll, IntersectionObserver reveals, counters and tilt

## Features

- **Brand loader**: redraws the logo (ribbon traces in, sun rises), tracks real readiness (fonts, page load, 3D scene ready), then splits open. Short version on repeat visits.
- **⌘K / Ctrl+K search**: Fuse.js over every page section and news post, with filters, highlighting and keyboard navigation.
- **Aman Assistant chat**: answers about donating, Kafaleh prices, Zakat, e-wallets, applying, programs and contact, in both languages, from a knowledge base written from the site's own content (`src/lib/chat-kb.ts`). Falls back to site search. Runs fully client-side.
- **Donate builder + Zakat calculator** (wealth, gold by karat, silver, crops, stocks; nisab check).
- **Illustrations**: line-art SVGs that draw in on scroll; an illustrated "journey after 18" path.
- **Video**: click-to-load YouTube players (award film, charity dinner).
- Interactive Hours-of-Education meter, wallet guide on a phone mockup, 3D report covers, filterable news.

## Develop

```bash
npm install
npm run dev        # builds src/data/content.json, then starts Astro
npm run build      # static output in dist/
```

## Content pipeline

`raw/pages.json` is the scraped source of truth.

1. `node scripts/crawl.mjs <dir>`: polite crawl of alamanfund.jo (EN + AR)
2. `node scripts/extract.mjs raw/html raw`: HTML → structured blocks
3. `npm run media`: downloads every referenced image/PDF into `public/media`
4. `node scripts/optimize-media.mjs`: resizes oversized photos
5. `npm run content`: normalizes into `src/data/content.json` + `public/search-index.json`
