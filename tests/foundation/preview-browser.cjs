const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]||'docs/cloud-audit/preview-browser.json');
(async()=>{
 const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://local').pathname);if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end('missing')}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'text/html');res.end(fs.readFileSync(file))}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({...(process.env.SIKOYEK_CHROMIUM?{executablePath:process.env.SIKOYEK_CHROMIUM}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const origin='http://127.0.0.1:'+server.address().port,errors=[],external=[],missing=[],checks=[];
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(15000);
 await context.route('**/*',route=>{if(route.request().url().startsWith(origin+'/'))return route.continue();external.push(route.request().url());return route.abort()});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
 const check=name=>{checks.push(name);console.log('PASS '+name)};
 const enter=async(tenant,role='admin')=>{await page.goto(origin+'/');await page.selectOption('#tenant',tenant);await page.selectOption('#role',role);await page.click('#open');await page.waitForSelector('.dashboard-head');await page.waitForTimeout(800);};
 const rows=table=>page.evaluate(async table=>(await sb.from(table).select('*')).data,table);
 try{
  await enter('master');assert.equal((await rows('projects')).length,6);check('master seeded dashboard');
  assert.equal(await page.locator('.control-dashboard').count(),1);
  assert.equal(await page.locator('.control-legacy').count(),0);
  await page.locator('.control-period').waitFor();
  await page.locator('#dashboard-decision-panel').waitFor();
  await page.locator('#chartCashFlow').waitFor();
  const curveProject=page.getByRole('combobox',{name:'Proyek Kurva-S'});
  assert.equal(await curveProject.inputValue(),'p0');
  await page.locator('.control-legend .target').filter({hasText:'Target Manual'}).waitFor();
  await curveProject.selectOption('p1');
  await page.locator('.control-legend .target').filter({hasText:'Target Otomatis'}).waitFor();
  const points=await page.locator('.control-dot.target title').allTextContents();
  assert.equal(points[0],'2026-08-31 · 0%');
  assert.equal(points[1],'2026-09-07 · 20%');
  assert.equal(points.at(-1),'2026-10-12 · 100%');
  await page.locator('.control-legend .actual').filter({hasText:'30%'}).waitFor();
  await curveProject.selectOption('p0');
  await page.getByRole('searchbox',{name:'Pencarian proyek'}).fill('Proyek Uji 1');
  assert.equal(await page.locator('.control-project-list tbody tr').count(),1);
  assert.equal(await page.locator('.control-project-list tbody tr:first-child td').count(),7);
  await page.getByRole('searchbox',{name:'Pencarian proyek'}).fill('');
  await page.locator('.control-period [name=from]').fill('2026-09-01');
  await page.locator('.control-period [name=to]').fill('2026-09-01');
  await page.getByRole('button',{name:'Terapkan',exact:true}).click();
  await page.getByText('Tidak ada transaksi pada periode ini.',{exact:true}).waitFor();
  assert.equal(await page.locator('.control-project-list tbody tr').count(),6);
  await page.getByRole('button',{name:'Semua Periode',exact:true}).click();
  await page.locator('#chartCashFlow').waitFor();
  assert.ok(await page.locator('.control-finance-host tbody [data-project]').count()>0);
  check('one dashboard keeps project, decision and finance content under the same period');
  const sidebar=page.getByRole('navigation',{name:'Menu utama'});
  for(const title of ['Dashboard','Daftar Proyek','Laporan','Master Data']){
    assert.ok(await sidebar.getByRole('button',{name:title,exact:true}).isVisible());
  }
  for(const title of ['Jadwal & Milestones','Anggaran & Biaya','Material & Logistik','Tenaga Kerja & Alat']){
    assert.equal(await sidebar.getByRole('button',{name:title,exact:true}).count(),0);
  }
  await sidebar.getByRole('button',{name:'Daftar Proyek',exact:true}).click();
  const projectFilter=page.getByRole('combobox',{name:'Filter daftar proyek'});
  await projectFilter.waitFor();
  assert.equal(await projectFilter.inputValue(),'all');
  await page.evaluate(()=>{state.summary.find(row=>row.project_id==='p5').status='SELESAI';});
  await projectFilter.selectOption('active');
  assert.equal(await page.locator('#page table tbody tr').count(),5);
  await projectFilter.selectOption('all');
  assert.equal(await page.locator('#page table tbody tr').count(),6);
  await page.getByRole('button',{name:'Proyek Uji 1',exact:true}).click();
  const tabs=page.locator('#page .tabs');
  await tabs.getByRole('button',{name:'Kurva-S',exact:true}).click();
  await page.locator('#project-tab-content .control-chart').waitFor();
  await page.getByRole('heading',{name:'Milestones',exact:true}).waitFor();
  assert.match(await page.locator('.sk-project-header').evaluate(el=>getComputedStyle(el).backgroundImage),/page-header-network/);
  await tabs.getByRole('button',{name:'Material & Logistik',exact:true}).click();
  await page.getByRole('heading',{name:'Saldo material per proyek'}).waitFor();
  assert.equal(await page.locator('#project-tab-content select').count(),0);
  await tabs.getByRole('button',{name:'Tenaga Kerja & Alat',exact:true}).click();
  await page.getByRole('heading',{name:'Penempatan alat',exact:true}).waitFor();
  await sidebar.getByRole('button',{name:'Laporan',exact:true}).click();
  await page.locator('.report-tabs').waitFor();
  await page.getByRole('button',{name:'Dokumen Proyek',exact:true}).waitFor();
  await sidebar.getByRole('button',{name:'Dashboard',exact:true}).click();
  await page.locator('.dashboard-head').waitFor();
  check('sidebar routes, project status filter, project tabs, and direct Laporan');
  await sidebar.getByRole('button',{name:'Master Data',exact:true}).click();
  const masterTabs=page.locator('.md-tabs');
  await masterTabs.waitFor();
  assert.equal(await masterTabs.getByRole('button').count(),7);
  for (const [tab, key, code, name] of [['Karyawan','employees','K-UJI','Karyawan Uji'],['Alat','equipment','A-UJI','Alat Uji'],['Barang','goods','BR-UJI','Barang Uji']]){
    await masterTabs.getByRole('button',{name:tab,exact:true}).click();
    const panel=page.locator('[data-master-panel="'+key+'"]');
    await panel.getByRole('button',{name:'+ Tambah',exact:true}).click();
    await panel.getByRole('dialog').waitFor();
    await panel.locator('input[name=code]').fill(code);
    await panel.locator('input[name=name]').fill(name);
    if(key==='goods') await panel.locator('input[name=unit]').fill('kg');
    await panel.getByRole('dialog').getByRole('button',{name:'Simpan',exact:true}).click();
    await panel.getByRole('cell',{name:name,exact:true}).waitFor();
    assert.equal(await page.locator('[data-master-panel]:visible').count(),1);
  }
  await sidebar.getByRole('button',{name:'Daftar Proyek',exact:true}).click();
  await page.getByRole('button',{name:'Proyek Uji 1',exact:true}).click();
  await tabs.getByRole('button',{name:'Material & Logistik',exact:true}).click();
  const goods=page.locator('#project-tab-content select[name=goods_id]');
  await goods.selectOption({label:'BR-UJI — Barang Uji (kg)'});
  const stockForm=goods.locator('xpath=ancestor::form');
  await stockForm.locator('[name=quantity]').fill('15');
  await stockForm.locator('[name=minimum_quantity]').fill('5');
  await stockForm.getByRole('button',{name:'Tambah',exact:true}).click();
  await page.getByRole('cell',{name:'Barang Uji',exact:true}).waitFor();
  assert.equal((await rows('project_material_stocks')).find(row=>row.name==='Barang Uji')?.unit,'kg');
  await tabs.getByRole('button',{name:'Tenaga Kerja & Alat',exact:true}).click();
  for(const [key,label,table,catalog] of [['employee_id','K-UJI — Karyawan Uji','project_worker_assignments','employee_master'],
      ['equipment_id','A-UJI — Alat Uji','project_equipment_assignments','equipment_master']]){
    const dropdown=page.locator('#project-tab-content select[name="'+key+'"]');
    const form=dropdown.locator('xpath=ancestor::form');
    await dropdown.selectOption({label});
    const selected=await dropdown.inputValue();
    await form.locator('input[name=starts_on]').fill('2026-12-28');
    await form.getByRole('button',{name:'Tambah',exact:true}).click();
    await page.waitForFunction(async({key,selected,table})=>(await sb.from(table).select('*')).data.some(row=>row[key]===selected&&row.project_id==='p0'),{key,selected,table});
    assert.ok((await rows(catalog)).some(row=>row.id===selected));
  }
  await sidebar.getByRole('button',{name:'Dashboard',exact:true}).click();
  await page.locator('.dashboard-head').waitFor();
  check('tabbed Master Data creates workers and tools available in project assignment dropdowns');



  await page.evaluate(()=>openProjectForm());await page.waitForSelector('#uiFinalNext');assert.equal(await page.locator('#uiFinalBack').isVisible(),false);assert.equal(await page.locator('#uiFinalSave').isVisible(),false);await page.click('#uiFinalNext');assert.equal((await rows('projects')).length,6);check('required validation does not save');
  await page.fill('#f_code','PREVIEW-001');await page.fill('#f_name','Proyek Uji Tambah');await page.fill('#f_contract','100000000');await page.click('#uiFinalNext');assert.equal((await rows('projects')).length,6);assert.equal(await page.locator('#uiFinalNext').isVisible(),false);assert.equal(await page.locator('#uiFinalSave').isVisible(),true);check('confirmation shows the save action without saving');await page.click('#uiFinalSave');await page.waitForSelector('#modal',{state:'detached'});
  const id=(await rows('projects')).find(p=>p.project_code==='PREVIEW-001').id;await page.evaluate(id=>openProject(id),id);await page.waitForFunction(()=>state.detail?.project?.project_code==='PREVIEW-001');assert.equal((await rows('projects')).length,7);check('project create through UI persists');
  await page.evaluate(id=>p5EditProject(id),id);await page.waitForSelector('#p5_name');await page.fill('#p5_name','Proyek Uji Edit');await page.click('#p5EditSave');assert.equal((await rows('projects')).find(p=>p.id===id).project_name,'Proyek Uji Edit');check('unstarted project edit through UI');
  await page.evaluate(()=>openItemForm());await page.waitForSelector('#wi_name');await page.fill('#wi_name','Pekerjaan Uji');await page.fill('#wi_weight','40');await page.evaluate(()=>saveItem());assert.equal((await rows('project_work_items')).filter(i=>i.project_id===id).length,1);check('work item create through UI');
  await page.evaluate(()=>openRapForm());await page.waitForSelector('#rap_material');await page.fill('#rap_material','30000000');await page.evaluate(()=>saveRap());assert.equal((await rows('project_rap')).find(r=>r.project_id===id).material,30000000);check('RAP save through UI');
  await page.evaluate(()=>openProgressForm());await page.waitForSelector('#pr_pct');await page.fill('#pr_pct','25');await page.evaluate(()=>saveProgress());assert.equal((await rows('progress_records')).filter(p=>p.project_id===id).length,1);assert.equal((await rows('projects')).find(p=>p.id===id).project_progress,10);check('progress save and weighted contribution');
  await page.evaluate(()=>openTxForm());await page.waitForSelector('#tx_amount');await page.selectOption('#tx_type','KELUAR');await page.waitForSelector('#tx_cat option[value="Material"]',{state:'attached'});await page.selectOption('#tx_cat','Material');await page.fill('#tx_amount','12345');await page.fill('#tx_desc','Transaksi Uji');await page.evaluate(()=>saveTx());assert.equal((await rows('financial_transactions')).filter(t=>t.project_id===id).length,1);check('financial transaction save through UI');
  await page.reload();await page.waitForSelector('.dashboard-head');assert.equal((await rows('projects')).length,7);check('preview mutations survive reload');
  await page.evaluate(id=>openProject(id),id);await page.waitForTimeout(800);assert.equal(await page.getByRole('button',{name:'Edit Proyek',exact:true}).isDisabled(),true);check('project lock after financial history');
  await page.evaluate(()=>go('users'));await page.waitForSelector('.um-grid');await page.evaluate(()=>umAdd());await page.fill('#um_name','User Baru Uji');await page.fill('#um_email','baru@preview.invalid');await page.fill('#um_password','Preview999!');await page.fill('#um_password_confirm','Preview999!');await page.selectOption('#um_role','keuangan');await page.evaluate(()=>umSaveAdd());assert.ok((await rows('profiles')).some(p=>p.email==='baru@preview.invalid'));check('user create invokes isolated preview adapter');
  const newUser=(await rows('profiles')).find(p=>p.email==='baru@preview.invalid');await page.evaluate(id=>umEdit(id),newUser.id);await page.fill('#um_edit_name','User Edit Uji');await page.evaluate(id=>umSaveEdit(id),newUser.id);assert.equal((await rows('profiles')).find(p=>p.id===newUser.id).full_name,'User Edit Uji');check('user edit');
  page.once('dialog',dialog=>dialog.accept());await page.evaluate(id=>umDelete(id,'User Edit Uji'),newUser.id);assert.equal((await rows('profiles')).some(p=>p.id===newUser.id),false);check('user delete confirmation');
  await page.evaluate(()=>go('master-data'));await page.waitForSelector('.md-page');
  for(const [opener,table,name] of [['mdAddFinanceCategory','transaction_categories','Kategori Uji Simpan'],['mdAddPaymentMethod','payment_methods','Metode Uji Simpan']]){
   await page.evaluate(fn=>window[fn](),opener);await page.fill('#md_name','');await page.locator('#modal').getByRole('button',{name:'Simpan',exact:true}).click();assert.ok(await page.locator('#md_name').isVisible());
   await page.fill('#md_name',name);await page.locator('#modal').getByRole('button',{name:'Simpan',exact:true}).click();await page.waitForSelector('#modal',{state:'detached'});assert.ok((await rows(table)).some(r=>r.name===name));check(table+' actual save button and required validation');
  }
  await page.evaluate(()=>go('laporan'));await page.waitForTimeout(1600);await page.locator('.report-tabs button[data-report="finance"]').click();await page.waitForTimeout(1000);
  const financePrefix=await page.locator('#finPeriod,#financePeriod').evaluate(el=>el.id.slice(0,-6));
  const today=await page.evaluate(()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');return{month:d.getFullYear()+'-'+pad(d.getMonth()+1)+'-01',quarter:(()=>{d.setDate(d.getDate()-89);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())})()}});
  await page.selectOption('#'+financePrefix+'Period','month');await page.waitForFunction(({prefix,value})=>document.getElementById(prefix+'From').value===value,{prefix:financePrefix,value:today.month});check('active finance report uses the selected calendar month');
  await page.selectOption('#'+financePrefix+'Period','all');await page.waitForFunction(prefix=>!document.getElementById(prefix+'From').value&&!document.getElementById(prefix+'To').value,financePrefix);check('active finance report all-period reset');
  await page.evaluate(id=>openProject(id),id);await page.waitForTimeout(500);
  for(const [progress,status] of [[0.01,'AWASI'],[0,'BERISIKO']]){
   await page.evaluate(({progress})=>{state.summary.find(p=>p.project_id===state.selected).project_progress=progress;state.detail.fin=[{transaction_type:'KELUAR',category:'Material',amount:1800000}];setTab('cost')},{progress});await page.waitForSelector('#cost-control-v7');assert.ok((await page.locator('#cost-control-v7').innerText()).includes(status));check('cost V7 deployed Health threshold '+status);
  }
  await enter('konstruva');assert.equal((await rows('projects')).length,6);check('KONSTRUVA data isolated from MASTER preview');
  await enter('klien-baru');assert.equal((await rows('projects')).length,6);check('new client uses same source and isolated data');
  for(const role of ['direktur','keuangan','marketing','pelaksana']){await enter('master',role);assert.equal(await page.evaluate(async()=>(await sb.auth.getSession()).data.session.user.email),role+'@preview.invalid');if(role==='pelaksana'){const rejected=await page.evaluate(()=>sb.from('projects').insert({project_code:'DENIED',project_name:'Denied'}));assert.ok(rejected.error);check('preview adapter rejects unauthorized direct write')}check('role '+role+' dashboard');}
  await enter('master');await page.evaluate(()=>logout());await page.waitForSelector('.login-v1 #email');await page.fill('#email','admin@preview.invalid');await page.fill('#password','Preview123!');await page.click('#loginBtn');await page.waitForSelector('.dashboard-head');assert.ok(await page.getByRole('button',{name:'Log Lapangan',exact:true}).isVisible());assert.match(await page.locator('.control-sidebar .control-identity').innerText(),/Pengguna Uji admin/);
  assert.equal(await page.locator('.dashboard-head .control-identity').count(),0);
  await page.waitForFunction(()=>document.querySelector('.control-brand img')?.naturalWidth===480);
  await page.setViewportSize({width:360,height:800});
  const menu=page.getByRole('button',{name:'Menu',exact:true});
  await menu.click();
  assert.ok(await page.locator('.control-sidebar .control-identity').isVisible());
  const brand=await page.locator('.control-brand img').boundingBox(), menuBox=await menu.boundingBox();
  assert.ok(brand.x+brand.width<=menuBox.x,'logo fits alongside the mobile menu');
  await menu.click();
  await page.setViewportSize({width:1440,height:1000});
  check('credential login shows the account and logo in the responsive sidebar');
  await page.goto(origin+'/');await page.selectOption('#tenant','master');await page.click('#reset');await page.selectOption('#role','admin');await page.click('#open');await page.waitForSelector('.dashboard-head');assert.equal((await rows('projects')).length,6);check('reset selected tenant restores seed');
  await page.goto(origin+'/');await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#open').isVisible());await page.screenshot({path:path.join(path.dirname(output),'preview-portal.png'),fullPage:true});check('mobile preview portal');
  assert.deepEqual(external,[]);assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);check('zero external requests, 404s and JavaScript errors');
  fs.writeFileSync(output,JSON.stringify({passed:true,checks,errors,external,missing,scope:'synthetic local browser simulation; no production database requests'},null,2)+'\n');
 }catch(error){console.error(JSON.stringify({errors,external,missing,page:await page.evaluate(()=>({text:document.body.innerText,project:window.state?.detail?.project,selected:window.state?.selected}))},null,2));await page.screenshot({path:path.join(path.dirname(output),'preview-failure.png'),fullPage:true});throw error}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
