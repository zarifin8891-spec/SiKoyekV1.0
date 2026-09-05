/* SiKoyek V1.0 — Laporan extra tabs v3 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_EXTRA_TABS_V3__)return;
  window.__SIKOYEK_LAPORAN_EXTRA_TABS_V3__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const date=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const tabs=[['rap','Laporan RAP & Biaya'],['finance','Laporan Keuangan'],['cashflow','Laporan Cash Flow'],['period','Laporan per Periode'],['export','Export / Print']];
  let data={projects:[],summary:[],transactions:[],progress:[]};
  let wrapped=false;

  function css(){
    if(document.getElementById('laporan-extra-v3-css'))return;
    const s=document.createElement('style');s.id='laporan-extra-v3-css';s.textContent=`
      .laporan-v3 .extra-report-tab{border:1px solid var(--line);background:#fff;color:var(--text);border-radius:9px;padding:8px 13px;cursor:pointer;font-weight:700}
      .laporan-v3 .extra-report-tab.active{background:#092e53;border-color:#092e53;color:#fff}
      .laporan-v3 .extra-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:8px}
      .laporan-v3 .extra-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-height:68px;display:flex;flex-direction:column;justify-content:center}
      .laporan-v3 .extra-kpi small{font-size:9px;color:var(--muted);font-weight:700}.laporan-v3 .extra-kpi strong{font-size:17px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v3 .extra-period-grid{display:grid;grid-template-columns:1.1fr 1fr 1fr 1.1fr auto;gap:10px;align-items:end}
      .laporan-v3 .extra-actions{display:flex;gap:8px;flex-wrap:wrap}
      .laporan-v3 .extra-empty{padding:28px;text-align:center;color:var(--muted)}
      .laporan-v3 .extra-note{padding:12px 14px;font-size:12px;color:var(--muted)}
      @media(max-width:1000px){.laporan-v3 .extra-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.laporan-v3 .extra-period-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:650px){.laporan-v3 .extra-kpis{grid-template-columns:1fr 1fr}.laporan-v3 .extra-period-grid{grid-template-columns:1fr}}
      @media print{.laporan-v3 .report-tabs,.laporan-v3 .core-module-header,.sidebar{display:none!important}.content{padding:0!important}}
    `;document.head.appendChild(s);
  }

  async function loadData(){
    const client=window.SK?.sb||window.sb;if(!client)throw new Error('Supabase client belum siap.');
    const [{data:projects,error:e1},{data:summary,error:e2},{data:transactions,error:e3},{data:progress,error:e4}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name,contract_value').order('project_code'),
      client.from('project_summary').select('*').order('project_code'),
      client.from('financial_transactions').select('*').order('transaction_date'),
      client.from('progress_records').select('*').order('progress_date')
    ]);
    const err=e1||e2||e3||e4;if(err)throw err;data={projects:projects||[],summary:summary||[],transactions:transactions||[],progress:progress||[]};
  }

  function txKind(r){const t=String(r.transaction_type||r.type||r.category||'').toUpperCase();if(/IN|MASUK|PENERIMAAN|RECEIPT|PENDAPATAN/.test(t))return'in';if(/OUT|KELUAR|PENGELUARAN|PAYMENT|BIAYA|BELANJA/.test(t))return'out';return'other'}
  function projectName(id){const p=data.projects.find(x=>String(x.id)===String(id));return p?`${p.project_code||'-'} — ${p.project_name||'-'}`:'-'}
  function opts(id){return `<option value="">Semua Proyek</option>${data.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_code||'-')} — ${esc(p.project_name||'-')}</option>`).join('')}`}
  function periodOpts(){return '<option value="all">Semua Periode</option><option value="today">Hari Ini</option><option value="week">Minggu Ini</option><option value="month">Bulan Ini</option><option value="quarter">3 Bulan Terakhir</option><option value="year">Tahun Ini</option><option value="custom">Custom</option>'}
  function range(id){const k=document.getElementById(id+'Period')?.value||'all';const n=new Date(),t=date(n);if(k==='all')return{from:'',to:''};if(k==='today')return{from:t,to:t};if(k==='week'){const d=new Date(n);d.setDate(n.getDate()-((n.getDay()+6)%7));return{from:date(d),to:t}}if(k==='month')return{from:date(new Date(n.getFullYear(),n.getMonth(),1)),to:date(new Date(n.getFullYear(),n.getMonth()+1,0))};if(k==='quarter'){const d=new Date(n.getFullYear(),n.getMonth()-2,1);return{from:date(d),to:t}}if(k==='year')return{from:date(new Date(n.getFullYear(),0,1)),to:date(new Date(n.getFullYear(),11,31))};return{from:document.getElementById(id+'From')?.value||'',to:document.getElementById(id+'To')?.value||''}}
  function filterBox(id){return `<div class="card" style="padding:14px"><div class="extra-period-grid"><div class="field"><label>Periode</label><select id="${id}Period">${periodOpts()}</select></div><div class="field"><label>Dari Tanggal</label><input id="${id}From" type="date"></div><div class="field"><label>Sampai Tanggal</label><input id="${id}To" type="date"></div><div class="field"><label>Proyek</label><select id="${id}Project">${opts(id)}</select></div><div class="extra-actions"><button class="btn ghost" type="button" id="${id}Reset">Reset</button></div></div></div>`}
  function bind(id,render){const p=document.getElementById(id+'Period'),f=document.getElementById(id+'From'),t=document.getElementById(id+'To'),sync=()=>{const r=range(id);if(kCustom(p)){f?.removeAttribute('readonly');t?.removeAttribute('readonly')}else{if(f)f.value=r.from;if(t)t.value=r.to;f?.setAttribute('readonly','readonly');t?.setAttribute('readonly','readonly')}render()};p?.addEventListener('change',sync);f?.addEventListener('change',render);t?.addEventListener('change',render);document.getElementById(id+'Project')?.addEventListener('change',render);document.getElementById(id+'Reset')?.addEventListener('click',()=>{if(p)p.value='all';if(f)f.value='';if(t)t.value='';const pr=document.getElementById(id+'Project');if(pr)pr.value='';sync()});sync()}
  function kCustom(p){return p?.value==='custom'}

  function rap(){const rows=data.summary,rap=rows.reduce((s,r)=>s+Number(r.total_rap||0),0),real=rows.reduce((s,r)=>s+Number(r.total_realization||0),0);content(`<div class="extra-kpis"><div class="extra-kpi"><small>TOTAL PROYEK</small><strong>${rows.length}</strong></div><div class="extra-kpi"><small>TOTAL RAP</small><strong>${money(rap)}</strong></div><div class="extra-kpi"><small>TOTAL REALISASI</small><strong>${money(real)}</strong></div><div class="extra-kpi"><small>RAP TERSISA</small><strong>${money(rap-real)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">RAP</th><th class="num">Realisasi</th><th class="num">Sisa RAP</th><th>Progress</th><th>Rasio Biaya</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.project_code||'-')}</strong></td><td>${esc(r.project_name||'-')}</td><td class="num">${money(r.total_rap)}</td><td class="num">${money(r.total_realization)}</td><td class="num">${money(Number(r.total_rap||0)-Number(r.total_realization||0))}</td><td>${pct(r.project_progress)}</td><td>${pct(r.cost_ratio)}</td><td>${esc(r.health_status||'-')}</td></tr>`).join('')||'<tr><td colspan="8" class="extra-empty">Belum ada data.</td></tr>'}</tbody></table></div></div>`)}
  function finance(){content(filterBox('fin'));bind('fin',renderFinance)}
  function renderFinance(){const {from,to}=range('fin'),pid=document.getElementById('finProject')?.value||'';const rows=data.transactions.filter(r=>{const d=String(r.transaction_date||'').slice(0,10);return(!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});let i=0,o=0;rows.forEach(r=>{const a=Number(r.amount||0);if(txKind(r)==='in')i+=a;else if(txKind(r)==='out')o+=a});const c=document.getElementById('reportContent');if(!c)return;c.querySelectorAll('.extra-dynamic').forEach(x=>x.remove());c.insertAdjacentHTML('beforeend',`<div class="extra-dynamic"><div class="extra-kpis"><div class="extra-kpi"><small>TRANSAKSI</small><strong>${rows.length}</strong></div><div class="extra-kpi"><small>PEMASUKAN</small><strong>${money(i)}</strong></div><div class="extra-kpi"><small>PENGELUARAN</small><strong>${money(o)}</strong></div><div class="extra-kpi"><small>NET</small><strong>${money(i-o)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Tanggal</th><th>Proyek</th><th>Jenis</th><th>Keterangan</th><th class="num">Jumlah</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(String(r.transaction_date||'').slice(0,10))}</td><td>${esc(projectName(r.project_id))}</td><td>${esc(r.transaction_type||r.type||'-')}</td><td>${esc(r.description||r.notes||r.remark||'-')}</td><td class="num">${money(r.amount)}</td></tr>`).join('')||'<tr><td colspan="5" class="extra-empty">Tidak ada transaksi pada periode/filter ini.</td></tr>'}</tbody></table></div></div></div>`)}
  function cash(){const rows=data.summary,ci=rows.reduce((s,r)=>s+Number(r.cash_in||0),0),co=rows.reduce((s,r)=>s+Number(r.cash_out||0),0),net=rows.reduce((s,r)=>s+Number(r.net_cashflow||0),0);content(`<div class="extra-kpis"><div class="extra-kpi"><small>CASH IN</small><strong>${money(ci)}</strong></div><div class="extra-kpi"><small>CASH OUT</small><strong>${money(co)}</strong></div><div class="extra-kpi"><small>NET CASH FLOW</small><strong>${money(net)}</strong></div><div class="extra-kpi"><small>PROYEK</small><strong>${rows.length}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Cash In</th><th class="num">Cash Out</th><th class="num">Net Cash Flow</th><th>Status</th></tr></thead><tbody>${rows.map(r=>{const n=Number(r.net_cashflow||0),ci=Number(r.cash_in||0);return `<tr><td><strong>${esc(r.project_code||'-')}</strong></td><td>${esc(r.project_name||'-')}</td><td class="num">${money(ci)}</td><td class="num">${money(r.cash_out)}</td><td class="num">${money(n)}</td><td>${n<0?'<span class="pill red">BERISIKO</span>':ci>0&&n/ci<.2?'<span class="pill amber">PERLU PENGAWASAN</span>':'<span class="pill green">SEHAT</span>'}</td></tr>`}).join('')}</tbody></table></div></div>`)}
  function period(){content(filterBox('per'));bind('per',renderPeriod)}
  function renderPeriod(){const {from,to}=range('per'),pid=document.getElementById('perProject')?.value||'';const tx=data.transactions.filter(r=>{const d=String(r.transaction_date||'').slice(0,10);return(!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});const pr=data.progress.filter(r=>{const d=String(r.progress_date||'').slice(0,10);return(!from||d>=from)&&(!to||d<=to)&&(!pid||String(r.project_id)===String(pid))});let ci=0,co=0;tx.forEach(r=>{const a=Number(r.amount||0);if(txKind(r)==='in')ci+=a;else if(txKind(r)==='out')co+=a});const avg=pr.length?pr.reduce((s,r)=>s+Number(r.progress_percentage||0),0)/pr.length:0;const entries=[...tx.map(r=>({d:String(r.transaction_date||'').slice(0,10),p:projectName(r.project_id),a:`Transaksi ${r.transaction_type||r.type||''}`,v:money(r.amount)})),...pr.map(r=>({d:String(r.progress_date||'').slice(0,10),p:projectName(r.project_id),a:'Progress',v:pct(r.progress_percentage)}))].sort((a,b)=>a.d.localeCompare(b.d));const c=document.getElementById('reportContent');c.querySelectorAll('.extra-dynamic').forEach(x=>x.remove());c.insertAdjacentHTML('beforeend',`<div class="extra-dynamic"><div class="extra-kpis"><div class="extra-kpi"><small>TRANSAKSI</small><strong>${tx.length}</strong></div><div class="extra-kpi"><small>CASH IN</small><strong>${money(ci)}</strong></div><div class="extra-kpi"><small>CASH OUT</small><strong>${money(co)}</strong></div><div class="extra-kpi"><small>AVG INPUT PROGRESS</small><strong>${pct(avg)}</strong></div></div><div class="card tablecard"><div class="scroll"><table><thead><tr><th>Tanggal</th><th>Proyek</th><th>Aktivitas</th><th class="num">Nilai / Progress</th></tr></thead><tbody>${entries.map(x=>`<tr><td>${esc(x.d)}</td><td>${esc(x.p)}</td><td>${esc(x.a)}</td><td class="num">${x.v}</td></tr>`).join('')||'<tr><td colspan="4" class="extra-empty">Tidak ada aktivitas pada periode ini.</td></tr>'}</tbody></table></div></div></div>`)}
  function exportView(){content('<div class="card" style="padding:16px"><h3 style="margin-top:0">Export / Print</h3><p class="extra-note">Cetak laporan yang sedang tampil atau ekspor tabel aktif ke CSV.</p><div class="extra-actions"><button class="btn primary" type="button" id="printReport">Print Laporan</button><button class="btn ghost" type="button" id="csvReport">Export CSV</button></div></div>');document.getElementById('printReport')?.addEventListener('click',()=>window.print());document.getElementById('csvReport')?.addEventListener('click',csv)}
  function csv(){const t=document.querySelector('#reportContent table');if(!t){alert('Belum ada tabel untuk diekspor.');return}const rows=[...t.querySelectorAll('tr')].map(r=>[...r.children].map(td=>`"${String(td.innerText||'').replaceAll('"','""')}"`).join(','));const b=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`sikoyek-laporan-${date(new Date())}.csv`;a.click();URL.revokeObjectURL(a.href)}
  function content(html){const c=document.getElementById('reportContent');if(c)c.innerHTML=html}

  function attach(){
    css();const root=document.querySelector('.laporan-v3'),wrap=root?.querySelector('.report-tabs');if(!wrap)return false;
    wrap.querySelectorAll('.extra-report-tab').forEach(b=>b.remove());
    tabs.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='extra-report-tab';b.dataset.extraReport=id;b.textContent=label;b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();wrap.querySelectorAll('[data-report],[data-extra-report]').forEach(x=>x.classList.remove('active'));b.classList.add('active');try{if(id==='rap')rap();else if(id==='finance')finance();else if(id==='cashflow')cash();else if(id==='period')period();else exportView()}catch(err){content(`<div class="card"><div class="extra-empty">Gagal menampilkan laporan: ${esc(err?.message||err)}</div></div>`)}} ,true);wrap.appendChild(b)});
    return true;
  }

  function hook(){
    if(wrapped||typeof window.openLaporan!=='function')return false;
    const original=window.openLaporan;
    window.openLaporan=async function(...args){const result=await original.apply(this,args);setTimeout(attach,0);return result};
    wrapped=true;return true;
  }
  async function boot(){try{await loadData()}catch(e){console.warn('SiKoyek extra tabs v3:',e)}hook();attach()}
  const wait=()=>{if(hook())attach();else setTimeout(wait,50)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{boot();wait()},{once:true});else{boot();wait()}
})();
