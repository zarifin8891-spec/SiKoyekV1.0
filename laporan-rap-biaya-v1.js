/* SiKoyek V1.0 — Laporan RAP & Biaya v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_RAP_BIAYA_V1__)return;
  window.__SIKOYEK_LAPORAN_RAP_BIAYA_V1__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  let projects=[];
  let summaryRows=[];
  let mountedRoot=null;
  let polling=false;
  let tries=0;

  async function loadData(){
    const client=window.SK?.sb||window.sb;
    if(!client)throw new Error('Supabase client belum siap.');
    const [{data:ps,error:e1},{data:sr,error:e2}]=await Promise.all([
      client.from('projects').select('id,project_code,project_name,contract_value').order('project_code'),
      client.from('project_summary').select('*').order('project_code')
    ]);
    const err=e1||e2;
    if(err)throw err;
    projects=ps||[];
    summaryRows=sr||[];
  }

  function styles(){
    if(document.getElementById('laporan-rap-biaya-style-v1'))return;
    const s=document.createElement('style');
    s.id='laporan-rap-biaya-style-v1';
    s.textContent=`
      .laporan-v3 .rap-biaya-filter{display:grid;grid-template-columns:minmax(260px,420px) auto;gap:10px;align-items:end}
      .laporan-v3 .rap-biaya-filter .field{margin:0}
      .laporan-v3 .rap-biaya-filter label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:5px}
      .laporan-v3 .rap-biaya-filter select{width:100%;height:40px;border:1px solid var(--line);border-radius:9px;padding:8px 10px;background:#fff;color:var(--text)}
      .laporan-v3 .rap-biaya-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
      .laporan-v3 .rap-biaya-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:9px 12px;min-height:68px;display:flex;flex-direction:column;justify-content:center}
      .laporan-v3 .rap-biaya-kpi small{font-size:9px;color:var(--muted);font-weight:700}
      .laporan-v3 .rap-biaya-kpi strong{font-size:17px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      @media(max-width:1000px){.laporan-v3 .rap-biaya-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:650px){.laporan-v3 .rap-biaya-filter{grid-template-columns:1fr}.laporan-v3 .rap-biaya-kpis{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s);
  }

  function selectedRows(){
    const pid=document.getElementById('rapBiayaProject')?.value||'';
    return summaryRows.filter(r=>!pid||String(r.project_id)===String(pid));
  }

  function render(){
    const content=document.getElementById('reportContent');
    if(!content)return;
    const previous=document.getElementById('rapBiayaProject')?.value||'';
    const options=projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_code||'-')} — ${esc(p.project_name||'-')}</option>`).join('');
    content.innerHTML=`
      <div class="card" style="padding:14px">
        <div class="rap-biaya-filter">
          <div class="field"><label>Proyek</label><select id="rapBiayaProject"><option value="">Semua Proyek</option>${options}</select></div>
          <div class="filter-actions"><button class="btn ghost" type="button" id="rapBiayaReset">Reset</button></div>
        </div>
      </div>
      <div class="rap-biaya-kpis">
        <div class="rap-biaya-kpi"><small>TOTAL RAP</small><strong id="rapBiayaKpiRap">Rp 0</strong></div>
        <div class="rap-biaya-kpi"><small>TOTAL REALISASI</small><strong id="rapBiayaKpiReal">Rp 0</strong></div>
        <div class="rap-biaya-kpi"><small>RAP TERSISA</small><strong id="rapBiayaKpiSisa">Rp 0</strong></div>
        <div class="rap-biaya-kpi"><small>AVG PROGRESS</small><strong id="rapBiayaKpiProgress">0.00%</strong></div>
        <div class="rap-biaya-kpi"><small>AVG RASIO BIAYA</small><strong id="rapBiayaKpiRatio">0.00%</strong></div>
      </div>
      <div class="card tablecard"><div class="scroll"><table><thead><tr><th>Kode</th><th>Nama Proyek</th><th class="num">RAP</th><th class="num">Realisasi</th><th class="num">Sisa RAP</th><th>Progress</th><th>Rasio Biaya</th><th>Status</th></tr></thead><tbody id="rapBiayaBody"></tbody></table></div></div>
      <div class="card note-card">RAP adalah anggaran biaya proyek, sedangkan realisasi adalah biaya yang sudah tercatat. Sisa RAP = RAP − Realisasi. Rasio biaya mengikuti ringkasan proyek.</div>`;
    const select=document.getElementById('rapBiayaProject');
    if(select)select.value=previous;
    select?.addEventListener('change',renderBody);
    document.getElementById('rapBiayaReset')?.addEventListener('click',()=>{if(select)select.value='';renderBody()});
    renderBody();
  }

  function renderBody(){
    const rows=selectedRows();
    const rap=rows.reduce((s,r)=>s+Number(r.total_rap||0),0);
    const real=rows.reduce((s,r)=>s+Number(r.total_realization||0),0);
    const avgProgress=rows.length?rows.reduce((s,r)=>s+Number(r.project_progress||0),0)/rows.length:0;
    const avgRatio=rows.length?rows.reduce((s,r)=>s+Number(r.cost_ratio||0),0)/rows.length:0;
    const kRap=document.getElementById('rapBiayaKpiRap');
    const kReal=document.getElementById('rapBiayaKpiReal');
    const kSisa=document.getElementById('rapBiayaKpiSisa');
    const kProg=document.getElementById('rapBiayaKpiProgress');
    const kRatio=document.getElementById('rapBiayaKpiRatio');
    if(kRap)kRap.textContent=money(rap);
    if(kReal)kReal.textContent=money(real);
    if(kSisa)kSisa.textContent=money(rap-real);
    if(kProg)kProg.textContent=pct(avgProgress);
    if(kRatio)kRatio.textContent=pct(avgRatio);
    const body=document.getElementById('rapBiayaBody');
    if(!body)return;
    if(!rows.length){body.innerHTML='<tr><td colspan="8" class="empty">Tidak ada data RAP dan biaya.</td></tr>';return}
    body.innerHTML=rows.map(r=>{
      const status=String(r.health_status||'-');
      const cls=status.toUpperCase()==='SEHAT'?'green':status.toUpperCase()==='BERISIKO'?'red':'amber';
      return `<tr><td><strong>${esc(r.project_code||'-')}</strong></td><td>${esc(r.project_name||'-')}</td><td class="num">${money(r.total_rap)}</td><td class="num">${money(r.total_realization)}</td><td class="num">${money(Number(r.total_rap||0)-Number(r.total_realization||0))}</td><td>${pct(r.project_progress)}</td><td>${pct(r.cost_ratio)}</td><td><span class="pill ${cls}">${esc(status)}</span></td></tr>`;
    }).join('');
  }

  function activate(){
    const root=document.querySelector('.laporan-v3');
    if(!root)return false;
    const button=root.querySelector('[data-report="rap"]');
    if(!button)return false;
    if(button.dataset.rapBiayaV1!=='1'){
      button.dataset.rapBiayaV1='1';
      button.addEventListener('click',e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b===button));
        const c=document.getElementById('reportContent');
        if(c)c.innerHTML='<div class="card"><div class="empty">Memuat laporan RAP & Biaya...</div></div>';
        Promise.resolve(loadData()).then(render).catch(err=>{if(c)c.innerHTML='<div class="card"><div class="empty">Gagal memuat RAP & Biaya: '+esc(err?.message||err)+'</div></div>'});
      },true);
    }
    return true;
  }

  function poll(){
    if(polling)return;
    polling=true;tries=0;
    const tick=()=>{
      if(activate()||++tries>=80){polling=false;return}
      setTimeout(tick,100);
    };
    tick();
  }

  styles();
  poll();
})();