/* SiKoyek V1.0 — RBAC tanpa mengambil alih navigasi. */
(function(){
  'use strict';
  if(window.__SIKOYEK_RBAC_DIRECT_V2__)return;
  window.__SIKOYEK_RBAC_DIRECT_V2__=true;

  const M={DASHBOARD:'DASHBOARD',PROJECTS:'PROJECTS',MASTER_DATA:'MASTER_DATA',PROGRESS:'PROGRESS',RAP:'RAP',KEUANGAN:'KEUANGAN',USERS:'USERS',LAPORAN:'LAPORAN'};
  const norm=v=>String(v??'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const attr=(el,n)=>String(el?.getAttribute?.(n)||'');
  const perms=()=>window.__SIKOYEK_RBAC_PERMISSIONS_V6__;
  const canView=m=>{const p=perms();return !!(p&&(p.role==='admin'||p.views?.[String(m).toUpperCase()]===true))};
  const canAct=(m,a)=>{const p=perms();return !!(p&&(p.role==='admin'||p.actions?.[String(m).toUpperCase()]?.[String(a).toUpperCase()]===true))};
  const setMeta=(el,m,a)=>{el.dataset.rbacModule=String(m).toUpperCase();el.dataset.rbacAction=String(a||'VIEW').toUpperCase()};

  function installNavStyle(){
    if(document.getElementById('sikoyek-rbac-direct-nav-style-v2'))return;
    const s=document.createElement('style');s.id='sikoyek-rbac-direct-nav-style-v2';
    s.textContent=`
      .sidebar .nav a,.sidebar .nav button{
        color:#cbd5e1!important;text-decoration:none!important;background:transparent;
        border:0;text-align:left;font:inherit;font-weight:700;cursor:pointer;
      }
      .sidebar .nav a:hover,.sidebar .nav a.active,
      .sidebar .nav button:hover,.sidebar .nav button.active{
        color:#fff!important;text-decoration:none!important;background:#202938;
      }
    `;
    document.head.appendChild(s);
  }

  function sidebarModule(el){
    const t=norm(el.textContent),h=attr(el,'href').toLowerCase();
    if(t.includes('dashboard')||h.includes('index.html'))return M.DASHBOARD;
    if(t.includes('daftar_proyek')||t==='projects'||h.includes('workspace.html'))return M.PROJECTS;
    if(t.includes('data_master')||t.includes('master_data'))return M.MASTER_DATA;
    if(t.includes('daftar_user')||t.includes('management_user')||t.includes('user_management'))return M.USERS;
    if(t.includes('laporan')||h.includes('laporan.html'))return M.LAPORAN;
    return '';
  }

  function ensureCoreItems(){
    const nav=document.querySelector('.sidebar .nav');if(!nav)return;
    const hasText=t=>[...nav.querySelectorAll('a,button')].some(x=>norm(x.textContent)===t);
    if(!hasText('daftar_user')&&typeof window.openUserManagement==='function'){
      const b=document.createElement('button');b.type='button';b.dataset.usersNav='1';b.textContent='Daftar User';b.onclick=()=>window.openUserManagement();nav.appendChild(b);
    }
    if(!hasText('laporan')){
      /* Use a button, matching the rest of the dashboard navigation. */
      const b=document.createElement('button');
      b.type='button';
      b.dataset.laporanNav='1';
      b.textContent='Laporan';
      b.onclick=()=>{window.location.href='./laporan.html'};
      nav.appendChild(b);
    }
  }

  function annotate(el){
    if(!el||el.closest('script,style,textarea,input,select'))return;
    if(el.closest('.sidebar')){const m=sidebarModule(el);if(m)setMeta(el,m,'VIEW');return;}
    if(el.dataset.rbacModule&&el.dataset.rbacAction)return;
    const o=attr(el,'onclick').toLowerCase(),t=norm(el.textContent);
    if(o.includes('mdadd')||o.includes('mdsaveprojectcategory')||o.includes('mdsavemanager')||o.includes("add('transaction_categories'")||o.includes("add('payment_methods'")){setMeta(el,M.MASTER_DATA,'ADD');return}
    if(o.includes('mdedit')||o.includes('saveedit')){setMeta(el,M.MASTER_DATA,'EDIT');return}
    if(o.includes('mddelete')||o.includes('confirmdel')||o.includes('mdconfirmdelete')){setMeta(el,M.MASTER_DATA,'DELETE');return}
    if(o.includes('umadd')||o.includes('umsaveadd')){setMeta(el,M.USERS,'ADD');return}
    if(o.includes('umedit')||o.includes('umsaveedit')||o.includes('umreset')||o.includes('resetpassword')){setMeta(el,M.USERS,'EDIT');return}
    if(o.includes('umdelete')||o.includes('umconfirmdelete')){setMeta(el,M.USERS,'DELETE');return}
    if(o.includes('openrapform')){setMeta(el,M.RAP,t.includes('edit')?'EDIT':'ADD');return}
    if(o.includes('rap')&&t.includes('edit')){setMeta(el,M.RAP,'EDIT');return}
    if(o.includes('rap')&&t.includes('hapus')){setMeta(el,M.RAP,'DELETE');return}
    if(el.closest('.tabs')){
      if(t==='progress'||t.includes('progress')){setMeta(el,M.PROGRESS,'VIEW');return}
      if(t==='keuangan'||t.includes('keuangan')||t.includes('kontrol_biaya')||t.includes('cost_control')){setMeta(el,M.KEUANGAN,'VIEW');return}
      if(t==='rap'||t.includes('rap')){setMeta(el,M.RAP,'VIEW');return}
    }
    if(o.includes('openitemform')){setMeta(el,M.PROJECTS,'ADD');return}
    if(o.includes('edititem')||o.includes('updateitem')||o.includes('saveitem')){setMeta(el,M.PROJECTS,'EDIT');return}
    if(o.includes('deleteitem')||o.includes('removeitem')){setMeta(el,M.PROJECTS,'DELETE');return}
    if(o.includes('opentxform')){setMeta(el,M.KEUANGAN,'ADD');return}
    if(o.includes('openprojectform')){setMeta(el,M.PROJECTS,'ADD');return}
    if(o.includes('editproject')){setMeta(el,M.PROJECTS,'EDIT');return}
    if(o.includes('deleteproject')||o.includes('removeproject')){setMeta(el,M.PROJECTS,'DELETE');return}
    if((t==='hapus'||t.startsWith('hapus_'))&&el.closest('.projects-page-v2')){setMeta(el,M.PROJECTS,'DELETE');return}
    if((t==='edit'||t.startsWith('edit_'))&&el.closest('.projects-page-v2')){setMeta(el,M.PROJECTS,'EDIT');return}
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
    el.style.setProperty('opacity','.48','important');el.style.setProperty('cursor','not-allowed','important');el.style.setProperty('pointer-events','none','important');
    if('disabled' in el)el.disabled=true;
  }

  function apply(){
    const p=perms();if(!p)return;
    installNavStyle();resetControlled();ensureCoreItems();
    document.querySelectorAll('button,a').forEach(annotate);
    document.querySelectorAll('[data-rbac-module]').forEach(el=>{
      const m=String(el.dataset.rbacModule||'').toUpperCase(),a=String(el.dataset.rbacAction||'VIEW').toUpperCase();
      if(!m)return;
      if(el.closest('.sidebar')){el.style.display=canView(m)?'':'none';el.style.removeProperty('pointer-events');return;}
      if(a==='VIEW'){if(!canView(m))disable(el)}else if(!canAct(m,a))disable(el);
    });
    window.__SIKOYEK_RBAC_APPLIED_V8__=true;
  }

  async function load(){
    const client=window.SK?.sb||window.sb;if(!client?.auth||!client?.from)return;
    try{
      const {data:{user},error:ue}=await client.auth.getUser();if(ue||!user)return;
      const {data:profile,error:pe}=await client.from('profiles').select('is_active,role_id,roles(name)').eq('id',user.id).maybeSingle();if(pe||!profile?.is_active)return;
      const role=String(profile?.roles?.name||'').trim().toLowerCase(),out={role,views:{},actions:{}};
      if(role!=='admin'){
        const {data:rps,error:re}=await client.from('role_permissions').select('permission_id').eq('role_id',profile.role_id);if(re)throw re;
        const ids=(rps||[]).map(x=>x.permission_id).filter(Boolean);
        if(ids.length){const {data:ps,error:qe}=await client.from('permissions').select('id,module,action').in('id',ids);if(qe)throw qe;(ps||[]).forEach(x=>{const m=String(x.module||'').toUpperCase(),a=String(x.action||'').toUpperCase();if(a==='VIEW')out.views[m]=true;else{out.actions[m]??={};out.actions[m][a]=true}})}
      }
      window.__SIKOYEK_RBAC_PERMISSIONS_V6__=out;apply();
    }catch(e){console.warn('SiKoyek RBAC direct:',e)}
  }

  window.sikoyekCan=canAct;window.sikoyekCanView=canView;
  window.applyRBACNav=async()=>{if(!perms())await load();else apply()};
  window.applyRBACUiLock=()=>apply();
  const boot=()=>{load();setTimeout(()=>{if(perms())apply()},300)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
