// Renders film/journey.js to video with local Chrome + ffmpeg.
//   node film/render.mjs stills 0,4,8,12,16,20,24   -> film/out/still-<t>.jpg (composition check)
//   node film/render.mjs video                      -> public/video/journey.mp4 + .webm + poster
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const [mode = 'video', arg = '0,6,12,18,24'] = process.argv.slice(2);
const OUT = 'film/out';
fs.mkdirSync(OUT, { recursive: true });

await build({ entryPoints: ['film/journey.js'], bundle: true, format: 'iife', outfile: `${OUT}/journey.bundle.js`, minify: true, logLevel: 'warning' });
fs.writeFileSync(`${OUT}/index.html`, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#00262b}canvas{display:block}</style><body><script src="journey.bundle.js"></script></body>`);

const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => m.type() === 'error' && console.log('page:', m.text()));
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('file:///' + path.resolve(`${OUT}/index.html`).replace(/\\/g, '/'));
await page.waitForFunction(() => window.FILM);
const { duration } = await page.evaluate(() => window.FILM);

const frameAt = (t, q = 0.93) =>
  page.evaluate(([t, q]) => {
    window.renderAt(t);
    return document.querySelector('canvas').toDataURL('image/jpeg', q).split(',')[1];
  }, [t, q]);

if (mode === 'stills') {
  for (const t of arg.split(',').map(Number)) {
    fs.writeFileSync(`${OUT}/still-${t}.jpg`, Buffer.from(await frameAt(t), 'base64'));
    console.log('still', t);
  }
} else {
  const FPS = 30;
  const total = Math.round(duration * FPS);
  fs.mkdirSync('public/video', { recursive: true });
  const mp4 = 'public/video/journey.mp4';
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const buf = Buffer.from(await frameAt(f / FPS, 0.95), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  fs.writeFileSync('public/video/journey-poster.jpg', Buffer.from(await frameAt(23.5, 0.85), 'base64'));
  await new Promise((r) =>
    spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', 'public/video/journey.webm'], { stdio: 'inherit' }).on('close', r),
  );
  for (const f of ['journey.mp4', 'journey.webm', 'journey-poster.jpg']) console.log(f, (fs.statSync('public/video/' + f).size / 1e6).toFixed(2), 'MB');
}
await browser.close();
