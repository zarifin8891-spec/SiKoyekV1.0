(function(){
  const STYLE_ID='project-summary-v2-style';
  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .project-summary-v2{margin-top:16px}
      .project-summary-v2 .summary-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}
      .project-summary-v2 .summary-heading h2{margin:0;font-size:18px}
      .project-summary-v2 .summary-panels{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:14px;align-items:stretch}
      .project-summary-v2 .summary-panel{min-width:0;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 8px 22px rgba(23,32,51,.035)}
      .project-summary-v2 .summary-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
      .project-summary-v2 .summary-panel-head h3{margin:0;font-size:16px}
      .project-summary-v2 .summary-panel-head .btn{height:38px;padding:0 14px;border-radius:9px;font-size:14px;font-weight:500}
      .project-summary-v2 .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 20px}
      .project-summary-v2 .info-item .note{margin-top:0;margin-bottom:3px}
      .project-summary-v2 .info-item strong{font-size:15px}
      .project-summary-v2 .summary-divider{height:1px;background:var(--line);margin:15px 0 12px}
      .project-summary-v2 .subheading{font-size:13px;font-weight:800;color:#43516a;margin-bottom:9px;text-transform:uppercase;letter-spacing:.03em}
      .project-summary-v2 .cost-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .project-summary-v2 .cost-item{background:#f8fafc;border:1px solid #e8edf4;border-radius:10px;padding:10px 11px}
      .project-summary-v2 .cost-item .note{margin:0 0 3px;font-size:11px}
      .project-summary-v2 .cost-item strong{font-size:15px}
      .project-summary-v2 .rap-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .project-summary-v2 .rap-item{background:#f8fafc;border:1px solid #e8edf4;border-radius:10px;padding:12px}
      .project-summary-v2 .rap-item .label{font-size:10px;color:var(--muted);font-weight:750;text-transform:uppercase}
      .project-summary-v2 .rap-item .value{font-size:18px;font-weight:800;margin-top:5px;white-space:nowrap}
      .project-summary-v2 .rap-total{margin-top:10px;padding:12px 13px;border-radius:10px;background:#eef5ff;border:1px solid #dce8ff;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .project-summary-v2 .rap-total .label{font-size:11px;color:#52627b;font-weight:800;text-transform:uppercase}
      .project-summary-v2 .rap-total .value{font-size:20px;font-weight:850}
      .project-summary-v2 .detail-kpis-v2{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}
      .project-summary-v2 .detail-kpi-v2{height:104px;padding:14px 16px;display:flex;flex-direction:column;justify-content:center;min-width:0}
      .project-summary-v2 .detail-kpi-v2 .label{font-size:11px;color:var(--muted);font-weight:700;letter-spacing:.02em}
      .project-summary-v2 .detail-kpi-v2 .value{font-size:22px;line-height:1.1;font-weight:800;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .project-summary-v2 .progress-value{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .project-summary-v2 .progress-value .value{margin-top:0}
      .project-summary-v2 .detail-kpi-v2 .bar{margin-top:9px;height:7px}
      .project-summary-v2 .health-kpi{display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
      .project-summary-v2 .health-kpi .value{margin-top:8px}
      .project-summary-v2 .health-kpi .pill{font-size:11px}
      @media(max-width:1100px){
        .project-summary-v2 .summary-panels{grid-template-columns:1fr}
        .project-summary-v2 .rap-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
      }
      @media(max-width:780px){
        .project-summary-v2 .detail-kpis-v2{grid-template-columns:repeat(2,minmax(0,1fr))}
        .project-summary-v2 .info-grid{grid-template-columns:1fr}
      }
      @media(max-width:520px){
        .project-summary-v2 .detail-kpis-v2{grid-template-columns:1fr}
        .project-summary-v2 .rap-grid{grid-template-columns:1fr 1fr}
        .project-summary-v2 .summary-panel-head{align-items:flex-start;flex-direction:column}
      }
    `;
    document.head.appendChild(s);
  }

  function kpiMarkup(s){
    const progress=Math.min(100,Math.max(0,Number(s?.project_progress||0)));
    return `<div class="project-summary-v2"><div class="detail-kpis-v2">
      <div class="card detail-kpi-v2"><div class="label">NILAI KONTRAK</div><div class="value">${money(s?.contract_value)}</div></div>
      <div class="card detail-kpi-v2"><div class="label">RAP</div><div class="value">${money(s?.total_rap)}</div></div>
      <div class="card detail-kpi-v2 health-kpi"><div class="label">HEALTH</div><div class="value"><span class="pill ${healthClass(s?.health_status)}">${esc(s?.health_status||'-')}</span></div></div>
      <div class="card detail-kpi-v2"><div class="label progress-value"><span>PROGRESS</span><span class="value">${pct(progress)}</span></div><div class="bar"><i style="width:${progress}%"></i></div></div>
    </div></div>`;
  }

  function summaryMarkup(d,s){
    const r=d.rap||{};
    const info=[['Pemilik',d.project.owner_name||'-'],['Project Manager',d.project.project_manager||'-'],['Mulai',d.project.start_date||'-'],['Target Selesai',d.project.end_date||'-']];
    const costs=[['Cost Ratio',pct(s?.cost_ratio)],['RAP Consumption',pct(s?.rap_consumption)]];
    const rap=[['Material',r.material],['Upah',r.labor],['Alat',r.equipment],['Operasional',r.operational],['Subkon',r.subcontract],['Lain-Lain',r.other]];
    return `<section class="project-summary-v2"><div class="summary-heading"><h2>Project Summary</h2></div><div class="summary-panels">
      <section class="summary-panel"><div class="summary-panel-head"><h3>Informasi Proyek &amp; Kinerja Biaya</h3></div><div class="info-grid">${info.map(([label,value])=>`<div class="info-item"><div class="note">${label}</div><strong>${esc(value)}</strong></div>`).join('')}</div><div class="summary-divider"></div><div class="subheading">Kinerja Biaya</div><div class="cost-grid">${costs.map(([label,value])=>`<div class="cost-item"><div class="note">${label}</div><strong>${value}</strong></div>`).join('')}</div></section>
      <section class="summary-panel"><div class="summary-panel-head"><h3>RAP</h3><button class="btn primary" onclick="openRapForm()">${d.rap?'Edit RAP':'Isi RAP'}</button></div><div class="rap-grid">${rap.map(([label,value])=>`<div class="rap-item"><div class="label">${label}</div><div class="value">${money(value)}</div></div>`).join('')}</div><div class="rap-total"><span class="label">TOTAL RAP</span><span class="value">${money(s?.total_rap)}</span></div></section>
    </div></section>`;
  }

  function renderDetailV2(el){
    if(!state.detail){el.innerHTML='<div class="empty">Memuat proyek...</div>';return}
    const d=state.detail,s=state.summary.find(x=>x.project_id===state.selected);
    const labels={overview:'Overview',pekerjaan:'Item Pekerjaan',progress:'Progress',keuangan:'Keuangan',cost:'Cost Control'};
    if(state.detailTab==='rap')state.detailTab='overview';
    el.innerHTML=`<div class="top"><div class="detailtitle"><h2>${esc(d.project.project_name)}</h2><p>${esc(d.project.project_code)} • ${esc(d.project.location||'-')} • ${esc(d.project.status)}</p></div><div class="actions"><button class="btn ghost" onclick="go('projects')">← Kembali</button><button class="btn primary" onclick="openItemForm()">+ Item Pekerjaan</button><button class="btn ghost" onclick="openTxForm()">+ Transaksi</button></div></div>${kpiMarkup({...s,contract_value:d.project.contract_value})}<div class="tabs">${Object.entries(labels).map(([k,v])=>`<button class="${state.detailTab===k?'active':''}" onclick="setTab('${k}')">${v}</button>`).join('')}</div><div>${state.detailTab==='overview'?summaryMarkup(d,s):detailBodyV2(d,s)}</div>`;
  }

  function detailBodyV2(d,s){
    if(state.detailTab==='pekerjaan')return workitems(d);
    if(state.detailTab==='progress')return progressView(d);
    if(state.detailTab==='keuangan')return financeView(d);
    return costView(d,s);
  }

  function install(){
    if(typeof window.renderDetail==='function'){
      window.renderDetail=renderDetailV2;
      addStyle();
      if(typeof state!=='undefined'&&state.page==='detail'&&state.detail) renderDetailV2(document.getElementById('page'));
    }
  }

  addStyle();
  const boot=()=>setTimeout(install,120);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__projectSummaryV2Timer);window.__projectSummaryV2Timer=setTimeout(install,120)});
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
