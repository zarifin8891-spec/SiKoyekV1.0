/* Dashboard Layout V2 — presentation helper only. */
(function(){
  'use strict';

  function isDashboard(){
    const h=document.querySelector('.top h1');
    return !!h && h.textContent.trim().toLowerCase()==='dashboard';
  }

  function formatDateTime(date){
    return new Intl.DateTimeFormat('id-ID',{
      weekday:'short',day:'2-digit',month:'short',year:'numeric',
      hour:'2-digit',minute:'2-digit',hour12:false
    }).format(date).replace(',', ' •');
  }

  function apply(){
    const content=document.querySelector('.content');
    const top=document.querySelector('.top');
    if(!content||!top)return;

    if(!isDashboard()){
      content.classList.remove('dashboard-view');
      top.classList.remove('dashboard-top');
      top.querySelector('.dashboard-userinfo')?.remove();
      return;
    }

    content.classList.add('dashboard-view');
    top.classList.add('dashboard-top');

    const actions=top.querySelector('.actions');
    if(!actions)return;

    let info=actions.querySelector('.dashboard-userinfo');
    if(!info){
      info=document.createElement('div');
      info.className='dashboard-userinfo';
      info.innerHTML='<div><div class="user-main">Pengguna</div><div class="user-time"></div></div>';
      actions.insertBefore(info,actions.firstChild);
    }

    const userMain=info.querySelector('.user-main');
    const userTime=info.querySelector('.user-time');
    const client=window.__siKoyekSupabase;

    if(client?.auth?.getSession){
      client.auth.getSession().then(({data})=>{
        const identity=data?.session?.user?.user_metadata?.full_name || data?.session?.user?.email || 'Pengguna';
        if(userMain)userMain.textContent=identity;
      }).catch(()=>{});
    }

    if(userTime)userTime.textContent=formatDateTime(new Date());
  }

  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply()});
  }

  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{
    if(isDashboard()){
      const time=document.querySelector('.dashboard-userinfo .user-time');
      if(time)time.textContent=formatDateTime(new Date());
    }
  },30000);
  schedule();
})();
