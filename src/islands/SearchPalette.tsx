import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { searcher, snippet, type Doc } from '../lib/search';
import type { Lang } from '../lib/i18n';
import './search.scss';

type Props = {
  lang: Lang;
  t: { searchPlaceholder: string; noResults: string; pages: string; news: string; all: string; search: string };
  quick: { label: string; href: string }[];
};

type Filter = 'all' | 'page' | 'news';

function highlight(text: string, q: string): ReactNode {
  const words = q.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return text;
  const re = new RegExp(`(${words.join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

export default function SearchPalette({ lang, t, quick }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [results, setResults] = useState<Doc[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-open-search]')) setOpen(true);
    };
    addEventListener('keydown', onKey);
    addEventListener('click', onClick);
    addEventListener('search:open', () => setOpen(true));
    return () => {
      removeEventListener('keydown', onKey);
      removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('no-scroll', open);
    if (open) {
      searcher(lang); // warm the index
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, lang]);

  useEffect(() => {
    let alive = true;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    searcher(lang).then((f) => {
      if (!alive) return;
      const seen = new Set<string>();
      const hits = f
        .search(q, { limit: 40 })
        .map((r) => r.item)
        .filter((d) => (filter === 'all' || d.type === filter) && !seen.has(d.url) && seen.add(d.url));
      setResults(hits.slice(0, 14));
      setActive(0);
    });
    return () => {
      alive = false;
    };
  }, [q, filter, lang]);

  const groups = useMemo(() => {
    const pages = results.filter((r) => r.type === 'page');
    const news = results.filter((r) => r.type === 'news');
    return [
      { key: 'page', label: t.pages, items: pages },
      { key: 'news', label: t.news, items: news },
    ].filter((g) => g.items.length);
  }, [results, t]);
  const flat = groups.flatMap((g) => g.items);

  const go = (url: string) => {
    window.location.href = url;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && flat[active]) go(flat[active].url);
  };

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;
  let idx = -1;

  return (
    <div className="sp" role="dialog" aria-modal="true" aria-label={t.search} onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="sp__panel" onKeyDown={onKeyDown}>
        <div className="sp__field">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-controls="sp-list"
            aria-activedescendant={flat[active] ? `sp-${active}` : undefined}
            role="combobox"
            aria-expanded="true"
          />
          <kbd onClick={() => setOpen(false)}>Esc</kbd>
        </div>
        <div className="sp__filters" role="tablist">
          {(['all', 'page', 'news'] as Filter[]).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? t.all : f === 'page' ? t.pages : t.news}
            </button>
          ))}
        </div>

        <ul className="sp__list" id="sp-list" role="listbox" ref={listRef}>
          {q.trim().length < 2 &&
            quick.map((l) => (
              <li key={l.href}>
                <a className="sp__quick" href={l.href}>
                  <span className="sp__dot" />
                  {l.label}
                </a>
              </li>
            ))}
          {q.trim().length >= 2 && !flat.length && <li className="sp__empty">{t.noResults}</li>}
          {groups.map((g) => (
            <li key={g.key} className="sp__group">
              <span className="sp__glabel">{g.label}</span>
              <ul>
                {g.items.map((d) => {
                  idx++;
                  const i = idx;
                  return (
                    <li key={d.url} id={`sp-${i}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)}>
                      <a href={d.url} className="sp__item">
                        {d.image ? <img src={d.image} alt="" loading="lazy" /> : <span className="sp__icon">{d.type === 'news' ? '✦' : '◐'}</span>}
                        <span className="sp__txt">
                          <strong>{highlight(d.type === 'page' && d.heading !== d.title ? `${d.title} · ${d.heading}` : d.title, q)}</strong>
                          <small>{highlight(snippet(d.text, q), q)}</small>
                        </span>
                        <span className="sp__enter" aria-hidden="true">↵</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
        <div className="sp__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>⌘</kbd><kbd>K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
