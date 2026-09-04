/* SiKoyek V1.0 — Laporan Ringkasan Proyek V1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_V2__)return;
  window.__SIKOYEK_LAPORAN_V2__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let rows=[];

  function styles(){
    if(document.getElementById('laporan-v2-style'))return;
    const s=document.createElement('style');s.id='laporan-v2-style';
    s.textContent=`
      .laporan-v2{display:grid;gap:16px}
      .laporan-v2 .report-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap}
      .laporan-v2 .report-head h2{margin:0;font-size:20px}
      .laporan-v2 .report-head p{margin:4px 0 0;color:var(--muted);font-size:12px}
      .laporan-v2 .filters{display:grid;grid-template-columns:1.2fr 1fr 1fr auto;gap:10px;align-items:end}
      .laporan-v2 .field{margin:0}.laporan-v2 .field label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:5px}
      .laporan-v2 .field input,.laporan-v2 .field select{width:100%;height:40px;border:1px solid var(--line);border-radius:9px;padding:8px 10px;background:#fff;color:var(--text)}
      .laporan-v2 .filter-actions{display:flex;gap:8px}.laporan-v2 .filter-actions .btn{height:40px;padding:0 13px}
      .laporan-v2 .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
      .laporan-v2 .kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:13px 14px}
      .laporan-v2 .kpi .label{font-size:10px;color:var(--muted);font-weight:700}.laporan-v2 .kpi .value{margin-top:5px;font-size:19px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .laporan-v2 .tablecard{overflow:hidden}.laporan-v2 .scroll{overflow:auto}.laporan-v2 table{width:100%;border-collapse:collapse}.laporan-v2 th,.laporan-v2 td{padding:10px 11px;border-bottom:1px solid var(--line);font-size:12px;text-align:left;white-space:nowrap}.laporan-v2 th{font-size:9px;color:var(--muted);text-transform:uppercase;background:#fafbfd}.laporan-v2 .num{text-align:right}.laporan-v2 .pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700}.laporan-v2 .green{background:var(--green2);color:var(--green)}.laporan-v2 .amber{background:var(--amber2);color:var(--amber)}.laporan-v2 .red{background:var(--red2);color:var(--red)}
      @media(max-width:1000px){.laporan-v2 .filters{grid-template-columns:1fr 1fr}.laporan-v2 .filter-actions{grid-column:1/-1}.laporan-v2 .kpis{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:650px){.laporan-v2 .filters,.laporan-v2 .kpis{grid-template-columns:1fr 1fr}.laporan-v2 .kpi .value{font-size:17px}}
    `;
    document.head.appendChild(s);
  }

  function shell(){
    const p=document.getElementById('page')||document.getElementById('app');
    if(!p)return null;
    p.innerHTML=`<div class="laporan-v2">
      <div class="report-head"><div><h2>Ringkasan Proyek</h2><p>Rekap kondisi proyek berdasarkan data Project Control.</p></div></div>
      <div class="card" style="padding:14px">
        <div class="filters">
          <div class="field"><label>Proyek</label><select id="lapProject"><option value="">Semua Proyek</option></select></div>
          <div class="field"><label>Status</label><select id="lapStatus"><option value="">Semua Status</option><option value="SEHAT">Sehat</option><option value="PERLU PENGAWASAN">Perlu Pengawasan</option><option value="BERISIKO">Berisiko</option></select></div>
          <div class="field"><label>Cari</label><input id="lapSearch" placeholder="Kode atau nama proyek..."></div>
          <div class="filter-actions"><button class="btn ghost" type="button" id="lapReset">Reset</button></div>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi"><div class="label">TOTAL PROYEK</div><div class="value" id="lapKpiProjects">0</div></div>
        <div class="kpi"><div class="label">NILAI KONTRAK</div><div class="value" id="lapKpiContract">Rp 0</div></div>
        <div class="kpi"><div class="label">TOTAL RAP</div><div class="value" id="lapKpiRap">Rp 0</div></div>
        <div class="kpi"><div class="label">TOTAL REALISASI</div><div class="value" id="lapKpiReal">Rp 0</div></div>
        <div class="kpi"><div class="label">AVG PROGRESS</div><div class="value" id="lapKpiProgress">0.00%</div></div>
      </div>
      <div class="card tablecard"><div class="scroll"><table><thead><tr>
        <th>Kode</th><th>Nama Proyek</th><th class="num">Nilai Kontrak</th><th class="num">RAP</th><th class="num">Realisasi</th><th>Progress</th><th>Rasio Biaya</th><th>Status</th>
      </tr></thead><tbody id="lapBody"><tr><td colspan="8" class="empty">Memuat data...</td></tr></tbody></table></div></div>
    </div>`;
    return p;
  }

  function filtered(){
    const project=(document.getElementById('lapProject')?.value||'').trim();
    const status=(document.getElementById('lapStatus')?.value||'').trim();
    const search=(document.getElementById('lapSearch')?.value||'').trim().toLowerCase();
    return rows.filter(x=>{
      if(project && String(x.project_id||'')!==project)return false;
      if(status && String(x.health_status||'')!==status)return false;
      if(search){const hay=`${x.project_code||''} ${x.project_name||''}`.toLowerCase();if(!hay.includes(search))return false}
      return true;
    });
  }

  function render(){
    const data=filtered();
    const sum=k=>data.reduce((t,x)=>t+Number(x[k]||0),0);
    const avg=data.length?sum('project_progress')/data.length:0;
    document.getElementById('lapKpiProjects').textContent=data.length;
    document.getElementById('lapKpiContract').textContent=money(sum('contract_value'));
    document.getElementById('lapKpiRap').textContent=money(sum('total_rap'));
    document.getElementById('lapKpiReal').textContent=money(sum('total_realization'));
    document.getElementById('lapKpiProgress').textContent=pct(avg);
    const body=document.getElementById('lapBody');
    if(!body)return;
    if(!data.length){body.innerHTML='<tr><td colspan="8" class="empty">Tidak ada data yang sesuai.</td></tr>';return}
    body.innerHTML=data.map(x=>{
      const hs=String(x.health_status||'').toUpperCase();
      const cls=hs==='SEHAT'?'green':hs==='BERISIKO'?'red':'amber';
      return `<tr><td><strong>${esc(x.project_code)}</strong></td><td>${esc(x.project_name)}</td><td class="num">${money(x.contract_value)}</td><td class="num">${money(x.total_rap)}</td><td class="num">${money(x.total_realization)}</td><td>${pct(x.project_progress)}</td><td>${pct(x.cost_ratio)}</td><td><span class="pill ${cls}">${esc(x.health_status||'-')}</span></td></tr>`;
    }).join('');
  }

  async function load(){
    const client=window.SK?.sb||window.sb;
    const {data,error}=await client.from('project_summary').select('*').order('project_code');
    if(error)throw error;
    rows=data||[];
    const sel=document.getElementById('lapProject');
    if(sel)sel.innerHTML='<option value="">Semua Proyek</option>'+rows.map(x=>`<option value="${esc(x.project_id)}">${esc(x.project_code)} — ${esc(x.project_name)}</option>`).join('');
    render();
  }

  async function renderPage(){
    styles();
    shell();
    ['lapProject','lapStatus','lapSearch'].forEach(id=>document.getElementById(id)?.addEventListener(id==='lapSearch'?'input':'change',render));
    document.getElementById('lapReset')?.addEventListener('click',()=>{document.getElementById('lapProject').value='';document.getElementById('lapStatus').value='';document.getElementById('lapSearch').value='';render()});
    try{await load()}catch(e){const p=document.getElementById('page')||document.getElementById('app');if(p)p.innerHTML='<div class="card"><div class="empty">Gagal memuat laporan: '+esc(e?.message||'Kesalahan tidak diketahui')+'</div></div>';console.warn('SiKoyek Laporan:',e)}
    window.applyRBACNav?.();
  }

  window.openLaporan=renderPage;
})();