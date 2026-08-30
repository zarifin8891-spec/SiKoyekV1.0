/* Overview-only timeline block. Isolated: no global observer, no edits to other tabs/layout. */
(function(){
  const STYLE_ID='overview-timeline-style-v3';
  const BLOCK_CLASS='overview-timeline-v3';

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .overview-timeline-v3{
        margin-top:12px;
        background:#fff;
        border:1px solid #e5eaf1;
        border-radius:15px;
        padding:13px 16px 12px;
        box-sizing:border-box;
      }
      .overview-timeline-v3 .ot-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:18px;
        margin-bottom:9px;
      }
      .overview-timeline-v3 .ot-title{font-size:16px;line-height:1.2;font-weight:700;color:#172033;margin:0}
      .overview-timeline-v3 .ot-sub{font-size:10px;line-height:1.35;color:#687386;margin-top:3px}
      .overview-timeline-v3 .ot-metrics{display:flex;gap:24px;flex-wrap:wrap;justify-content:flex-end}
      .overview-timeline-v3 .ot-metric{min-width:100px}
      .overview-timeline-v3 .ot-k{font-size:10px;line-height:1.2;color:#687386}
      .overview-timeline-v3 .ot-v{font-size:18px;line-height:1.1;font-weight:750;color:#172033;margin-top:3px}
      .overview-timeline-v3 .ot-s{font-size:9px;color:#687386;margin-top:2px}
      .overview-timeline-v3 .ot-track{position:relative;height:26px;margin-top:3px;padding:0 2px}
      .overview-timeline-v3 .ot-line{position:absolute;left:0;right:0;top:10px;height:6px;border-radius:99px;background:#edf1f6;overflow:hidden}
      .overview-timeline-v3 .ot-fill{height:100%;border-radius:99px;background:#245cff}
      .overview-timeline-v3 .ot-marker{position:absolute;top:4px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#fff;border:4px solid #245cff;box-sizing:border-box;z-index:2}
      .overview-timeline-v3 .ot-points{display:flex;justify-content:space-between;font-size:9px;line-height:1.35;color:#687386;margin-top:2px}
      .overview-timeline-v3 .ot-points strong{color:#304059}
      .overview-timeline-v3 .ot-state{font-size:10px;font-weight:650;margin-top:7px}
      .overview-timeline-v3 .ot-state.ontrack{color:#11875d}
      .overview-timeline-v3 .ot-state.overdue{color:#c73737}
      .overview-timeline-v3 .ot-state.future{color:#a56a00}
      @media (max-width:700px){
        .overview-timeline-v3 .ot-head{flex-direction:column}
        .overview-timeline-v3 .ot-metrics{justify-content:flex-start}
      }
    `;
    document.head.appendChild(s);
  }

  function dayDiff(a,b){
    return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate()) - Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000);
  }

  function fmt(d){
    return d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'});
  }

  function getProject(){
    return window.state?.detail?.project || null;
  }

  function isOverviewActive(){
    if(window.state?.detailTab==='overview') return true;
    const tabs=[...document.querySelectorAll('button,[role="tab"],.tab,.nav-tab')];
    return tabs.some(el=>{
      const text=(el.textContent||'').trim();
      return text==='Overview' && (el.classList.contains('active') || el.getAttribute('aria-selected')==='true');
    });
  }

  function getRoot(){
    return document.querySelector('#page')
      || document.querySelector('#modal-page')
      || document.querySelector('#project-detail')
      || document.querySelector('.project-detail');
  }

  function getSummaryAnchor(root){
    if(!root) return null;
    const headings=[...root.querySelectorAll('h1,h2,h3,h4')];
    const heading=headings.find(el=>/Project Summary/i.test((el.textContent||'').trim()));
    if(!heading) return null;
    return heading.closest('section,article,.card') || heading.parentElement?.parentElement || heading.parentElement || null;
  }

  function removeOnlyOwnBlock(root){
    if(root) root.querySelectorAll('.'+BLOCK_CLASS).forEach(el=>el.remove());
  }

  function build(){
    addStyle();
    const root=getRoot();
    if(!root || !isOverviewActive()) return;

    const project=getProject();
    if(!project?.start_date || !project?.end_date) return;

    removeOnlyOwnBlock(root);

    const start=new Date(project.start_date+'T00:00:00');
    const end=new Date(project.end_date+'T00:00:00');
    const today=new Date();
    today.setHours(0,0,0,0);

    const duration=Math.max(0,dayDiff(start,end));
    const elapsed=Math.max(0,Math.min(duration,dayDiff(start,today)));
    const remaining=dayDiff(today,end);
    const pct=duration?Math.max(0,Math.min(100,(elapsed/duration)*100)):0;

    let stateClass='ontrack';
    let stateText='Proyek berjalan sesuai kalender.';
    let remainText='Sisa '+Math.max(0,remaining)+' hari';

    if(today<start){
      stateClass='future';
      stateText='Proyek belum dimulai.';
      remainText='Mulai '+dayDiff(today,start)+' hari lagi';
    }else if(today>end){
      stateClass='overdue';
      stateText='Target selesai terlewati '+Math.abs(remaining)+' hari.';
      remainText='Terlambat '+Math.abs(remaining)+' hari';
    }else if(project.status==='SELESAI'){
      stateText='Proyek selesai.';
      remainText='Selesai';
    }

    const html=`
      <section class="${BLOCK_CLASS}">
        <div class="ot-head">
          <div>
            <div class="ot-title">Timeline Proyek</div>
            <div class="ot-sub">${fmt(start)} — ${fmt(end)} • Durasi ${duration} hari</div>
          </div>
          <div class="ot-metrics">
            <div class="ot-metric">
              <div class="ot-k">UMUR PROYEK</div>
              <div class="ot-v">${elapsed} hari</div>
              <div class="ot-s">sejak mulai</div>
            </div>
            <div class="ot-metric">
              <div class="ot-k">SISA WAKTU</div>
              <div class="ot-v">${remainText}</div>
              <div class="ot-s">hari kalender</div>
            </div>
          </div>
        </div>
        <div class="ot-track">
          <div class="ot-line"><div class="ot-fill" style="width:${pct}%"></div></div>
          ${(today>=start && today<=end)?`<div class="ot-marker" style="left:${pct}%" title="Hari ini"></div>`:''}
        </div>
        <div class="ot-points">
          <span><strong>Mulai</strong><br>${fmt(start)}</span>
          <span style="text-align:center"><strong>Hari ini</strong><br>${fmt(today)}</span>
          <span style="text-align:right"><strong>Estimasi Selesai</strong><br>${fmt(end)}</span>
        </div>
        <div class="ot-state ${stateClass}">${stateText}</div>
      </section>`;

    const anchor=getSummaryAnchor(root);
    if(anchor) anchor.insertAdjacentHTML('afterend',html);
    else root.insertAdjacentHTML('beforeend',html);
  }

  function boot(){
    addStyle();
    build();
    document.addEventListener('click',function(ev){
      const target=ev.target?.closest?.('button,[role="tab"],.tab,.nav-tab');
      if(!target) return;
      setTimeout(build,80);
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
