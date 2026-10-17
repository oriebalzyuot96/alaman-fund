import type { Block } from './i18n';

export type Group =
  | { k: 'heading'; level: number; text: string }
  | { k: 'text'; text: string }
  | { k: 'list'; items: string[] }
  | { k: 'figures'; items: { src: string; caption: string }[]; logos: boolean }
  | { k: 'gallery'; items: string[] }
  | { k: 'image'; src: string; alt: string }
  | { k: 'people'; items: { name: string; role: string }[] }
  | { k: 'stats'; items: { value: string; text: string }[] }
  | { k: 'video'; id: string; poster?: string }
  | { k: 'map'; src: string }
  | { k: 'actions'; items: { text: string; href: string; file: boolean }[] }
  | { k: 'table'; rows: string[][] };

export const youtubeId = (src: string) => src.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/)?.[1];
const isLogo = (src: string) => /\.(svg|png|webp)$/i.test(src) && !/scaled|IMG|DSC|photo/i.test(src);
const junk = (b: Block) => (b.text && b.text.trim().startsWith('<')) || (b.t === 'p' && /^(video|gallery|فيديو|المعرض)$/i.test(b.text || ''));

/** Collapse a flat CMS block stream into presentational groups. */
export function group(blocks: Block[]): Group[] {
  const out: Group[] = [];
  const bs = blocks.filter((b) => !junk(b) && b.t !== 'bg');
  const last = () => out[out.length - 1];

  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    const next = bs[i + 1];

    if (b.t === 'img') {
      // image + short heading caption → figure card; numeric caption → gallery
      if (next && /^h[2-6]$/.test(next.t) && (next.text || '').length < 90) {
        i++;
        if (/^\d+$/.test(next.text || '')) {
          const l = last();
          if (l?.k === 'gallery') l.items.push(b.src!);
          else out.push({ k: 'gallery', items: [b.src!] });
          continue;
        }
        const caption = (next.text || '').replace(/[-_]/g, ' ').replace(/\b(Logo Variations ai|images \(\d+\) \(\d+\))\b/gi, '').trim();
        const l = last();
        const item = { src: b.src!, caption };
        if (l?.k === 'figures') l.items.push(item);
        else out.push({ k: 'figures', items: [item], logos: isLogo(b.src!) });
        continue;
      }
      const l = last();
      if (l?.k === 'image' && !isLogo(b.src!)) {
        out[out.length - 1] = { k: 'gallery', items: [l.src, b.src!] };
        continue;
      }
      if (l?.k === 'gallery' && !isLogo(b.src!)) {
        l.items.push(b.src!);
        continue;
      }
      out.push({ k: 'image', src: b.src!, alt: b.alt || '' });
    } else if (b.t === 'h5' && b.sub !== undefined) {
      const l = last();
      const item = { name: b.text!, role: b.sub || '' };
      if (l?.k === 'people') {
        if (!l.items.some((p) => p.name === item.name)) l.items.push(item);
      } else out.push({ k: 'people', items: [item] });
    } else if (/^h[1-6]$/.test(b.t)) {
      out.push({ k: 'heading', level: +b.t[1], text: b.text! });
    } else if (b.t === 'p') {
      out.push({ k: 'text', text: b.text! });
    } else if (b.t === 'li') {
      const l = last();
      if (l?.k === 'list') l.items.push(b.text!);
      else out.push({ k: 'list', items: [b.text!] });
    } else if (b.t === 'stat') {
      const l = last();
      const item = { value: b.value!, text: b.text! };
      if (l?.k === 'stats') l.items.push(item);
      else out.push({ k: 'stats', items: [item] });
    } else if (b.t === 'iframe') {
      const id = youtubeId(b.src!);
      if (id) {
        // a thumbnail image right before the embed becomes its poster
        const l = last();
        const poster = l?.k === 'image' ? (out.pop() as { src: string }).src : undefined;
        out.push({ k: 'video', id, poster });
      } else if (/google\.com\/maps/.test(b.src!)) out.push({ k: 'map', src: b.src! });
    } else if (b.t === 'a') {
      const id = youtubeId(b.href!);
      if (id && /youtube|youtu\.be/.test(b.href!)) {
        out.push({ k: 'video', id });
        continue;
      }
      const item = { text: b.text!, href: b.href!, file: /\.pdf$/i.test(b.href!) };
      const l = last();
      if (l?.k === 'actions') l.items.push(item);
      else out.push({ k: 'actions', items: [item] });
    } else if (b.t === 'table' && b.rows) {
      out.push({ k: 'table', rows: b.rows });
    }
  }
  return out;
}
