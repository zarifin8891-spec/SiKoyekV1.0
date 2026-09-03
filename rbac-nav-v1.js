/* SiKoyek RBAC VIEW — sidebar enforcement only (stage 1). */
(function(){
  'use strict';
  if(window.__SIKOYEK_RBAC_NAV_V1__) return;
  window.__SIKOYEK_RBAC_NAV_V1__=true;

  const aliases={
    dashboard:['dashboard'],
    workspace:['workspace'],
    progress:['progress'],
    rap:['rap','rap_proyek'],
    keuangan:['keuangan','finance'],
    items:['item_pekerjaan','items','work_items'],
    users:['users','user_management','management_user']
  };

  function norm(v){return String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
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
  function matches(key, module){
    const n=norm(module); return (aliases[key]||[]).some(a=>n===a||n.includes(a)||a.includes(n));
  }
  function hideShellItem(key){
    document.querySelectorAll('.sidebar .nav a').forEach(a=>{
      const href=(a.getAttribute('href')||'').toLowerCase();
      const text=norm(a.textContent);
      const hit=(key==='dashboard'&&href.endsWith('index.html'))||
        (key==='workspace'&&(href.includes('workspace.html')||text==='workspace'))||
        (key==='progress'&&(href.includes('progress.html')||text==='progress'))||
        (key==='rap'&&(href.includes('rap.html')||text==='rap'))||
        (key==='keuangan'&&(href.includes('keuangan.html')||text==='keuangan'))||
        (key==='items'&&(href.includes('item-pekerjaan.html')||text.includes('item_pekerjaan')))||
        (key==='users'&&text.includes('user'));
      if(hit) a.style.display='none';
    });
    document.querySelectorAll('.side button').forEach(b=>{
      const text=norm(b.textContent), oc=norm(b.getAttribute('onclick')||'');
      const hit=(key==='dashboard'&&(text==='dashboard'||oc.includes('index_html')))||
        (key==='workspace'&&text==='workspace')||
        (key==='progress'&&(text==='progress'||oc.includes('progress_html')))||
        (key==='rap'&&(text==='rap'||oc.includes('rap_html')))||
        (key==='keuangan'&&(text==='keuangan'||oc.includes('keuangan_html')))||
        (key==='items'&&text.includes('item_pekerjaan'))||
        (key==='users'&&text.includes('user'));
      if(hit) b.style.display='none';
    });
  }
  async function apply(){
    if(!window.SK?.sb) return;
    try{
      const {data:{user},error:ue}=await SK.sb.auth.getUser();
      if(ue||!user)return;
      const {data:profile,error:pe}=await SK.sb.from('profiles').select('is_active,role_id,roles(name)').eq('id',user.id).maybeSingle();
      if(pe||!profile?.is_active)return;
      const role=norm(profile?.roles?.name);
      const navKeys=Object.keys(aliases);
      if(role==='admin') return; // ADMIN sees everything.
      const {data:rps,error:re}=await SK.sb.from('role_permissions').select('permission_id').eq('role_id',profile.role_id);
      if(re)return;
      const ids=(rps||[]).map(x=>x.permission_id);
      const {data:perms,error:qe}=await SK.sb.from('permissions').select('id,module,action').in('id',ids);
      if(qe)return;
      const allowed={}; navKeys.forEach(k=>allowed[k]=(perms||[]).some(p=>String(p.action).toUpperCase()==='VIEW'&&matches(k,p.module)));
      navKeys.forEach(k=>{if(!allowed[k]) hideShellItem(k)});
      const current=pageKey();
      if(current && allowed[current]===false){
        const fallback=allowed.dashboard!==false?'index.html':allowed.workspace!==false?'workspace.html':'';
        if(fallback && !location.pathname.toLowerCase().endsWith(fallback)) location.replace(fallback);
      }
    }catch(e){console.warn('RBAC VIEW:',e)}
  }
  function boot(){setTimeout(apply,0);setTimeout(apply,180)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
