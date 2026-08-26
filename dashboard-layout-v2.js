/* Dashboard Layout V2 — presentation helper only. */
(function(){
  'use strict';
  function isDashboard(){const h=document.querySelector('.top h1');return !!h&&h.textContent.trim().toLowerCase()==='dashboard'}
  function formatDateTime(date){return new Intl.DateTimeFormat('id-ID',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(date).replace(',', ' •')}
  function movePeriodIntoHeader(top){const period=document.querySelector('.dashboard-view .periodbar');if(!period||!top)return;if(period.parentElement!==top)top.appendChild(period)}
  function stabilizePeriodPreset(root){
    const preset=root?.querySelector('#periodPreset');
    if(!preset)return;
    const key='sikoyek.dashboard.periodPreset';
    if(!preset.dataset.stableBound){
      preset.dataset.stableBound='1';
      preset.addEventListener('change',()=>{
        if(preset.value)localStorage.setItem(key,preset.value);else localStorage.removeItem(key);
      });
    }
    const saved=localStorage.getItem(key);
    if(saved && [...preset.options].some(o=>o.value===saved) && preset.value!==saved){
      preset.value=saved;
    }else if(preset.value){
      localStorage.setItem(key,preset.value);
    }
  }
  function normalizeDashboardPercentages(root){
    if(!root)return;
    root.querySelectorAll('.kpi .value,.table td,.big').forEach(el=>{
      const text=(el.textContent||'').trim();
      const m=text.match(/^(-?\d+(?:\.\d+)?)%$/);
      if(!m)return;
      const v=Number(m[1]);
      if(Math.abs(v)>0&&Math.abs(v)<=1)el.textContent=(v*100).toFixed(2)+'%';
    });
  }
  function compactKpis(){const kpiStrip=document.querySelector('.dashboard-view .cards');const health=document.querySelector('.dashboard-view .health');if(!kpiStrip||!health)return;kpiStrip.classList.add('dashboard-kpi-strip');[...health.children].forEach(box=>kpiStrip.appendChild(box));health.closest('.section')?.remove()}
  function decorateKpis(){
    const strip=document.querySelector('.dashboard-view .dashboard-kpi-strip');if(!strip)return;
    const icons={
      'TOTAL PROYEK':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18v13H3z"/><path d="M8 7V4h8v3"/></svg>',
      'NILAI KONTRAK':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4"/><path d="M8 12h8M8 16h6"/></svg>',
      'TOTAL RAP':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h4"/><path d="M8 12h8M8 16h5"/></svg>',
      'TOTAL REALISASI':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7"/></svg>',
      'AVG PROGRESS':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 10 12l4 3 6-8"/><path d="M16 7h4v4"/></svg>'
    };
    strip.querySelectorAll('.kpi').forEach(k=>{if(k.querySelector('.kpi-icon'))return;const label=(k.querySelector('.label')?.textContent||'').trim();const icon=icons[label];if(!icon)return;const i=document.createElement('span');i.className='kpi-icon';i.innerHTML=icon;k.insertBefore(i,k.firstChild);k.classList.add('reference-kpi')});
  }
  function organizeLowerPanels(){const dashboard=document.querySelector('.dashboard-view');if(!dashboard)return;const health=document.getElementById('health-engine-v1-card'),decision=document.getElementById('decision-engine-v1-card');if(!health&&!decision)return;let grid=dashboard.querySelector('.dashboard-lower-grid');if(!grid){grid=document.createElement('div');grid.className='dashboard-lower-grid';const anchor=health||decision;anchor.parentNode.insertBefore(grid,anchor)}if(health&&health.parentNode!==grid)grid.appendChild(health);if(decision&&decision.parentNode!==grid)grid.appendChild(decision);grid.style.gridTemplateColumns='minmax(0,0.94fr) minmax(0,1.06fr)';if(health)health.querySelectorAll('th:nth-child(4),td:nth-child(4)').forEach(x=>{x.style.width='92px';x.style.maxWidth='92px';x.style.whiteSpace='normal';x.style.lineHeight='1.1'})}
  function ensureMasterDataNav(){if(!isDashboard())return;const nav=document.querySelector('.sidebar .nav');if(!nav||nav.querySelector('[data-master-data-nav]'))return;const b=document.createElement('button');b.type='button';b.dataset.masterDataNav='1';b.textContent='Master Data';b.onclick=()=>{if(typeof window.openMasterData==='function'){window.openMasterData();return}const existing=[...document.scripts].find(s=>(s.src||'').includes('master-data-v1.js'));if(existing){setTimeout(()=>window.openMasterData?.(),150);return}const s=document.createElement('script');s.src='./master-data-v1.js?v=stable-nav';s.onload=()=>window.openMasterData?.();document.body.appendChild(s)};nav.appendChild(b)}
  function injectReferenceStyles(){
    if(document.getElementById('dashboard-reference-top-styles'))return;
    const s=document.createElement('style');s.id='dashboard-reference-top-styles';s.textContent=`
      .dashboard-view .top.dashboard-top{margin:0 0 14px!important;padding:18px 22px 16px!important;min-height:178px!important;border-radius:16px!important;background:linear-gradient(135deg,#0d294a 0%,#123b62 58%,#17657a 100%)!important;color:#fff!important;box-shadow:0 10px 26px rgba(10,38,68,.16)!important;display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;row-gap:8px!important}
      .dashboard-view .top.dashboard-top h1{font-size:28px!important;line-height:1.08!important;color:#fff!important;margin:0!important}
      .dashboard-view .top.dashboard-top p{font-size:12px!important;line-height:1.2!important;color:rgba(255,255,255,.82)!important;margin:4px 0 0!important}
      .dashboard-view .top.dashboard-top .actions{margin-left:auto!important;gap:7px!important;align-items:center!important}
      .dashboard-view .top.dashboard-top .actions .btn.primary,.dashboard-view .top.dashboard-top .actions .btn.ghost{height:40px!important;padding:8px 13px!important;font-size:14px!important;font-weight:750!important;border-radius:9px!important;white-space:nowrap!important}
      .dashboard-view .top.dashboard-top .actions .btn.primary{background:#0d294a!important;color:#fff!important;border-color:#0d294a!important}
      .dashboard-view .top.dashboard-top .actions .btn.ghost{background:#fff!important;color:#0d294a!important;border-color:#fff!important}
      .dashboard-userinfo{height:40px!important;padding:5px 10px!important;border-radius:9px!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.18)!important;display:flex!important;align-items:center!important;gap:7px!important}
      .dashboard-userinfo::before{content:'◯';font-size:17px;line-height:1;color:#fff;opacity:.95}
      .dashboard-userinfo .user-main{font-size:10px!important;font-weight:750!important}.dashboard-userinfo .user-time{font-size:8px!important}
      .dashboard-view .top.dashboard-top>.periodbar{order:3!important;flex:1 1 100%!important;width:100%!important;display:flex!important;align-items:center!important;gap:8px!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important}
      .dashboard-view .periodrow{gap:8px!important;align-items:flex-end!important;display:flex!important;flex-wrap:nowrap!important;min-width:0!important}
      .dashboard-view .periodrow .field:first-child{width:205px!important;flex:0 0 205px!important}
      .dashboard-view .periodrow .field:nth-child(2),.dashboard-view .periodrow .field:nth-child(3){width:175px!important;flex:0 0 175px!important}
      .dashboard-view .periodrow .field label{font-size:10px!important;color:rgba(255,255,255,.9)!important;margin-bottom:4px!important}
      .dashboard-view .periodrow .field input,.dashboard-view .periodrow .field select{height:44px!important;padding:8px 12px!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.30)!important;color:#fff!important;font-size:14px!important;border-radius:10px!important;min-width:0!important}
      .dashboard-view .periodrow .btn{height:44px!important;padding:8px 14px!important;background:#fff!important;color:#0d294a!important;border:1px solid #fff!important;font-size:14px!important;font-weight:750!important;border-radius:10px!important;white-space:nowrap!important}
      .dashboard-view .periodnote{font-size:10px!important;line-height:1.3!important;color:rgba(255,255,255,.82)!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin:0!important}
      .dashboard-view .cards.dashboard-kpi-strip{grid-template-columns:1fr 1.18fr 1.18fr 1.18fr 1.18fr .88fr .88fr .88fr!important;gap:9px!important;margin-top:8px!important}
      .dashboard-view .dashboard-kpi-strip .kpi,.dashboard-view .dashboard-kpi-strip .box{height:88px!important;min-height:88px!important;padding:12px 12px!important;border-radius:13px!important;min-width:0!important;overflow:hidden!important}
      .dashboard-view .dashboard-kpi-strip .kpi{position:relative!important;padding-left:70px!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
      .dashboard-view .dashboard-kpi-strip .kpi .kpi-icon{position:absolute!important;left:13px!important;top:50%!important;transform:translateY(-50%)!important;width:40px!important;height:40px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:#eef5ff!important}
      .dashboard-view .dashboard-kpi-strip .kpi:nth-child(2) .kpi-icon{background:#eaf9f2}.dashboard-view .dashboard-kpi-strip .kpi:nth-child(3) .kpi-icon{background:#f1edff}.dashboard-view .dashboard-kpi-strip .kpi:nth-child(4) .kpi-icon{background:#fff3df}.dashboard-view .dashboard-kpi-strip .kpi:nth-child(5) .kpi-icon{background:#eef5ff}
      .dashboard-view .dashboard-kpi-strip .kpi-icon svg{width:21px;height:21px;fill:none;stroke:#1676d2;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.dashboard-view .dashboard-kpi-strip .kpi:nth-child(2) .kpi-icon svg{stroke:#13a56f}.dashboard-view .dashboard-kpi-strip .kpi:nth-child(3) .kpi-icon svg{stroke:#7555e8}.dashboard-view .dashboard-kpi-strip .kpi:nth-child(4) .kpi-icon svg{stroke:#ef9a17}.dashboard-view .dashboard-kpi-strip .kpi:nth-child(5) .kpi-icon svg{stroke:#4d8fe8}
      .dashboard-view .dashboard-kpi-strip .kpi .label{font-size:9px!important;line-height:1.1!important;font-weight:700!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.dashboard-view .dashboard-kpi-strip .kpi .value{font-size:18px!important;line-height:1.05!important;margin-top:6px!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .dashboard-view .dashboard-kpi-strip .box.green{display:flex!important}.dashboard-view .dashboard-kpi-strip .box{justify-content:center!important;text-align:left!important}.dashboard-view .dashboard-kpi-strip .box .big{font-size:22px!important;line-height:1!important;margin-bottom:5px!important;font-weight:800!important}.dashboard-view .dashboard-kpi-strip .box>div:last-child{font-size:10px!important;line-height:1.1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      @media(max-width:1100px){.dashboard-view .cards.dashboard-kpi-strip{grid-template-columns:repeat(4,minmax(0,1fr))!important}.dashboard-view .dashboard-kpi-strip .kpi{padding-left:60px!important}.dashboard-view .dashboard-kpi-strip .kpi .kpi-icon{left:10px!important;width:36px!important;height:36px!important}}
      @media(max-width:780px){.dashboard-view .top.dashboard-top{min-height:auto!important;padding:15px!important}.dashboard-view .cards.dashboard-kpi-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important}.dashboard-view .top.dashboard-top .actions{width:auto!important}.dashboard-view .periodrow{flex-wrap:wrap!important}.dashboard-view .periodrow .field:first-child,.dashboard-view .periodrow .field:nth-child(2),.dashboard-view .periodrow .field:nth-child(3){width:auto!important;flex:1 1 150px!important}}
    `;document.head.appendChild(s)
  }
  function compactHeaderTypography(top){const h1=top.querySelector('h1'),p=top.querySelector('p');if(h1)h1.style.cssText+=';font-size:28px!important;line-height:1.08!important';if(p)p.style.cssText+=';font-size:12px!important;line-height:1.2!important';top.querySelectorAll('.periodrow .field label').forEach(x=>x.style.cssText+=';font-size:10px!important');top.querySelectorAll('.periodrow input,.periodrow select,.periodrow .btn').forEach(x=>x.style.cssText+=';font-size:14px!important');top.querySelectorAll('.periodnote').forEach(x=>x.style.cssText+=';font-size:10px!important');top.querySelectorAll('.dashboard-userinfo .user-main').forEach(x=>x.style.cssText+=';font-size:10px!important');top.querySelectorAll('.dashboard-userinfo .user-time').forEach(x=>x.style.cssText+=';font-size:8px!important')}
  function requestPanelSync(){if(!isDashboard())return;const request=()=>window.dispatchEvent(new CustomEvent('sikoyek:dashboard-panel-request'));request();setTimeout(request,400);setTimeout(request,1200)}
  function apply(){const content=document.querySelector('.content');const top=document.querySelector('.top');if(!content||!top)return;if(!isDashboard()){content.classList.remove('dashboard-view');top.classList.remove('dashboard-top');top.querySelector('.dashboard-userinfo')?.remove();return}content.classList.add('dashboard-view');top.classList.add('dashboard-top');injectReferenceStyles();movePeriodIntoHeader(top);stabilizePeriodPreset(content);const actions=top.querySelector('.actions');if(!actions)return;let info=actions.querySelector('.dashboard-userinfo');if(!info){info=document.createElement('div');info.className='dashboard-userinfo';info.innerHTML='<span class="user-copy"><div class="user-main">Pengguna</div><div class="user-time"></div></span>';actions.insertBefore(info,actions.firstChild)}const userMain=info.querySelector('.user-main'),userTime=info.querySelector('.user-time'),client=window.__siKoyekSupabase;if(client?.auth?.getSession){client.auth.getSession().then(({data})=>{const identity=data?.session?.user?.user_metadata?.full_name||data?.session?.user?.email||'Pengguna';if(userMain)userMain.textContent=identity}).catch(()=>{})}if(userTime)userTime.textContent=formatDateTime(new Date());compactHeaderTypography(top);compactKpis();decorateKpis();normalizeDashboardPercentages(content);organizeLowerPanels();ensureMasterDataNav();requestPanelSync()}
  let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});setInterval(()=>{if(isDashboard()){const time=document.querySelector('.dashboard-userinfo .user-time');if(time)time.textContent=formatDateTime(new Date())}},30000);schedule();
})();