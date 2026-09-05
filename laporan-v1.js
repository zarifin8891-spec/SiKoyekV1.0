/* SiKoyek V1.0 — Laporan Ringkasan & Progress Proyek V3 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_V4__)return;
  window.__SIKOYEK_LAPORAN_V4__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let projects=[];
  let summaryRows=[];
  let workItems=[];
  let progressRecords=[];
  let financialTransactions=[];
  let activeReport='summary';

  function styles(){
    if(document.getElementById('laporan-v4-style'))return;
    const s=document.createElement('style');s.id='laporan-v4-style';
    s.textContent=`
      .shell:has(.laporan-v3) .sidefoot{display:none!important}
      .laporan-v3{display:grid;gap:14px}
      .laporan-v3 .report-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap}
      .laporan-v3 .report-head h2{margin:0;font-size:20px}
      .laporan-v3 .report-head p{margin:4px 0 0;color:var(--muted);font-size:12px}
      .laporan-v3 .report-tabs{display:flex;gap:6px;flex-wrap:wrap}
      .laporan-v3 .report-tabs button{border:1px solid var(--line);background:#fff;color:var(--text);border-radius:9px;padding:8px 13px;cursor:pointer;font-weight:700}
      .laporan-v3 .report-tabs button.active{background:#092e53;border-color:#092e53;color:#fff}
      .laporan-v3 .filters{display:grid;grid-template-columns:1.2fr 1fr 1fr auto;gap:10px;align-items:end}
      .laporan-v3 .field{margin:0}.laporan-v3 .field label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:5px}
      .laporan-v3 .field input,.laporan-v3 .field select{width:100%;height:40px;border:1px solid var(--line);border-radius:9px;padding:8px 10px;background:#fff;color:var(--text)}
      .laporan-v3 .filter-actions{display:flex;gap:8px}.laporan-v3 .filter-actions .btn{height:40px;padding:0 13px}
      .laporan-v3 .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
      .laporan-v3 .kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:9px 12px;min-height:68px;display:flex;flex-direction:column;justify-content:center}
      .laporan-v3 .kpi .label{font-size:9px;line-height:1.1;color:var(--muted);font-weight:700}.laporan-v3 .kpi .value{margin-top:4px;font-size:17px;line-height:1.05;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v3 .tablecard{overflow:hidden}.laporan-v3 .scroll{overflow:auto}.laporan-v3 table{width:100%;border-collapse:collapse}.laporan-v3 th,.laporan-v3 td{padding:10px 11px;border-bottom:1px solid var(--line);font-size:12px;text-align:left;white-space:nowrap}.laporan-v3 th{font-size:9px;color:var(--muted);text-transform:uppercase;background:#fafbfd}.laporan-v3 .num{text-align:right}.laporan-v3 .center{text-align:center}.laporan-v3 .pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700}.laporan-v3 .green{background:var(--green2);color:var(--green)}.laporan-v3 .amber{background:var(--amber2);color:var(--amber)}.laporan-v3 .red{background:var(--red2);color:var(--red)}
      .laporan-v3 .progressbar{width:140px;max-width:100%;height:8px;background:#edf1f6;border-radius:999px;overflow:hidden}.laporan-v3 .progressbar i{display:block;height:100%;background:var(--blue)}
      .laporan-v3 .note-card{padding:12px 14px;font-size:12px;color:var(--muted)}
      .laporan-v3 .period-custom{display:none;grid-column:1/-1;grid-template-columns:1fr 1fr;gap:10px}
      .laporan-v3 .period-custom.show{display:grid}
      @media(max-width:1000px){.laporan-v3 .filters{grid-template-columns:1fr 1fr}.laporan-v3 .filter-actions{grid-column:1/-1}.laporan-v3 .kpis{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:650px){.laporan-v3 .filters,.laporan-v3 .kpis{grid-template-columns:1fr 1fr}.laporan-v3 .period-custom{grid-template-columns:1fr}.laporan-v3 .kpi .value{font-size:16px}}
    `;
    document.head.appendChild(s);
  }

  function shell(){
    const p=document.getElementById('page')||document.getElementById('module')||document.getElementById('app');
    if(!p)return null;
    p.innerHTML=`<div class="laporan-v3">
      <div class="report-tabs">
        <button type="button" data-report="summary" class="active">Ringkasan Proyek</button>
        <button type="button" data-report="progress">Progress Proyek</button>
      </div>
      <div id="reportContent"></div>
    </div>`;
    p.querySelectorAll('[data-report]').forEach(btn=>btn.addEventListener('click',()=>{activeReport=btn.dataset.report;renderReport()}));
    return p;
  }

  function periodOptions(selected='all'){
    return `<option value="all" ${selected==='all'?'selected':''}>Semua Periode</option>
      <option value="today" ${selected==='today'?'selected':''}>Hari Ini</option>
      <option value="week" ${selected==='week'?'selected':''}>Minggu Ini</option>
      <option value="month" ${selected==='month'?'selected':''}>Bulan Ini</option>
      <option value="quarter" ${selected==='quarter'?'selected':''}>3 Bulan Terakhir</option>
      <option value="year" ${selected==='year'?'selected':''}>Tahun Ini</option>
      <option value="custom" ${selected==='custom'?'selected':''}>Custom</option>`;
  }

  function periodRange(prefix){
    const kind=document.getElementById(prefix+'Period')?.value||'all';
    const now=new Date();
    const localDate=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
    if(kind==='all')return {from:'',to:''};
    if(kind==='custom')return {from:document.getElementById(prefix+'From')?.value||'',to:document.getElementById(prefix+'To')?.value||''};
    const to=localDate(now);let from=new Date(now);
    if(kind==='today')return {from:to,to};
    if(kind==='week'){const day=(now.getDay()+6)%7;from.setDate(now.getDate()-day)}
    else if(kind==='month')from=new Date(now.getFullYear(),now.getMonth(),1);
    else if(kind==='quarter')from.setDate(now.getDate()-89);
    else if(kind==='year')from=new Date(now.getFullYear(),0,1);
    return {from:localDate(from),to};
  }

  function periodControls(prefix){
    return `<div class="field"><label>Periode</label><select id="${prefix}Period">${periodOptions()}</select></div>
      <div class="period-custom" id="${prefix}Custom">
        <div class="field"><label>Dari Tanggal</label><input id="${prefix}From" type="date"></div>
        <div class="field"><label>Sampai Tanggal</label><input id="${prefix}To" type="date"></div>
      </div>`;
  }

  function projectIdsInPeriod(from,to){
    if(!from&&!to)return null;
    const ids=new Set();
    progressRecords.forEach(r=>{const d=String(r.progress_date||'').slice(0,10);if(d&&(!from||d>=from)&&(!to||d<=to))ids.add(String(r.project_id))});
    financialTransactions.forEach(r=>{const d=String(r.transaction_date||'').slice(0,10);if(d&&(!from||d>=from)&&(!to||d<=to))ids.add(String(r.project_id))});
    return ids;
  }

  function summaryView(){
    const content=document.getElementById('reportContent');
    content.innerHTML=`
      <div class="card" style="padding:14px"><div class="filters">
        ${periodControls('sum')}
        <div class="field"><label>Status</label><select id="sumStatus"><option value="">Semua Status</option><option value="SEHAT">Sehat</option><option value="PERLU PENGAWASAN">Perlu Pengawasan</option><option value="BERISIKO">Berisiko</option></select></div>
        <div class="field"><label>Cari</label><input id="sumSearch" placeholder="Kode atau nama proyek..."></div>
        <div class="filter-actions"><button class="btn ghost" type="button" id="sumReset">Reset</button></div>
      </div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">TOTAL PROYEK</div><div class="value" id="sumKpiProjects">0</div></div>
        <div class="kpi"><div class="label">NILAI KONTRAK</div><div class="value" id="sumKpiContract">Rp 0</div></div>
        <div class="kpi"><div class="label">TOTAL RAP</div><div class="value" id="sumKpiRap">Rp 0</div></div>
        <div class="kpi"><div class="label">TOTAL REALISASI</div><div class="value" id="sumKpiReal">Rp 0</div></div>
        <div class="kpi"><div class="label">AVG PROGRESS</div><div class="value" id="sumKpiProgress">0.00%</div></div>
      </div>
      <div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Nilai Kontrak</th><th class="num">RAP</th><th class="num">Realisasi</th><th>Progress</th><th>Rasio Biaya</th><th>Status</th></tr></thead><tbody id="sumBody"><tr><td colspan="8" class="empty">Memuat data...</td></tr></tbody></table></div></div>`;
    bindPeriod('sum',renderSummary);
    ['sumStatus','sumSearch'].forEach(id=>document.getElementById(id)?.addEventListener(id==='sumSearch'?'input':'change',renderSummary));
    document.getElementById('sumReset')?.addEventListener('click',()=>{document.getElementById('sumPeriod').value='all';document.getElementById('sumStatus').value='';document.getElementById('sumSearch').value='';toggleCustom('sum');renderSummary()});
    renderSummary();
  }

  function bindPeriod(prefix,fn){
    document.getElementById(prefix+'Period')?.addEventListener('change',()=>{toggleCustom(prefix);fn()});
    document.getElementById(prefix+'From')?.addEventListener('change',fn);
    document.getElementById(prefix+'To')?.addEventListener('change',fn);
    toggleCustom(prefix);
  }

  function toggleCustom(prefix){
    const custom=document.getElementById(prefix+'Custom');
    const show=(document.getElementById(prefix+'Period')?.value||'all')==='custom';
    custom?.classList.toggle('show',show);
  }

  function filteredSummary(){
    const {from,to}=periodRange('sum');
    const periodIds=projectIdsInPeriod(from,to);
    const status=document.getElementById('sumStatus')?.value||'';
    const search=(document.getElementById('sumSearch')?.value||'').trim().toLowerCase();
    return summaryRows.filter(x=>{
      if(periodIds&&!periodIds.has(String(x.project_id)))return false;
      if(status && String(x.health_status||'')!==status)return false;
      if(search){const hay=`${x.project_code||''} ${x.project_name||''}`.toLowerCase();if(!hay.includes(search))return false}
      return true;
    });
  }

  function renderSummary(){
    const data=filteredSummary();
    const sum=k=>data.reduce((t,x)=>t+Number(x[k]||0),0);
    const avg=data.length?sum('project_progress')/data.length:0;
    document.getElementById('sumKpiProjects').textContent=data.length;
    document.getElementById('sumKpiContract').textContent=money(sum('contract_value'));
    document.getElementById('sumKpiRap').textContent=money(sum('total_rap'));
    document.getElementById('sumKpiReal').textContent=money(sum('total_realization'));
    document.getElementById('sumKpiProgress').textContent=pct(avg);
    const body=document.getElementById('sumBody');if(!body)return;
    if(!data.length){body.innerHTML='<tr><td colspan="8" class="empty">Tidak ada data yang sesuai.</td></tr>';return}
    body.innerHTML=data.map(x=>{const hs=String(x.health_status||'').toUpperCase();const cls=hs==='SEHAT'?'green':hs==='BERISIKO'?'red':'amber';return `<tr><td><strong>${esc(x.project_code)}</strong></td><td>${esc(x.project_name)}</td><td class="num">${money(x.contract_value)}</td><td class="num">${money(x.total_rap)}</td><td class="num">${money(x.total_realization)}</td><td>${pct(x.project_progress)}</td><td>${pct(x.cost_ratio)}</td><td><span class="pill ${cls}">${esc(x.health_status||'-')}</span></td></tr>`}).join('');
  }

  function progressView(){
    const content=document.getElementById('reportContent');
    content.innerHTML=`
      <div class="card" style="padding:14px"><div class="filters">
        ${periodControls('prog')}
        <div class="field"><label>Dari Tanggal</label><input id="progFrom" type="date"></div>
        <div class="field"><label>Sampai Tanggal</label><input id="progTo" type="date"></div>
        <div class="filter-actions"><button class="btn ghost" type="button" id="progReset">Reset</button></div>
      </div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">TOTAL ITEM</div><div class="value" id="progKpiItems">0</div></div>
        <div class="kpi"><div class="label">ITEM SUDAH BERJALAN</div><div class="value" id="progKpiStarted">0</div></div>
        <div class="kpi"><div class="label">ITEM SELESAI</div><div class="value" id="progKpiDone">0</div></div>
        <div class="kpi"><div class="label">AVG PROGRESS ITEM</div><div class="value" id="progKpiAvg">0.00%</div></div>
        <div class="kpi"><div class="label">PROJECT PROGRESS</div><div class="value" id="progKpiProject">0.00%</div></div>
      </div>
      <div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th>Item Pekerjaan</th><th class="num">Bobot</th><th class="num">Progress Item</th><th class="num">Progress Berbobot</th><th>Visual</th><th>Status</th></tr></thead><tbody id="progBody"><tr><td colspan="8" class="empty">Memuat data...</td></tr></tbody></table></div></div>
      <div class="card note-card">Progress item dihitung dari akumulasi progress yang tersimpan. Progress berbobot = bobot item × progress item. Laporan ini tidak menampilkan target pekerjaan karena data target belum tersedia di struktur Progress saat ini.</div>`;
    bindPeriod('prog',renderProgress);
    ['progFrom','progTo'].forEach(id=>document.getElementById(id)?.addEventListener('change',renderProgress));
    document.getElementById('progReset')?.addEventListener('click',()=>{document.getElementById('progPeriod').value='all';document.getElementById('progFrom').value='';document.getElementById('progTo').value='';toggleCustom('prog');renderProgress()});
    renderProgress();
  }

  function renderProgress(){
    const selectedRange=periodRange('prog');
    const manualFrom=document.getElementById('progFrom')?.value||'';
    const manualTo=document.getElementById('progTo')?.value||'';
    const from=manualFrom||selectedRange.from;
    const to=manualTo||selectedRange.to;
    const selectedProjects=projects;
    const selectedIds=new Set(selectedProjects.map(p=>String(p.id)));
    const recByItem={};
    progressRecords.forEach(r=>{
      if(!selectedIds.has(String(r.project_id)))return;
      const d=String(r.progress_date||'').slice(0,10);
      if(from && (!d||d<from))return;
      if(to && (!d||d>to))return;
      recByItem[r.work_item_id]=(recByItem[r.work_item_id]||0)+Number(r.progress_percentage||0);
    });
    const data=workItems.filter(i=>selectedIds.has(String(i.project_id))).map(i=>{
      const progress=Math.min(100,recByItem[i.id]||0);
      const weight=Number(i.weight||0);
      const weighted=weight*(progress/100)*100;
      const project=projects.find(p=>String(p.id)===String(i.project_id));
      return {...i,progress,weighted,project};
    });
    const avg=data.length?data.reduce((s,x)=>s+x.progress,0)/data.length:0;
    const started=data.filter(x=>x.progress>0).length;
    const done=data.filter(x=>x.progress>=100).length;
    const projectProgress=selectedProjects.length?selectedProjects.reduce((s,p)=>{
      const items=data.filter(x=>String(x.project_id)===String(p.id));
      return s+(items.reduce((a,x)=>a+x.weighted,0));
    },0)/selectedProjects.length:0;
    document.getElementById('progKpiItems').textContent=data.length;
    document.getElementById('progKpiStarted').textContent=started;
    document.getElementById('progKpiDone').textContent=done;
    document.getElementById('progKpiAvg').textContent=pct(avg);
    document.getElementById('progKpiProject').textContent=pct(projectProgress);
    const body=document.getElementById('progBody');if(!body)return;
    if(!data.length){body.innerHTML='<tr><td colspan="8" class="empty">Tidak ada item atau progress pada filter yang dipilih.</td></tr>';return}
    body.innerHTML=data.map(x=>{const cls=x.progress>=100?'green':x.progress>0?'amber':'red';const status=x.progress>=100?'SELESAI':x.progress>0?'BERJALAN':'BELUM MULAI';return `<tr><td><strong>${esc(x.project?.project_code||'-')}</strong></td><td>${esc(x.project?.project_name||'-')}</td><td>${esc(x.work_name||'-')}</td><td class="num">${pct(Number(x.weight||0)*100)}</td><td class="num">${pct(x.progress)}</td><td class="num">${pct(x.weighted)}</td><td><div class="progressbar"><i style="width:${Math.max(0,Math.min(100,x.progress))}%"></i></div></td><td><span class="pill ${cls}">${status}</span></td></tr>`}).join('');
  }

  async function load(){
    const client=window.SK?.sb||window.sb;
    if(!client)return;
    const [{data:ps,error:e1},{data:sr,error:e2},{data:wi,error:e3},{data:pr,error:e4},{data:ft,error:e5}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name,contract_value').order('project_code'),
      client.from('project_summary').select('*').order('project_code'),
      client.from('project_work_items').select('*').order('sort_order'),
      client.from('progress_records').select('*').order('progress_date'),
      client.from('financial_transactions').select('project_id,transaction_date,transaction_type,amount')
    ]);
    const err=e1||e2||e3||e4||e5;
    if(err)throw err;
    projects=ps||[];
    summaryRows=sr||[];
    workItems=wi||[];
    progressRecords=pr||[];
    financialTransactions=ft||[];
  }

  function renderReport(){
    const root=document.querySelector('.laporan-v3');
    if(!root)return;
    if(activeReport==='progress')progressView();else summaryView();
    root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b.dataset.report===activeReport));
  }

  async function renderPage(){
    styles();
    const p=shell();
    if(!p)return;
    try{await load();renderReport()}catch(e){console.warn('SiKoyek Laporan:',e);const c=document.getElementById('reportContent');if(c)c.innerHTML='<div class="card"><div class="empty">Gagal memuat data Laporan: '+esc(e?.message||e)+'</div></div>'}
    window.applyRBACNav?.();
  }

  window.openLaporan=renderPage;
})();
