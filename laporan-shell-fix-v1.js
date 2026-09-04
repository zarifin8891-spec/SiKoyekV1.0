/* SiKoyek V1.0 — Laporan shell alignment V3. */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_SHELL_FIX_V3__)return;
  window.__SIKOYEK_LAPORAN_SHELL_FIX_V3__=true;

  function loadScript(id,src,ready){
    if(document.getElementById(id)){ready?.();return}
    const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>ready?.();document.head.appendChild(s);
  }

  function ensureSidebar(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;
    nav.innerHTML=`
      <a href="index.html" data-lap-side="dashboard">Dashboard</a>
      <a href="workspace.html" data-lap-side="projects">Daftar Proyek</a>
      <a href="javascript:void(0)" id="lapMasterDataNav" data-lap-side="master">Data Master</a>
      <a href="javascript:void(0)" id="lapUsersNav" data-lap-side="users">Daftar User</a>
      <a href="laporan.html" class="active" data-laporan-nav="1" data-lap-side="laporan">Laporan</a>`;
    nav.querySelectorAll('a,button').forEach(el=>{el.style.setProperty('pointer-events','auto','important');el.style.setProperty('cursor','pointer','important')});
    document.getElementById('lapMasterDataNav')?.addEventListener('click',(e)=>{e.preventDefault();loadScript('lap-master-data-loader-v3','./master-data-v1.js?v=4',()=>window.openMasterData?.())});
    document.getElementById('lapUsersNav')?.addEventListener('click',(e)=>{e.preventDefault();loadScript('lap-users-loader-v3','./user-management-v1.js?v=3',()=>window.openUserManagement?.())});
  }

  function ensureHeader(){
    const top=document.querySelector('main.content .top');
    if(!top)return;
    top.classList.add('laporan-standard-header');
    top.querySelector(':scope > div:first-child')?.classList.add('laporan-standard-title');
    let actions=top.querySelector('.laporan-top-actions');
    if(!actions){
      const oldButton=top.querySelector('#logoutBtn');
      actions=document.createElement('div');actions.className='laporan-top-actions';
      actions.innerHTML='<div class="laporan-userinfo"><div class="laporan-user-main">Pengguna</div><div class="laporan-user-role">Memuat...</div></div><button class="btn ghost" id="laporanLogoutBtn">Keluar</button>';
      oldButton?.replaceWith(actions);if(!oldButton)top.appendChild(actions);
      document.getElementById('laporanLogoutBtn')?.addEventListener('click',()=>window.SK?.logout?.());
    }
    if(!document.getElementById('laporan-shell-style-v3')){
      const s=document.createElement('style');s.id='laporan-shell-style-v3';s.textContent=`
        .laporan-standard-header{background:linear-gradient(115deg,#12375f 0%,#0c4a70 52%,#1f7180 100%);color:#fff;border-radius:18px;padding:20px 24px 18px;margin-bottom:16px;box-shadow:0 14px 30px rgba(18,55,95,.12);position:relative;overflow:hidden;display:flex;justify-content:space-between;gap:16px;align-items:flex-start!important}
        .laporan-standard-header:after{content:"";position:absolute;right:-80px;bottom:-90px;width:360px;height:170px;background:rgba(72,180,190,.18);border-radius:55% 0 0 0;transform:rotate(-8deg);pointer-events:none}
        .laporan-standard-title{position:relative;z-index:2}.laporan-standard-title h1{margin:0;color:#fff;font-size:30px!important;line-height:1.05}.laporan-standard-title p{margin:5px 0 0;color:#eef7fb;font-size:13px}
        .laporan-top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:relative;z-index:2}.laporan-userinfo{min-width:190px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);border-radius:10px;padding:7px 12px;text-align:center;font-size:12px;line-height:1.25}.laporan-user-main{display:block;color:#fff;font-size:12px;font-weight:700}.laporan-user-role{color:#d9edf2;font-size:10px;margin-top:2px}.laporan-top-actions .btn.ghost{height:42px;padding:0 17px;background:#fff;border-color:#fff;color:#172033;border-radius:10px;font-size:15px;font-weight:500}
        .laporan-shell-nav-lock{pointer-events:auto!important;cursor:pointer!important}
        @media(max-width:780px){.laporan-standard-header{flex-direction:column}.laporan-top-actions{width:100%}.laporan-userinfo{flex:1}}
      `;document.head.appendChild(s);
    }
  }

  function fillHeader(){
    const client=window.SK?.sb||window.sb;if(!client?.auth?.getUser)return;
    client.auth.getUser().then(async({data:{user}})=>{if(!user)return;const display=user?.user_metadata?.full_name||user?.email||'Pengguna';const {data:profile}=await client.from('profiles').select('roles(name)').eq('id',user.id).maybeSingle();const role=String(profile?.roles?.name||'').trim().toUpperCase();document.querySelector('.laporan-user-main')?.replaceChildren(document.createTextNode(display));document.querySelector('.laporan-user-role')?.replaceChildren(document.createTextNode(role?'Role: '+role:'Pengguna'))}).catch(()=>{});
  }

  function bindNavigation(){
    const nav=document.querySelector('.sidebar .nav');if(!nav)return;
    nav.querySelectorAll('a[data-lap-side],button[data-lap-side]').forEach(el=>{el.classList.add('laporan-shell-nav-lock');el.style.setProperty('pointer-events','auto','important');el.style.setProperty('cursor','pointer','important');if(el.dataset.boundV3==='1')return;el.dataset.boundV3='1';if(el.tagName==='A'){const href=el.getAttribute('href');if(href&&href!=='javascript:void(0)')el.addEventListener('click',(e)=>{e.preventDefault();window.location.assign(href)},true)}});
  }

  function boot(){
    if(!location.pathname.toLowerCase().endsWith('laporan.html'))return;
    ensureSidebar();ensureHeader();fillHeader();bindNavigation();
    setTimeout(bindNavigation,100);setTimeout(bindNavigation,500);setTimeout(bindNavigation,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
