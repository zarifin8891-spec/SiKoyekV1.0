/* SiKoyek V1.0 — compatibility bridge to centralized RBAC. */
(function(){
  'use strict';
  const run=()=>window.applyRBACNav?.();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else setTimeout(run,0);
})();
