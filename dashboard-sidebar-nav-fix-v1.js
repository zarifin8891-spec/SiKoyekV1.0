/* SiKoyek V1.0 — Dashboard sidebar compatibility layer. */
(function(){
  'use strict';
  if(window.__SIKOYEK_DASHBOARD_SIDEBAR_NAV_FIX_V2__)return;
  window.__SIKOYEK_DASHBOARD_SIDEBAR_NAV_FIX_V2__=true;

  function goTo(path){ window.location.href=path; }

  function installStyle(){
    if(document.getElementById('sikoyek-dashboard-sidebar-nav-style-v2'))return;
    const s=document.createElement('style');
    s.id='sikoyek-dashboard-sidebar-nav-style-v2';
    s.textContent=`
      .sidebar .nav a,.sidebar .nav button{
        color:#cbd5e1!important;
        text-decoration:none!important;
        cursor:pointer!important;
      }
      .sidebar .nav a:hover,.sidebar .nav a.active,
      .sidebar .nav button:hover,.sidebar .nav button.active{
        color:#fff!important;
        text-decoration:none!important;
      }
    `;
    document.head.appendChild(s);
  }

  installStyle();

  document.addEventListener('click',function(e){
    /* Laporan has its own canonical sidebar. Do not intercept it here. */
    if(location.pathname.toLowerCase().endsWith('laporan.html'))return;

    const el=e.target?.closest?.('.sidebar .nav button,.sidebar .nav a');
    if(!el)return;
    const text=String(el.textContent||'').trim().toLowerCase();

    if(text==='dashboard'){
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.go==='function')window.go('dashboard');
      else goTo('./index.html');
      return;
    }
    if(text==='projects'||text==='daftar proyek'){
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.go==='function')window.go('projects');
      else goTo('./workspace.html');
      return;
    }
    if(text==='laporan'){
      e.preventDefault();e.stopImmediatePropagation();
      goTo('./laporan.html');
      return;
    }
    if(text==='data master'){
      if(typeof window.openMasterData!=='function')return;
      e.preventDefault();e.stopImmediatePropagation();
      window.openMasterData();
      return;
    }
    if(text==='daftar user'){
      if(typeof window.openUserManagement!=='function')return;
      e.preventDefault();e.stopImmediatePropagation();
      window.openUserManagement();
      return;
    }
  },true);
})();
