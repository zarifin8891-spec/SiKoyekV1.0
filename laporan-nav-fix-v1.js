/* SiKoyek V1.0 — Laporan sidebar navigation fix. */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_NAV_FIX_V1__)return;
  window.__SIKOYEK_LAPORAN_NAV_FIX_V1__=true;

  function loadScript(id,src,ready){
    if(document.getElementById(id)){ready?.();return}
    const s=document.createElement('script');
    s.id=id;s.src=src;
    s.onload=()=>ready?.();
    document.head.appendChild(s);
  }

  function wire(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;

    nav.querySelectorAll('a,button').forEach(el=>{
      el.style.setProperty('pointer-events','auto','important');
      el.style.setProperty('cursor','pointer','important');
    });

    const master=document.getElementById('lapMasterDataNav');
    if(master){
      master.onclick=(e)=>{
        e.preventDefault();
        loadScript('lap-master-data-loader-fix','./master-data-v1.js?v=3',()=>{
          window.openMasterData?.();
        });
      };
    }

    const users=document.getElementById('lapUsersNav');
    if(users){
      users.onclick=(e)=>{
        e.preventDefault();
        loadScript('lap-users-loader-fix','./user-management-v1.js?v=2',()=>{
          window.openUserManagement?.();
        });
      };
    }

    nav.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href')||'';
      if(!href || href==='javascript:void(0)')return;
      a.onclick=(e)=>{
        if(e.defaultPrevented)return;
        window.location.href=href;
      };
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wire,50),{once:true});
  else setTimeout(wire,50);
  setTimeout(wire,300);
  setTimeout(wire,1000);
})();
