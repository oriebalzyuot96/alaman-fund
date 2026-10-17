// QA screenshots of a deployed/local URL with real Chrome: header, film section (with playback state), footer.
//   node film/shoot.mjs https://oriebalzyuot96.github.io/alaman-fund/ [out-prefix]
import { chromium } from 'playwright-core';
import fs from 'fs';

const url = process.argv[2] || 'http://localhost:4510/';
const pre = process.argv[3] || 'film/out/qa';
fs.mkdirSync('film/out', { recursive: true });
const exe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });

for (const [name, vp] of [['desk', { width: 1440, height: 900 }], ['mob', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${pre}-${name}-top.jpg`, quality: 70 });
  if (name === 'desk') {
    const trig = await page.$('.hdr__item.has-sub:nth-child(2) .hdr__link');
    if (trig) { await trig.hover(); await page.waitForTimeout(700); await page.screenshot({ path: `${pre}-${name}-mega.jpg`, quality: 70, clip: { x: 0, y: 0, width: 1440, height: 520 } }); await page.mouse.move(5, 600); }
  }

  const film = await page.$('[data-film]');
  if (film) {
    await film.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in')));
    await page.waitForTimeout(4000);
    const state = await page.evaluate(() => {
      const v = document.querySelector('.jf__video');
      const r = v.getBoundingClientRect();
      return { paused: v.paused, t: +v.currentTime.toFixed(2), ready: v.readyState, net: v.networkState, err: v.error?.message || v.error?.code || null, src: v.currentSrc, w: r.width, h: r.height, display: getComputedStyle(v).display, opacity: getComputedStyle(v).opacity, clip: getComputedStyle(v).clipPath };
    });
    console.log(name, 'video', JSON.stringify(state));
    await film.screenshot({ path: `${pre}-${name}-film.jpg`, quality: 70 });
  }
  const royal = await page.$('.royal');
  if (royal) { await royal.scrollIntoViewIfNeeded(); await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in'))); await page.waitForTimeout(1500); await royal.screenshot({ path: `${pre}-${name}-royal.jpg`, quality: 70 }); }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  const footer = await page.$('footer.ftr');
  if (footer) await footer.screenshot({ path: `${pre}-${name}-footer.jpg`, quality: 70 });
  console.log(name, 'errors', errors.slice(0, 5));
  await page.close();
}
await browser.close();
