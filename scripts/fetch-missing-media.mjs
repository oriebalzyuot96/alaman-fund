// Downloads every /wp-content/uploads/ image referenced anywhere in raw/html (incl. lazy/background attributes) that is not in public/media yet.
import fs from 'fs'; import path from 'path';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const html = fs.readdirSync('raw/html').map((f) => fs.readFileSync('raw/html/' + f, 'utf8')).join('\n');
const set = new Set();
for (const m of html.matchAll(/(?:https:\/\/alamanfund\.jo)?\/wp-content\/uploads\/([^"'\s)?,&]+\.(?:jpe?g|png|webp|gif|svg))(?=["'\s)?,&])/gi)) set.add(decodeURIComponent(m[1]));
const missing = [...set].filter((rel) => !fs.existsSync(path.join('public/media', rel)));
console.log('referenced', set.size, 'missing', missing.length);
let ok = 0;
for (const rel of missing) {
  try {
    const r = await fetch('https://alamanfund.jo/wp-content/uploads/' + rel.split('/').map(encodeURIComponent).join('/'), { headers: { 'User-Agent': UA } });
    if (!r.ok) { if (!/-\d+x\d+\./.test(rel)) console.log(r.status, rel); continue; }
    const dest = path.join('public/media', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    ok++;
  } catch (e) { console.log('ERR', rel); }
}
console.log('downloaded', ok);
