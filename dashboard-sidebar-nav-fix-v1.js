/* SiKoyek V1.0 — harden Dashboard sidebar navigation. */
(function(){
  'use strict';
  if(window.__SIKOYEK_DASHBOARD_SIDEBAR_NAV_FIX_V1__)return;
  window.__SIKOYEK_DASHBOARD_SIDEBAR_NAV_FIX_V1__=true;

  function goTo(path){ window.location.href=path; }

  document.addEventListener('click',function(e){
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
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.openMasterData==='function')window.openMasterData();
      return;
    }
    if(text==='daftar user'){
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.openUserManagement==='function')window.openUserManagement();
      return;
    }
  },true);
})();
