/* SiKoyek RBAC UI lock V3 — action-aware, nested feature lock, duplicate nav cleanup. */
(function(){
  'use strict';
  if(window.__SIKOYEK_RBAC_UI_LOCK_V3__) return;
  window.__SIKOYEK_RBAC_UI_LOCK_V3__=true;

  const norm=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const perms=()=>window.__SIKOYEK_RBAC_PERMISSIONS_V2__||window.__SIKOYEK_RBAC_PERMISSIONS_V1__;
  const isAdmin=p=>p?.role==='admin';
  const canView=(p,k)=>isAdmin(p)||p?.views?.[k]===true;
  const canAction=(p,k,a)=>isAdmin(p)||p?.actions?.[k]?.[a]===true;

  function disable(el,title='Tidak memiliki hak akses'){
    if(!el||el.classList.contains('rbac-ui-disabled'))return;
    el.classList.add('rbac-ui-disabled');
    el.setAttribute('aria-disabled','true');
    el.setAttribute('title',title);
    el.style.setProperty('opacity','.48','important');
    el.style.setProperty('cursor','not-allowed','important');
    el.style.setProperty('pointer-events','none','important');
    if('disabled' in el)el.disabled=true;
  }

  function cleanDuplicateDaftarUser(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;
    const list=[...nav.querySelectorAll('button,a')].filter(el=>norm(el.textContent)==='daftar_user');
    if(list.length<=1)return;
    const keep=list.find(el=>el.matches('[data-users-nav]'))||list[0];
    list.forEach(el=>{if(el!==keep)el.remove()});
  }

  function moduleForTab(el){
    const s=norm(el.textContent)+' '+String(el.getAttribute?.('href')||'').toLowerCase()+' '+norm(el.getAttribute?.('data-module')||'');
    if(s.includes('progress'))return'progress';
    if(s.includes('rap'))return'rap';
    if(s.includes('keuangan')||s.includes('finance'))return'keuangan';
    if(s.includes('pekerjaan'))return'items';
    if(s.includes('workspace'))return'workspace';
    return'';
  }

  function applyNested(p){
    if(!p)return;
    document.querySelectorAll('.tabs button,.tabs a,.project-tabs button,.project-tabs a,.project-detail-tabs button,.project-detail-tabs a,[role="tab"]').forEach(el=>{
      const k=moduleForTab(el);
      if(k&&!canView(p,k))disable(el);
    });

    // Project detail quick actions and RAP editor.
    document.querySelectorAll('button,a').forEach(el=>{
      if(el.closest('.sidebar'))return;
      const t=norm(el.textContent), onclick=norm(el.getAttribute?.('onclick')||'');
      if(!t&&!onclick)return;

      if(onclick.includes('openrapform') || t.includes('edit_rap')){
        const isEdit=t.includes('edit')||onclick.includes('edit');
        const allowed=isEdit?canAction(p,'rap','EDIT'):canView(p,'rap');
        if(!allowed)disable(el); else if(el.classList.contains('rbac-ui-disabled'))return;
        return;
      }
      if(t.includes('item_pekerjaan')||t==='item_pekerjaan'||t.includes('item_pekerjaan')){
        if(!canAction(p,'items','ADD'))disable(el);
        return;
      }
      if(t.includes('transaksi')){
        if(!canAction(p,'keuangan','ADD'))disable(el);
        return;
      }
      // Project CRUD actions.
      if(t==='tambah_proyek'||t==='proyek_baru'||onclick.includes('addproject')||onclick.includes('addproject')){
        if(!canAction(p,'projects','ADD'))disable(el);
        return;
      }
      if((t==='edit'||t.startsWith('edit_'))&&(el.closest('.projects-page-v2')||el.closest('#page'))){
        if(!canAction(p,'projects','EDIT') && !onclick.includes('mdedit'))disable(el);
        return;
      }
      if((t==='hapus'||t.startsWith('hapus_'))&&(el.closest('.projects-page-v2')||el.closest('#page'))){
        if(!canAction(p,'projects','DELETE') && !onclick.includes('mddelete'))disable(el);
      }
    });

    // Master Data CRUD. Master Data uses mdAdd/mdEdit/mdDelete inline handlers.
    if(document.querySelector('#page .md-page')){
      document.querySelectorAll('#page .md-page button').forEach(el=>{
        const oc=norm(el.getAttribute?.('onclick')||''), t=norm(el.textContent);
        let action='';
        if(oc.includes('mdadd'))action='ADD';
        else if(oc.includes('mdedit'))action='EDIT';
        else if(oc.includes('mddelete'))action='DELETE';
        if(action && !canAction(p,'master_data',action))disable(el);
        if(t==='tambah'&& !action && !canAction(p,'master_data','ADD'))disable(el);
        if(t==='edit'&& !action && !canAction(p,'master_data','EDIT'))disable(el);
        if((t==='hapus'||t==='hapus_data')&&!action&&!canAction(p,'master_data','DELETE'))disable(el);
      });
    }

    // Fallback for the RAP summary editor when the inline handler is available only on the panel.
    document.querySelectorAll('.summary-panel').forEach(panel=>{
      const heading=norm(panel.querySelector('h3')?.textContent||'');
      if(!heading.includes('rap'))return;
      panel.querySelectorAll('button,a').forEach(el=>{
        const t=norm(el.textContent);
        if(t.includes('edit_rap')&&!canAction(p,'rap','EDIT'))disable(el);
        else if(t.includes('isi_rap')&&!canAction(p,'rap','ADD'))disable(el);
      });
    });

    cleanDuplicateDaftarUser();
  }

  function loadAndApply(){
    const p=perms();
    if(p)applyNested(p);
  }
  window.applyRBACUiLock=loadAndApply;
  const boot=()=>{loadAndApply();setTimeout(loadAndApply,100);setTimeout(loadAndApply,300);setTimeout(loadAndApply,700);setTimeout(loadAndApply,1200)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(()=>{clearTimeout(window.__rbacUiLockV3Timer);window.__rbacUiLockV3Timer=setTimeout(loadAndApply,70)}).observe(document.body,{childList:true,subtree:true});
})();
