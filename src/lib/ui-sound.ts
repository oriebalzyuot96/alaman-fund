// UI sounds, ported from the Mashroo3Hub web client's UiSoundService: synthesised with Web Audio
// (no audio files), slight per-hit variation, throttled, through a soft lowpass + compressor chain,
// plus a click ripple. Enabled state is the "Interface sounds" switch in the Appearance panel
// (html[data-sound="on"]). Other code triggers cues with window.amanSound.play('pop') etc.

export type SoundKind = 'tick' | 'pop' | 'switch' | 'success' | 'step' | 'whoosh' | 'error' | 'fieldOk' | 'fieldBad' | 'chime';

const INTERACTIVE = 'button, a, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], input[type="checkbox"], input[type="radio"], summary, label.ap__choice';
const SWITCH_LIKE = '[role="switch"], [role="checkbox"], input[type="checkbox"], input[type="radio"], label.ap__choice';
const FIELD_CONTROL =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select';

const MASTER_GAIN = 0.55;
const MASTER_LOWPASS_HZ = 5200;
type Sweep = { f0: number; f1: number; d: number; g: number; body?: number; room?: boolean; type?: OscillatorType };
const SWEEPS: Record<'tick' | 'pop' | 'switch', Sweep> = {
  tick: { f0: 1250, f1: 820, d: 0.05, g: 0.045, body: 0.35 },
  pop: { f0: 460, f1: 780, d: 0.13, g: 0.065, body: 0.5, room: true },
  switch: { f0: 700, f1: 1050, d: 0.08, g: 0.05, type: 'triangle', body: 0.3 },
};
const SUCCESS_NOTES = [523.25, 659.25, 783.99];
const VARIED = new Set<SoundKind>(['tick', 'switch', 'pop']);
const REPEAT_GAP_MS = 45;
const CUE_GAP_MS = 90;

const root = document.documentElement;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let room: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
const lastCueAt = new Map<SoundKind, number>();

const enabled = () => root.dataset.sound === 'on';

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}
function out(c: AudioContext) {
  if (!master) {
    master = c.createGain();
    master.gain.value = MASTER_GAIN;
    const lowpass = c.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = MASTER_LOWPASS_HZ;
    lowpass.Q.value = 0.5;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
    master.connect(lowpass).connect(comp).connect(c.destination);
  }
  return master;
}
function roomSend(c: AudioContext) {
  if (!room) {
    const send = c.createGain();
    send.gain.value = 0.22;
    const delay = c.createDelay(0.5);
    delay.delayTime.value = 0.085;
    const feedback = c.createGain();
    feedback.gain.value = 0.28;
    const tone = c.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    send.connect(delay);
    delay.connect(tone).connect(feedback).connect(delay);
    tone.connect(out(c));
    room = send;
  }
  return room;
}
function tone(c: AudioContext, at: number, f0: number, f1: number, d: number, g: number, type: OscillatorType, body = 0, withRoom = false) {
  const gain = c.createGain();
  const endAt = at + d;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(g, at + Math.min(0.012, d / 3));
  gain.gain.linearRampToValueAtTime(0, endAt);
  gain.connect(out(c));
  if (withRoom) gain.connect(roomSend(c));
  const voices: [OscillatorType, number, number][] = [[type, 1, 1]];
  if (body > 0) voices.push(['sine', 0.5, body]);
  for (const [wave, ratio, level] of voices) {
    const osc = c.createOscillator();
    const v = c.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(Math.max(1, f0 * ratio), at);
    osc.frequency.linearRampToValueAtTime(Math.max(1, f1 * ratio), endAt);
    v.gain.value = level;
    osc.connect(v).connect(gain);
    osc.start(at);
    osc.stop(endAt + 0.03);
  }
}
function noise(c: AudioContext) {
  if (!noiseBuffer) {
    const len = Math.floor(c.sampleRate * 0.4);
    noiseBuffer = c.createBuffer(1, len, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}
function whoosh(c: AudioContext, at: number) {
  const d = 0.36;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.05;
  filter.frequency.setValueAtTime(320, at);
  filter.frequency.linearRampToValueAtTime(2600, at + d * 0.55);
  filter.frequency.linearRampToValueAtTime(720, at + d);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.09, at + 0.07);
  gain.gain.linearRampToValueAtTime(0, at + d);
  src.connect(filter).connect(gain).connect(out(c));
  gain.connect(roomSend(c));
  src.start(at);
  src.stop(at + d + 0.02);
}

function render(kind: SoundKind, c: AudioContext, vary: { pitch: number; gain: number }) {
  const now = c.currentTime;
  switch (kind) {
    case 'success':
      SUCCESS_NOTES.forEach((f, i) => tone(c, now + i * 0.08, f, f * 1.004, 0.24 + i * 0.05, 0.055, 'sine', 0.45, true));
      break;
    case 'chime': // the loader lifting: a soft rising fifth, like a sunrise
      tone(c, now, 392, 392.8, 0.5, 0.04, 'sine', 0.5, true);
      tone(c, now + 0.12, 587.3, 588.4, 0.7, 0.035, 'sine', 0.4, true);
      break;
    case 'fieldOk':
      tone(c, now, 700, 980, 0.07, 0.04, 'sine', 0.25, true);
      break;
    case 'step':
      tone(c, now, 740, 1180, 0.09, 0.05, 'triangle', 0.3, true);
      tone(c, now + 0.07, 1180, 1560, 0.11, 0.04, 'sine', 0.25, true);
      break;
    case 'error':
      tone(c, now, 220, 165, 0.14, 0.09, 'triangle', 0.5);
      tone(c, now + 0.15, 196, 147, 0.18, 0.08, 'triangle', 0.5);
      break;
    case 'fieldBad':
      tone(c, now, 280, 175, 0.12, 0.07, 'triangle', 0.4);
      break;
    case 'whoosh':
      whoosh(c, now);
      break;
    default: {
      const p = SWEEPS[kind as keyof typeof SWEEPS];
      if (p) tone(c, now, p.f0 * vary.pitch, p.f1 * vary.pitch, p.d, p.g * vary.gain, p.type ?? 'sine', p.body ?? 0, p.room ?? false);
    }
  }
}

function throttled(kind: SoundKind) {
  const now = performance.now();
  const last = lastCueAt.get(kind);
  if (last !== undefined && now - last < (VARIED.has(kind) ? REPEAT_GAP_MS : CUE_GAP_MS)) return true;
  lastCueAt.set(kind, now);
  return false;
}

export function play(kind: SoundKind = 'tick') {
  if (!enabled() || throttled(kind)) return;
  const vary = VARIED.has(kind) ? { pitch: 1 + (Math.random() - 0.5) * 0.06, gain: 0.85 + Math.random() * 0.15 } : { pitch: 1, gain: 1 };
  try {
    const c = audio();
    if (c.state === 'suspended') {
      const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
      if (ua && !ua.hasBeenActive) return;
      c.resume().then(() => enabled() && render(kind, c, vary));
    }
    else render(kind, c, vary);
  } catch {}
}

// ---- click ripple (skipped when animations are off) ----------------------------------------
function ripple(el: HTMLElement, ev: PointerEvent) {
  if (root.dataset.motion === 'off' || !el.matches('.btn, button, [role="button"], [role="tab"], .ap__choice')) return;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.width > 600) return;
  const size = Math.max(rect.width, rect.height);
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  let layer = el.querySelector<HTMLElement>(':scope > .aman-ripple-layer');
  if (!layer) {
    layer = document.createElement('span');
    layer.className = 'aman-ripple-layer';
    layer.setAttribute('aria-hidden', 'true');
    el.appendChild(layer);
  }
  const dot = document.createElement('span');
  dot.className = 'aman-ripple';
  dot.style.width = dot.style.height = `${size}px`;
  dot.style.left = `${ev.clientX - rect.left - size / 2}px`;
  dot.style.top = `${ev.clientY - rect.top - size / 2}px`;
  layer.appendChild(dot);
  dot.addEventListener('animationend', () => dot.remove(), { once: true });
}

