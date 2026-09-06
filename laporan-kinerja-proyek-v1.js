/* SiKoyek V1.0 — Kinerja Proyek v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_KINERJA_PROYEK_V1__)return;
  window.__SIKOYEK_LAPORAN_KINERJA_PROYEK_V1__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const txDate=r=>String(r?.transaction_date||'').slice(0,10);
  const txType=r=>String(r?.transaction_type||r?.type||'').trim().toUpperCase();
  const amount=r=>Math.abs(Number(r?.amount||0)||0);

  let data={projects:[],workItems:[],progressRecords:[],transactions:[]};

  function styles(){
    if(document.getElementById('laporan-kinerja-proyek-v1-style'))return;
    const s=document.createElement('style');s.id='laporan-kinerja-proyek-v1-style';s.textContent=`
      .laporan-v3 .kinerja{display:grid;gap:10px}
      .laporan-v3 .kinerja-toolbar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}
      .laporan-v3 .kinerja-filter,.laporan-v3 .kinerja-kpi{background:#fff;border:1px solid var(--line);border-radius:10px;box-sizing:border-box;min-width:0}
      .laporan-v3 .kinerja-filter{padding:7px 10px;min-height:62px;display:flex;flex-direction:column;justify-content:center}
      .laporan-v3 .kinerja-filter label{display:block;font-size:10px;line-height:1.1;font-weight:700;color:var(--muted);margin-bottom:5px}
      .laporan-v3 .kinerja-filter select{width:100%;height:34px;border:1px solid var(--line);border-radius:8px;padding:6px 8px;background:#fff;color:var(--text);font-size:12px;box-sizing:border-box}
      .laporan-v3 .kinerja-kpi{padding:8px 9px;min-height:62px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}
      .laporan-v3 .kinerja-kpi small{font-size:9px;line-height:1.1;color:var(--muted);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v3 .kinerja-kpi strong{font-size:14px;line-height:1.05;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v3 .kinerja-section{border:1px solid var(--line);background:#fff;border-radius:10px;overflow:hidden}
      .laporan-v3 .kinerja-title{padding:10px 12px;border-bottom:1px solid var(--line);font-size:12px;font-weight:800}
      .laporan-v3 .kinerja-scroll{overflow:auto}
      .laporan-v3 .kinerja-table{width:100%;border-collapse:collapse}
      .laporan-v3 .kinerja-table th,.laporan-v3 .kinerja-table td{padding:8px 9px;border-bottom:1px solid var(--line);font-size:11px;text-align:left;white-space:nowrap}
      .laporan-v3 .kinerja-table th{font-size:9px;color:var(--muted);text-transform:uppercase;background:#fafbfd}
      .laporan-v3 .kinerja-table .num{text-align:right}
      .laporan-v3 .kinerja-table tr:last-child td{border-bottom:0}
      .laporan-v3 .kinerja-pill{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:800}
      .laporan-v3 .kinerja-pill.done{background:var(--green2);color:var(--green)}
      .laporan-v3 .kinerja-pill.run{background:var(--amber2);color:var(--amber)}
      .laporan-v3 .kinerja-total td{font-weight:800;background:#fafbfd}
      .laporan-v3 .kinerja-empty{padding:20px;text-align:center;color:var(--muted)}
      .laporan-v3 .kinerja-trend-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line)}
      .laporan-v3 .kinerja-trend-filter{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:700;color:var(--muted)}
      .laporan-v3 .kinerja-trend-filter select{height:32px;border:1px solid var(--line);border-radius:8px;padding:0 8px;background:#fff;color:var(--text);font-size:11px}
      .laporan-v3 .kinerja-trend-meta{padding:8px 12px 0;font-size:10px;color:var(--muted)}
      .laporan-v3 .kinerja-chart-wrap{padding:8px 12px 12px;overflow:auto}
      .laporan-v3 .kinerja-chart{display:block;width:100%;min-width:720px;height:330px}
      .laporan-v3 .kinerja-legend{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;padding:0 12px 11px;font-size:10px;color:var(--muted)}
      .laporan-v3 .kinerja-legend span{display:inline-flex;align-items:center;gap:6px}.laporan-v3 .kinerja-legend i{width:10px;height:10px;border-radius:2px;display:inline-block}
      @media(max-width:1100px){.laporan-v3 .kinerja-toolbar{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:650px){.laporan-v3 .kinerja-toolbar{grid-template-columns:1fr 1fr}.laporan-v3 .kinerja-trend-head{align-items:flex-start;flex-direction:column}.laporan-v3 .kinerja-chart{min-width:640px}}
      @media print{.laporan-v3 .kinerja-trend-filter{display:none!important}.laporan-v3 .kinerja-chart{min-width:0!important}}
    `;document.head.appendChild(s);
  }

  async function loadData(){
    const client=window.SK?.sb||window.sb;
    if(!client)throw new Error('Supabase client belum siap.');
    const [{data:projects,error:e1},{data:workItems,error:e2},{data:progressRecords,error:e3},{data:transactions,error:e4}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name,contract_value').order('project_code'),
      client.from('project_work_items').select('id,project_id,weight').order('sort_order'),
      client.from('progress_records').select('project_id,work_item_id,progress_date,progress_percentage').order('progress_date'),
      client.from('financial_transactions').select('id,project_id,transaction_date,transaction_type,category,amount').order('transaction_date')
    ]);
    const err=e1||e2||e3||e4;if(err)throw err;
    data={projects:projects||[],workItems:workItems||[],progressRecords:progressRecords||[],transactions:transactions||[]};
  }

  function normalizeText(s){return String(s||'').trim().toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' ')}
  function costCategory(raw){
    const c=normalizeText(raw);
    if(/material|bahan|barang/.test(c))return'Material';
    if(/upah|tenaga kerja|labor/.test(c))return'Upah';
    if(/peralatan|alat|equipment/.test(c))return'Peralatan';
    if(/operasional|operasi|transport|administrasi|adm/.test(c))return'Operasional';
    if(/subkon|sub contractor|subcontract/.test(c))return'Subkon';
    return'Lain-lain';
  }

  function buildProgressModel(){
    const weight=new Map(data.workItems.map(x=>[String(x.id),Number(x.weight||0)]));
    const byProjectMonth=new Map();
    const monthlyWork=new Map();
    const projectProgress=new Map();
    const records=data.progressRecords.slice().sort((a,b)=>String(a.progress_date||'').localeCompare(String(b.progress_date||'')));
    const cumulativeByItem=new Map();

    for(const r of records){
      const pid=String(r.project_id||'');
      const wid=String(r.work_item_id||'');
      if(!pid||!wid)continue;
      const d=String(r.progress_date||'').slice(0,10);if(!d)continue;
      const periodPct=Number(r.progress_percentage||0);
      const prev=cumulativeByItem.get(wid)||0;
      const next=Math.min(100,Math.max(0,prev+periodPct));
      cumulativeByItem.set(wid,next);
      const w=weight.get(wid)||0;
      const delta=Math.max(0,next-prev);
      const weightedDelta=w*delta;
      const key=`${pid}|${monthKey(new Date(d+'T00:00:00'))}`;
      monthlyWork.set(key,(monthlyWork.get(key)||0)+weightedDelta);
      const prevProject=projectProgress.get(pid)||0;
      projectProgress.set(pid,prevProject+weightedDelta);
    }

    for(const [key,val] of monthlyWork)byProjectMonth.set(key,val);
    return {byProjectMonth,projectProgress};
  }

  function projectRows(progressModel){
    const costMap=new Map();
    for(const tx of data.transactions){
      if(txType(tx)!=='KELUAR')continue;
      const pid=String(tx.project_id||'');if(!pid)continue;
      if(!costMap.has(pid))costMap.set(pid,{Material:0,Upah:0,Peralatan:0,Operasional:0,Subkon:0,'Lain-lain':0});
      costMap.get(pid)[costCategory(tx.category)]+=amount(tx);
    }
    return data.projects.map(p=>{
      const pid=String(p.id),c=costMap.get(pid)||{Material:0,Upah:0,Peralatan:0,Operasional:0,Subkon:0,'Lain-lain':0};
      const total=Object.values(c).reduce((a,v)=>a+v,0);
      const contract=Number(p.contract_value||0);
      const progress=Math.min(100,Number(progressModel.projectProgress.get(pid)||0));
      return {...p,contract,c,total,laba:contract-total,progress,status:progress>=99.999?'SELESAI':'BERJALAN'};
    });
  }

  function monthRange(kind){
    const now=new Date();
    if(kind==='12')return{from:new Date(now.getFullYear(),now.getMonth()-11,1),to:new Date(now.getFullYear(),now.getMonth()+1,0)};
    const six=new Date(now.getFullYear(),now.getMonth()-5,1);
    return{from:six,to:new Date(now.getFullYear(),now.getMonth()+1,0)};
  }

  function parseMonth(v){const m=String(v||'').match(/^(\d{4})-(\d{2})$/);return m?new Date(Number(m[1]),Number(m[2])-1,1):null}

  function monthKeys(from,to){const out=[];let d=new Date(from.getFullYear(),from.getMonth(),1);const end=new Date(to.getFullYear(),to.getMonth(),1);while(d<=end){out.push(monthKey(d));d.setMonth(d.getMonth()+1)}return out}

  function monthlyTotals(from,to,projectId){
    const progressModel=buildProgressModel();
    const keys=monthKeys(from,to),rows=[];
    const monthStart=new Date(from.getFullYear(),from.getMonth(),1);
    const beforeKey=monthKey(new Date(monthStart.getFullYear(),monthStart.getMonth()-1,1));
    const projectFilter=projectId||'';
    const contracts=new Map(data.projects.map(p=>[String(p.id),Number(p.contract_value||0)]));

    for(const key of keys){
      let value=0,cost=0;
      for(const p of data.projects){
        const pid=String(p.id);if(projectFilter&&pid!==projectFilter)continue;
        value+=(Number(progressModel.byProjectMonth.get(`${pid}|${key}`)||0)/100)*Number(contracts.get(pid)||0);
      }
      data.transactions.forEach(tx=>{
        if(txType(tx)!=='KELUAR')return;
        const pid=String(tx.project_id||'');if(projectFilter&&pid!==projectFilter)return;
        if(txDate(tx).slice(0,7)!==key)return;
        cost+=amount(tx);
      });
      rows.push({key,value,cost,profit:value-cost});
    }
    return rows;
  }

  function monthLabel(key){const [y,m]=key.split('-').map(Number);return new Intl.DateTimeFormat('id-ID',{month:'short',year:'2-digit'}).format(new Date(y,m-1,1))}

  function drawChart(rows){
    const svg=document.getElementById('kinerjaTrendSvg');if(!svg)return;
    const W=960,H=330,left=66,right=20,top=20,bottom=45,innerW=W-left-right,innerH=H-top-bottom;
    const max=Math.max(1,...rows.flatMap(r=>[r.value,r.cost,r.profit]));
    const x=i=>left+(rows.length<=1?0:i*(innerW/(rows.length-1)));
    const y=v=>top+innerH-(Math.max(0,v)/max)*innerH;
    const escText=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const path=field=>rows.map((r,i)=>`${i?'L':'M'} ${x(i).toFixed(1)} ${y(r[field]).toFixed(1)}`).join(' ');
    const grid=[];for(let i=0;i<=4;i++){const yy=top+innerH-(i/4)*innerH;const val=max*i/4;grid.push(`<line x1="${left}" y1="${yy}" x2="${W-right}" y2="${yy}" stroke="#e5e7eb" stroke-width="1"/><text x="${left-8}" y="${yy+3}" text-anchor="end" font-size="9" fill="#64748b">${escText(money(val))}</text>`)}
    const labels=rows.map((r,i)=>`<text x="${x(i)}" y="${H-18}" text-anchor="middle" font-size="9" fill="#64748b">${escText(monthLabel(r.key))}</text>`).join('');
    const dots=field=>rows.map((r,i)=>`<circle cx="${x(i)}" cy="${y(r[field])}" r="3.2" fill="white" stroke="currentColor" stroke-width="2"/>`).join('');
    svg.innerHTML=`<g>${grid.join('')}${labels}</g><g fill="none" stroke="currentColor" stroke-width="2.5"><path d="${path('value')}" style="color:#2563eb"/><path d="${path('cost')}" style="color:#dc2626"/><path d="${path('profit')}" style="color:#059669"/></g><g style="color:#2563eb">${dots('value')}</g><g style="color:#dc2626">${dots('cost')}</g><g style="color:#059669">${dots('profit')}</g>`;
  }

  function render(dataReady=true){
    styles();
    const c=document.getElementById('reportContent');if(!c)return;
    const rows=projectRows(buildProgressModel());
    const total=k=>rows.reduce((a,r)=>a+Number(r[k]||0),0);
    c.innerHTML=`
      <div class="kinerja">
        <div class="kinerja-toolbar">
          <div class="kinerja-filter"><label>Status Proyek</label><select id="kinerjaStatus"><option value="all">Semua Status</option><option value="SELESAI">Selesai</option><option value="BERJALAN">Berjalan</option></select></div>
          <div class="kinerja-kpi"><small>TOTAL PROYEK</small><strong id="kKpiTotal">${rows.length}</strong></div>
          <div class="kinerja-kpi"><small>SELESAI</small><strong id="kKpiDone">${rows.filter(r=>r.status==='SELESAI').length}</strong></div>
          <div class="kinerja-kpi"><small>BERJALAN</small><strong id="kKpiRun">${rows.filter(r=>r.status==='BERJALAN').length}</strong></div>
          <div class="kinerja-kpi"><small>NILAI PROYEK</small><strong id="kKpiValue">${money(total('contract'))}</strong></div>
          <div class="kinerja-kpi"><small>LABA</small><strong id="kKpiProfit">${money(total('laba'))}</strong></div>
        </div>

        <div class="kinerja-section"><div class="kinerja-title">Kinerja Proyek</div><div class="kinerja-scroll"><table class="kinerja-table"><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Nilai Proyek</th><th class="num">Material</th><th class="num">Upah</th><th class="num">Peralatan</th><th class="num">Operasional</th><th class="num">Subkon</th><th class="num">Lain-lain</th><th class="num">Total Realisasi</th><th class="num">Laba</th><th>Status</th></tr></thead><tbody id="kinerjaBody"></tbody></table></div></div>

        <div class="kinerja-section"><div class="kinerja-trend-head"><div class="kinerja-title" style="padding:0;border:0">Trend Nilai Proyek / Biaya / Laba per Bulan</div><div class="kinerja-trend-filter"><span>Periode</span><select id="kinerjaTrendRange"><option value="6">6 Bulan</option><option value="12">1 Tahun</option><option value="custom">Custom</option></select><input id="kinerjaTrendFrom" type="month" style="display:none"/><span id="kinerjaTrendSep" style="display:none">s/d</span><input id="kinerjaTrendTo" type="month" style="display:none"/></div></div><div class="kinerja-trend-meta" id="kinerjaTrendMeta"></div><div class="kinerja-chart-wrap"><svg id="kinerjaTrendSvg" class="kinerja-chart" viewBox="0 0 960 330" preserveAspectRatio="none" aria-label="Grafik trend nilai proyek, realisasi biaya, dan laba"></svg></div><div class="kinerja-legend"><span><i style="background:#2563eb"></i>Nilai Proyek</span><span><i style="background:#dc2626"></i>Realisasi Biaya</span><span><i style="background:#059669"></i>Laba</span></div></div>
      </div>`;

    const renderTable=()=>{
      const status=document.getElementById('kinerjaStatus')?.value||'all';
      const filtered=rows.filter(r=>status==='all'||r.status===status);
      document.getElementById('kKpiTotal').textContent=filtered.length;
      document.getElementById('kKpiDone').textContent=filtered.filter(r=>r.status==='SELESAI').length;
      document.getElementById('kKpiRun').textContent=filtered.filter(r=>r.status==='BERJALAN').length;
      document.getElementById('kKpiValue').textContent=money(filtered.reduce((a,r)=>a+r.contract,0));
      document.getElementById('kKpiProfit').textContent=money(filtered.reduce((a,r)=>a+r.laba,0));
      document.getElementById('kinerjaBody').innerHTML=filtered.length?filtered.map(r=>`<tr><td><strong>${esc(r.project_code||'-')}</strong></td><td>${esc(r.project_name||'-')}</td><td class="num">${money(r.contract)}</td><td class="num">${money(r.c.Material)}</td><td class="num">${money(r.c.Upah)}</td><td class="num">${money(r.c.Peralatan)}</td><td class="num">${money(r.c.Operasional)}</td><td class="num">${money(r.c.Subkon)}</td><td class="num">${money(r.c['Lain-lain'])}</td><td class="num">${money(r.total)}</td><td class="num">${money(r.laba)}</td><td><span class="kinerja-pill ${r.status==='SELESAI'?'done':'run'}">${r.status}</span></td></tr>`).join(''):`<tr><td colspan="12" class="kinerja-empty">Tidak ada proyek pada filter yang dipilih.</td></tr>`;
    };

    const rangeSelect=document.getElementById('kinerjaTrendRange'),from=document.getElementById('kinerjaTrendFrom'),to=document.getElementById('kinerjaTrendTo'),sep=document.getElementById('kinerjaTrendSep'),meta=document.getElementById('kinerjaTrendMeta');
    const updateTrend=()=>{
      let start,end;
      if(rangeSelect.value==='custom'){
        start=parseMonth(from.value);end=parseMonth(to.value);
        if(!start||!end||start>end){meta.textContent='Pilih rentang bulan yang valid untuk menampilkan grafik.';document.getElementById('kinerjaTrendSvg').innerHTML='';return}
      }else{const r=monthRange(rangeSelect.value);start=r.from;end=r.to}
      from.style.display=rangeSelect.value==='custom'?'inline-block':'none';to.style.display=rangeSelect.value==='custom'?'inline-block':'none';sep.style.display=rangeSelect.value==='custom'?'inline':'none';
      const trend=monthlyTotals(start,end,'');
      meta.textContent=`${monthLabel(monthKey(start))} — ${monthLabel(monthKey(end))}`;
      drawChart(trend);
    };
    document.getElementById('kinerjaStatus').addEventListener('change',renderTable);
    rangeSelect.addEventListener('change',()=>{if(rangeSelect.value==='custom'){const r=monthRange('6');from.value=monthKey(r.from);to.value=monthKey(r.to)}updateTrend()});
    from.addEventListener('change',updateTrend);to.addEventListener('change',updateTrend);
    renderTable();updateTrend();
  }

  function activate(){
    styles();
    const root=document.querySelector('.laporan-v3');if(!root)return false;
    const button=root.querySelector('[data-report="kinerja"]');if(!button)return false;
    if(button.dataset.kinerjaV1==='1')return true;
    button.dataset.kinerjaV1='1';
    button.addEventListener('click',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b===button));
      const content=document.getElementById('reportContent');
      if(content)content.innerHTML='<div class="card"><div class="empty">Memuat Kinerja Proyek...</div></div>';
      try{await loadData();render()}catch(err){if(content)content.innerHTML='<div class="card"><div class="empty">Gagal memuat Kinerja Proyek: '+esc(err?.message||err)+'</div></div>'}
    },true);
    return true;
  }

  function boot(){styles();let n=0;const tick=()=>{if(activate()||++n>=80)return;setTimeout(tick,100)};tick()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();