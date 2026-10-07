const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(process.argv[2]),output=process.argv[3]||'docs/cloud-audit/tenant-routing.json';
(async()=>{
 const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://local').pathname);if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file))}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({...(process.env.SIKOYEK_CHROMIUM?{executablePath:process.env.SIKOYEK_CHROMIUM}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),results=[];
 try{for(const tenant of JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'))).tenants){
  const folder=path.dirname(tenant.entry),sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,folder,'environment.js'),'utf8'),sandbox);const expected=sandbox.window.SIKOYEK_CONFIG;
  const context=await browser.newContext(),page=await context.newPage(),errors=[],external=[];
  await context.addInitScript(fs.readFileSync(path.join(__dirname,'fixture.js'),'utf8')+`\nwindow.__clientUrls=[];const factory=window.supabase.createClient;window.supabase.createClient=(url,key,options)=>{if(url!==${JSON.stringify(expected.url)}||key!==${JSON.stringify(expected.key)})throw new Error('Cross-client backend');window.__clientUrls.push(url);return factory(url,key,options)};`);
  await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith('http://127.0.0.1:'))return route.continue();if(url.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js'))return route.fulfill({contentType:'text/javascript',body:'/* offline SDK fixture */'});external.push(url);return route.abort()});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/'+tenant.entry);await page.waitForSelector('.dashboard-head');await page.waitForTimeout(1000);
  await page.evaluate(()=>go('projects'));await page.waitForTimeout(500);await page.evaluate(()=>openProject('p0'));await page.waitForTimeout(600);
  await page.evaluate(()=>setTab('keuangan'));await page.waitForTimeout(400);await page.evaluate(()=>go('laporan'));await page.waitForTimeout(700);
  for(const secondary of ['master-data.html','user-management.html','laporan.html','workspace.html','progress-v2.html']){await page.goto('http://127.0.0.1:'+server.address().port+'/'+folder+'/'+secondary);await page.waitForTimeout(600);assert.deepEqual(await page.evaluate(()=>window.__clientUrls),[expected.url],tenant.id+': '+secondary)}
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({tenant:tenant.id,expectedUrl:expected.url,passed:true,errors,external});console.log('PASS '+tenant.id+' backend routing and secondary pages');await context.close();
 }}finally{await browser.close();server.close()}
 fs.writeFileSync(output,JSON.stringify({passed:true,scope:'SDK fixture only; zero production database requests',results},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
