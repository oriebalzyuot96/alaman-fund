import Fuse from 'fuse.js';
import type { Lang } from './i18n';
import { withBase } from './base';

export type Doc = { lang: Lang; type: 'page' | 'news'; title: string; heading: string; url: string; text: string; date?: string; image?: string };

let docsPromise: Promise<Doc[]> | null = null;
const fuses: Partial<Record<Lang, Fuse<Doc>>> = {};

export function loadDocs() {
  docsPromise ??= fetch(withBase('/search-index.json')).then((r) => r.json());
  return docsPromise;
}

export async function searcher(lang: Lang) {
  if (fuses[lang]) return fuses[lang]!;
  const docs = (await loadDocs()).filter((d) => d.lang === lang);
  fuses[lang] = new Fuse(docs, {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'heading', weight: 2 },
      { name: 'text', weight: 1 },
    ],
    includeMatches: true,
    ignoreLocation: true,
    threshold: 0.34,
    minMatchCharLength: 2,
  });
  return fuses[lang]!;
}

/** A short excerpt of `text` centred on the first occurrence of any query word. */
export function snippet(text: string, q: string, len = 150) {
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const lower = text.toLowerCase();
  let at = -1;
  for (const w of words) {
    at = lower.indexOf(w);
    if (at >= 0) break;
  }
  if (at < 0) return text.slice(0, len) + (text.length > len ? '…' : '');
  const start = Math.max(0, at - 50);
  return (start ? '…' : '') + text.slice(start, start + len) + (start + len < text.length ? '…' : '');
}
