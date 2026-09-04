/* SiKoyek V1.0 — Laporan shell alignment V2. */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_SHELL_FIX_V2__)return;
  window.__SIKOYEK_LAPORAN_SHELL_FIX_V2__=true;

  function loadScript(id,src,ready){
    if(document.getElementById(id)){ready?.();return}
    const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>ready?.();document.body.appendChild(s);
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
    document.getElementById('lapMasterDataNav')?.addEventListener('click',()=>loadScript('lap-master-data-loader','./master-data-v1.js?v=3',()=>window.openMasterData?.()));
    document.getElementById('lapUsersNav')?.addEventListener('click',()=>loadScript('lap-users-loader','./user-management-v1.js?v=2',()=>window.openUserManagement?.()));
  }

  function ensureHeader(){
    const top=document.querySelector('main.content .top');
    if(!top)return;
    top.classList.add('laporan-standard-header');
    let titleWrap=top.querySelector('.laporan-standard-title');
    if(!titleWrap){
      const first=top.querySelector(':scope > div');
      if(first){first.classList.add('laporan-standard-title')}
    }
    let actions=top.querySelector('.laporan-top-actions');
    if(!actions){
      const oldButton=top.querySelector('#logoutBtn');
      actions=document.createElement('div');actions.className='laporan-top-actions';
      actions.innerHTML='<div class="laporan-userinfo" id="laporanUserInfo"><div class="laporan-user-main">Pengguna</div><div class="laporan-user-role">Memuat...</div></div>';
      if(oldButton){oldButton.replaceWith(actions);actions.insertAdjacentHTML('beforeend','<button class="btn ghost" id="logoutBtn">Keluar</button>')}
      else{top.appendChild(actions);actions.insertAdjacentHTML('beforeend','<button class="btn ghost" id="logoutBtn">Keluar</button>')}
      document.getElementById('logoutBtn')?.addEventListener('click',()=>window.SK?.logout?.());
    }
    if(!document.getElementById('laporan-shell-style-v2')){
      const s=document.createElement('style');s.id='laporan-shell-style-v2';s.textContent=`
        .laporan-standard-header{background:linear-gradient(115deg,#12375f 0%,#0c4a70 52%,#1f7180 100%);color:#fff;border-radius:18px;padding:20px 24px 18px;margin-bottom:16px;box-shadow:0 14px 30px rgba(18,55,95,.12);position:relative;overflow:hidden;align-items:flex-start!important}
        .laporan-standard-header:after{content:"";position:absolute;right:-80px;bottom:-90px;width:360px;height:170px;background:rgba(72,180,190,.18);border-radius:55% 0 0 0;transform:rotate(-8deg);pointer-events:none}
        .laporan-standard-title{position:relative;z-index:1}.laporan-standard-title h1{margin:0;color:#fff;font-size:30px!important;line-height:1.05}.laporan-standard-title p{margin:5px 0 0;color:#eef7fb;font-size:13px}
        .laporan-top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:relative;z-index:1}
        .laporan-userinfo{min-width:190px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);border-radius:10px;padding:7px 12px;text-align:center;font-size:12px;line-height:1.25}.laporan-user-main{display:block;color:#fff;font-size:12px;font-weight:700}.laporan-user-role{color:#d9edf2;font-size:10px;margin-top:2px}
        .laporan-top-actions .btn.ghost{height:42px;padding:0 17px;background:#fff;border-color:#fff;color:#172033;border-radius:10px;font-size:15px;font-weight:500}
        @media(max-width:780px){.laporan-standard-header{padding:18px}.laporan-standard-header{flex-direction:column}.laporan-top-actions{width:100%}.laporan-userinfo{flex:1}}
      `;document.head.appendChild(s);
    }
  }

  async function fillHeader(){
    try{
      const client=window.SK?.sb||window.sb;if(!client?.auth?.getUser)return;
      const {data:{user}}=await client.auth.getUser();if(!user)return;
      const display=user?.user_metadata?.full_name||user?.email||'Pengguna';
      const {data:profile}=await client.from('profiles').select('roles(name)').eq('id',user.id).maybeSingle();
      const role=String(profile?.roles?.name||'').trim().toUpperCase();
      const main=document.querySelector('.laporan-user-main');const roleEl=document.querySelector('.laporan-user-role');
      if(main)main.textContent=display;if(roleEl)roleEl.textContent=role?'Role: '+role:'Pengguna';
    }catch(e){console.warn('SiKoyek Laporan header:',e)}
  }

  function ensureRBAC(){
    if(document.getElementById('rbac-nav-v1-script')){window.applyRBACNav?.();return}
    const s=document.createElement('script');s.id='rbac-nav-v1-script';s.src='./rbac-nav-v1.js?v=10';s.defer=true;s.onload=()=>window.applyRBACNav?.();document.head.appendChild(s);
  }

  function boot(){
    if(location.pathname.toLowerCase().endsWith('laporan.html')){ensureSidebar();ensureHeader();ensureRBAC();fillHeader();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
