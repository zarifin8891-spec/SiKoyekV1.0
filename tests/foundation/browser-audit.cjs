const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'docs/cloud-audit/baseline-browser.json');
const fixture=fs.readFileSync(path.join(__dirname,'fixture.js'),'utf8');
(async()=>{
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname);const p=path.join(root,name==='/'?'index.html':name);if(!p.startsWith(root)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404);return res.end('missing')}res.setHeader('content-type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(p))}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({executablePath:process.env.SIKOYEK_CHROMIUM||'/workspace/scratch/d23346dc0a1c/browser/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
for(const role of ['admin','pelaksana']){
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[],missing=[],external=[];
 await context.addInitScript(`window.__testRole=${JSON.stringify(role)};`+fixture);
 await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith('http://127.0.0.1:'))return route.continue();if(url.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js'))return route.fulfill({contentType:'text/javascript',body:'/* fixture already installed */'});external.push(url);return route.abort()});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(new URL(r.url()).pathname)});
 await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForTimeout(3500);
 const snap=async(name)=>{const v=await page.evaluate(()=>({text:document.body.innerText,controls:[...document.querySelectorAll('button,input,select,textarea,a')].map(e=>({tag:e.tagName,text:(e.textContent||'').trim(),id:e.id,value:e.value||'',disabled:e.disabled||false,display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility,onclick:e.getAttribute('onclick'),href:e.getAttribute('href')})),styles:[...document.querySelectorAll('h1,h2,.kpi,.dashboard-kpi,.dashboard-head,.modalbox,th,td,.field label,.field input,.field select')].slice(0,250).map(e=>{let s=getComputedStyle(e),r=e.getBoundingClientRect();return [e.tagName,e.className,e.textContent.slice(0,50),s.fontFamily,s.fontSize,s.fontWeight,s.color,s.backgroundColor,s.padding,s.borderRadius,Math.round(r.width),Math.round(r.height)]}),audit:window.__audit}));results.push({role,name,...v});};
 await snap('dashboard');const cb=await page.evaluate(()=>window.__audit.callbacks),q=await page.evaluate(()=>window.__audit.queries.length);await page.waitForTimeout(3000);results.at(-1).idle={callbacks:(await page.evaluate(()=>window.__audit.callbacks))-cb,queries:(await page.evaluate(()=>window.__audit.queries.length))-q};
 if(role==='admin'){
  await page.evaluate(()=>go('projects'));await page.waitForTimeout(700);await snap('projects');
  await page.evaluate(()=>openProject('p0'));await page.waitForTimeout(1200);await snap('detail-overview');
  for(const tab of ['pekerjaan','progress','rap','keuangan','cost']){await page.evaluate(t=>setTab(t),tab);await page.waitForTimeout(600);await snap('detail-'+tab)}
  await page.evaluate(()=>openProjectForm());await page.waitForTimeout(1000);await snap('project-form');await page.evaluate(()=>closeModal());
  await page.evaluate(()=>openMasterData());await page.waitForTimeout(1000);await snap('master');
 }
 results.at(-1).errors=errors;results.at(-1).missing=[...new Set(missing)];results.at(-1).external=external;
 await context.close();
}
await browser.close();server.close();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({role:r.role,name:r.name,clients:r.audit.clients,observers:r.audit.observers,callbacks:r.audit.callbacks,queries:r.audit.queries.length,idle:r.idle,errors:r.errors,missing:r.missing,external:r.external})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
