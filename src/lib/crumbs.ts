import { data, href, type Lang } from './i18n';

/** Breadcrumb trail for a slug like "ways-to-give/donate" (excludes Home and the page itself). */
export function crumbs(lang: Lang, slug: string) {
  const parts = slug.split('/');
  return parts.slice(0, -1).map((_, i) => {
    const s = parts.slice(0, i + 1).join('/');
    return { label: data[lang].pages[s]?.title ?? s, href: href(lang, s) };
  });
}

export const sectionKicker = (lang: Lang, slug: string) => {
  const root = slug.split('/')[0];
  return root !== slug ? data[lang].pages[root]?.title : lang === 'ar' ? 'صندوق الأمان' : 'Al Aman Fund';
};
