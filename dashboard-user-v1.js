/* SiKoyek Dashboard User V3 — resolve the actual active Supabase user. */
(function(){
  'use strict';
  if(window.__SIKOYEK_DASHBOARD_USER_V3__) return;
  window.__SIKOYEK_DASHBOARD_USER_V3__=true;
  let lastUserId='';
  let busy=false;

  async function resolveUser(){
    const client=(typeof sb!=='undefined'&&sb)||window.__siKoyekSupabase||window.sb;
    const actual=document.querySelector('.dashboard-user');
    const info=document.querySelector('.dashboard-userinfo');
    if(!client?.auth?.getSession || (!actual&&!info) || busy) return;
    busy=true;
    try{
      const {data,error}=await client.auth.getSession();
      if(error || !data?.session?.user) return;
      const user=data.session.user;
      const target=actual||info;
      if(user.id===lastUserId && target.dataset.profileResolved==='1') return;
      lastUserId=user.id;

      let fullName=user.user_metadata?.full_name||user.email||'Pengguna';
      let roleName='';
      const profileResult=await client.from('profiles').select('full_name,role_id').eq('id',user.id).maybeSingle();
      if(!profileResult.error && profileResult.data){
        if(profileResult.data.full_name) fullName=profileResult.data.full_name;
        if(profileResult.data.role_id){
          const roleResult=await client.from('roles').select('name').eq('id',profileResult.data.role_id).maybeSingle();
          if(!roleResult.error && roleResult.data?.name) roleName=roleResult.data.name;
        }
      }

      if(actual){
        const main=actual.querySelector('strong');
        const sub=actual.querySelector('span');
        if(main) main.textContent=fullName;
        if(sub) sub.textContent=roleName?`Role: ${roleName}`:'Pengguna';
        actual.dataset.profileResolved='1';
      }
      if(info){
        const main=info.querySelector('.user-main');
        if(main) main.textContent=fullName;
        let role=info.querySelector('.user-role');
        if(!role){
          role=document.createElement('div');
          role.className='user-role';
          info.querySelector('.user-copy')?.appendChild(role);
        }
        role.textContent=roleName?`Role: ${roleName}`:'';
        role.style.cssText='font-size:10px;line-height:1.2;color:rgba(255,255,255,.82);margin-top:2px;font-weight:400';
        info.dataset.profileResolved='1';
      }
    }catch(e){
      console.warn('Dashboard user resolver:',e);
    }finally{busy=false;}
  }

  function boot(){
    resolveUser();
    setInterval(resolveUser,1000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));
  else setTimeout(boot,300);
})();
