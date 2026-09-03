/* SiKoyek RBAC VIEW — sidebar enforcement stage 1.1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_RBAC_NAV_V2__) return;
  window.__SIKOYEK_RBAC_NAV_V2__=true;

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
  function matches(key,module){
    const n=norm(module);
    return (aliases[key]||[]).some(a=>n===a||n.includes(a)||a.includes(n));
  }
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
  function pageKey(){
    const p=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    if(p==='index.html'||p==='') return 'dashboard';
    if(p==='workspace.html') return 'workspace';
    if(p==='progress.html') return 'progress';
    if(p==='rap.html') return 'rap';
    if(p==='keuangan.html') return 'keuangan';
    if(p==='item-pekerjaan.html') return 'items';
    return '';
  }
  function hideKey(key){
    document.querySelectorAll('.sidebar .nav a,.sidebar .nav button,.side button,.side a').forEach(el=>{
      if(itemKey(el)===key) el.style.display='none';
    });
  }
  function showAllowed(allowed){
    document.querySelectorAll('.sidebar .nav a,.sidebar .nav button,.side button,.side a').forEach(el=>{
      const key=itemKey(el); if(!key)return;
      el.style.display=allowed[key]?'':'none';
    });
  }
  async function apply(){
    if(!window.SK?.sb && !window.sb?.auth) return;
    const client=window.SK?.sb||window.sb;
    try{
      const {data:{user},error:ue}=await client.auth.getUser();
      if(ue||!user)return;
      const {data:profile,error:pe}=await client.from('profiles').select('is_active,role_id,roles(name)').eq('id',user.id).maybeSingle();
      if(pe||!profile?.is_active)return;
      const role=norm(profile?.roles?.name);
      if(role==='admin'){
        showAllowed(Object.keys(aliases).reduce((o,k)=>(o[k]=true,o),{}));
        return;
      }
      const {data:rps,error:re}=await client.from('role_permissions').select('permission_id').eq('role_id',profile.role_id);
      if(re) return;
      const ids=(rps||[]).map(x=>x.permission_id);
      const {data:perms,error:qe}=await client.from('permissions').select('id,module,action').in('id',ids);
      if(qe)return;
      const allowed={};Object.keys(aliases).forEach(k=>{allowed[k]=(perms||[]).some(p=>String(p.action).toUpperCase()==='VIEW'&&matches(k,p.module))});
      showAllowed(allowed);
      const current=pageKey();
      if(current && allowed[current]===false){
        const fallback=allowed.dashboard!==false?'index.html':allowed.workspace!==false?'workspace.html':allowed.progress!==false?'progress.html':allowed.rap!==false?'rap.html':allowed.keuangan!==false?'keuangan.html':allowed.items!==false?'item-pekerjaan.html':'';
        if(fallback && !location.pathname.toLowerCase().endsWith(fallback)) location.replace(fallback);
      }
    }catch(e){console.warn('RBAC VIEW:',e)}
  }
  window.applyRBACNav=apply;
  function boot(){setTimeout(apply,0);setTimeout(apply,150);setTimeout(apply,400)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();