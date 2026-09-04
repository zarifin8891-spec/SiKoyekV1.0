/* SiKoyek V1.0 — compatibility bridge to centralized RBAC + canonical Laporan shell. */
(function(){
  'use strict';
  const load=(id,src)=>{
    if(document.getElementById(id))return;
    const s=document.createElement('script');
    s.id=id;
    s.src=src;
    s.defer=true;
    document.head.appendChild(s);
  };

  const run=()=>{
    if(location.pathname.toLowerCase().endsWith('laporan.html')){
      /* Laporan now has one canonical shell. The previous two repair scripts
         competed with RBAC and could recreate/duplicate sidebar entries. */
      load('laporan-shell-clean-v1-script','./laporan-shell-clean-v1.js?v=1');
    }
    window.applyRBACNav?.();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else setTimeout(run,0);
})();