// ---- global listeners ------------------------------------------------------------------------
document.addEventListener(
  'pointerdown',
  (ev) => {
    const el = (ev.target as HTMLElement | null)?.closest?.(INTERACTIVE) as HTMLElement | null;
    if (!el) return;
    play(el.matches(SWITCH_LIKE) ? 'switch' : 'tick');
    ripple(el, ev);
  },
  { passive: true },
);

document.addEventListener('keydown', (ev) => {
  if ((ev.key !== 'Enter' && ev.key !== ' ') || ev.repeat || ev.isComposing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const target = ev.target as HTMLElement | null;
  if (!target || target.isContentEditable || target.matches?.(FIELD_CONTROL)) return;
  const el = target.closest?.(INTERACTIVE) as HTMLElement | null;
  if (!el || (ev.key === ' ' && el.matches('a[href]:not([role])'))) return;
  play(el.matches(SWITCH_LIKE) ? 'switch' : 'tick');
});

// Leaving a filled form field: a soft "ok" when valid, a low cue when invalid.
let lastField = '';
let lastFieldAt = 0;
document.addEventListener(
  'focusout',
  (ev) => {
    if (!enabled()) return;
    const el = ev.target as HTMLInputElement | null;
    if (!el?.matches?.(FIELD_CONTROL) || el.closest('.sp__field, .chat__form')) return;
    setTimeout(() => {
      const value = (el.value || '').trim();
      if (!value) return;
      const key = el.name || el.id || el.placeholder;
      const now = performance.now();
      if (key === lastField && now - lastFieldAt < 350) return;
      lastField = key;
      lastFieldAt = now;
      play(el.checkValidity() && el.getAttribute('aria-invalid') !== 'true' ? 'fieldOk' : 'fieldBad');
    }, 50);
  },
  true,
);

// Animation cues raised by other parts of the site.
addEventListener('loader:done', () => play('chime'));
addEventListener('aman:sound', (e) => play((e as CustomEvent<SoundKind>).detail));

declare global {
  interface Window {
    amanSound: { play: typeof play };
  }
}
window.amanSound = { play };
