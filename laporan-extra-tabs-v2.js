/* SiKoyek V1.0 — Additional report tabs v2 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_EXTRA_TABS_V2__)return;
  window.__SIKOYEK_LAPORAN_EXTRA_TABS_V2__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const tabDefs=[
    ['rap','Laporan RAP & Biaya'],
    ['finance','Laporan Keuangan'],
    ['cashflow','Laporan Cash Flow'],
    ['period','Laporan per Periode'],
    ['export','Export / Print']
  ];

  let data={projects:[],summary:[],transactions:[],progress:[]};
  let currentExtra='';
  let mountedRoot=null;
  let pollCount=0;
  let polling=false;

  function style(){
    if(document.getElementById('laporan-extra-style-v2'))return;
    const s=document.createElement('style');
    s.id='laporan-extra-style-v2';
    s.textContent=`
      .laporan-v3 .extra-report-tab{border:1px solid var(--line);background:#fff;color:var(--text);border-radius:9px;padding:8px 13px;cursor:pointer;font-weight:700}
      .laporan-v3 .extra-report-tab.active{background:#092e53;border-color:#092e53;color:#fff}
      .laporan-v3 .extra-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:8px}
      .laporan-v3 .extra-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-height:68px;display:flex;flex-direction:column;justify-content:center}
      .laporan-v3 .extra-kpi small{font-size:9px;color:var(--muted);font-weight:700}
      .laporan-v3 .extra-kpi strong{font-size:17px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v3 .extra-actions{display:flex;gap:8px;flex-wrap:wrap}
      .laporan-v3 .extra-period-grid{display:grid;grid-template-columns:1.1fr 1fr 1fr 1.1fr auto;gap:10px;align-items:end}
      .laporan-v3 .extra-empty{padding:28px;text-align:center;color:var(--muted)}
      .laporan-v3 .extra-note{padding:12px 14px;font-size:12px;color:var(--muted)}
      @media(max-width:1000px){.laporan-v3 .extra-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.laporan-v3 .extra-period-grid{grid-template-columns:1fr 1fr}.laporan-v3 .extra-period-grid .extra-actions{grid-column:1/-1}}
      @media(max-width:650px){.laporan-v3 .extra-kpis{grid-template-columns:1fr 1fr}.laporan-v3 .extra-period-grid{grid-template-columns:1fr}}
      @media print{.laporan-v3 .report-tabs,.laporan-v3 .core-module-header,.sidebar{display:none!important}.content{padding:0!important}.laporan-v3 .card{box-shadow:none!important}}
    `;
    document.head.appendChild(s);
  }

  async function loadData(){
    const client=window.SK?.sb||window.sb;
    if(!client)throw new Error('Supabase client belum siap.');
    const [{data:projects,error:e1},{data:summary,error:e2},{data:transactions,error:e3},{data:progress,error:e4}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name,contract_value').order('project_code'),
      client.from('project_summary').select('*').order('project_code'),
      client.from('financial_transactions').select('*').order('transaction_date'),
      client.from('progress_records').select('*').order('progress_date')
    ]);
    const err=e1||e2||e3||e4;
    if(err)throw err;
    data={projects:projects||[],summary:summary||[],transactions:transactions||[],progress:progress||[]};
  }

  function projectName(id){
    const p=data.projects.find(x=>String(x.id)===String(id));
    return p?`${p.project_code||'-'} — ${p.project_name||'-'}`:'-';
  }

  function txKind(r){
    const t=String(r.transaction_type||r.type||r.category||'').toUpperCase();
    if(/IN|MASUK|PENERIMAAN|RECEIPT|PENDAPATAN/.test(t))return 'in';
    if(/OUT|KELUAR|PENGELUARAN|PAYMENT|BIAYA|BELANJA/.test(t))return 'out';
    return 'other';
  }

  function periodOpts(){
    return '<option value="all">Semua Periode</option><option value="today">Hari Ini</option><option value="week">Minggu Ini</option><option value="month">Bulan Ini</option><option value="quarter">3 Bulan Terakhir</option><option value="year">Tahun Ini</option><option value="custom">Custom</option>';
  }

  function range(id){
    const kind=document.getElementById(id+'Period')?.value||'all';
    const now=new Date();
    const today=localDate(now);
    if(kind==='all')return {from:'',to:''};
    if(kind==='today')return {from:today,to:today};
    if(kind==='week'){const d=new Date(now);d.setDate(now.getDate()-((now.getDay()+6)%7));return {from:localDate(d),to:today};}
    if(kind==='month')return {from:localDate(new Date(now.getFullYear(),now.getMonth(),1)),to:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))};
    if(kind==='quarter'){const d=new Date(now);d.setMonth(now.getMonth()-2);d.setDate(1);return {from:localDate(d),to:today};}
    if(kind==='year')return {from:localDate(new Date(now.getFullYear(),0,1)),to:localDate(new Date(now.getFullYear(),11,31))};
    return {from:document.getElementById(id+'From')?.value||'',to:document.getElementById(id+'To')?.value||''};
  }

  function periodBox(id){
    return `<div class="card" style="padding:14px"><div class="extra-period-grid">
      <div class="field"><label>Periode</label><select id="${id}Period">${periodOpts()}</select></div>
      <div class="field"><label>Dari Tanggal</label><input id="${id}From" type="date"></div>
      <div class="field"><label>Sampai Tanggal</label><input id="${id}To" type="date"></div>
      <div class="field"><label>Proyek</label><select id="${id}Project"><option value="">Semua Proyek</option>${data.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_code||'-')} — ${esc(p.project_name||'-')}</option>`).join('')}</select></div>
      <div class="extra-actions"><button class="btn ghost" type="button" id="${id}Reset">Reset</button></div>
    </div></div>`;
  }

  function bindPeriod(id,render){
    const p=document.getElementById(id+'Period');
    const f=document.getElementById(id+'From');
    const t=document.getElementById(id+'To');
    const sync=()=>{
      const r=range(id);
      if(p?.value==='custom'){
        f?.removeAttribute('readonly');t?.removeAttribute('readonly');
      }else{
        if(f)f.value=r.from;if(t)t.value=r.to;
        f?.setAttribute('readonly','readonly');t?.setAttribute('readonly','readonly');
      }
      render();
    };
    p?.addEventListener('change',sync);
    f?.addEventListener('change',render);
    t?.addEventListener('change',render);
    document.getElementById(id+'Project')?.addEventListener('change',render);
    document.getElementById(id+'Reset')?.addEventListener('click',()=>{if(p)p.value='all';if(f)f.value='';if(t)t.value='';const pr=document.getElementById(id+'Project');if(pr)pr.value='';sync()});
    sync();
  }

  function rapView(){
    const rows=data.summary.map(r=>({r,rap:Number(r.total_rap||0),real:Number(r.total_realization||0),ratio:Number(r.cost_ratio||0),progress:Number(r.project_progress||0)}));
    const rap=rows.reduce((s,x)=>s+x.rap,0),real=rows.reduce((s,x)=>s+x.real,0);
    document.getElementById('reportContent').innerHTML=`<div class="extra-kpis"><div class="extra-kpi"><small>TOTAL PROYEK</small><strong>${rows.length}</strong></div><div class="extra-kpi"><small>TOTAL RAP</small><strong>${money(rap)}</strong></div><div class="extra-kpi"><small>TOTAL REALISASI</small><strong>${money(real)}</strong></div><div class="extra-kpi"><small>RAP TERSISA</small><strong>${money(rap-real)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">RAP</th><th class="num">Realisasi</th><th class="num">Sisa RAP</th><th>Progress</th><th>Rasio Biaya</th><th>Status</th></tr></thead><tbody>${rows.length?rows.map(x=>`<tr><td><strong>${esc(x.r.project_code||'-')}</strong></td><td>${esc(x.r.project_name||'-')}</td><td class="num">${money(x.rap)}</td><td class="num">${money(x.real)}</td><td class="num">${money(x.rap-x.real)}</td><td>${pct(x.progress)}</td><td>${pct(x.ratio)}</td><td>${esc(x.r.health_status||'-')}</td></tr>`).join(''):`<tr><td colspan="8" class="extra-empty">Belum ada data.</td></tr>`}</tbody></table></div></div><div class="card extra-note">RAP, realisasi, rasio biaya, dan progress mengikuti ringkasan proyek.</div>`;
  }

  function financeView(){
    document.getElementById('reportContent').innerHTML=periodBox('fin');
    bindPeriod('fin',renderFinance);
  }
  function renderFinance(){
    const {from,to}=range('fin');const pid=document.getElementById('finProject')?.value||'';
    const rows=data.transactions.filter(r=>{const d=String(r.transaction_date||'').slice(0,10);return (!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});
    let income=0,expense=0;rows.forEach(r=>{const a=Number(r.amount||0);if(txKind(r)==='in')income+=a;else if(txKind(r)==='out')expense+=a});
    const c=document.getElementById('reportContent');if(!c)return;
    c.querySelectorAll('.extra-dynamic').forEach(x=>x.remove());
    c.insertAdjacentHTML('beforeend',`<div class="extra-dynamic"><div class="extra-kpis"><div class="extra-kpi"><small>TRANSAKSI</small><strong>${rows.length}</strong></div><div class="extra-kpi"><small>PEMASUKAN</small><strong>${money(income)}</strong></div><div class="extra-kpi"><small>PENGELUARAN</small><strong>${money(expense)}</strong></div><div class="extra-kpi"><small>NET</small><strong>${money(income-expense)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Tanggal</th><th>Proyek</th><th>Jenis</th><th>Keterangan</th><th class="num">Jumlah</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(String(r.transaction_date||'').slice(0,10))}</td><td>${esc(projectName(r.project_id))}</td><td>${esc(r.transaction_type||r.type||'-')}</td><td>${esc(r.description||r.notes||r.remark||'-')}</td><td class="num">${money(r.amount)}</td></tr>`).join('')||'<tr><td colspan="5" class="extra-empty">Tidak ada transaksi pada periode/filter ini.</td></tr>'}</tbody></table></div></div></div>`);
  }

  function cashflowView(){
    const rows=data.summary.map(r=>({code:r.project_code,name:r.project_name,in:Number(r.cash_in||0),out:Number(r.cash_out||0),net:Number(r.net_cashflow||0)}));
    const cin=rows.reduce((s,x)=>s+x.in,0),cout=rows.reduce((s,x)=>s+x.out,0),net=rows.reduce((s,x)=>s+x.net,0);
    document.getElementById('reportContent').innerHTML=`<div class="extra-kpis"><div class="extra-kpi"><small>CASH IN</small><strong>${money(cin)}</strong></div><div class="extra-kpi"><small>CASH OUT</small><strong>${money(cout)}</strong></div><div class="extra-kpi"><small>NET CASH FLOW</small><strong>${money(net)}</strong></div><div class="extra-kpi"><small>PROYEK</small><strong>${rows.length}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Cash In</th><th class="num">Cash Out</th><th class="num">Net Cash Flow</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${esc(x.code||'-')}</strong></td><td>${esc(x.name||'-')}</td><td class="num">${money(x.in)}</td><td class="num">${money(x.out)}</td><td class="num">${money(x.net)}</td><td>${x.net<0?'<span class="pill red">BERISIKO</span>':x.in>0&&x.net/x.in<.2?'<span class="pill amber">PERLU PENGAWASAN</span>':'<span class="pill green">SEHAT</span>'}</td></tr>`).join('')}</tbody></table></div></div><div class="card extra-note">Cash Flow memakai Cash In, Cash Out, dan Net Cashflow dari ringkasan proyek.</div>`;
  }

  function periodView(){
    document.getElementById('reportContent').innerHTML=periodBox('per');
    bindPeriod('per',renderPeriod);
  }
  function renderPeriod(){
    const {from,to}=range('per');const pid=document.getElementById('perProject')?.value||'';
    const tx=data.transactions.filter(r=>{const d=String(r.transaction_date||'').slice(0,10);return (!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});
    const pr=data.progress.filter(r=>{const d=String(r.progress_date||'').slice(0,10);return (!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});
    let cin=0,cout=0;tx.forEach(r=>{const a=Number(r.amount||0);if(txKind(r)==='in')cin+=a;else if(txKind(r)==='out')cout+=a});
    const avg=pr.length?pr.reduce((s,r)=>s+Number(r.progress_percentage||0),0)/pr.length:0;
    const entries=[...tx.map(r=>({d:String(r.transaction_date||'').slice(0,10),p:projectName(r.project_id),a:`Transaksi ${r.transaction_type||r.type||''}`,v:money(r.amount)})),...pr.map(r=>({d:String(r.progress_date||'').slice(0,10),p:projectName(r.project_id),a:`Progress ${r.work_item_id||''}`,v:pct(r.progress_percentage)}))].sort((a,b)=>a.d.localeCompare(b.d));
    const c=document.getElementById('reportContent');if(!c)return;c.querySelectorAll('.extra-dynamic').forEach(x=>x.remove());
    c.insertAdjacentHTML('beforeend',`<div class="extra-dynamic"><div class="extra-kpis"><div class="extra-kpi"><small>TRANSAKSI</small><strong>${tx.length}</strong></div><div class="extra-kpi"><small>CASH IN</small><strong>${money(cin)}</strong></div><div class="extra-kpi"><small>CASH OUT</small><strong>${money(cout)}</strong></div><div class="extra-kpi"><small>AVG INPUT PROGRESS</small><strong>${pct(avg)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Tanggal</th><th>Proyek</th><th>Aktivitas</th><th class="num">Nilai / Progress</th></tr></thead><tbody>${entries.map(x=>`<tr><td>${esc(x.d)}</td><td>${esc(x.p)}</td><td>${esc(x.a)}</td><td class="num">${x.v}</td></tr>`).join('')||'<tr><td colspan="4" class="extra-empty">Tidak ada aktivitas pada periode ini.</td></tr>'}</tbody></table></div></div></div>`);
  }

  function exportView(){
    document.getElementById('reportContent').innerHTML='<div class="card" style="padding:16px"><h3 style="margin-top:0">Export / Print</h3><p class="extra-note" style="padding:0">Cetak laporan yang sedang tampil atau ekspor tabel aktif ke CSV.</p><div class="extra-actions"><button class="btn primary" type="button" id="printReport">Print Laporan</button><button class="btn ghost" type="button" id="csvReport">Export CSV</button></div><div class="card extra-note" style="margin-top:12px">CSV mengambil tabel yang saat ini tampil pada tab laporan aktif.</div></div>';
    document.getElementById('printReport')?.addEventListener('click',()=>window.print());
    document.getElementById('csvReport')?.addEventListener('click',exportCsv);
  }

  function exportCsv(){
    const table=document.querySelector('#reportContent table');
    if(!table){alert('Belum ada tabel untuk diekspor.');return;}
    const rows=[...table.querySelectorAll('tr')].map(tr=>[...tr.children].map(td=>`"${String(td.innerText||'').replaceAll('"','""')}"`).join(','));
    const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sikoyek-laporan-${localDate(new Date())}.csv`;a.click();URL.revokeObjectURL(a.href);
  }

  function renderExtra(id){
    currentExtra=id;
    const root=document.querySelector('.laporan-v3');
    if(!root)return;
    const wrap=root.querySelector('.report-tabs');
    if(!wrap)return;
    wrap.querySelectorAll('.extra-report-tab').forEach(b=>b.classList.toggle('active',b.dataset.extraReport===id));
    root.querySelectorAll('[data-report],[data-extra-report]').forEach(b=>{if(b.dataset.extraReport!==id)b.classList.remove('active')});
    const c=document.getElementById('reportContent');if(c)c.innerHTML='<div class="card"><div class="extra-empty">Memuat laporan...</div></div>';
    try{if(id==='rap')rapView();else if(id==='finance')financeView();else if(id==='cashflow')cashflowView();else if(id==='period')periodView();else if(id==='export')exportView();}
    catch(e){if(c)c.innerHTML=`<div class="card"><div class="extra-empty">Gagal menampilkan laporan: ${esc(e?.message||e)}</div></div>`}
  }

  function mount(){
    style();
    const root=document.querySelector('.laporan-v3');
    if(!root)return false;
    if(mountedRoot===root)return true;
    const wrap=root.querySelector('.report-tabs');
    if(!wrap)return false;
    mountedRoot=root;
    tabDefs.forEach(([id,label])=>{
      if(wrap.querySelector(`[data-extra-report="${id}"]`))return;
      const b=document.createElement('button');
      b.type='button';b.className='extra-report-tab';b.dataset.extraReport=id;b.textContent=label;
      b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();renderExtra(id)},true);
      wrap.appendChild(b);
    });
    return true;
  }

  async function boot(){
    try{await loadData();}
    catch(e){console.warn('SiKoyek extra laporan:',e)}
  }

  function startPolling(){
    if(polling)return;
    polling=true;pollCount=0;
    const tick=()=>{
      if(mount()||++pollCount>=80){polling=false;return}
      setTimeout(tick,100);
    };
    tick();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{boot();startPolling()},{once:true});
  else{boot();startPolling()}
})();
