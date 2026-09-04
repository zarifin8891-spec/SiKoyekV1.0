/* SiKoyek V1.0 — compatibility bridge to centralized RBAC + Laporan shell. */
(function(){
  'use strict';
  const run=()=>{
    if(location.pathname.toLowerCase().endsWith('laporan.html')){
      if(!document.getElementById('laporan-shell-fix-v1-script')){
        const s=document.createElement('script');s.id='laporan-shell-fix-v1-script';s.src='./laporan-shell-fix-v1.js?v=1';s.defer=true;document.head.appendChild(s);
      }
    }
    window.applyRBACNav?.();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else setTimeout(run,0);
})();
