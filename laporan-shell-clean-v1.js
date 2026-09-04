/* SiKoyek V1.0 — canonical Laporan sidebar. One source of truth; no navigation interception. */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_SHELL_CLEAN_V1__)return;
  window.__SIKOYEK_LAPORAN_SHELL_CLEAN_V1__=true;

  const loadScript=(id,src,ready)=>{
    const existing=document.getElementById(id);
    if(existing){
      if(existing.dataset.loaded==='1')ready?.();
      else existing.addEventListener('load',()=>ready?.(),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.id=id;
    s.src=src;
    s.onload=()=>{s.dataset.loaded='1';ready?.()};
    document.head.appendChild(s);
  };

  function installStyle(){
    if(document.getElementById('laporan-canonical-nav-style'))return;
    const s=document.createElement('style');
    s.id='laporan-canonical-nav-style';
    s.textContent=`
      .sidebar .nav{display:grid;gap:5px}
      .sidebar .nav a,.sidebar .nav button{
        display:block;width:100%;box-sizing:border-box;border:0;background:transparent;
        color:#cbd5e1;text-decoration:none;text-align:left;padding:11px 12px;border-radius:10px;
        font:inherit;font-weight:700;cursor:pointer;pointer-events:auto!important;
      }
      .sidebar .nav a:hover,.sidebar .nav a.active,
      .sidebar .nav button:hover,.sidebar .nav button.active{background:#202938;color:#fff;text-decoration:none}
    `;
    document.head.appendChild(s);
  }

  function buildCanonicalSidebar(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;

    nav.innerHTML=`
      <a href="index.html" data-lap-side="dashboard">Dashboard</a>
      <a href="workspace.html" data-lap-side="projects">Daftar Proyek</a>
      <button type="button" data-lap-side="master" data-master-data-nav="1">Data Master</button>
      <button type="button" data-lap-side="users" data-users-nav="1">Daftar User</button>
      <a href="laporan.html" class="active" data-lap-side="laporan" data-laporan-nav="1">Laporan</a>`;

    nav.querySelector('[data-master-data-nav]')?.addEventListener('click',()=>{
      loadScript('lap-master-data-loader-clean-v1','./master-data-v1.js?v=5',()=>window.openMasterData?.());
    });

    nav.querySelector('[data-users-nav]')?.addEventListener('click',()=>{
      loadScript('lap-users-loader-clean-v1','./user-management-v1.js?v=4',()=>window.openUserManagement?.());
    });
  }

  function ensureHeader(){
    const top=document.querySelector('main.content .top');
    if(!top)return;
    top.classList.add('laporan-standard-header');
    top.querySelector(':scope > div:first-child')?.classList.add('laporan-standard-title');
    let actions=top.querySelector('.laporan-top-actions');
    if(actions)return;
    const oldButton=top.querySelector('#logoutBtn');
    actions=document.createElement('div');
    actions.className='laporan-top-actions';
    actions.innerHTML='<div class="laporan-userinfo"><div class="laporan-user-main">Pengguna</div><div class="laporan-user-role">Memuat...</div></div><button class="btn ghost" id="laporanLogoutBtn">Keluar</button>';
    if(oldButton)oldButton.replaceWith(actions);else top.appendChild(actions);
    document.getElementById('laporanLogoutBtn')?.addEventListener('click',()=>window.SK?.logout?.());

    if(!document.getElementById('laporan-shell-clean-style')){
      const s=document.createElement('style');
      s.id='laporan-shell-clean-style';
      s.textContent=`
        .laporan-standard-header{background:linear-gradient(115deg,#12375f 0%,#0c4a70 52%,#1f7180 100%);color:#fff;border-radius:18px;padding:20px 24px 18px;margin-bottom:16px;box-shadow:0 14px 30px rgba(18,55,95,.12);position:relative;overflow:hidden;display:flex;justify-content:space-between;gap:16px;align-items:flex-start!important}
        .laporan-standard-header:after{content:"";position:absolute;right:-80px;bottom:-90px;width:360px;height:170px;background:rgba(72,180,190,.18);border-radius:55% 0 0 0;transform:rotate(-8deg);pointer-events:none}
        .laporan-standard-title{position:relative;z-index:2}.laporan-standard-title h1{margin:0;color:#fff;font-size:30px!important;line-height:1.05}.laporan-standard-title p{margin:5px 0 0;color:#eef7fb;font-size:13px}
        .laporan-top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:relative;z-index:2}.laporan-userinfo{min-width:190px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);border-radius:10px;padding:7px 12px;text-align:center;font-size:12px;line-height:1.25}.laporan-user-main{display:block;color:#fff;font-size:12px;font-weight:700}.laporan-user-role{color:#d9edf2;font-size:10px;margin-top:2px}.laporan-top-actions .btn.ghost{height:42px;padding:0 17px;background:#fff;border-color:#fff;color:#172033;border-radius:10px;font-size:15px;font-weight:500}
        @media(max-width:780px){.laporan-standard-header{flex-direction:column}.laporan-top-actions{width:100%}.laporan-userinfo{flex:1}}
      `;
      document.head.appendChild(s);
    }
  }

  function fillHeader(){
    const client=window.SK?.sb||window.sb;
    if(!client?.auth?.getUser)return;
    client.auth.getUser().then(async({data:{user}})=>{
      if(!user)return;
      const display=user?.user_metadata?.full_name||user?.email||'Pengguna';
      const {data:profile}=await client.from('profiles').select('roles(name)').eq('id',user.id).maybeSingle();
      const role=String(profile?.roles?.name||'').trim().toUpperCase();
      document.querySelector('.laporan-user-main')?.replaceChildren(document.createTextNode(display));
      document.querySelector('.laporan-user-role')?.replaceChildren(document.createTextNode(role?'Role: '+role:'Pengguna'));
    }).catch(()=>{});
  }

  function boot(){
    if(!location.pathname.toLowerCase().endsWith('laporan.html'))return;
    installStyle();
    buildCanonicalSidebar();
    ensureHeader();
    fillHeader();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,0);
})();
