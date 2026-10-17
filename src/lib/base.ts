// Site base path ("/" locally, "/alaman-fund" on GitHub Pages). Every root-relative URL goes through withBase().
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const withBase = <T extends string | undefined>(p: T): T =>
  (p && p.startsWith('/') && !p.startsWith('//') && !(BASE && p.startsWith(BASE + '/')) ? BASE + p : p) as T;
export const stripBase = (p: string) => (BASE && p.startsWith(BASE) ? p.slice(BASE.length) || '/' : p);
