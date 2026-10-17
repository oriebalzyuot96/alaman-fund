// Normalises raw/pages.json (scraped from alamanfund.jo) into src/data/content.json:
// per-locale pages keyed by canonical slug, news posts, and a search index shared by search + chat.
import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('raw/pages.json', 'utf8'));
const HOST = 'https://alamanfund.jo';

const AR_ALIASES = {
  '': '', 'homepage-ar': '',
  'who-we-are-ar/برامجنا': 'who-we-are/our-programs',
  'donate-ar': 'ways-to-give/donate',
  'digital-donation-ar': 'ways-to-give/digital-donation',
};
const EN_ALIASES = { 'general-assembly': 'who-we-are/general-assembly' };

function parse(url) {
  let p = decodeURIComponent(url.replace(HOST, '')).replace(/^\/+|\/+$/g, '');
  const lang = p === 'ar' || p.startsWith('ar/') ? 'ar' : 'en';
  if (lang === 'ar') p = p.replace(/^ar\/?/, '');
  if (/(^|\/)page\/\d+$/.test(p)) return { lang, kind: 'skip' };
  const cat = p.match(/^archives\/category\/([^/]+)/);
  if (cat) return { lang, kind: 'category', slug: cat[1].replace(/-ar$/, '') };
  const post = p.match(/^archives\/(\d+)$/);
  if (post) return { lang, kind: 'post', slug: post[1] };
  let slug = lang === 'ar' ? (AR_ALIASES[p] ?? p.split('/').map((s) => s.replace(/-ar$/, '')).join('/')) : (EN_ALIASES[p] ?? p);
  if (slug === 'news-releases') return { lang, kind: 'skip' };
  return { lang, kind: 'page', slug };
}

/** Turn any alamanfund.jo link into a route on the new site; keep external links as-is. */
function route(href, lang) {
  if (!href) return href;
  if (href.includes('/wp-content/uploads/')) return media(href);
  if (!href.startsWith(HOST)) return href;
  const r = parse(href.split('#')[0]);
  const pre = r.lang === 'ar' ? '/ar' : '';
  if (r.kind === 'post') return `${pre}/news/${r.slug}`;
  if (r.kind === 'category' || r.kind === 'skip') return `${pre}/news`;
  return `${pre}/${r.slug}`.replace(/\/$/, '') || '/';
}
const media = (src) => (src && src.includes('/wp-content/uploads/') ? '/media/' + decodeURIComponent(src.split('/wp-content/uploads/')[1]) : src);
const exists = (src) => !src?.startsWith('/media/') || fs.existsSync('public' + src);

function clean(block, lang) {
  const b = { ...block };
  if (b.src) b.src = media(b.src);
  if (b.poster) b.poster = media(b.poster);
  if (b.href) b.href = route(b.href, lang);
  return b;
}

const out = { en: { pages: {}, news: [] }, ar: { pages: {}, news: [] } };
const categories = { en: {}, ar: {} };

for (const p of raw) {
  const r = parse(p.url);
  if (r.kind === 'category') {
    const ids = p.sections.flat().filter((b) => b.t === 'a' && /\/archives\/\d+$/.test(b.href)).map((b) => b.href.match(/(\d+)$/)[1]);
    for (const id of ids) categories[r.lang][id] = r.slug.includes('queen-rania') ? 'royal' : categories[r.lang][id] || 'news';
  }
}

for (const p of raw) {
  const r = parse(p.url);
  const L = out[r.lang];
  if (r.kind === 'post') {
    const head = p.sections[0] || [];
    const title = head.find((b) => b.t === 'h1')?.text || p.title;
    const body = (p.sections[1] || [])
      .filter((b) => !(b.t === 'h6' && /share|مشاركة/i.test(b.text)))
      .map((b) => clean(b, r.lang))
      .filter((b) => (b.t === 'img' ? exists(b.src) : true));
    const image = media(p.ogImage) || body.find((b) => b.t === 'img')?.src || '';
    const crumb = head.filter((b) => b.t === 'a').map((b) => b.href).join(' ');
    const category = /queen-rania/.test(crumb) ? 'royal' : categories[r.lang][r.slug] || 'news';
    const excerpt = body.find((b) => b.t === 'p')?.text?.slice(0, 220) || '';
    L.news.push({ id: r.slug, title, date: p.date, image: exists(image) ? image : '', category, excerpt, body });
  } else if (r.kind === 'page') {
    if (L.pages[r.slug]) continue;
    const [head = [], ...rest] = p.sections;
    const title = head.find((b) => /^h[12]$/.test(b.t))?.text || p.title;
    const sections = (r.slug === '' ? p.sections : rest)
      .map((s) => s.map((b) => clean(b, r.lang)).filter((b) => (b.t === 'img' || b.t === 'bg' ? exists(b.src) : true)))
      .filter((s) => s.length);
    L.pages[r.slug] = { slug: r.slug, title, desc: p.desc, image: exists(media(p.ogImage)) ? media(p.ogImage) : '', sections };
  }
}

for (const lang of ['en', 'ar']) out[lang].news.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

// Search/chat index: one record per page section and per news post.
const index = [];
for (const lang of ['en', 'ar']) {
  const pre = lang === 'ar' ? '/ar' : '';
  for (const pg of Object.values(out[lang].pages)) {
    pg.sections.forEach((s, i) => {
      const heading = s.find((b) => /^h[1-4]$/.test(b.t))?.text || pg.title;
      const text = s.filter((b) => b.text).map((b) => b.text + (b.sub ? ` — ${b.sub}` : '')).join(' ');
      if (text.length > 20) index.push({ lang, type: 'page', title: pg.title, heading, url: `${pre}/${pg.slug}`.replace(/\/$/, '') || '/', text: text.slice(0, 1600) });
    });
  }
  for (const n of out[lang].news) {
    index.push({ lang, type: 'news', title: n.title, heading: n.title, url: `${pre}/news/${n.id}`, date: n.date, image: n.image, text: n.body.filter((b) => b.text).map((b) => b.text).join(' ').slice(0, 1600) });
  }
}

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/content.json', JSON.stringify(out));
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/search-index.json', JSON.stringify(index));
console.log(
  'en pages', Object.keys(out.en.pages).length, 'news', out.en.news.length,
  '| ar pages', Object.keys(out.ar.pages).length, 'news', out.ar.news.length,
  '| index', index.length,
);
