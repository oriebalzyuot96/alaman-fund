// Downloads every media file referenced by raw/pages.json into public/media/ (mirrors the wp-content/uploads path).
import fs from 'fs'; import path from 'path';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const pages=JSON.parse(fs.readFileSync('raw/pages.json','utf8'));
const set=new Set(JSON.parse(fs.readFileSync('raw/media.json','utf8')));
const html=fs.readdirSync('raw/html').map(f=>fs.readFileSync('raw/html/'+f,'utf8')).join('\n');
for(const m of html.matchAll(/https:\/\/alamanfund\.jo\/wp-content\/uploads\/[^"'\s)?,]+\.(?:jpe?g|png|webp|svg|gif|pdf|mp4)/gi)) set.add(m[0]);
const list=[...set].filter(u=>u.includes('/wp-content/uploads/'));
let ok=0,fail=0; const q=[...list];
async function worker(){while(q.length){const u=q.shift();const rel=decodeURIComponent(u.split('/wp-content/uploads/')[1]);const dest=path.join('public/media',rel);
 if(fs.existsSync(dest)){ok++;continue}
 try{const r=await fetch(u,{headers:{'User-Agent':UA}});if(!r.ok)throw r.status;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,Buffer.from(await r.arrayBuffer()));ok++;}catch(e){fail++;console.log('FAIL',e,u)}}}
await Promise.all(Array.from({length:4},worker));
console.log('done',ok,'ok',fail,'failed of',list.length);
