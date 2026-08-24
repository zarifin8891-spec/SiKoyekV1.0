(function(){
  const STYLE_ID='project-health-engine-style';
  const MODULE_ID='project-health-engine';

  function pct(n){return Number(n||0).toFixed(2)+'%'}
  function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0))}
  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .phe-wrap{margin-top:18px}
      .phe-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
      .phe-title{font-size:18px;font-weight:850;margin:0}
      .phe-sub{font-size:12px;color:var(--muted);margin-top:5px}
      .phe-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:13px}
      .phe-card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:17px}
      .phe-label{font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase}
      .phe-value{font-size:24px;font-weight:850;margin-top:8px}
      .phe-green{color:var(--green)} .phe-amber{color:var(--amber)} .phe-red{color:var(--red)} .phe-blue{color:var(--blue)}
      .phe-tablecard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
      .phe-table{width:100%;border-collapse:collapse}
      .phe-table th,.phe-table td{padding:11px 12px;border-bottom:1px solid var(--line);font-size:12px;text-align:left;vertical-align:top}
      .phe-table th{font-size:10px;color:var(--muted);text-transform:uppercase;background:#fafbfd}
      .phe-pill{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:850}
      .phe-pill.green{background:var(--green2);color:var(--green)}
      .phe-pill.amber{background:var(--amber2);color:var(--amber)}
      .phe-pill.red{background:var(--red2);color:var(--red)}
      .phe-action{font-weight:750;line-height:1.35}
      .phe-driver{color:var(--muted);margin-top:3px;line-height:1.35}
      .phe-empty{padding:24px;text-align:center;color:var(--muted)}
      @media(max-width:1000px){.phe-kpis{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:650px){.phe-kpis{grid-template-columns:1fr}.phe-table{min-width:760px}.phe-tablecard{overflow:auto}}
    `;document.head.appendChild(s)
  }
  function evaluate(x){
    const progress=Number(x.project_progress||0);
    const cost=Number(x.cost_ratio||0);
    const rap=Number(x.rap_consumption||0);
    const costGap=cost-progress;
    const rapGap=rap-progress;
    let status='SEHAT';
    let level='green';
    let action='Lanjutkan pekerjaan dan monitoring normal.';
    let driver='Cost Ratio dan RAP Consumption masih berada dalam batas wajar terhadap progress.';
    if(costGap>=15 || rapGap>=20){
      status='BERISIKO'; level='red';
      action='Prioritaskan audit biaya dan progress sebelum menambah pengeluaran non-kritis.';
      driver=`Gap biaya ${pct(costGap)} • Gap RAP ${pct(rapGap)}.`;
    }else if(costGap>=5 || rapGap>=10 || (progress<=0.01 && (cost>0.01 || rap>0.01))){
      status='PERLU PENGAWASAN'; level='amber';
      action='Tinjau item pekerjaan, realisasi biaya, dan penyebab deviasi pada periode berikutnya.';
      driver=`Gap biaya ${pct(costGap)} • Gap RAP ${pct(rapGap)}.`;
    }
    const severity=status==='BERISIKO'?3:status==='PERLU PENGAWASAN'?2:1;
    return {status,level,action,driver,costGap,rapGap,severity};
  }
  function activeRows(){
    if(typeof state==='undefined'||!Array.isArray(state.summary))return [];
    if(typeof periodMatch==='function')return state.summary.filter(periodMatch);
    return state.summary.slice();
  }
  function dashboardApply(){
    if(typeof state==='undefined'||state.page!=='dashboard')return;
    const host=document.getElementById('page');if(!host)return;
    const old=document.getElementById(MODULE_ID);if(old)old.remove();
    const rows=activeRows().map(x=>({...x,...evaluate(x)}));
    const counts={green:rows.filter(x=>x.level==='green').length,amber:rows.filter(x=>x.level==='amber').length,red:rows.filter(x=>x.level==='red').length};
    const ranked=rows.slice().sort((a,b)=>b.severity-a.severity||Math.max(b.costGap,b.rapGap)-Math.max(a.costGap,a.rapGap)||String(a.project_code).localeCompare(String(b.project_code))).slice(0,5);
    const section=[...host.querySelectorAll('.section')].find(el=>el.querySelector('.sectiontitle h2')?.textContent.trim()==='Project Health');
    if(!section)return;
    const wrap=document.createElement('section');wrap.id=MODULE_ID;wrap.className='phe-wrap';
    wrap.innerHTML=`<div class="phe-header"><div><h2 class="phe-title">Project Health & Decision Engine</h2><div class="phe-sub">Rule-based diagnostic V1.0. Engine ini memberi rekomendasi berdasarkan Progress, Cost Ratio, dan RAP Consumption tanpa mengubah status database.</div></div><div class="note">${rows.length} proyek dianalisis</div></div><div class="phe-kpis"><div class="phe-card"><div class="phe-label">Sehat</div><div class="phe-value phe-green">${counts.green}</div></div><div class="phe-card"><div class="phe-label">Perlu Pengawasan</div><div class="phe-value phe-amber">${counts.amber}</div></div><div class="phe-card"><div class="phe-label">Berisiko</div><div class="phe-value phe-red">${counts.red}</div></div><div class="phe-card"><div class="phe-label">Prioritas</div><div class="phe-value phe-blue">${Math.min(5,rows.length)}</div></div></div><div class="phe-tablecard"><div style="overflow:auto"><table class="phe-table"><thead><tr><th>Proyek</th><th>Progress</th><th>Cost Ratio</th><th>RAP Consumption</th><th>Engine</th><th>Keputusan</th></tr></thead><tbody>${ranked.map(x=>`<tr><td><strong>${esc(x.project_code)}</strong> — ${esc(x.project_name)}</td><td>${pct(x.project_progress)}</td><td>${pct(x.cost_ratio)}</td><td>${pct(x.rap_consumption)}</td><td><span class="phe-pill ${x.level}">${x.status}</span><div class="phe-driver">${esc(x.driver)}</div></td><td><div class="phe-action">${esc(x.action)}</div></td></tr>`).join('')||'<tr><td colspan="6" class="phe-empty">Belum ada proyek pada periode aktif.</td></tr>'}</tbody></table></div></div>`;
    section.parentNode.insertBefore(wrap,section);
  }
  function detailApply(){
    if(typeof state==='undefined'||state.page!=='detail'||state.detailTab!=='overview')return;
    const host=document.getElementById('page');if(!host||document.getElementById(MODULE_ID))return;
    const s=Array.isArray(state.summary)?state.summary.find(x=>x.project_id===state.selected):null;
    if(!s)return;
    const e=evaluate(s);
    const anchor=[...host.querySelectorAll('.section')].find(el=>el.querySelector('.sectiontitle h2')?.textContent.trim()==='Informasi Proyek');
    if(!anchor)return;
    const wrap=document.createElement('section');wrap.id=MODULE_ID;wrap.className='section';
    const cashOut=(state.detail?.fin||[]).filter(x=>x.transaction_type==='KELUAR').reduce((t,x)=>t+Number(x.amount||0),0);
    wrap.innerHTML=`<div class="sectiontitle"><h2>Decision Engine</h2><span class="phe-pill ${e.level}">${e.status}</span></div><div class="card kpi"><div style="font-size:16px;font-weight:850">${esc(e.action)}</div><div class="note" style="margin-top:8px">${esc(e.driver)} Cash Out saat ini ${money(cashOut)}.</div></div>`;
    anchor.parentNode.insertBefore(wrap,anchor);
  }
  addStyle();
  const run=()=>{dashboardApply();detailApply()};
  const obs=new MutationObserver(run);obs.observe(document.body,{childList:true,subtree:true});
  setInterval(run,1000);
  run();
})();
