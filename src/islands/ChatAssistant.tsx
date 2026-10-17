import { useEffect, useRef, useState } from 'react';
import { matchIntent, type Answer } from '../lib/chat-kb';
import { searcher, snippet } from '../lib/search';
import type { Lang } from '../lib/i18n';
import './chat.scss';

type Msg = { from: 'bot' | 'me'; text: string; links?: Answer['links']; cards?: { title: string; url: string; text: string }[] };
type Props = {
  lang: Lang;
  t: { chatTitle: string; chatHello: string; chatPlaceholder: string; chatSuggestions: readonly string[]; chatFallback: string; chatNone: string };
};

const KEY = 'aman-chat';

async function reply(lang: Lang, q: string, t: Props['t']): Promise<Msg> {
  const hit = matchIntent(lang, q);
  if (hit) return { from: 'bot', ...hit };
  const fuse = await searcher(lang);
  const res = fuse.search(q, { limit: 3 }).map((r) => r.item);
  if (!res.length) return { from: 'bot', text: t.chatNone };
  return { from: 'bot', text: t.chatFallback, cards: res.map((d) => ({ title: d.title, url: d.url, text: snippet(d.text, q, 120) })) };
}

export default function ChatAssistant({ lang, t }: Props) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [nudge, setNudge] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (saved?.lang === lang && saved.msgs?.length) setMsgs(saved.msgs);
    } catch {}
    const id = setTimeout(() => setNudge(true), 9000);
    const onOpen = () => setOpen(true);
    addEventListener('chat:open', onOpen);
    return () => {
      clearTimeout(id);
      removeEventListener('chat:open', onOpen);
    };
  }, [lang]);

  useEffect(() => {
    if (open && !msgs.length) setMsgs([{ from: 'bot', text: t.chatHello }]);
    if (open) {
      setNudge(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ lang, msgs }));
    } catch {}
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || typing) return;
    setInput('');
    setMsgs((m) => [...m, { from: 'me', text }]);
    setTyping(true);
    const [answer] = await Promise.all([reply(lang, text, t), new Promise((r) => setTimeout(r, 650 + Math.random() * 500))]);
    setTyping(false);
    setMsgs((m) => [...m, answer]);
  };

  return (
    <div className={`chat ${open ? 'is-open' : ''}`}>
      {nudge && !open && (
        <button className="chat__nudge" onClick={() => setOpen(true)}>
          {t.chatSuggestions[0]}
        </button>
      )}
      <button className="chat__fab" aria-label={t.chatTitle} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="chat__sun" aria-hidden="true" />
        <svg className="chat__ico chat__ico--msg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5Z" />
          <circle cx="9" cy="9.5" r="1" /><circle cx="12" cy="9.5" r="1" /><circle cx="15" cy="9.5" r="1" />
        </svg>
        <svg className="chat__ico chat__ico--x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>

      <section className="chat__win" aria-label={t.chatTitle} aria-hidden={!open}>
        <header className="chat__head">
          <img src="/logo-mark.png" alt="" width="40" height="40" />
          <div>
            <strong>{t.chatTitle}</strong>
            <span><i /> {lang === 'ar' ? 'متصل الآن' : 'Online now'}</span>
          </div>
          <button aria-label="Close" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>

        <div className="chat__body" ref={bodyRef} aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`chat__msg chat__msg--${m.from}`}>
              <p>{m.text}</p>
              {m.cards && (
                <div className="chat__cards">
                  {m.cards.map((c) => (
                    <a key={c.url} href={c.url}>
                      <strong>{c.title}</strong>
                      <small>{c.text}</small>
                    </a>
                  ))}
                </div>
              )}
              {m.links && (
                <div className="chat__links">
                  {m.links.map((l) => (
                    <a key={l.href} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
                      {l.label} →
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="chat__msg chat__msg--bot chat__typing" aria-label="typing">
              <span /><span /><span />
            </div>
          )}
        </div>

        <div className="chat__chips">
          {t.chatSuggestions.map((s) => (
            <button key={s} onClick={() => ask(s)}>{s}</button>
          ))}
        </div>

        <form
          className="chat__form"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.chatPlaceholder} aria-label={t.chatPlaceholder} />
          <button type="submit" aria-label="Send" disabled={!input.trim()}>
            <svg viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
          </button>
        </form>
      </section>
    </div>
  );
}
