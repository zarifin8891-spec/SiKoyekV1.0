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
    compactKpis();organizeLowerPanels();requestPanelSync();
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{if(isDashboard()){const time=document.querySelector('.dashboard-userinfo .user-time');if(time)time.textContent=formatDateTime(new Date())}},30000);
  schedule();
})();
