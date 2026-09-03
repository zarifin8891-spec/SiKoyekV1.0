/* SiKoyek RBAC VIEW — sidebar visibility + nested module locks. */
(function(){
  'use strict';
  if(window.__SIKOYEK_RBAC_NAV_V3__) return;
  window.__SIKOYEK_RBAC_NAV_V3__=true;

  const aliases={
    dashboard:['dashboard'],
    workspace:['workspace'],
    progress:['progress'],
    rap:['rap','rap_proyek'],
    keuangan:['keuangan','finance'],
    items:['item_pekerjaan','items','work_items'],
    users:['users','user_management','management_user']
  };

  const norm=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  function matches(key,module){const n=norm(module);return (aliases[key]||[]).some(a=>n===a||n.includes(a)||a.includes(n));}
  function itemKey(el){
    const text=norm(el.textContent);
    const href=String(el.getAttribute?.('href')||'').toLowerCase();
    const onclick=norm(el.getAttribute?.('onclick')||'');
    if(text.includes('dashboard')||href.includes('index.html')) return 'dashboard';
    if(text==='workspace'||href.includes('workspace.html')||onclick.includes('workspace')) return 'workspace';
    if(text==='progress'||href.includes('progress.html')||onclick.includes('progress')) return 'progress';
    if(text==='rap'||href.includes('rap.html')||onclick.includes('rap')) return 'rap';
    if(text==='keuangan'||href.includes('keuangan.html')||onclick.includes('keuangan')) return 'keuangan';
    if(text.includes('item pekerjaan')||text.includes('item_pekerjaan')||href.includes('item-pekerjaan.html')||onclick.includes('item_pekerjaan')) return 'items';
    if(text.includes('daftar user')||text.includes('management user')||text.includes('user management')||href.includes('user')||onclick.includes('user')) return 'users';
    return '';
  }
  function showAllowed(allowed){
    document.querySelectorAll('.sidebar .nav a,.sidebar .nav button,.side button,.side a').forEach(el=>{
      const key=itemKey(el); if(!key)return;
      el.style.display=allowed[key]?'':'none';
    });
  }
  function moduleOf(el){
    const text=norm(el.textContent);
    const href=String(el.getAttribute?.('href')||'').toLowerCase();
    if(text==='progress'||href.includes('progress'))return 'progress';
    if(text==='rap'||href.includes('rap'))return 'rap';
    if(text==='keuangan'||href.includes('keuangan')||href.includes('finance'))return 'keuangan';
    if(text==='workspace'||href.includes('workspace'))return 'workspace';
    if(text.includes('item pekerjaan')||href.includes('item-pekerjaan'))return 'items';
    if(text.includes('daftar user')||text.includes('management user')||href.includes('user'))return 'users';
    return '';
  }
  function lockElement(el){
    if(el.dataset.rbacLocked==='1')return;
    el.dataset.rbacLocked='1';
    el.classList.add('rbac-ui-disabled');
    el.setAttribute('aria-disabled','true');
    el.setAttribute('title','Tidak memiliki hak akses');
    el.style.setProperty('opacity','.48','important');
    el.style.setProperty('cursor','not-allowed','important');
    el.style.setProperty('pointer-events','none','important');
    if('disabled' in el)el.disabled=true;
  }
  function lockNested(){
    const p=window.__SIKOYEK_RBAC_PERMISSIONS_V1__;
    if(!p)return;
    const can=key=>p.role==='admin'||p.views?.[key]===true;
    document.querySelectorAll('.tabs button,.tabs a,[role="tab"],.project-tabs button,.project-tabs a,.project-detail-tabs button,.project-detail-tabs a').forEach(el=>{
      const key=moduleOf(el); if(key&&!can(key))lockElement(el);
    });
  }
  async function apply(){
    if(!window.SK?.sb&&!window.sb?.auth)return;
    const client=window.SK?.sb||window.sb;
    try{
      const {data:{user},error:ue}=await client.auth.getUser();
      if(ue||!user)return;
      const {data:profile,error:pe}=await client.from('profiles').select('is_active,role_id,roles(name)').eq('id',user.id).maybeSingle();
      if(pe||!profile?.is_active)return;
      const role=norm(profile?.roles?.name);
      if(role==='admin'){
        const allowed=Object.keys(aliases).reduce((o,k)=>(o[k]=true,o),{});
        window.__SIKOYEK_RBAC_PERMISSIONS_V1__={role,views:allowed};
        showAllowed(allowed);
        lockNested();
        return;
      }
      const {data:rps,error:re}=await client.from('role_permissions').select('permission_id').eq('role_id',profile.role_id);
      if(re)return;
      const ids=(rps||[]).map(x=>x.permission_id);
      const {data:perms,error:qe}=await client.from('permissions').select('id,module,action').in('id',ids);
      if(qe)return;
      const allowed={};
      Object.keys(aliases).forEach(k=>{allowed[k]=(perms||[]).some(p=>String(p.action).toUpperCase()==='VIEW'&&matches(k,p.module));});
      window.__SIKOYEK_RBAC_PERMISSIONS_V1__={role,views:allowed};
      showAllowed(allowed);
      lockNested();
    }catch(e){console.warn('RBAC VIEW:',e)}
  }
  window.applyRBACNav=apply;
  window.applyRBACUiLock=lockNested;
  function boot(){setTimeout(apply,0);setTimeout(apply,150);setTimeout(apply,400);setTimeout(lockNested,650)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__rbacV3Timer);window.__rbacV3Timer=setTimeout(()=>{apply();lockNested()},80)});
  obs.observe(document.body,{childList:true,subtree:true});
})();