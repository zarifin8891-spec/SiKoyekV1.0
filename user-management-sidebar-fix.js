(function(){
  if(window.__SIKOYEK_USER_SIDEBAR_FIX_V3__) return;
  window.__SIKOYEK_USER_SIDEBAR_FIX_V3__=true;
  async function canViewUsers(){
    try{
      const client=window.SK?.sb||window.sb;
      if(!client?.auth)return false;
      const {data:{user}}=await client.auth.getUser();
      if(!user)return false;
      const {data:profile}=await client.from('profiles').select('is_active,role_id,roles(name)').eq('id',user.id).maybeSingle();
      if(!profile?.is_active)return false;
      if(String(profile?.roles?.name||'').trim().toUpperCase()==='ADMIN')return true;
      if(!profile.role_id)return false;
      const {data:rps}=await client.from('role_permissions').select('permission_id').eq('role_id',profile.role_id);
      const ids=(rps||[]).map(x=>x.permission_id).filter(Boolean);
      if(!ids.length)return false;
      const {data:perms}=await client.from('permissions').select('id,module,action').in('id',ids);
      return (perms||[]).some(p=>String(p.module||'').trim().toUpperCase()==='USERS'&&String(p.action||'').trim().toUpperCase()==='VIEW');
    }catch(e){return false}
  }
  async function ensure(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav || typeof window.openUserManagement!=='function') return;
    const b=nav.querySelector('[data-users-nav]');
    const allowed=await canViewUsers();
    if(!allowed){if(b)b.remove();return}
    if(b)return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.dataset.usersNav='1';
    btn.textContent='Daftar User';
    btn.onclick=window.openUserManagement;
    nav.appendChild(btn);
    window.applyRBACNav?.();
  }
  function loadResetModule(){
    if(document.getElementById('user-management-reset-v1-script')) return;
    const s=document.createElement('script');
    s.id='user-management-reset-v1-script';
    s.src='./user-management-reset-v1.js?v=1';
    s.defer=true;
    document.body.appendChild(s);
  }
  const boot=()=>{ensure();loadResetModule(); if(!window.__SIKOYEK_USER_SIDEBAR_OBS_V3__){
    window.__SIKOYEK_USER_SIDEBAR_OBS_V3__=new MutationObserver(()=>setTimeout(ensure,50));
    window.__SIKOYEK_USER_SIDEBAR_OBS_V3__.observe(document.body,{childList:true,subtree:true});
  }};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setTimeout(ensure,100);
  setTimeout(ensure,400);
})();
