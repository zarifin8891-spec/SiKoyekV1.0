/* SiKoyek V1.0 — Kinerja Proyek v2 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_KINERJA_PROYEK_V2__)return;
  window.__SIKOYEK_LAPORAN_KINERJA_PROYEK_V2__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const txType=r=>String(r?.transaction_type||r?.type||'').trim().toUpperCase();
  const txDate=r=>String(r?.transaction_date||'').slice(0,10);
  const amount=r=>Math.abs(Number(r?.amount||0)||0);
  const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const monthLabel=k=>{const [y,m]=k.split('-').map(Number);return new Intl.DateTimeFormat('id-ID',{month:'short',year:'2-digit'}).format(new Date(y,m-1,1))};
  const norm=s=>String(s||'').trim().toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' ');
  const category=s=>{const c=norm(s);if(/material|bahan|barang/.test(c))return'Material';if(/upah|tenaga kerja|labor/.test(c))return'Upah';if(/peralatan|alat|equipment/.test(c))return'Peralatan';if(/operasional|operasi|transport|administrasi|adm/.test(c))return'Operasional';if(/subkon|sub contractor|subcontract/.test(c))return'Subkon';return'Lain-lain'};
  let data={projects:[],items:[],progress:[],tx:[]};

  async function loadData(){
    const client=window.SK?.sb||window.sb;
    if(!client)throw new Error('Supabase client belum siap.');
    const [a,b,c,d]=await Promise.all([
      client.from('projects').select('id,project_code,project_name,contract_value').order('project_code'),
      client.from('project_work_items').select('id,project_id,weight').order('sort_order'),
      client.from('progress_records').select('project_id,work_item_id,progress_date,progress_percentage').order('progress_date'),
      client.from('financial_transactions').select('id,project_id,transaction_date,transaction_type,category,amount').order('transaction_date')
    ]);
    const err=a.error||b.error||c.error||d.error;if(err)throw err;
    data={projects:a.data||[],items:b.data||[],progress:c.data||[],tx:d.data||[]};
  }

  function progressModel(){
    const weights=new Map(data.items.map(x=>[String(x.id),Number(x.weight||0)]));
    const projectProgress=new Map();
    const monthly=new Map();
    const records=data.progress.slice().sort((x,y)=>String(x.progress_date||'').localeCompare(String(y.progress_date||'')));
    const current=new Map();
    for(const r of records){
      const pid=String(r.project_id||''),wid=String(r.work_item_id||'');
      if(!pid||!wid)continue;
      const d=String(r.progress_date||'').slice(0,10);if(!d)continue;
      const prev=current.get(wid)||0;
      const next=Math.min(100,Math.max(0,prev+Number(r.progress_percentage||0)));
      current.set(wid,next);
      const delta=Math.max(0,next-prev);
      const weighted=Number(weights.get(wid)||0)*delta;
      const key=pid+'|'+monthKey(new Date(d+'T00:00:00'));
      monthly.set(key,(monthly.get(key)||0)+weighted);
      projectProgress.set(pid,(projectProgress.get(pid)||0)+weighted);
    }
    return {projectProgress,monthly};
  }

  function rows(){
    const pm=progressModel();
    const costs=new Map();
    for(const t of data.tx){if(txType(t)!=='KELUAR')continue;const pid=String(t.project_id||'');if(!pid)continue;if(!costs.has(pid))costs.set(pid,{Material:0,Upah:0,Peralatan:0,Operasional:0,Subkon:0,'Lain-lain':0});costs.get(pid)[category(t.category)]+=amount(t)}
    return data.projects.map(p=>{const pid=String(p.id),c=costs.get(pid)||{Material:0,Upah:0,Peralatan:0,Operasional:0,Subkon:0,'Lain-lain':0};const total=Object.values(c).reduce((a,v)=>a+v,0);const contract=Number(p.contract_value||0);const progress=Math.min(100,Number(pm.projectProgress.get(pid)||0));return{...p,contract,c,total,laba:contract-total,progress,status:progress>=99.999?'SELESAI':'BERJALAN'}});
  }

  function chartFrom(rows){
    const now=new Date(),from=new Date(now.getFullYear(),now.getMonth()-5,1),to=new Date(now.getFullYear(),now.getMonth()+1,0);
    const keys=[];for(let d=new Date(from);d<=to;d.setMonth(d.getMonth()+1))keys.push(monthKey(d));
    return keys.map(k=>{let value=0,cost=0;const pm=progressModel();for(const p of data.projects)value+=(Number(pm.monthly.get(String(p.id)+'|'+k)||0)/100)*Number(p.contract_value||0);for(const t of data.tx){if(txType(t)==='KELUAR'&&txDate(t).slice(0,7)===k)cost+=amount(t)}return{key:k,value,cost,profit:value-cost}});
  }

  function render(){
    const c=document.getElementById('reportContent');if(!c)return;
    const rws=rows();
    const totalValue=rws.reduce((a,r)=>a+r.contract,0),totalProfit=rws.reduce((a,r)=>a+r.laba,0);
    c.innerHTML=`<div class="kinerja-v2">
      <style>
        .kinerja-v2{display:grid;gap:10px}.kinerja-v2 .kv2-toolbar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.kinerja-v2 .kv2-filter,.kinerja-v2 .kv2-kpi{border:1px solid var(--line);background:#fff;border-radius:10px;padding:9px;min-height:62px;box-sizing:border-box}.kinerja-v2 .kv2-filter label,.kinerja-v2 .kv2-kpi small{display:block;font-size:9px;font-weight:700;color:var(--muted);margin-bottom:5px}.kinerja-v2 .kv2-filter select{width:100%;height:34px;border:1px solid var(--line);border-radius:8px;background:#fff;padding:5px 7px}.kinerja-v2 .kv2-kpi{display:flex;flex-direction:column;justify-content:center}.kinerja-v2 .kv2-kpi strong{font-size:14px}.kinerja-v2 .kv2-sec{border:1px solid var(--line);border-radius:10px;background:#fff;overflow:hidden}.kinerja-v2 .kv2-title{padding:10px 12px;font-size:12px;font-weight:800;border-bottom:1px solid var(--line)}.kinerja-v2 .kv2-scroll{overflow:auto}.kinerja-v2 table{width:100%;border-collapse:collapse}.kinerja-v2 th,.kinerja-v2 td{padding:7px 8px;border-bottom:1px solid var(--line);font-size:10px;white-space:nowrap;text-align:left}.kinerja-v2 th{font-size:8px;text-transform:uppercase;color:var(--muted);background:#fafbfd}.kinerja-v2 .num{text-align:right}.kinerja-v2 .pill{font-size:8px;font-weight:800}.kinerja-v2 .kv2-trend{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line)}.kinerja-v2 .kv2-trend select{height:30px;border:1px solid var(--line);border-radius:8px;background:#fff;padding:4px 8px;font-size:10px}.kinerja-v2 .kv2-meta{padding:8px 12px 0;font-size:9px;color:var(--muted)}.kinerja-v2 .kv2-chart{width:100%;height:260px;display:block}.kinerja-v2 .legend{display:flex;justify-content:center;gap:18px;padding:0 10px 10px;font-size:9px;color:var(--muted)}@media(max-width:1000px){.kinerja-v2 .kv2-toolbar{grid-template-columns:repeat(3,1fr)}}@media(max-width:600px){.kinerja-v2 .kv2-toolbar{grid-template-columns:1fr 1fr}}
      </style>
      <div class="kv2-toolbar"><div class="kv2-filter"><label>Status Proyek</label><select id="kv2Status"><option value="all">Semua Status</option><option value="SELESAI">Selesai</option><option value="BERJALAN">Berjalan</option></select></div><div class="kv2-kpi"><small>TOTAL PROYEK</small><strong id="kv2Total">${rws.length}</strong></div><div class="kv2-kpi"><small>SELESAI</small><strong id="kv2Done">${rws.filter(r=>r.status==='SELESAI').length}</strong></div><div class="kv2-kpi"><small>BERJALAN</small><strong id="kv2Run">${rws.filter(r=>r.status==='BERJALAN').length}</strong></div><div class="kv2-kpi"><small>NILAI PROYEK</small><strong id="kv2Value">${money(totalValue)}</strong></div><div class="kv2-kpi"><small>LABA</small><strong id="kv2Profit">${money(totalProfit)}</strong></div></div>
      <div class="kv2-sec"><div class="kv2-title">Kinerja Proyek</div><div class="kv2-scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">Nilai Proyek</th><th class="num">Material</th><th class="num">Upah</th><th class="num">Peralatan</th><th class="num">Operasional</th><th class="num">Subkon</th><th class="num">Lain-lain</th><th class="num">Total Realisasi</th><th class="num">Laba</th><th>Status</th></tr></thead><tbody id="kv2Body"></tbody></table></div></div>
      <div class="kv2-sec"><div class="kv2-trend"><strong>Trend Nilai Proyek / Biaya / Laba per Bulan</strong><select id="kv2Range"><option value="6">6 Bulan</option><option value="12">1 Tahun</option></select></div><div class="kv2-meta" id="kv2Meta"></div><div class="kv2-scroll"><svg id="kv2Svg" class="kv2-chart" viewBox="0 0 960 260" preserveAspectRatio="none"></svg></div><div class="legend"><span>Nilai Proyek</span><span>Realisasi Biaya</span><span>Laba</span></div></div></div>`;

    const body=document.getElementById('kv2Body');
    const paint=()=>{const s=document.getElementById('kv2Status').value;const f=rws.filter(r=>s==='all'||r.status===s);document.getElementById('kv2Total').textContent=f.length;document.getElementById('kv2Done').textContent=f.filter(r=>r.status==='SELESAI').length;document.getElementById('kv2Run').textContent=f.filter(r=>r.status==='BERJALAN').length;document.getElementById('kv2Value').textContent=money(f.reduce((a,r)=>a+r.contract,0));document.getElementById('kv2Profit').textContent=money(f.reduce((a,r)=>a+r.laba,0));body.innerHTML=f.map(r=>`<tr><td><strong>${esc(r.project_code||'-')}</strong></td><td>${esc(r.project_name||'-')}</td><td class="num">${money(r.contract)}</td><td class="num">${money(r.c.Material)}</td><td class="num">${money(r.c.Upah)}</td><td class="num">${money(r.c.Peralatan)}</td><td class="num">${money(r.c.Operasional)}</td><td class="num">${money(r.c.Subkon)}</td><td class="num">${money(r.c['Lain-lain'])}</td><td class="num">${money(r.total)}</td><td class="num">${money(r.laba)}</td><td><span class="pill">${r.status}</span></td></tr>`).join('')};
    const draw=()=>{const range=document.getElementById('kv2Range').value;const dataRows=chartFrom(rws);const rows2=range==='12'?(()=>{const now=new Date(),from=new Date(now.getFullYear(),now.getMonth()-11,1),to=new Date(now.getFullYear(),now.getMonth()+1,0),keys=[];for(let d=new Date(from);d<=to;d.setMonth(d.getMonth()+1))keys.push(monthKey(d));const pm=progressModel();return keys.map(k=>{let v=0,c=0;for(const p of data.projects)v+=(Number(pm.monthly.get(String(p.id)+'|'+k)||0)/100)*Number(p.contract_value||0);for(const t of data.tx)if(txType(t)==='KELUAR'&&txDate(t).slice(0,7)===k)c+=amount(t);return{key:k,value:v,cost:c,profit:v-c}})})():dataRows;const svg=document.getElementById('kv2Svg'),W=960,H=260,L=55,R=15,T=15,B=32,iw=W-L-R,ih=H-T-B,max=Math.max(1,...rows2.flatMap(x=>[x.value,x.cost,x.profit]));const x=i=>L+(rows2.length===1?0:i*iw/(rows2.length-1)),y=v=>T+ih-(Math.max(0,v)/max)*ih,path=k=>rows2.map((z,i)=>`${i?'L':'M'} ${x(i).toFixed(1)} ${y(z[k]).toFixed(1)}`).join(' ');svg.innerHTML=`<g stroke="#e5e7eb"><line x1="${L}" y1="${T+ih}" x2="${W-R}" y2="${T+ih}"/></g><g fill="none" stroke-width="2"><path d="${path('value')}" style="stroke:#2563eb"/><path d="${path('cost')}" style="stroke:#dc2626"/><path d="${path('profit')}" style="stroke:#059669"/></g><g fill="#64748b" font-size="9">${rows2.map((z,i)=>`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${esc(monthLabel(z.key))}</text>`).join('')}</g>`;document.getElementById('kv2Meta').textContent=`${monthLabel(rows2[0]?.key||'2026-01')} — ${monthLabel(rows2[rows2.length-1]?.key||'2026-01')}`};
    document.getElementById('kv2Status').addEventListener('change',paint);document.getElementById('kv2Range').addEventListener('change',draw);paint();draw();
  }

  async function open(){const root=document.querySelector('.laporan-v3'),content=document.getElementById('reportContent');if(!root||!content)return false;root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b.dataset.report==='kinerja'));content.innerHTML='<div class="card"><div class="empty">Memuat Kinerja Proyek...</div></div>';try{await loadData();render();return true}catch(e){content.innerHTML='<div class="card"><div class="empty">Gagal memuat Kinerja Proyek: '+esc(e?.message||e)+'</div></div>';return false}}
  window.__SIKOYEK_LAPORAN_KINERJA_OPEN_V2__=open;
})();
