(function(){
  const { money, formatDate } = window.SiKoyekFoundation;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const pct = value => value == null ? '—' : Number(value).toFixed(2) + '%';
  const healthClass = status => status === 'SEHAT' ? 'green' : status === 'BERISIKO' ? 'red' : 'amber';
  const STYLE_ID='project-summary-v2-style';
  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .project-summary-v2{margin-top:14px}.project-summary-v2 .summary-heading{display:none}.project-summary-v2 .summary-panels{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:14px;align-items:stretch}.project-summary-v2 .summary-panel{min-width:0;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 8px 22px rgba(23,32,51,.035)}.project-summary-v2 .summary-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.project-summary-v2 .summary-panel-head h3{margin:0;font-size:16px}.project-summary-v2 .summary-panel-head .btn{height:38px;padding:0 14px;border-radius:9px;font-size:14px;font-weight:500!important}.project-summary-v2 .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px}.project-summary-v2 .info-item .note{margin-top:0;margin-bottom:3px}.project-summary-v2 .info-item strong{font-size:15px}.project-summary-v2 .summary-divider{height:1px;background:var(--line);margin:13px 0 11px}.project-summary-v2 .subheading{font-size:12px;font-weight:800;color:#43516a;margin-bottom:8px;text-transform:uppercase;letter-spacing:.03em}.project-summary-v2 .cost-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.project-summary-v2 .cost-item{background:#f8fafc;border:1px solid #e8edf4;border-radius:10px;padding:9px 10px}.project-summary-v2 .cost-item .note{margin:0 0 2px;font-size:11px}.project-summary-v2 .cost-item strong{font-size:15px}.project-summary-v2 .rap-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.project-summary-v2 .rap-item{background:#f8fafc;border:1px solid #e8edf4;border-radius:10px;padding:10px}.project-summary-v2 .rap-item .label{font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase}.project-summary-v2 .rap-item .value{font-size:15px;font-weight:500!important;line-height:1.2;margin-top:4px;white-space:nowrap}.project-summary-v2 .rap-total{margin-top:9px;padding:10px 12px;border-radius:10px;background:#eef5ff;border:1px solid #dce8ff;display:flex;align-items:center;justify-content:space-between;gap:12px}.project-summary-v2 .rap-total .label{font-size:11px;color:#52627b;font-weight:700;text-transform:uppercase}.project-summary-v2 .rap-total .value{font-size:17px;font-weight:600!important;line-height:1.2}.project-summary-v2 .detail-kpis-v2{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px}.project-summary-v2 .detail-kpi-v2{min-height:64px;padding:8px 9px;display:flex;flex-direction:column;justify-content:center;min-width:0}.project-summary-v2 .detail-kpi-v2 .label{font-size:10px;color:var(--muted);font-weight:700;letter-spacing:.02em}.project-summary-v2 .detail-kpi-v2 .value{font-size:17px;line-height:1.1;font-weight:600;margin-top:4px;overflow-wrap:anywhere}.project-summary-v2 .progress-value{display:flex;align-items:center;justify-content:space-between;gap:8px}.project-summary-v2 .progress-value .value{margin-top:0;font-size:18px;font-weight:600}.project-summary-v2 .detail-kpi-v2 .bar{margin-top:6px;height:5px}.project-summary-v2 .health-kpi{display:flex;flex-direction:column;justify-content:center;align-items:flex-start}.project-summary-v2 .health-kpi .value{margin-top:5px}.project-summary-v2 .health-kpi .pill{font-size:10px;padding:4px 8px}.project-summary-v2 .timeline-v4{margin-top:14px;border:1px solid var(--line);border-radius:16px;background:#fff;padding:15px 16px}.project-summary-v2 .timeline-v4-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.project-summary-v2 .timeline-v4-head h3{margin:0;font-size:16px}.project-summary-v2 .timeline-v4-meta{display:flex;gap:8px;flex-wrap:wrap}.project-summary-v2 .timeline-v4-badge{padding:5px 9px;border-radius:999px;background:#f3f6fa;color:#53627a;font-size:11px;font-weight:700}.project-summary-v2 .timeline-v4-track{position:relative;height:14px;background:#edf1f6;border-radius:999px;overflow:visible;margin:8px 0 10px}.project-summary-v2 .timeline-v4-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:#245cff}.project-summary-v2 .timeline-v4-marker{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #245cff;transform:translate(-50%,-50%);box-sizing:border-box}.project-summary-v2 .timeline-v4-current-date{position:absolute;top:22px;transform:translateX(-50%);font-size:10px;color:var(--muted);white-space:nowrap}.project-summary-v2 .timeline-v4-dates{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11px;color:var(--muted);margin-top:18px}.project-summary-v2 .timeline-v4-dates>div:last-child{text-align:right}.project-summary-v2 .timeline-v4-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}.project-summary-v2 .timeline-v4-stat{background:#f8fafc;border:1px solid #e8edf4;border-radius:10px;padding:10px 11px}.project-summary-v2 .timeline-v4-stat .label{font-size:10px;color:var(--muted);font-weight:700}.project-summary-v2 .timeline-v4-stat .value{margin-top:3px;font-size:16px;font-weight:600}
      @media(max-width:1100px){.project-summary-v2 .summary-panels{grid-template-columns:1fr}.project-summary-v2 .rap-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:780px){.project-summary-v2 .detail-kpis-v2{grid-template-columns:repeat(2,minmax(0,1fr))}.project-summary-v2 .info-grid{grid-template-columns:1fr}.project-summary-v2 .timeline-v4-stats{grid-template-columns:1fr}}@media(max-width:520px){.project-summary-v2 .rap-grid{grid-template-columns:1fr 1fr}.project-summary-v2 .summary-panel-head{align-items:flex-start;flex-direction:column}.project-summary-v2 .timeline-v4-dates{font-size:10px}}
    `;document.head.appendChild(s);
  }
  function kpiMarkup(d,s,access){
    const progress=Math.min(100,Math.max(0,Number(s?.project_progress||0)));
    const contract=d.project.contract_value;
    const rap=s?.total_rap;
    const card=(label,value,attributes='')=>`<div class="card detail-kpi-v2"><div class="label">${label}</div><div class="value" ${attributes}>${value}</div></div>`;
    const finance=(access?.finance ?? SiKoyekControl.canFinance())
      ? card('REALISASI BIAYA',money(s?.total_realization ?? s?.cash_out ?? d.fin.filter(row=>row.transaction_type==='KELUAR').reduce((total,row)=>total+Number(row.amount||0),0)))
        +(!access || access.rap && contract != null ? card('ESTIMASI LABA',money(s?.estimated_profit ?? (Number(contract||0)-Number(rap||0)))) : '')
      : '';
    const workers=!access && SiKoyekControl.canProgress() ? card('TENAGA KERJA','—','data-project-worker-count aria-live="polite"') : '';
    return `<div class="project-summary-v2"><div class="detail-kpis-v2">
      ${!access || contract != null ? card('NILAI KONTRAK',money(contract)) : ''}${!access || access.rap ? card('RAP',money(rap)) : ''}${finance}
      <div class="card detail-kpi-v2 health-kpi"><div class="label">HEALTH</div><div class="value"><span class="pill ${healthClass(s?.health_status)}">${esc(s?.health_status||'-')}</span></div></div>
      <div class="card detail-kpi-v2"><div class="label progress-value"><span>PROGRESS</span><span class="value">${access && !access.curve ? '—' : pct(progress)}</span></div><div class="bar"><i style="width:${progress}%"></i></div></div>
      ${workers}
    </div></div>`;
  }
  function timelineMarkup(d){const p=d?.project||{},start=new Date(p.start_date),end=new Date(p.end_date),now=new Date(),day=86400000;if(!p.start_date||!p.end_date||Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<start)return `<section class="timeline-v4"><div class="timeline-v4-head"><h3>Timeline Proyek</h3></div><div class="empty">Tanggal mulai/selesai belum tersedia</div></section>`;const duration=Math.max(0,Math.ceil((end-start)/day)),elapsed=Math.ceil((now-start)/day),age=Math.max(0,Math.min(duration,elapsed)),remaining=Math.ceil((end-now)/day),before=now<start,after=now>end,pos=before?0:after?100:(age/duration*100),timePct=duration?Math.round((Math.max(0,Math.min(duration,elapsed))/duration)*100):0,status=before?'Belum dimulai':after?`Terlambat ${Math.abs(remaining)} hari`:'Berjalan',today=formatDate(now);return `<section class="timeline-v4"><div class="timeline-v4-head"><h3>Timeline Proyek</h3><div class="timeline-v4-meta"><span class="timeline-v4-badge">${status}</span><span class="timeline-v4-badge">${today}</span></div></div><div class="timeline-v4-track"><span class="timeline-v4-fill" style="width:${pos}%"></span><span class="timeline-v4-marker" style="left:${pos}%"></span><span class="timeline-v4-current-date" style="left:${pos}%">${today}</span></div><div class="timeline-v4-dates"><div>${formatDate(p.start_date)}</div><div>${formatDate(p.end_date)}</div></div><div class="timeline-v4-stats"><div class="timeline-v4-stat"><div class="label">UMUR PROYEK</div><div class="value">${before?'0 hari':`${age} hari`}</div></div><div class="timeline-v4-stat"><div class="label">WAKTU BERJALAN</div><div class="value">${timePct}%</div></div><div class="timeline-v4-stat"><div class="label">SISA WAKTU</div><div class="value">${after?`Terlambat ${Math.abs(remaining)} hari`:before?`${duration} hari`:`${Math.max(0,remaining)} hari`}</div></div></div></section>`}
  function actualCostsMarkup(d){
    const heading='<h2>Realisasi Biaya per Kategori</h2>';
    if(d.financeReadError) return `<section class="control-card">${heading}<p class="control-note">Data realisasi biaya belum dapat dimuat.</p></section>`;
    const categories=[
      ['material','Material','#337bb2'],
      ['upah','Upah','#e99b34'],
      ['alat','Alat','#459f91'],
      ['operasional','Operasional','#8865bc'],
      ['subkon','SubKon','#db6d65'],
      ['lainlain','Lain-lain','#6e839b']
    ];
    const amounts=new Map(categories.map(([key])=>[key,0]));
    const aliases={alatalat:'alat',subkontraktor:'subkon',subkontrak:'subkon'};
    for(const transaction of d.fin||[]){
      if(String(transaction.transaction_type).trim().toUpperCase()!=='KELUAR')continue;
      const amount=Number(transaction.amount);
      if(!Number.isFinite(amount)||amount<=0)continue;
      const category=String(transaction.category||'').toLowerCase().replace(/[\s_-]+/g,'');
      const key=aliases[category]||category;
      const group=amounts.has(key)?key:'lainlain';
      amounts.set(group,amounts.get(group)+amount);
    }
    const total=[...amounts.values()].reduce((sum,amount)=>sum+amount,0);
    let cumulative=0;
    const slices=categories.filter(([key])=>amounts.get(key)>0);
    const stops=slices.map(([key,,color],index)=>{
      const start=cumulative/total*100;
      cumulative+=amounts.get(key);
      const end=index===slices.length-1?100:cumulative/total*100;
      return `${color} ${start}% ${end}%`;
    }).join(',');
    const pie=total>0
      ? `<div class="project-cost-pie" style="--project-cost-slices:conic-gradient(${stops})" aria-hidden="true"></div>`
      : '<p class="control-note">Belum ada transaksi pengeluaran.</p>';
    return `<section class="control-card project-overview-costs">${heading}<div class="project-cost-layout${total>0?' project-cost-layout-paired':''}">${pie}
      <dl class="project-cost-breakdown">${categories.map(([key,label,color])=>`<div>
        <dt><span style="--project-cost-color:${color}" aria-hidden="true"></span>${label}</dt>
        <dd>${money(amounts.get(key))}</dd>
      </div>`).join('')}<div class="project-cost-total"><dt>Total Realisasi</dt><dd>${money(total)}</dd></div></dl></div></section>`;
  }

  function overviewChartsMarkup(d,access){
    const curve=(access?.curve ?? SiKoyekControl.canProgress())
      ? `<section class="control-card project-overview-curve"><h2>Kurva-S &amp; Kemajuan Proyek</h2><div class="control-curve">${SiKoyekControl.curveFromWorkItems(d.project,d.items,d.progress)}</div></section>`
      : '';
    const costs=(access?.costChart ?? SiKoyekControl.canFinance())?actualCostsMarkup(d):'';
    return curve||costs?`<div class="project-overview-charts${curve&&costs?' project-overview-charts-paired':''}">${curve}${costs}</div>`:'';
  }
  function rapMarkup(rap, total, action = '') {
    const values = rap || {};
    const categories = [['Material','material'],['Upah','labor'],['Alat','equipment'],
      ['Operasional','operational'],['Subkon','subcontract'],['Lain-Lain','other']];
    return `<section class="summary-panel"><div class="summary-panel-head"><h3>RAP</h3>${action}</div>
      <div class="rap-grid">${categories.map(([label,key]) => `<div class="rap-item"><div class="label">${label}</div>
        <div class="value">${money(values[key])}</div></div>`).join('')}</div>
      <div class="rap-total"><span class="label">TOTAL RAP</span><span class="value">${money(total)}</span></div></section>`;
  }

  function summaryMarkup(d,s,access) {
    const info = [['Pemilik',d.project.owner_name||'-'],['Project Manager',d.project.project_manager||'-'],
      ['Mulai',formatDate(d.project.start_date)],['Target Selesai',formatDate(d.project.end_date)]];
    const costs = [['Cost Ratio',pct(s?.cost_ratio)],['RAP Consumption',pct(s?.rap_consumption)]];
    const edit = !access ? `<button class="btn primary" onclick="openRapForm()">${d.rap?'Edit RAP':'Isi RAP'}</button>`
      : access.writeRap ? `<button type="button" class="btn primary" data-edit-rap>${d.rap?'Edit RAP':'Isi RAP'}</button>` : '';
    return `<section class="project-summary-v2"><div class="summary-heading"><h2>Project Summary</h2></div>
      <div class="summary-panels"><section class="summary-panel"><div class="summary-panel-head"><h3>Informasi Proyek &amp; Kinerja Biaya</h3></div>
      <div class="info-grid">${info.map(([label,value]) => `<div class="info-item"><div class="note">${label}</div><strong>${esc(value)}</strong></div>`).join('')}</div>
      <div class="summary-divider"></div><div class="subheading">Kinerja Biaya</div>
      <div class="cost-grid">${costs.map(([label,value]) => `<div class="cost-item"><div class="note">${label}</div><strong>${value}</strong></div>`).join('')}</div>
      </section>${!access || access.rap ? rapMarkup(d.rap,s?.total_rap,edit) : ''}</div>
      ${timelineMarkup(d)}${overviewChartsMarkup(d,access)}</section>`;
  }

  function headerMarkup(project, actions) {
    return `<div class="top sk-project-header"><div class="detailtitle"><h2>${esc(project.project_name)}</h2>
      <p>${esc(project.project_code)} • ${esc(project.location||'-')} • ${esc(project.status||'-')}</p></div>
      <div class="actions">${actions}</div></div>`;
  }

  function tabsMarkup(labels, selected, legacy = false) {
    return `<div class="tabs" aria-label="Perincian proyek">${Object.entries(labels).map(([key,label]) =>
      `<button type="button" class="${selected===key?'active':''}" ${selected===key?'aria-current="page"':''}
        ${legacy?`onclick="setTab('${key}')"`:`data-detail-tab="${key}"`}>${label}</button>`).join('')}</div>`;
  }

  function compactProgressView(d){const wrap=document.createElement('div');wrap.innerHTML=progressView(d);[...wrap.querySelectorAll('.card')].forEach(card=>{const text=(card.textContent||'').replace(/\s+/g,' ').trim();if(text.includes('Progress Saat Ini')||text.includes('Cara Kerja Progress'))card.remove()});return wrap.innerHTML}
  function renderDetailV2(el){if(!state.detail){el.innerHTML='<div class="empty">Memuat proyek...</div>';return}const d=state.detail,s=state.summary.find(x=>x.project_id===state.selected),labels={overview:'Overview',pekerjaan:'Item Pekerjaan',progress:'Progress',keuangan:'Keuangan',cost:'Cost Control',...(SiKoyekControl.canProgress()?SiKoyekControl.projectTabs:{})};if(!Object.hasOwn(labels,state.detailTab))state.detailTab='overview';el.innerHTML=`${headerMarkup(d.project, '<button class="btn ghost" onclick="go(\'projects\')">← Kembali</button><button class="btn primary" onclick="openItemForm()">+ Item Pekerjaan</button><button class="btn ghost" onclick="openTxForm()">+ Transaksi</button>')}${kpiMarkup(d,s)}${tabsMarkup(labels,state.detailTab,true)}<div id="project-tab-content">${Object.hasOwn(SiKoyekControl.projectTabs,state.detailTab)?'':state.detailTab==='overview'?summaryMarkup(d,s):detailBodyV2(d,s)}</div>`;
    const workerCount=el.querySelector('[data-project-worker-count]');
    const refreshWorkers=()=>workerCount && SiKoyekControl.loadWorkerCount(workerCount,[d.project.id]);
    refreshWorkers();
    if(Object.hasOwn(SiKoyekControl.projectTabs,state.detailTab))SiKoyekControl.mountProjectTab(el.querySelector('#project-tab-content'),state.detailTab,d.project,refreshWorkers);
  }
  function detailBodyV2(d,s){if(state.detailTab==='pekerjaan')return workitems(d);if(state.detailTab==='progress')return compactProgressView(d);if(state.detailTab==='keuangan')return financeView(d);return costView(d,s)}
  function install(){if(window.__projectSummaryV2Installed)return;if(typeof window.renderDetail==='function'){window.renderDetail=renderDetailV2;window.__projectSummaryV2Installed=true;addStyle();if(typeof state!=='undefined'&&state.page==='detail'&&state.detail)renderDetailV2(document.getElementById('page'))}}
  window.SiKoyekProjectDetail = { headerMarkup, tabsMarkup, kpiMarkup, summaryMarkup, rapMarkup };
  addStyle();
  if (document.documentElement.hasAttribute('data-shared-login')) return;
  const boot=()=>setTimeout(install,120);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();const obs=new window.SiKoyekFoundation.Observer(()=>{if(window.__projectSummaryV2Installed){obs.disconnect();return}clearTimeout(window.__projectSummaryV2Timer);window.__projectSummaryV2Timer=setTimeout(install,120)});obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
