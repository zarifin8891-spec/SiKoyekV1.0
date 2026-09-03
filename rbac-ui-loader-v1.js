(function(){
  'use strict';
  if(document.getElementById('rbac-ui-lock-v2-script')){window.applyRBACUiLock?.();return}
  const s=document.createElement('script');
  s.id='rbac-ui-lock-v2-script';
  s.src='./rbac-ui-lock-v2.js?v=1';
  s.defer=true;
  s.onload=()=>window.applyRBACUiLock?.();
  document.body.appendChild(s);
})();
