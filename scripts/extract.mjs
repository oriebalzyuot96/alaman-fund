import * as cheerio from 'cheerio'; import fs from 'fs'; import path from 'path';
const IN=process.argv[2], OUT=process.argv[3];
const urls=JSON.parse(fs.readFileSync(path.join(IN,'..','urls.json'),'utf8'));
const cf=h=>{const k=parseInt(h.slice(0,2),16);let s='';for(let i=2;i<h.length;i+=2)s+=String.fromCharCode(parseInt(h.slice(i,i+2),16)^k);return s};
const fileFor=u=>((u.replace('https://alamanfund.jo','')||'/index').replace(/^\//,'').replace(/[^\w\u0600-\u06FF-]+/g,'__')||'index');
const T=s=>(s||'').replace(/\s+/g,' ').trim();
const abs=u=>{if(!u)return u;try{return new URL(u,'https://alamanfund.jo/').href}catch{return u}};
const big=src=>src?src.replace(/-\d+x\d+(\.\w+)$/,'$1'):src;
const pages=[]; const media=new Set();
for(const url of urls){const f=path.join(IN,fileFor(url)+'.html'); if(!fs.existsSync(f))continue;
 const $=cheerio.load(fs.readFileSync(f,'utf8'));
 const lang=url.includes('/ar/')||url.endsWith('/ar')?'ar':'en';
 const title=T($('title').text()).replace(/\s*[-–|]\s*Al Aman Fund.*$|\s*[-–|]\s*صندوق الأمان.*$/,'');
 const desc=$('meta[name=description]').attr('content')||$('meta[property="og:description"]').attr('content')||'';
 const ogImage=$('meta[property="og:image"]').attr('content')||'';
 const date=$('time[datetime]').first().attr('datetime')||$('meta[property="article:published_time"]').attr('content')||'';
 $('[data-cfemail]').each((i,e)=>$(e).replaceWith(cf($(e).attr('data-cfemail'))));
 const m=$('main.l-main'); m.find('script,style,noscript,form input[type=hidden]').remove();
 const sections=[];
 m.children('section, div, article').each((i,sec)=>{const blocks=[];
  $(sec).find('h1,h2,h3,h4,h5,h6,p,li,img,video,iframe,a,blockquote,table,[data-src],small').each((j,el)=>{
   const tag=el.tagName; const $el=$(el);
   if(/^h[1-6]$/.test(tag)){const t=T($el.text()); const sub=tag==='h5'?T($el.next().text()):''; if(t) blocks.push(sub?{t:tag,text:t,sub}:{t:tag,text:t});}
   else if(tag==='p'||tag==='blockquote'){ if($el.parents('li,p,blockquote').length) return; const t=T($el.text()); if(t) blocks.push({t:'p',text:t});}
   else if(tag==='li'){ if($el.find('li').length) return; const t=T($el.text()); if(t && !$el.closest('nav,.w-nav').length) blocks.push({t:'li',text:t});}
   else if(tag==='img'){const s=abs(big($el.attr('data-src')||$el.attr('src'))); if(s&&!s.startsWith('data:')){media.add(s);blocks.push({t:'img',src:s,alt:T($el.attr('alt'))});}}
   else if(tag==='video'){const s=abs($el.attr('src')||$el.find('source').attr('src')); if(s){media.add(s);blocks.push({t:'video',src:s,poster:abs($el.attr('poster'))});}}
   else if(tag==='iframe'){const s=$el.attr('src')||$el.attr('data-src'); if(s) blocks.push({t:'iframe',src:s});}
   else if(tag==='a'){const h=$el.attr('href'); const t=T($el.text()); if(h&&t&&!/^javascript|^#$/.test(h)&&!$el.parents('p,li,h1,h2,h3,h4').length) blocks.push({t:'a',text:t,href:abs(h)}); else if(h&&/\.(pdf)$/i.test(h)) blocks.push({t:'a',text:t||path.basename(h),href:abs(h)}); }
   else if(tag==='small'){const v=T($el.prev('span').text()); if(v) blocks.push({t:'stat',value:v,text:T($el.text())});}
   else if(tag==='table'){const rows=[];$el.find('tr').each((k,tr)=>rows.push($(tr).find('th,td').map((q,c)=>T($(c).text())).get()));blocks.push({t:'table',rows});}
  });
  // background images
  $(sec).find('[style*="background"]').addBack('[style*="background"]').each((j,el)=>{const mm=($(el).attr('style')||'').match(/url\(["']?([^"')]+)/); if(mm){const s=abs(mm[1]);media.add(s);blocks.push({t:'bg',src:s});}});
  // dedupe consecutive duplicates
  const out=blocks.filter((b,k)=>!(k&&JSON.stringify(b)===JSON.stringify(blocks[k-1])));
  if(out.length) sections.push(out);
 });
 if(ogImage) media.add(ogImage);
 pages.push({url,lang,title,desc,ogImage,date,sections});
}
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(path.join(OUT,'pages.json'),JSON.stringify(pages,null,1));
fs.writeFileSync(path.join(OUT,'media.json'),JSON.stringify([...media].filter(s=>s.includes('alamanfund.jo')),null,1));
console.log(pages.length,'pages',media.size,'media');
