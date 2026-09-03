/* SiKoyek RBAC UI lock — disable nested module tabs/buttons without hiding them. */
(function(){
  'use strict';
  if(window.__SIKOYEK_RBAC_UI_LOCK_V1__) return;
  window.__SIKOYEK_RBAC_UI_LOCK_V1__=true;

  const aliases={
    progress:['progress'],
    rap:['rap','rap_proyek'],
    keuangan:['keuangan','finance'],
    workspace:['workspace'],
    items:['item_pekerjaan','items','work_items'],
    users:['users','user_management','management_user'],
    projects:['projects'],
    dashboard:['dashboard']
  };
  const norm=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const match=(key,label)=>{const n=norm(label);return (aliases[key]||[]).some(a=>n===a||n.includes(a)||a.includes(n))};
  const moduleOf=el=>{const t=norm(el.textContent), href=String(el.getAttribute?.('href')||'').toLowerCase();
    if(t==='progress'||href.includes('progress'))return'progress';
    if(t==='rap'||href.includes('rap'))return'rap';
    if(t==='keuangan'||href.includes('keuangan')||href.includes('finance'))return'keuangan';
    if(t==='workspace'||href.includes('workspace'))return'workspace';
    if(t.includes('item pekerjaan')||href.includes('item-pekerjaan'))return'items';
    if(t.includes('daftar user')||t.includes('management user')||href.includes('user'))return'users';
    return '';
  };
  function style(el){
    el.classList.add('rbac-ui-disabled');
    el.setAttribute('aria-disabled','true');
    el.setAttribute('title','Tidak memiliki hak akses');
    el.style.setProperty('opacity','.48','important');
    el.style.setProperty('cursor','not-allowed','important');
    el.style.setProperty('pointer-events','none','important');
    if('disabled' in el)el.disabled=true;
  }
  function apply(){
    const permissions=window.__SIKOYEK_RBAC_PERMISSIONS_V1__;
    if(!permissions)return;
    const isAdmin=permissions.role==='admin';
    const can=key=>isAdmin||permissions.views?.[key]===true;
    document.querySelectorAll('.tabs button,.tabs a,[role="tab"],.project-tabs button,.project-tabs a,.project-detail-tabs button,.project-detail-tabs a').forEach(el=>{
      const key=moduleOf(el); if(key&&!can(key))style(el);
    });
  }
  window.applyRBACUiLock=apply;
  const boot=()=>{setTimeout(apply,50);setTimeout(apply,200);setTimeout(apply,500)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(()=>{clearTimeout(window.__rbacUiLockTimer);window.__rbacUiLockTimer=setTimeout(apply,60)}).observe(document.body,{childList:true,subtree:true});
})();