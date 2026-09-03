(function(){
  'use strict';
  const id='rbac-ui-lock-v3-script';
  const apply=()=>window.applyRBACUiLock?.();
  if(document.getElementById(id)){apply();return}
  const s=document.createElement('script');
  s.id=id;
  s.src='./rbac-ui-lock-v3.js?v=1';
  s.defer=true;
  s.onload=apply;
  document.body.appendChild(s);
})();
