import { useEffect, useRef, useState } from 'react';
import './donate.scss';

type Kind = 'wealth' | 'gold' | 'silver' | 'crops' | 'stocks';
type Props = { lang: 'en' | 'ar'; labels: Record<Kind, string>; donateHref: string };

const L = {
  en: {
    goldPrice: 'Gold price today (JOD / gram, 24k)',
    silverPrice: 'Silver price today (JOD / gram)',
    cash: 'Cash, savings & receivables (JOD)',
    debts: 'Debts due now (JOD)',
    grams: 'Weight (grams)',
    karat: 'Karat',
    kg: 'Harvest (kg)',
    irrigation: 'Irrigation',
    rain: 'Rain-fed (10%)',
    irrigated: 'Irrigated (5%)',
    value: 'Market value of zakatable shares (JOD)',
    nisab: 'Nisab',
    due: 'Zakat due',
    below: 'Below the Nisab — no Zakat is due yet.',
    needPrice: 'Enter today’s price to check the Nisab.',
    pay: 'Pay your Zakat',
    note: 'An estimate for guidance. Prices change; please use today’s rate.',
  },
  ar: {
    goldPrice: 'سعر غرام الذهب اليوم (دينار، عيار 24)',
    silverPrice: 'سعر غرام الفضة اليوم (دينار)',
    cash: 'النقد والمدخرات والديون المستحقة لك (دينار)',
    debts: 'الديون المستحقة عليك (دينار)',
    grams: 'الوزن (غرام)',
    karat: 'العيار',
    kg: 'المحصول (كغ)',
    irrigation: 'طريقة السقي',
    rain: 'بماء المطر (10%)',
    irrigated: 'بالري (5%)',
    value: 'القيمة السوقية للأسهم (دينار)',
    nisab: 'النصاب',
    due: 'الزكاة المستحقة',
    below: 'لم يبلغ المال النصاب بعد — لا زكاة عليه.',
    needPrice: 'أدخل سعر اليوم للتحقق من النصاب.',
    pay: 'ادفع زكاتك',
    note: 'تقدير استرشادي. الأسعار متغيرة؛ يرجى استخدام سعر اليوم.',
  },
};

const num = (s: string) => Math.max(0, parseFloat(s) || 0);

export default function ZakatCalc({ lang, labels, donateHref }: Props) {
  const l = L[lang];
  const [kind, setKind] = useState<Kind>('wealth');
  const [f, setF] = useState<Record<string, string>>({ karat: '24', irr: 'rain' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const fmt = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-JO' : 'en-US', { maximumFractionDigits: 2 }).format(n);

  const gold = num(f.gold);
  const silver = num(f.silver);
  let due = 0, base = 0, nisab: number | null = null, nisabLabel = '', needsPrice = false;

  if (kind === 'wealth') {
    base = num(f.cash) - num(f.debts);
    nisab = gold ? 85 * gold : null;
    needsPrice = !gold;
    nisabLabel = '85 g × gold';
    due = nisab !== null && base >= nisab ? base * 0.025 : 0;
  } else if (kind === 'gold') {
    const pure = num(f.grams) * (num(f.karat) / 24);
    base = pure * gold;
    nisab = 85 * gold;
    needsPrice = !gold;
    nisabLabel = '85 g (24k)';
    due = gold && pure >= 85 ? base * 0.025 : 0;
  } else if (kind === 'silver') {
    base = num(f.grams) * silver;
    nisab = 595 * silver;
    needsPrice = !silver;
    nisabLabel = '595 g';
    due = silver && num(f.grams) >= 595 ? base * 0.025 : 0;
  } else if (kind === 'crops') {
    const kg = num(f.kg);
    nisabLabel = '653 kg';
    nisab = 653;
    due = kg >= 653 ? kg * (f.irr === 'rain' ? 0.1 : 0.05) : 0;
    base = kg;
  } else {
    base = num(f.stocks);
    nisab = gold ? 85 * gold : null;
    needsPrice = !gold;
    nisabLabel = '85 g × gold';
    due = nisab !== null && base >= nisab ? base * 0.025 : 0;
  }
  const filled = base > 0;
  // a soft chime the moment the amount crosses the Nisab
  const wasDue = useRef(false);
  useEffect(() => {
    if (due > 0 && !wasDue.current) window.amanSound?.play('success');
    wasDue.current = due > 0;
  }, [due]);
  const unit = kind === 'crops' ? (lang === 'ar' ? 'كغ' : 'kg') : lang === 'ar' ? 'دينار' : 'JOD';

  const field = (k: string, label: string) => (
    <label className="zk__f">
      <span>{label}</span>
      <input inputMode="decimal" value={f[k] || ''} onChange={set(k)} placeholder="0" />
    </label>
  );

  return (
    <div className="zk">
      <div className="zk__tabs" role="tablist">
        {(Object.keys(labels) as Kind[]).map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>
            {labels[k]}
          </button>
        ))}
      </div>
      <div className="zk__body">
        <div className="zk__fields">
          {kind === 'wealth' && (<>{field('cash', l.cash)}{field('debts', l.debts)}{field('gold', l.goldPrice)}</>)}
          {kind === 'gold' && (
            <>
              {field('grams', l.grams)}
              <label className="zk__f">
                <span>{l.karat}</span>
                <select value={f.karat} onChange={set('karat')}>
                  {['24', '21', '18'].map((k) => <option key={k}>{k}</option>)}
                </select>
              </label>
              {field('gold', l.goldPrice)}
            </>
          )}
          {kind === 'silver' && (<>{field('grams', l.grams)}{field('silver', l.silverPrice)}</>)}
          {kind === 'crops' && (
            <>
              {field('kg', l.kg)}
              <label className="zk__f">
                <span>{l.irrigation}</span>
                <select value={f.irr} onChange={set('irr')}>
                  <option value="rain">{l.rain}</option>
                  <option value="irrigated">{l.irrigated}</option>
                </select>
              </label>
            </>
          )}
          {kind === 'stocks' && (<>{field('stocks', l.value)}{field('gold', l.goldPrice)}</>)}
        </div>

        <div className="zk__out" aria-live="polite">
          <span className="zk__lbl">{l.due}</span>
          <strong className="zk__due">{fmt(due)} <small>{unit}</small></strong>
          <span className="zk__nisab">
            {l.nisab}: {nisabLabel}
            {nisab !== null && kind !== 'crops' && !needsPrice ? ` ≈ ${fmt(nisab)} ${unit}` : ''}
          </span>
          {filled && needsPrice && <p className="zk__msg">{l.needPrice}</p>}
          {filled && !needsPrice && due === 0 && <p className="zk__msg">{l.below}</p>}
          <a className="btn" href={donateHref}>{l.pay}</a>
          <p className="zk__note">{l.note}</p>
        </div>
      </div>
    </div>
  );
}
