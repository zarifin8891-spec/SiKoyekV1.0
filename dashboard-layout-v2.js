/* Dashboard Layout V2 — presentation helper only. */
(function(){
  'use strict';
  function isDashboard(){const h=document.querySelector('.top h1');return !!h&&h.textContent.trim().toLowerCase()==='dashboard'}
  function formatDateTime(date){return new Intl.DateTimeFormat('id-ID',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(date).replace(',', ' •')}
  function movePeriodIntoHeader(top){
    const period=document.querySelector('.dashboard-view .periodbar');
    if(!period||!top)return;
    if(period.parentElement!==top)top.appendChild(period);
  }
  function compactKpis(){
    const kpiStrip=document.querySelector('.dashboard-view .cards');
    const health=document.querySelector('.dashboard-view .health');
    if(!kpiStrip||!health)return;
    kpiStrip.classList.add('dashboard-kpi-strip');
    [...health.children].forEach(box=>kpiStrip.appendChild(box));
    health.closest('.section')?.remove();
  }
  function organizeLowerPanels(){
    const dashboard=document.querySelector('.dashboard-view');if(!dashboard)return;
    const health=document.getElementById('health-engine-v1-card');
    const decision=document.getElementById('decision-engine-v1-card');
    if(!health&&!decision)return;
    let grid=dashboard.querySelector('.dashboard-lower-grid');
    if(!grid){grid=document.createElement('div');grid.className='dashboard-lower-grid';const anchor=health||decision;anchor.parentNode.insertBefore(grid,anchor)}
    if(health&&health.parentNode!==grid)grid.appendChild(health);
    if(decision&&decision.parentNode!==grid)grid.appendChild(decision);
    grid.style.gridTemplateColumns='minmax(0,0.94fr) minmax(0,1.06fr)';
    if(health){health.querySelectorAll('th:nth-child(4),td:nth-child(4)').forEach(x=>{x.style.width='92px';x.style.maxWidth='92px';x.style.whiteSpace='normal';x.style.lineHeight='1.1'})}
  }
  function ensureMasterDataNav(){
    if(!isDashboard())return;
    const nav=document.querySelector('.sidebar .nav');
    if(!nav||nav.querySelector('[data-master-data-nav]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.masterDataNav='1';b.textContent='Master Data';
    b.onclick=()=>{
      if(typeof window.openMasterData==='function'){window.openMasterData();return}
      const existing=[...document.scripts].find(s=>(s.src||'').includes('master-data-v1.js'));
      if(existing){setTimeout(()=>window.openMasterData?.(),150);return}
      const s=document.createElement('script');s.src='./master-data-v1.js?v=stable-nav';s.onload=()=>window.openMasterData?.();document.body.appendChild(s);
    };
    nav.appendChild(b);
  }
  function compactHeaderTypography(top){
    const h1=top.querySelector('h1'),p=top.querySelector('p');
    if(h1)h1.style.cssText+=';font-size:21px!important;line-height:1.08!important';
    if(p)p.style.cssText+=';font-size:11px!important;line-height:1.2!important';
    top.querySelectorAll('.periodrow .field label').forEach(x=>x.style.cssText+=';font-size:9px!important');
    top.querySelectorAll('.periodrow input,.periodrow select,.periodrow .btn').forEach(x=>x.style.cssText+=';font-size:13px!important');
    top.querySelectorAll('.periodnote').forEach(x=>x.style.cssText+=';font-size:9px!important');
    top.querySelectorAll('.dashboard-userinfo .user-main').forEach(x=>x.style.cssText+=';font-size:10px!important');
    top.querySelectorAll('.dashboard-userinfo .user-time').forEach(x=>x.style.cssText+=';font-size:8px!important');
  }
  function requestPanelSync(){
    if(!isDashboard())return;
    const request=()=>window.dispatchEvent(new CustomEvent('sikoyek:dashboard-panel-request'));
    request();setTimeout(request,400);setTimeout(request,1200);
  }
  function apply(){
    const content=document.querySelector('.content');const top=document.querySelector('.top');
    if(!content||!top)return;
    if(!isDashboard()){
      content.classList.remove('dashboard-view');top.classList.remove('dashboard-top');top.querySelector('.dashboard-userinfo')?.remove();return;
    }
    content.classList.add('dashboard-view');top.classList.add('dashboard-top');
    movePeriodIntoHeader(top);
    const actions=top.querySelector('.actions');if(!actions)return;
    let info=actions.querySelector('.dashboard-userinfo');
    if(!info){info=document.createElement('div');info.className='dashboard-userinfo';info.innerHTML='<div><div class="user-main">Pengguna</div><div class="user-time"></div></div>';actions.insertBefore(info,actions.firstChild)}
    const userMain=info.querySelector('.user-main'),userTime=info.querySelector('.user-time'),client=window.__siKoyekSupabase;
    if(client?.auth?.getSession){client.auth.getSession().then(({data})=>{const identity=data?.session?.user?.user_metadata?.full_name||data?.session?.user?.email||'Pengguna';if(userMain)userMain.textContent=identity}).catch(()=>{})}
    if(userTime)userTime.textContent=formatDateTime(new Date());
    compactHeaderTypography(top);compactKpis();organizeLowerPanels();ensureMasterDataNav();requestPanelSync();
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{if(isDashboard()){const time=document.querySelector('.dashboard-userinfo .user-time');if(time)time.textContent=formatDateTime(new Date())}},30000);
  schedule();
})();
