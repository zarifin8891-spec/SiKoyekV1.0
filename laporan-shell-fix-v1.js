/* SiKoyek V1.0 — Laporan shell alignment V1. */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_SHELL_FIX_V1__)return;
  window.__SIKOYEK_LAPORAN_SHELL_FIX_V1__=true;

  function loadScript(id,src,ready){
    if(document.getElementById(id)){ready?.();return}
    const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>ready?.();document.body.appendChild(s);
  }

  function ensureSidebar(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;
    nav.innerHTML=`
      <a href="index.html">Dashboard</a>
      <a href="workspace.html">Daftar Proyek</a>
      <button type="button" data-master-data-nav="1" id="lapMasterDataNav">Data Master</button>
      <button type="button" data-users-nav="1" id="lapUsersNav">Daftar User</button>
      <a href="laporan.html" class="active" data-laporan-nav="1">Laporan</a>`;
    document.getElementById('lapMasterDataNav')?.addEventListener('click',()=>loadScript('lap-master-data-loader','./master-data-v1.js?v=2',()=>window.openMasterData?.()));
    document.getElementById('lapUsersNav')?.addEventListener('click',()=>loadScript('lap-users-loader','./user-management-v1.js?v=1',()=>window.openUserManagement?.()));
  }

  function ensureHeader(){
    const top=document.querySelector('main.content .top');
    if(!top)return;
    let actions=top.querySelector('.laporan-top-actions');
    if(!actions){
      const oldButton=top.querySelector('#logoutBtn');
      actions=document.createElement('div');actions.className='laporan-top-actions';
      actions.innerHTML='<div class="laporan-userinfo" id="laporanUserInfo"><div class="laporan-user-main">Pengguna</div><div class="laporan-user-role">Memuat...</div></div>';
      if(oldButton){oldButton.replaceWith(actions);actions.insertAdjacentHTML('beforeend','<button class="btn ghost" id="logoutBtn">Keluar</button>')}
      else{top.appendChild(actions);actions.insertAdjacentHTML('beforeend','<button class="btn ghost" id="logoutBtn">Keluar</button>')}
      document.getElementById('logoutBtn')?.addEventListener('click',()=>window.SK?.logout?.());
    }
    if(!document.getElementById('laporan-shell-style')){
      const s=document.createElement('style');s.id='laporan-shell-style';s.textContent='.laporan-top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.laporan-userinfo{min-width:190px;border:1px solid var(--line);background:#fff;border-radius:10px;padding:7px 12px;text-align:center;font-size:12px;line-height:1.25}.laporan-user-main{font-weight:800;color:var(--text)}.laporan-user-role{font-size:10px;color:var(--muted);margin-top:2px}';document.head.appendChild(s);
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
    const s=document.createElement('script');s.id='rbac-nav-v1-script';s.src='./rbac-nav-v1.js?v=9';s.defer=true;s.onload=()=>window.applyRBACNav?.();document.head.appendChild(s);
  }

  function boot(){
    if(location.pathname.toLowerCase().endsWith('laporan.html')){
      ensureSidebar();ensureHeader();ensureRBAC();fillHeader();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
