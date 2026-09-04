/* SiKoyek V1.0 — centralized RBAC engine. Database permissions are the single source of truth. */
(function(){
  'use strict';
  if(window.__SIKOYEK_RBAC_ENGINE_V9__) return;
  window.__SIKOYEK_RBAC_ENGINE_V9__=true;

  const MODULES={DASHBOARD:'DASHBOARD',PROJECTS:'PROJECTS',MASTER_DATA:'MASTER_DATA',PROGRESS:'PROGRESS',RAP:'RAP',KEUANGAN:'KEUANGAN',USERS:'USERS'};
  const norm=v=>String(v??'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const attr=(el,n)=>String(el?.getAttribute?.(n)||'');
  const canModule=module=>{const p=window.__SIKOYEK_RBAC_PERMISSIONS_V6__;const m=String(module||'').toUpperCase();return p?.role==='admin'||p?.views?.[m]===true};
  const canAction=(module,action)=>{const p=window.__SIKOYEK_RBAC_PERMISSIONS_V6__;const m=String(module||'').toUpperCase(),a=String(action||'').toUpperCase();return p?.role==='admin'||p?.actions?.[m]?.[a]===true};
  const setMeta=(el,module,action)=>{if(!el)return;if(module)el.dataset.rbacModule=String(module).toUpperCase();if(action)el.dataset.rbacAction=String(action).toUpperCase()};

  function classifySidebar(el){
    const t=norm(el.textContent),h=attr(el,'href').toLowerCase();
    if(t.includes('dashboard')||h.includes('index.html'))return MODULES.DASHBOARD;
    if(t.includes('daftar_proyek')||t==='projects'||h.includes('workspace.html'))return MODULES.PROJECTS;
    if(t.includes('data_master')||t.includes('master_data'))return MODULES.MASTER_DATA;
    if(t.includes('daftar_user')||t.includes('management_user')||t.includes('user_management'))return MODULES.USERS;
    if(t==='progress'||h.includes('progress.html'))return MODULES.PROGRESS;
    if(t==='rap'||h.includes('rap.html'))return MODULES.RAP;
    if(t==='keuangan'||h.includes('keuangan.html'))return MODULES.KEUANGAN;
    if(t==='item_pekerjaan'||h.includes('item-pekerjaan.html'))return MODULES.PROJECTS;
    return '';
  }

  function ensureUserNav(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav||typeof window.openUserManagement!=='function')return;
    const users=[...nav.querySelectorAll('button,a')].filter(x=>norm(x.textContent)==='daftar_user');
    if(users.length===0){
      const b=document.createElement('button');b.type='button';b.dataset.usersNav='1';b.textContent='Daftar User';b.onclick=window.openUserManagement;nav.appendChild(b);
    }else{
      const keep=users.find(x=>x.dataset.usersNav==='1')||users[0];
      users.forEach(x=>{if(x!==keep)x.remove()});
      keep.dataset.usersNav='1';
    }
  }

  function ensureLaporanNav(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;
    const items=[...nav.querySelectorAll('button,a')].filter(x=>norm(x.textContent)==='laporan');
    let b=items.find(x=>x.dataset.laporanNav==='1')||items[0];
    if(!b){
      b=document.createElement('button');
      b.type='button';
      b.dataset.laporanNav='1';
      b.textContent='Laporan';
      b.onclick=()=>{window.location.href='./laporan.html'};
      const project=nav.querySelector('button[data-rbac-module="PROJECTS"],a[href*="workspace.html"]');
      if(project?.nextSibling)nav.insertBefore(b,project.nextSibling);else nav.appendChild(b);
    }else{
      b.dataset.laporanNav='1';
      items.forEach(x=>{if(x!==b)x.remove()});
    }
  }

  function annotate(el){
    if(!el||el.closest('script,style,textarea,input,select'))return;
    if(el.closest('.sidebar')){const m=classifySidebar(el);if(m)setMeta(el,m,'VIEW');return}
    const onclick=attr(el,'onclick').toLowerCase();
    const t=norm(el.textContent);
    if(el.dataset.rbacModule&&el.dataset.rbacAction)return;

    if(onclick.includes('mdadd')||onclick.includes('mdsaveprojectcategory')||onclick.includes('mdsavemanager')||onclick.includes("add('transaction_categories'")||onclick.includes("add('payment_methods'")){setMeta(el,MODULES.MASTER_DATA,'ADD');return}
    if(onclick.includes('mdedit')||onclick.includes('saveedit')){setMeta(el,MODULES.MASTER_DATA,'EDIT');return}
    if(onclick.includes('mddelete')||onclick.includes('confirmdel')||onclick.includes('mdconfirmdelete')){setMeta(el,MODULES.MASTER_DATA,'DELETE');return}

    if(onclick.includes('umadd')||onclick.includes('umsaveadd')){setMeta(el,MODULES.USERS,'ADD');return}
    if(onclick.includes('umedit')||onclick.includes('umsaveedit')||onclick.includes('umreset')||onclick.includes('resetpassword')){setMeta(el,MODULES.USERS,'EDIT');return}
    if(onclick.includes('umdelete')||onclick.includes('umconfirmdelete')){setMeta(el,MODULES.USERS,'DELETE');return}

    if(onclick.includes('openrapform')){setMeta(el,MODULES.RAP,t.includes('edit')?'EDIT':'ADD');return}
    if(onclick.includes('rap')&&t.includes('edit')){setMeta(el,MODULES.RAP,'EDIT');return}
    if(onclick.includes('rap')&&t.includes('hapus')){setMeta(el,MODULES.RAP,'DELETE');return}

    if(el.closest('.tabs')){
      if(t==='progress'||t.includes('progress')){setMeta(el,MODULES.PROGRESS,'VIEW');return}
      if(t==='keuangan'||t.includes('keuangan')){setMeta(el,MODULES.KEUANGAN,'VIEW');return}
      if(t==='rap'||t.includes('rap')){setMeta(el,MODULES.RAP,'VIEW');return}
      if(t==='kontrol_biaya'||t.includes('kontrol_biaya')||t==='cost_control'||t.includes('cost_control')){setMeta(el,MODULES.KEUANGAN,'VIEW');return}
    }

    if(onclick.includes('openitemform')){setMeta(el,MODULES.PROJECTS,'ADD');return}
    if((onclick.includes('edititem')||onclick.includes('updateitem')||onclick.includes('saveitem')) && el.closest('#page')){setMeta(el,MODULES.PROJECTS,'EDIT');return}
    if((onclick.includes('deleteitem')||onclick.includes('removeitem')) && el.closest('#page')){setMeta(el,MODULES.PROJECTS,'DELETE');return}
    if(el.closest('#page')){
      const activeTab=norm(document.querySelector('.tabs button.active')?.textContent||'');
      if(activeTab==='item_pekerjaan'){
        if(t==='edit'||t.startsWith('edit_')){setMeta(el,MODULES.PROJECTS,'EDIT');return}
        if(t==='hapus'||t.startsWith('hapus_')){setMeta(el,MODULES.PROJECTS,'DELETE');return}
      }
    }

    if(onclick.includes('opentxform')){setMeta(el,MODULES.KEUANGAN,'ADD');return}
    if(onclick.includes('openprojectform')){setMeta(el,MODULES.PROJECTS,'ADD');return}
    if(onclick.includes('editproject')){setMeta(el,MODULES.PROJECTS,'EDIT');return}
    if(onclick.includes('deleteproject')||onclick.includes('removeproject')){setMeta(el,MODULES.PROJECTS,'DELETE');return}

    if((t==='hapus'||t.startsWith('hapus_')) && el.closest('.projects-page-v2')){setMeta(el,MODULES.PROJECTS,'DELETE');return}
    if((t==='edit'||t.startsWith('edit_')) && el.closest('.projects-page-v2')){setMeta(el,MODULES.PROJECTS,'EDIT');return}

    const dataModule=attr(el,'data-module');
    if(dataModule){setMeta(el,dataModule,attr(el,'data-action')||'VIEW');return}
  }

  function resetControlled(){
    document.querySelectorAll('[data-rbac-controlled="1"]').forEach(el=>{
      el.style.removeProperty('opacity');el.style.removeProperty('cursor');el.style.removeProperty('pointer-events');
      el.removeAttribute('aria-disabled');el.removeAttribute('title');
      if('disabled' in el)el.disabled=false;
      el.classList.remove('rbac-disabled');el.removeAttribute('data-rbac-controlled');
    });
  }
  function disable(el){
    el.dataset.rbacControlled='1';el.classList.add('rbac-disabled');el.setAttribute('aria-disabled','true');el.setAttribute('title','Tidak memiliki hak akses');
    el.style.setProperty('opacity','.48','important');el.style.setProperty('cursor','not-allowed','important');el.style.setProperty('pointer-events','none','important');if('disabled' in el)el.disabled=true;
  }

  function applyUI(){
    resetControlled();ensureUserNav();ensureLaporanNav();
    document.querySelectorAll('button,a').forEach(annotate);
    document.querySelectorAll('[data-rbac-module]').forEach(el=>{
      const m=String(el.dataset.rbacModule||'').toUpperCase(),a=String(el.dataset.rbacAction||'VIEW').toUpperCase();
      if(!m)return;
      if(el.closest('.sidebar')){if(!canModule(m))el.style.display='none';return}
      if(a==='VIEW'){if(!canModule(m))disable(el)}else if(!canAction(m,a))disable(el);
    });
    window.__SIKOYEK_RBAC_APPLIED_V6__=true;
  }

  async function load(){
    const client=window.SK?.sb||window.sb;if(!client?.auth||!client?.from)return;
    try{
      const {data:{user},error:ue}=await client.auth.getUser();if(ue||!user)return;
      const {data:profile,error:pe}=await client.from('profiles').select('is_active,role_id,roles(name)').eq('id',user.id).maybeSingle();if(pe||!profile?.is_active)return;
      const role=String(profile?.roles?.name||'').trim().toLowerCase();const permissions={role,views:{},actions:{}};
      if(role!=='admin'){
        const {data:rps,error:re}=await client.from('role_permissions').select('permission_id').eq('role_id',profile.role_id);if(re)throw re;
        const ids=(rps||[]).map(x=>x.permission_id).filter(Boolean);
        if(ids.length){const {data:ps,error:qe}=await client.from('permissions').select('id,module,action').in('id',ids);if(qe)throw qe;(ps||[]).forEach(p=>{const m=String(p.module||'').toUpperCase(),a=String(p.action||'').toUpperCase();if(a==='VIEW')permissions.views[m]=true;else{permissions.actions[m]??={};permissions.actions[m][a]=true}})}
      }
      window.__SIKOYEK_RBAC_PERMISSIONS_V6__=permissions;
      window.__SIKOYEK_RBAC_PERMISSIONS_V5__=permissions;
      window.__SIKOYEK_RBAC_PERMISSIONS_V4__=permissions;
      window.__SIKOYEK_RBAC_PERMISSIONS_V1__=permissions;
      window.__SIKOYEK_RBAC_PERMISSIONS_V2__=permissions;
      window.__SIKOYEK_RBAC_PERMISSIONS_V3__=permissions;
      applyUI();
    }catch(e){console.warn('SiKoyek RBAC:',e)}
  }

  window.sikoyekCan=canAction;window.sikoyekCanView=canModule;
  window.applyRBACNav=async()=>{if(!window.__SIKOYEK_RBAC_PERMISSIONS_V6__)await load();else applyUI()};
  window.applyRBACUiLock=()=>applyUI();
  const boot=()=>{load();setTimeout(load,250);setTimeout(load,900)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(()=>{clearTimeout(window.__sikoyekRbacTimer);window.__sikoyekRbacTimer=setTimeout(()=>{if(window.__SIKOYEK_RBAC_PERMISSIONS_V6__)applyUI()},80)}).observe(document.body,{childList:true,subtree:true});
})();
