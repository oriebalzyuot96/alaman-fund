import fs from 'fs'; import path from 'path';
const OUT=process.argv[2]; fs.mkdirSync(OUT+'/html',{recursive:true});
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const seen=new Set(), queue=['https://alamanfund.jo/','https://alamanfund.jo/ar/homepage-ar'];
const norm=u=>{try{const x=new URL(u,'https://alamanfund.jo/');if(x.hostname!=='alamanfund.jo')return null;if(/\/(wp-content|wp-json|wp-admin|feed|xmlrpc|wp-login)|\.(jpe?g|png|pdf|webp|gif|svg|mp4|zip|docx?|xlsx?)$/i.test(x.pathname))return null;if(/replytocom|share=|\?/.test(x.search))return null;x.hash='';let p=x.pathname.replace(/\/+$/,'')||'/';return 'https://alamanfund.jo'+p;}catch{return null}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let n=0;
while(queue.length&&n<400){const u=norm(queue.shift());if(!u||seen.has(u))continue;seen.add(u);
 let r;try{r=await fetch(u,{headers:{'User-Agent':UA,'Accept':'text/html'}});}catch(e){console.log('ERR',u);continue}
 if(!r.ok||!(r.headers.get('content-type')||'').includes('html')){console.log(r.status,u);continue}
 const h=await r.text();n++;const f=(u.replace('https://alamanfund.jo','')||'/index').replace(/^\//,'').replace(/[^\w؀-ۿ-]+/g,'__')||'index';
 fs.writeFileSync(`${OUT}/html/${f}.html`,h);console.log(n,u);
 for(const m of h.matchAll(/href=["']([^"'#]+)["']/g)){const v=norm(m[1]);if(v&&!seen.has(v))queue.push(v);}
 await sleep(250);}
fs.writeFileSync(OUT+'/urls.json',JSON.stringify([...seen],null,1));
