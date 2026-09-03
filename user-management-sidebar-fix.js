(function(){
  if(window.__SIKOYEK_USER_SIDEBAR_FIX_V2__) return;
  window.__SIKOYEK_USER_SIDEBAR_FIX_V2__=true;
  function ensure(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav || typeof window.openUserManagement!=='function') return;
    let b=nav.querySelector('[data-users-nav]');
    if(!b){
      b=document.createElement('button');
      b.type='button';
      b.dataset.usersNav='1';
      b.textContent='Daftar User';
      b.onclick=window.openUserManagement;
      nav.appendChild(b);
    }
    if(typeof window.applyRBACNav==='function') setTimeout(window.applyRBACNav,0);
  }
  function loadResetModule(){
    if(document.getElementById('user-management-reset-v1-script')) return;
    const s=document.createElement('script');
    s.id='user-management-reset-v1-script';
    s.src='./user-management-reset-v1.js?v=1';
    s.defer=true;
    document.body.appendChild(s);
  }
  const boot=()=>{ensure();loadResetModule(); if(!window.__SIKOYEK_USER_SIDEBAR_OBS_V2__){
    window.__SIKOYEK_USER_SIDEBAR_OBS_V2__=new MutationObserver(()=>setTimeout(ensure,20));
    window.__SIKOYEK_USER_SIDEBAR_OBS_V2__.observe(document.body,{childList:true,subtree:true});
  }};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(ensure,100);
  setTimeout(ensure,300);
})();
