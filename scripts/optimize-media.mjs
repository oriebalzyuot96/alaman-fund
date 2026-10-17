// Shrinks oversized photos in public/media in place (max 2000px wide, quality 80). Logos/SVGs untouched.
import fs from 'fs'; import path from 'path'; import sharp from 'sharp';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
let before = 0, after = 0;
for (const f of walk('public/media')) {
  if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
  const size = fs.statSync(f).size; before += size;
  if (size < 250_000) { after += size; continue; }
  try {
    const img = sharp(fs.readFileSync(f)).rotate();
    const meta = await img.metadata();
    let pipe = img.resize({ width: Math.min(meta.width || 2000, 2000), withoutEnlargement: true });
    pipe = /png$/i.test(f) ? pipe.png({ quality: 80, compressionLevel: 9, palette: true }) : /webp$/i.test(f) ? pipe.webp({ quality: 80 }) : pipe.jpeg({ quality: 80, mozjpeg: true });
    const buf = await pipe.toBuffer();
    if (buf.length < size) { fs.writeFileSync(f, buf); after += buf.length; } else after += size;
  } catch (e) { after += size; console.log('skip', f, e.message); }
}
console.log(`media: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`);
