(function(){
  const STYLE_ID='project-summary-v2-style';
  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .project-summary-v2{margin-top:14px}
      .project-summary-v2 .summary-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}
      .project-summary-v2 .summary-heading h2{margin:0;font-size:18px}
      .project-summary-v2 .summary-panels{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:14px;align-items:stretch}
      .project-summary-v2 .summary-panel{min-width:0;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 8px 22px rgba(23,32,51,.035)}
      .project-summary-v2 .summary-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
      .project-summary-v2 .summary-panel-head h3{margin:0;font-size:16px}
      .project-summary-v2 .summary-panel-head .btn{height:38px;padding:0 14px;border-radius:9px;font-size:14px;font-weight:500!important}
      .project-summary-v2 .summary-panel-head .btn.primary{font-weight:500!important}
      .project-summary-v2 .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px}
      .project-summary-v2 .info-item .note{margin-top:0;margin-bottom:3px}
      .project-summary-v2 .info-item strong{font-size:15px}
      .project-summary-v2 .summary-divider{height:1px;background:var(--line);margin:13px 0 11px}
      .project-summary-v2 .subheading{font-size:12px;font-weight:800;color:#43516a;margin-bottom:8px;text-transform:uppercase;letter-spacing:.03em}
      .project-summary-v2 .cost-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .project-summary-v2 .cost-item{background:#f8fafc;border:1px solid #e8edf4;border-radius:10px;padding:9px 10px}
      .project-summary-v2 .cost-item .note{margin:0 0 2px;font-size:11px}
      .project-summary-v2 .cost-item strong{font-size:15px}
      .project-summary-v2 .rap-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .project-summary-v2 .rap-item{background:#f8fafc;border:1px solid #e8edf4;border-radius:10px;padding:10px}
      .project-summary-v2 .rap-item .label{font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase}
      .project-summary-v2 .rap-item .value{font-size:15px;font-weight:500!important;line-height:1.2;margin-top:4px;white-space:nowrap}
      .project-summary-v2 .rap-item .value *{font-weight:500!important}
      .project-summary-v2 .rap-total{margin-top:9px;padding:10px 12px;border-radius:10px;background:#eef5ff;border:1px solid #dce8ff;display:flex;align-items:center;justify-content:space-between;gap:12px}
      .project-summary-v2 .rap-total .label{font-size:11px;color:#52627b;font-weight:700;text-transform:uppercase}
      .project-summary-v2 .rap-total .value{font-size:17px;font-weight:600!important;line-height:1.2}
      .project-summary-v2 .detail-kpis-v2{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}
      .project-summary-v2 .detail-kpi-v2{height:88px;padding:12px 16px;display:flex;flex-direction:column;justify-content:center;min-width:0}
      .project-summary-v2 .detail-kpi-v2 .label{font-size:11px;color:var(--muted);font-weight:700;letter-spacing:.02em}
      .project-summary-v2 .detail-kpi-v2 .value{font-size:19px;line-height:1.1;font-weight:600;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .project-summary-v2 .progress-value{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .project-summary-v2 .progress-value .value{margin-top:0;font-size:19px;font-weight:600}
      .project-summary-v2 .detail-kpi-v2 .bar{margin-top:8px;height:6px}
      .project-summary-v2 .health-kpi{display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
      .project-summary-v2 .health-kpi .value{margin-top:7px}
      .project-summary-v2 .health-kpi .pill{font-size:11px}
      .project-summary-v2 .timeline-v4{margin-top:14px;border:1px solid var(--line);border-radius:16px;background:#fff;padding:15px 16px}
      .project-summary-v2 .timeline-v4-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
      .project-summary-v2 .timeline-v4-head h3{margin:0;font-size:16px}
      .project-summary-v2 .timeline-v4-meta{display:flex;gap:8px;flex-wrap:wrap}
      .project-summary-v2 .timeline-v4-badge{padding:5px 9px;border-radius:999px;background:#f3f6fa;color:#53627a;font-size:11px;font-weight:700}
      .project-summary-v2 .timeline-v4-track{position:relative;height:14px;background:#edf1f6;border-radius:999px;overflow:visible;margin:8px 0 10px}
      .project-summary-v2 .timeline-v4-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:#245cff}
      .project-summary-v2 .timeline-v4-marker{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #245cff;transform:translate(-50%,-50%);box-sizing:border-box}
      .project-summary-v2 .timeline-v4-dates{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:11px;color:var(--muted)}
      .project-summary-v2 .timeline-v4-dates>div:nth-child(2){text-align:center}
      .project-summary-v2 .timeline-v4-dates>div:nth-child(3){text-align:right}
      .project-summary-v2 .timeline-v4-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}
      .project-summary-v2 .timeline-v4-stat{background:#f8fafc;border:1px solid #e8edf4;border-radius:10px;padding:10px 11px}
      .project-summary-v2 .timeline-v4-stat .label{font-size:10px;color:var(--muted);font-weight:700}
      .project-summary-v2 .timeline-v4-stat .value{margin-top:3px;font-size:16px;font-weight:600}
      @media(max-width:1100px){
        .project-summary-v2 .summary-panels{grid-template-columns:1fr}
        .project-summary-v2 .rap-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
      }
      @media(max-width:780px){
        .project-summary-v2 .detail-kpis-v2{grid-template-columns:repeat(2,minmax(0,1fr))}
        .project-summary-v2 .info-grid{grid-template-columns:1fr}
        .project-summary-v2 .timeline-v4-stats{grid-template-columns:1fr}
      }
      @media(max-width:520px){
        .project-summary-v2 .detail-kpis-v2{grid-template-columns:1fr}
        .project-summary-v2 .rap-grid{grid-template-columns:1fr 1fr}
        .project-summary-v2 .summary-panel-head{align-items:flex-start;flex-direction:column}
        .project-summary-v2 .timeline-v4-dates{font-size:10px}
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

  function timelineMarkup(d){
    const p=d?.project||{};
    const start=new Date(p.start_date);
    const end=new Date(p.end_date);
    const now=new Date();
    const validStart=!Number.isNaN(start.getTime());
    const validEnd=!Number.isNaN(end.getTime());
    const valid=validStart&&validEnd&&end>=start;
    if(!valid)return `<section class="timeline-v4"><div class="timeline-v4-head"><h3>Timeline Proyek</h3></div><div class="empty">Tanggal mulai/selesai belum tersedia</div></section>`;
    const msDay=86400000;
    const duration=Math.max(0,Math.ceil((end-start)/msDay));
    const elapsed=Math.ceil((now-start)/msDay);
    const age=Math.max(0,Math.min(duration,elapsed));
    const remaining=Math.ceil((end-now)/msDay);
    const isBefore=now<start;
    const isAfter=now>end;
    const pos=isBefore?0:isAfter?100:(age/duration*100);
    const pctTime=duration?Math.round((Math.max(0,Math.min(duration,elapsed))/duration)*100):0;
    const status=isBefore?'Belum dimulai':isAfter?`Terlambat ${Math.abs(remaining)} hari`:'Berjalan';
    const todayLabel=now.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
    return `<section class="timeline-v4"><div class="timeline-v4-head"><h3>Timeline Proyek</h3><div class="timeline-v4-meta"><span class="timeline-v4-badge">${status}</span><span class="timeline-v4-badge">${todayLabel}</span></div></div><div class="timeline-v4-track"><span class="timeline-v4-fill" style="width:${pos}%"></span><span class="timeline-v4-marker" style="left:${pos}%"></span></div><div class="timeline-v4-dates"><div>${esc(p.start_date)}</div><div>Hari ini</div><div>${esc(p.end_date)}</div></div><div class="timeline-v4-stats"><div class="timeline-v4-stat"><div class="label">UMUR PROYEK</div><div class="value">${isBefore?'0 hari':`${age} hari`}</div></div><div class="timeline-v4-stat"><div class="label">WAKTU BERJALAN</div><div class="value">${pctTime}%</div></div><div class="timeline-v4-stat"><div class="label">SISA WAKTU</div><div class="value">${isAfter?`Terlambat ${Math.abs(remaining)} hari`:isBefore?`${duration} hari`:`${Math.max(0,remaining)} hari`}</div></div></div></section>`;
  }

  function summaryMarkup(d,s){
    const r=d.rap||{};
    const info=[['Pemilik',d.project.owner_name||'-'],['Project Manager',d.project.project_manager||'-'],['Mulai',d.project.start_date||'-'],['Target Selesai',d.project.end_date||'-']];
    const costs=[['Cost Ratio',pct(s?.cost_ratio)],['RAP Consumption',pct(s?.rap_consumption)]];
    const rap=[['Material',r.material],['Upah',r.labor],['Alat',r.equipment),['Operasional',r.operational],['Subkon',r.subcontract],['Lain-Lain',r.other]];
    return `<section class="project-summary-v2"><div class="summary-heading"><h2>Project Summary</h2></div><div class="summary-panels">
      <section class="summary-panel"><div class="summary-panel-head"><h3>Informasi Proyek &amp; Kinerja Biaya</h3></div><div class="info-grid">${info.map(([label,value])=>`<div class="info-item"><div class="note">${label}</div><strong>${esc(value)}</strong></div>`).join('')}</div><div class="summary-divider"></div><div class="subheading">Kinerja Biaya</div><div class="cost-grid">${costs.map(([label,value])=>`<div class="cost-item"><div class="note">${label}</div><strong>${value}</strong></div>`).join('')}</div></section>
      <section class="summary-panel"><div class="summary-panel-head"><h3>RAP</h3><button class="btn primary" onclick="openRapForm()">${d.rap?'Edit RAP':'Isi RAP'}</button></div><div class="rap-grid">${rap.map(([label,value])=>`<div class="rap-item"><div class="label">${label}</div><div class="value">${money(value)}</div></div>`).join('')}</div><div class="rap-total"><span class="label">TOTAL RAP</span><span class="value">${money(s?.total_rap)}</span></div></section>
    </div>${timelineMarkup(d)}</section>`;
  }

  function compactProgressView(d){
    const html=progressView(d);
    const wrap=document.createElement('div');
    wrap.innerHTML=html;
    [...wrap.querySelectorAll('.card')].forEach(card=>{
      const text=(card.textContent||'').replace(/\s+/g,' ').trim();
      if(text.includes('Progress Saat Ini')||text.includes('Cara Kerja Progress')) card.remove();
    });
    return wrap.innerHTML;
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
    if(state.detailTab==='progress')return compactProgressView(d);
    if(state.detailTab==='keuangan')return financeView(d);
    return costView(d,s);
  }

  function install(){
    if(window.__projectSummaryV2Installed) return;
    if(typeof window.renderDetail==='function'){
      window.renderDetail=renderDetailV2;
      window.__projectSummaryV2Installed=true;
      addStyle();
      if(typeof state!=='undefined'&&state.page==='detail'&&state.detail) renderDetailV2(document.getElementById('page'));
    }
  }

  addStyle();
  const boot=()=>setTimeout(install,120);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{
    if(window.__projectSummaryV2Installed){obs.disconnect();return}
    clearTimeout(window.__projectSummaryV2Timer);
    window.__projectSummaryV2Timer=setTimeout(install,120);
  });
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
