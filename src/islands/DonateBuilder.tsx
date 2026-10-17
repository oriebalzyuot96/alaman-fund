import { useMemo, useState } from 'react';
import './donate.scss';

type Pkg = { name: string; min: number; max: number; any: boolean; per: string };
type Props = {
  lang: 'en' | 'ar';
  packages: Pkg[];
  checkout: string;
  t: { choose: string; amount: string; once: string; monthly: string; summary: string; cta: string; note: string; custom: string; cur: string };
};

const fmt = (lang: string, n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-JO' : 'en-US').format(n);

export default function DonateBuilder({ lang, packages, checkout, t }: Props) {
  const [sel, setSel] = useState(0);
  const pkg = packages[sel];
  const presets = useMemo(() => {
    if (pkg.any) return [10, 25, 50, 100];
    if (pkg.min === pkg.max) return [pkg.min];
    return [pkg.min, Math.round((pkg.min + pkg.max) / 2), pkg.max];
  }, [pkg]);
  const [amount, setAmount] = useState<number>(presets[0]);
  const [custom, setCustom] = useState('');
  const [freq, setFreq] = useState<'once' | 'monthly'>('once');
  const value = custom ? Math.max(0, parseFloat(custom) || 0) : amount;

  const pick = (i: number) => {
    setSel(i);
    const p = packages[i];
    setAmount(p.any ? 10 : p.min);
    setCustom('');
  };

  return (
    <div className="db">
      <div className="db__col">
        <h3 className="db__h">1 · {t.choose}</h3>
        <div className="db__pkgs" role="radiogroup">
          {packages.map((p, i) => (
            <button key={p.name} type="button" role="radio" aria-checked={sel === i} className={`db__pkg ${sel === i ? 'is-on' : ''}`} onClick={() => pick(i)}>
              <span className="db__pkgName">{p.name}</span>
              <span className="db__pkgPrice">
                {p.any ? '—' : p.min === p.max ? fmt(lang, p.min) : `${fmt(lang, p.min)}–${fmt(lang, p.max)}`} <small>{p.any ? '' : `${t.cur} ${p.per}`}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="db__col db__col--sum">
        <h3 className="db__h">2 · {t.amount}</h3>
        <div className="db__freq" role="radiogroup">
          {(['once', 'monthly'] as const).map((f) => (
            <button key={f} type="button" role="radio" aria-checked={freq === f} className={freq === f ? 'is-on' : ''} onClick={() => setFreq(f)}>
              {f === 'once' ? t.once : t.monthly}
            </button>
          ))}
          <span className="db__freqPill" style={{ insetInlineStart: freq === 'once' ? 4 : '50%' }} />
        </div>
        <div className="db__amts">
          {presets.map((a) => (
            <button key={a} type="button" className={!custom && amount === a ? 'is-on' : ''} onClick={() => (setAmount(a), setCustom(''))}>
              {fmt(lang, a)} <small>{t.cur}</small>
            </button>
          ))}
          <label className={`db__custom ${custom ? 'is-on' : ''}`}>
            <input inputMode="decimal" placeholder={t.custom} value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))} />
            <small>{t.cur}</small>
          </label>
        </div>

        <div className="db__sum">
          <span>{t.summary}</span>
          <strong key={value + freq}>
            {fmt(lang, value)} <small>{t.cur}{freq === 'monthly' ? (lang === 'ar' ? ' / شهرياً' : ' / month') : ''}</small>
          </strong>
          <em>{pkg.name}</em>
        </div>
        <a className="btn db__cta" href={checkout} target="_blank" rel="noopener" aria-disabled={!value}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10V8a6 6 0 1 1 12 0v2m-13 0h14v11H5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
          {t.cta}
        </a>
        <p className="db__note">{t.note}</p>
      </div>
    </div>
  );
}
