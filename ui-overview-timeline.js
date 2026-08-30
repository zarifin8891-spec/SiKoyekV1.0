/* Overview-only project timeline and compact summary. */
(function(){
  const STYLE_ID='overview-timeline-style-v1';
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .overview-timeline{margin-top:14px;background:#fff;border:1px solid #e5eaf1;border-radius:15px;padding:14px 16px 13px;box-sizing:border-box}
      .overview-timeline-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
      .overview-timeline-title{font-size:16px;font-weight:700;color:#172033;margin:0}
      .overview-timeline-sub{font-size:10px;color:#687386;margin-top:3px}
      .overview-timeline-metrics{display:flex;gap:16px;flex-wrap:wrap}
      .overview-timeline-metric{min-width:92px}.overview-timeline-metric .k{font-size:10px;color:#687386}.overview-timeline-metric .v{font-size:18px;line-height:1.1;font-weight:750;color:#172033;margin-top:3px}.overview-timeline-metric .s{font-size:9px;color:#687386;margin-top:2px}
      .overview-timeline-track{position:relative;height:44px;margin-top:8px;padding:0 2px}
      .overview-timeline-line{position:absolute;left:0;right:0;top:21px;height:6px;border-radius:99px;background:#edf1f6;overflow:hidden}
      .overview-timeline-fill{height:100%;border-radius:99px;background:#245cff}
      .overview-timeline-marker{position:absolute;top:13px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#fff;border:4px solid #245cff;box-sizing:border-box;z-index:2}
      .overview-timeline-points{display:flex;justify-content:space-between;font-size:9px;color:#687386;margin-top:2px}.overview-timeline-points strong{color:#304059}
      .overview-timeline-state{font-size:10px;font-weight:650;margin-top:8px}.overview-timeline-state.overdue{color:#c73737}.overview-timeline-state.ontrack{color:#11875d}.overview-timeline-state.future{color:#a56a00}
      .overview-summary-compact .kpi{padding:13px 15px!important}
      .overview-summary-compact .kpi .label{font-size:10px!important}.overview-summary-compact .kpi .value{font-size:20px!important;margin-top:6px!important}
    `;document.head.appendChild(s)
  }
  function dayDiff(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000)}
  function fmt(d){return d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'})}
  function build(){
    const detail=window.state?.detail;
    if(!detail?.project||window.state?.detailTab!=='overview')return;
    const root=document.querySelector('#modal-page, .content');
    if(!root)return;
    root.querySelectorAll('.overview-timeline').forEach(x=>x.remove());
    const project=detail.project;
    if(!project.start_date||!project.end_date)return;
    const start=new Date(project.start_date+'T00:00:00');
    const end=new Date(project.end_date+'T00:00:00');
    const today=new Date();today.setHours(0,0,0,0);
    const duration=Math.max(0,dayDiff(start,end));
    const age=Math.max(0,dayDiff(start,today));
    const remaining=dayDiff(today,end);
    const elapsedPct=duration?Math.max(0,Math.min(100,age/duration*100)):0;
    const projectAge=Math.max(0,Math.min(duration,age));
    const left=Math.max(0,Math.min(100,elapsedPct));
    let stateText='Proyek berjalan sesuai kalender.';let stateClass='ontrack';let remainText=`Sisa ${Math.max(0,remaining)} hari`;
    if(today<start){stateText='Proyek belum dimulai.';stateClass='future';remainText=`Mulai ${Math.max(0,dayDiff(today,start))} hari lagi`;}
    else if(today>end){stateText=`Target selesai terlewati ${Math.abs(remaining)} hari.`;stateClass='overdue';remainText=`Terlambat ${Math.abs(remaining)} hari`;}
    else if(project.status==='SELESAI'){stateText='Proyek selesai.';stateClass='ontrack';remainText='Selesai';}
    const html=`<section class="overview-timeline">
      <div class="overview-timeline-head"><div><div class="overview-timeline-title">Timeline Proyek</div><div class="overview-timeline-sub">${fmt(start)} — ${fmt(end)} • Durasi ${duration} hari</div></div>
        <div class="overview-timeline-metrics"><div class="overview-timeline-metric"><div class="k">UMUR PROYEK</div><div class="v">${projectAge} hari</div><div class="s">sejak mulai</div></div><div class="overview-timeline-metric"><div class="k">SISA WAKTU</div><div class="v">${remainText}</div><div class="s">hari kalender</div></div></div>
      </div>
      <div class="overview-timeline-track"><div class="overview-timeline-line"><div class="overview-timeline-fill" style="width:${left}%"></div></div>${(today>=start&&today<=end)?`<div class="overview-timeline-marker" style="left:${left}%" title="Hari ini"></div>`:''}</div>
      <div class="overview-timeline-points"><span><strong>Mulai</strong><br>${fmt(start)}</span><span style="text-align:center"><strong>Hari ini</strong><br>${fmt(today)}</span><span style="text-align:right"><strong>Estimasi Selesai</strong><br>${fmt(end)}</span></div>
      <div class="overview-timeline-state ${stateClass}">${stateText}</div>
    </section>`;
    const summary=[...root.querySelectorAll('.twocol')].find(x=>/Progress/i.test(x.innerText)&&/Biaya/i.test(x.innerText));
    if(summary){summary.classList.add('overview-summary-compact');summary.insertAdjacentHTML('afterend',html)}
    else root.insertAdjacentHTML('beforeend',html);
  }
  function run(){addStyle();setTimeout(build,40)}
  const obs=new MutationObserver(run);obs.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
