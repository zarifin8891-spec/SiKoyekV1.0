/* SiKoyek V1.0 — Additional report tabs */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_EXTRA_TABS_V1__)return;
  window.__SIKOYEK_LAPORAN_EXTRA_TABS_V1__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  let data={projects:[],summary:[],transactions:[],progress:[],workItems:[]};
  let active='summary';

  const tabs=[
    ['summary','Ringkasan Proyek'],
    ['progress','Progress Proyek'],
    ['rap','Laporan RAP & Biaya'],
    ['finance','Laporan Keuangan'],
    ['cashflow','Laporan Cash Flow'],
    ['period','Laporan per Periode'],
    ['export','Export / Print']
  ];

  function style(){
    if(document.getElementById('laporan-extra-style-v1'))return;
    const s=document.createElement('style');s.id='laporan-extra-style-v1';s.textContent=`
      .laporan-v3 .extra-report-tab{border:1px solid var(--line);background:#fff;color:var(--text);border-radius:9px;padding:8px 13px;cursor:pointer;font-weight:700}
      .laporan-v3 .extra-report-tab.active{background:#092e53;border-color:#092e53;color:#fff}
      .laporan-v3 .extra-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px}
      .laporan-v3 .extra-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-height:68px;display:flex;flex-direction:column;justify-content:center}
      .laporan-v3 .extra-kpi small{font-size:9px;color:var(--muted);font-weight:700}.laporan-v3 .extra-kpi strong{font-size:17px;margin-top:4px}
      .laporan-v3 .extra-actions{display:flex;gap:8px;flex-wrap:wrap}
      .laporan-v3 .extra-period-grid{display:grid;grid-template-columns:1.1fr 1fr 1fr 1.1fr auto;gap:10px;align-items:end}
      .laporan-v3 .extra-mini{font-size:11px;color:var(--muted);margin-top:5px}
      .laporan-v3 .extra-empty{padding:28px;text-align:center;color:var(--muted)}
      @media(max-width:1000px){.laporan-v3 .extra-kpis{grid-template-columns:repeat(2,1fr)}.laporan-v3 .extra-period-grid{grid-template-columns:1fr 1fr}.laporan-v3 .extra-period-grid .extra-actions{grid-column:1/-1}}
      @media print{.laporan-v3 .report-tabs,.laporan-v3 .core-module-header,.sidebar{display:none!important}.content{padding:0!important}.laporan-v3 .card{box-shadow:none!important}}
    `;document.head.appendChild(s);
  }

  async function load(){
    const client=window.SK?.sb||window.sb;
    if(!client)throw new Error('Supabase client belum siap.');
    const [{data:projects,error:e1},{data:summary,error:e2},{data:transactions,error:e3},{data:progress,error:e4},{data:workItems,error:e5}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name,contract_value').order('project_code'),
      client.from('project_summary').select('*').order('project_code'),
      client.from('financial_transactions').select('*').order('transaction_date'),
      client.from('progress_records').select('*').order('progress_date'),
      client.from('project_work_items').select('*').order('sort_order')
    ]);
    const err=e1||e2||e3||e4||e5;if(err)throw err;
    data={projects:projects||[],summary:summary||[],transactions:transactions||[],progress:progress||[],workItems:workItems||[]};
  }

  function projectName(id){const p=data.projects.find(x=>String(x.id)===String(id));return p?`${p.project_code||'-'} — ${p.project_name||'-'}`:'-'}
  function txKind(r){const t=String(r.transaction_type||r.type||r.category||'').toUpperCase();if(/IN|MASUK|PENERIMAAN|RECEIPT|PENDAPATAN/.test(t))return 'in';if(/OUT|KELUAR|PENGELUARAN|PAYMENT|BIAYA|BELANJA/.test(t))return 'out';return 'other'}
  function rangeFromSelect(id){
    const kind=document.getElementById(id+'Period')?.value||'all';const now=new Date();const today=localDate(now);
    if(kind==='all')return {from:'',to:''};if(kind==='today')return {from:today,to:today};
    if(kind==='week'){const d=new Date(now);d.setDate(now.getDate()-((now.getDay()+6)%7));return {from:localDate(d),to:today};}
    if(kind==='month')return {from:localDate(new Date(now.getFullYear(),now.getMonth(),1)),to:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))};
    if(kind==='quarter'){const d=new Date(now);d.setMonth(now.getMonth()-2);d.setDate(1);return {from:localDate(d),to:today};}
    if(kind==='year')return {from:localDate(new Date(now.getFullYear(),0,1)),to:localDate(new Date(now.getFullYear(),11,31))};
    return {from:document.getElementById(id+'From')?.value||'',to:document.getElementById(id+'To')?.value||''};
  }
  function periodOpts(){return `<option value="all">Semua Periode</option><option value="today">Hari Ini</option><option value="week">Minggu Ini</option><option value="month">Bulan Ini</option><option value="quarter">3 Bulan Terakhir</option><option value="year">Tahun Ini</option><option value="custom">Custom</option>`}
  function periodBox(id,withProject=true){return `<div class="card" style="padding:14px"><div class="extra-period-grid">
    <div class="field"><label>Periode</label><select id="${id}Period">${periodOpts()}</select></div>
    <div class="field"><label>Dari Tanggal</label><input id="${id}From" type="date"></div>
    <div class="field"><label>Sampai Tanggal</label><input id="${id}To" type="date"></div>
    ${withProject?`<div class="field"><label>Proyek</label><select id="${id}Project"><option value="">Semua Proyek</option>${data.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_code||'-')} — ${esc(p.project_name||'-')}</option>`).join('')}</select></div>`:''}
    <div class="extra-actions"><button class="btn ghost" type="button" id="${id}Reset">Reset</button></div>
  </div></div>`}
  function bindPeriod(id,render){
    const p=document.getElementById(id+'Period'),f=document.getElementById(id+'From'),t=document.getElementById(id+'To');
    const sync=()=>{const r=rangeFromSelect(id);if(p?.value==='custom'){document.getElementById(id+'From')?.removeAttribute('readonly');document.getElementById(id+'To')?.removeAttribute('readonly')}else{if(f)f.value=r.from;if(t)t.value=r.to;document.getElementById(id+'From')?.setAttribute('readonly','readonly');document.getElementById(id+'To')?.setAttribute('readonly','readonly')}render()};
    p?.addEventListener('change',sync);f?.addEventListener('change',render);t?.addEventListener('change',render);document.getElementById(id+'Project')?.addEventListener('change',render);document.getElementById(id+'Reset')?.addEventListener('click',()=>{if(p)p.value='all';if(f)f.value='';if(t)t.value='';if(document.getElementById(id+'Project'))document.getElementById(id+'Project').value='';sync()});sync();
  }

  function rapView(){
    const rows=data.summary.map(r=>({r,rap:Number(r.total_rap||0),real:Number(r.total_realization||0),ratio:Number(r.cost_ratio||0),progress:Number(r.project_progress||0)}));
    const rap=rows.reduce((s,x)=>s+x.rap,0),real=rows.reduce((s,x)=>s+x.real,0);
    document.getElementById('reportContent').innerHTML=`<div class="extra-kpis"><div class="extra-kpi"><small>TOTAL PROYEK</small><strong>${rows.length}</strong></div><div class="extra-kpi"><small>TOTAL RAP</small><strong>${money(rap)}</strong></div><div class="extra-kpi"><small>TOTAL REALISASI</small><strong>${money(real)}</strong></div><div class="extra-kpi"><small>RAP TERSISA</small><strong>${money(rap-real)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">RAP</th><th class="num">Realisasi</th><th class="num">Sisa RAP</th><th>Progress</th><th>Rasio Biaya</th><th>Status</th></tr></thead><tbody>${rows.length?rows.map(x=>`<tr><td><strong>${esc(x.r.project_code||'-')}</strong></td><td>${esc(x.r.project_name||'-')}</td><td class="num">${money(x.rap)}</td><td class="num">${money(x.real)}</td><td class="num">${money(x.rap-x.real)}</td><td>${pct(x.progress)}</td><td>${pct(x.ratio)}</td><td>${esc(x.r.health_status||'-')}</td></tr>`).join(''):`<tr><td colspan="8" class="extra-empty">Belum ada data.</td></tr>`}</tbody></table></div></div><div class="card note-card">Rasio biaya dan realisasi mengikuti ringkasan proyek yang tersedia di sistem.</div>`;
  }

  function financeView(){
    document.getElementById('reportContent').innerHTML=periodBox('fin',true);bindPeriod('fin',renderFinance)
  }
  function renderFinance(){
    const {from,to}=rangeFromSelect('fin');const pid=document.getElementById('finProject')?.value||'';
    const rows=data.transactions.filter(r=>{const d=String(r.transaction_date||'').slice(0,10);return (!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});
    let income=0,expense=0;rows.forEach(r=>{const a=Number(r.amount||0),k=txKind(r);if(k==='in')income+=a;else if(k==='out')expense+=a});
    const table=rows.map(r=>`<tr><td>${esc(String(r.transaction_date||'').slice(0,10))}</td><td>${esc(projectName(r.project_id))}</td><td>${esc(r.transaction_type||r.type||'-')}</td><td>${esc(r.description||r.notes||r.remark||'-')}</td><td class="num">${money(r.amount)}</td></tr>`).join('');
    const c=document.getElementById('reportContent');if(!c)return;c.insertAdjacentHTML('beforeend',`<div class="extra-kpis"><div class="extra-kpi"><small>TRANSAKSI</small><strong>${rows.length}</strong></div><div class="extra-kpi"><small>PEMASUKAN</small><strong>${money(income)}</strong></div><div class="extra-kpi"><small>PENGELUARAN</small><strong>${money(expense)}</strong></div><div class="extra-kpi"><small>NET</small><strong>${money(income-expense)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Tanggal</th><th>Proyek</th><th>Jenis</th><th>Keterangan</th><th class="num">Jumlah</th></tr></thead><tbody>${table||`<tr><td colspan="5" class="extra-empty">Tidak ada transaksi pada periode/filter ini.</td></tr>`}</tbody></table></div></div>`)
  }

  function cashflowView(){
    const rows=data.summary.map(r=>({code:r.project_code,name:r.project_name,in:Number(r.cash_in||0),out:Number(r.cash_out||0),net:Number(r.net_cashflow||0)}));
    const tin=rows.reduce((s,x)=>s+x.in,0),tout=rows.reduce((s,x)=>s+x.out,0),tn=rows.reduce((s,x)=>s+x.net,0);
    document.getElementById('reportContent').innerHTML=`<div class="extra-kpis"><div class="extra-kpi"><small>CASH IN</small><strong>${money(tin)}</strong></div><div class="extra-kpi"><small>CASH OUT</small><strong>${money(tout)}</strong></div><div class="extra-kpi"><small>NET CASH FLOW</small><strong>${money(tn)}</strong></div><div class="extra-kpi"><small>PROYEK</small><strong>${rows.length}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Cash In</th><th class="num">Cash Out</th><th class="num">Net Cash Flow</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td><strong>${esc(x.code||'-')}</strong></td><td>${esc(x.name||'-')}</td><td class="num">${money(x.in)}</td><td class="num">${money(x.out)}</td><td class="num">${money(x.net)}</td><td>${x.net<0?'<span class="pill red">BERISIKO</span>':x.in>0&&x.net/x.in<.2?'<span class="pill amber">PERLU PENGAWASAN</span>':'<span class="pill green">SEHAT</span>'}</td></tr>`).join('')}</tbody></table></div></div><div class="card note-card">Cash Flow memakai nilai Cash In, Cash Out, dan Net Cashflow dari ringkasan proyek.</div>`;
  }

  function periodView(){
    document.getElementById('reportContent').innerHTML=periodBox('per',true);bindPeriod('per',renderPeriod)
  }
  function renderPeriod(){
    const {from,to}=rangeFromSelect('per');const pid=document.getElementById('perProject')?.value||'';
    const tx=data.transactions.filter(r=>{const d=String(r.transaction_date||'').slice(0,10);return (!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});
    const pr=data.progress.filter(r=>{const d=String(r.progress_date||'').slice(0,10);return (!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});
    let cin=0,cout=0;tx.forEach(r=>{const a=Number(r.amount||0),k=txKind(r);if(k==='in')cin+=a;else if(k==='out')cout+=a});
    const pAvg=pr.length?pr.reduce((s,r)=>s+Number(r.progress_percentage||0),0)/pr.length:0;
    const pWeighted=pr.reduce((s,r)=>s+Number(r.progress_percentage||0),0);
    document.getElementById('reportContent').insertAdjacentHTML('beforeend',`<div class="extra-kpis"><div class="extra-kpi"><small>TRANSAKSI</small><strong>${tx.length}</strong></div><div class="extra-kpi"><small>CASH IN</small><strong>${money(cin)}</strong></div><div class="extra-kpi"><small>CASH OUT</small><strong>${money(cout)}</strong></div><div class="extra-kpi"><small>AVG INPUT PROGRESS</small><strong>${pct(pAvg)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Tanggal</th><th>Proyek</th><th>Aktivitas</th><th class="num">Nilai / Progress</th></tr></thead><tbody>${[...tx.map(r=>({d:String(r.transaction_date||'').slice(0,10),p:projectName(r.project_id),a:`Transaksi ${r.transaction_type||r.type||''}`,v:money(r.amount)})),...pr.map(r=>({d:String(r.progress_date||'').slice(0,10),p:projectName(r.project_id),a:`Progress ${r.work_item_id||''}`,v:pct(r.progress_percentage)}))].sort((a,b)=>a.d.localeCompare(b.d)).map(x=>`<tr><td>${esc(x.d)}</td><td>${esc(x.p)}</td><td>${esc(x.a)}</td><td class="num">${x.v}</td></tr>`).join('')||`<tr><td colspan="4" class="extra-empty">Tidak ada aktivitas pada periode ini.</td></tr>`}</tbody></table></div></div>`)
  }

  function exportView(){
    document.getElementById('reportContent').innerHTML=`<div class="card" style="padding:16px"><h3 style="margin-top:0">Export / Print</h3><p class="extra-mini">Gunakan tombol di bawah untuk mencetak laporan yang sedang tampil atau mengekspor tabel aktif ke CSV.</p><div class="extra-actions"><button class="btn primary" type="button" id="printReport">Print Laporan</button><button class="btn ghost" type="button" id="csvReport">Export CSV</button></div><div class="card note-card" style="margin-top:12px">Export CSV mengambil tabel yang saat ini tampil pada tab laporan aktif.</div></div>`;
    document.getElementById('printReport')?.addEventListener('click',()=>window.print());
    document.getElementById('csvReport')?.addEventListener('click',exportCsv);
  }
  function exportCsv(){
    const table=document.querySelector('#reportContent table');if(!table){alert('Belum ada tabel untuk diekspor.');return}
    const rows=[...table.querySelectorAll('tr')].map(tr=>[...tr.children].map(td=>`"${String(td.innerText||'').replaceAll('"','""')}"`).join(','));
    const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sikoyek-laporan-${active}-${localDate(new Date())}.csv`;a.click();URL.revokeObjectURL(a.href);
  }

  function render(){
    style();
    const root=document.querySelector('.laporan-v3');if(!root)return;
    const tabWrap=root.querySelector('.report-tabs');if(!tabWrap)return;
    tabWrap.querySelectorAll('.extra-report-tab').forEach(x=>x.remove());
    tabs.slice(2).forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='extra-report-tab';b.dataset.extraReport=id;b.textContent=label;b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();active=id;tabWrap.querySelectorAll('[data-report],[data-extra-report]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderBody()},true);tabWrap.appendChild(b)});
    tabWrap.querySelector('[data-report="summary"]')?.classList.toggle('active',active==='summary');
    tabWrap.querySelector('[data-report="progress"]')?.classList.toggle('active',active==='progress');
    renderBody();
  }

  function renderBody(){
    if(active==='summary'||active==='progress')return;
    const c=document.getElementById('reportContent');if(!c)return;
    c.innerHTML='<div class="card"><div class="extra-empty">Memuat laporan...</div></div>';
    try{if(active==='rap')rapView();else if(active==='finance')financeView();else if(active==='cashflow')cashflowView();else if(active==='period')periodView();else if(active==='export')exportView()}catch(e){c.innerHTML=`<div class="card"><div class="extra-empty">Gagal menampilkan laporan: ${esc(e?.message||e)}</div></div>`}
  }

  async function boot(){
    try{await load();render();}
    catch(e){console.warn('SiKoyek extra laporan:',e)}
  }
  function watch(){
    const target=document.body||document.documentElement;if(target)new MutationObserver(()=>render()).observe(target,{childList:true,subtree:true});
    let tries=0;const retry=()=>{render();if(++tries<30)setTimeout(retry,150)};retry();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{boot();watch()},{once:true});else{boot();watch()}
})();
