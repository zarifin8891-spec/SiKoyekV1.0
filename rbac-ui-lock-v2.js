/* SiKoyek RBAC UI lock V2 — keep unavailable features visible but disabled. */
(function(){
  'use strict';
  if(window.__SIKOYEK_RBAC_UI_LOCK_V2__) return;
  window.__SIKOYEK_RBAC_UI_LOCK_V2__=true;

  const norm=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const aliases={
    dashboard:['dashboard'],projects:['projects','project'],workspace:['workspace'],progress:['progress'],rap:['rap','rap_proyek'],keuangan:['keuangan','finance'],items:['item_pekerjaan','items','work_items'],users:['users','user_management','management_user'],master_data:['master_data','master','data_master']
  };
  const matchModule=(key,module)=>{const n=norm(module);return (aliases[key]||[]).some(a=>n===a||n.includes(a)||a.includes(n))};
  const hasView=(perms,key)=>perms.role==='admin'||perms.views?.[key]===true;
  const hasAction=(perms,key,action)=>perms.role==='admin'||perms.actions?.[key]?.[action]===true;

  function styleDisabled(el){
    if(el.classList.contains('rbac-ui-disabled')) return;
    el.classList.add('rbac-ui-disabled');
    el.setAttribute('aria-disabled','true');
    el.setAttribute('title','Tidak memiliki hak akses');
    el.style.setProperty('opacity','.48','important');
    el.style.setProperty('cursor','not-allowed','important');
    el.style.setProperty('pointer-events','none','important');
    if('disabled' in el)el.disabled=true;
  }

  function moduleFromText(el){
    const t=norm(el.textContent),h=String(el.getAttribute?.('href')||'').toLowerCase(),d=norm(el.getAttribute?.('data-module')||'');
    const s=t+' '+h+' '+d;
    if(s.includes('progress'))return'progress';
    if(s.includes('rap'))return'rap';
    if(s.includes('keuangan')||s.includes('finance'))return'keuangan';
    if(s.includes('workspace'))return'workspace';
    if(s.includes('item_pekerjaan')||s.includes('item-pekerjaan'))return'items';
    if(s.includes('daftar_user')||s.includes('user_management')||s.includes('management_user')||s.includes('user'))return'users';
    return'';
  }

  function topTitle(){return norm(document.querySelector('.top h1,.dashboard-title h1,.detailtitle h2')?.textContent||'')}

  function applyNested(perms){
    const nested=document.querySelectorAll('.tabs button,.tabs a,.project-tabs button,.project-tabs a,.project-detail-tabs button,.project-detail-tabs a,[role="tab"]');
    nested.forEach(el=>{const key=moduleFromText(el);if(key&&!hasView(perms,key))styleDisabled(el)});

    const title=topTitle();
    const onMaster=title.includes('master')||title.includes('data_master')||!!document.querySelector('#p6CatRows');
    const onProject=title.includes('daftar_proyek')||title.includes('projects');

    document.querySelectorAll('button,a').forEach(el=>{
      if(el.closest('.sidebar'))return;
      if(el.classList.contains('rbac-ui-disabled'))return;
      const t=norm(el.textContent);
      if(!t)return;

      if(/(^|_)(edit_rap|ubah_rap|rap_edit)($|_)/.test(t) || (t.includes('edit')&&t.includes('rap'))){
        if(!hasAction(perms,'rap','EDIT'))styleDisabled(el);
        return;
      }
      if(t==='rap' || t==='buka_rap'){
        if(!hasView(perms,'rap'))styleDisabled(el);
        return;
      }
      if(onMaster){
        if(t==='tambah'||t.includes('tambah_')){if(!hasAction(perms,'master_data','ADD'))styleDisabled(el);return}
        if(t==='edit'||t.includes('_edit')||t.startsWith('edit_')){if(!hasAction(perms,'master_data','EDIT'))styleDisabled(el);return}
        if(t==='hapus'||t.includes('hapus_')||t.startsWith('hapus_')){if(!hasAction(perms,'master_data','DELETE'))styleDisabled(el);return}
      }
      if(onProject){
        if(t==='tambah'||t.includes('tambah_')){if(!hasAction(perms,'projects','ADD'))styleDisabled(el);return}
        if(t==='edit'||t.includes('_edit')||t.startsWith('edit_')){if(!hasAction(perms,'projects','EDIT'))styleDisabled(el);return}
        if(t==='hapus'||t.includes('hapus_')||t.startsWith('hapus_')){if(!hasAction(perms,'projects','DELETE'))styleDisabled(el);return}
      }
    });
  }

  async function loadAndApply(){
    const client=window.SK?.sb||window.sb;
    if(!client?.auth||!client?.from)return;
    try{
      const {data:{user},error:ue}=await client.auth.getUser();
      if(ue||!user)return;
      const {data:profile,error:pe}=await client.from('profiles').select('is_active,role_id,roles(name)').eq('id',user.id).maybeSingle();
      if(pe||!profile?.is_active)return;
      const role=norm(profile.roles?.name);
      const perms={role,views:{},actions:{}};
      if(role!=='admin'){
        const {data:rps,error:re}=await client.from('role_permissions').select('permission_id').eq('role_id',profile.role_id);
        if(re)return;
        const ids=(rps||[]).map(x=>x.permission_id);
        if(ids.length){
          const {data:ps,error:qe}=await client.from('permissions').select('id,module,action').in('id',ids);
          if(qe)return;
          (ps||[]).forEach(p=>{
            const action=String(p.action||'').toUpperCase();
            Object.keys(aliases).forEach(k=>{if(matchModule(k,p.module)){if(action==='VIEW')perms.views[k]=true;else(perms.actions[k]??={})[action]=true}});
          });
        }
      }
      window.__SIKOYEK_RBAC_PERMISSIONS_V1__=perms;
      window.__SIKOYEK_RBAC_PERMISSIONS_V2__=perms;
      window.applyRBACUiLock?.();
      applyNested(perms);
    }catch(e){console.warn('RBAC UI LOCK:',e)}
  }

  window.applyRBACUiLock=()=>{
    const p=window.__SIKOYEK_RBAC_PERMISSIONS_V2__;
    if(p)applyNested(p);
  };
  const boot=()=>{loadAndApply();setTimeout(loadAndApply,180);setTimeout(loadAndApply,500);setTimeout(loadAndApply,1000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__rbacUiLockV2Timer);window.__rbacUiLockV2Timer=setTimeout(()=>{const p=window.__SIKOYEK_RBAC_PERMISSIONS_V2__;if(p)applyNested(p)},70)});
  obs.observe(document.body,{childList:true,subtree:true});
})();