(function(){
  if(window.__SIKOYEK_USER_SIDEBAR_FIX__) return;
  window.__SIKOYEK_USER_SIDEBAR_FIX__=true;
  function ensure(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav || typeof window.openUserManagement!=='function') return;
    if(nav.querySelector('[data-users-nav]')) return;
    const b=document.createElement('button');
    b.type='button';
    b.dataset.usersNav='1';
    b.textContent='Daftar User';
    b.onclick=window.openUserManagement;
    nav.appendChild(b);
  }
  const boot=()=>{ensure(); if(!window.__SIKOYEK_USER_SIDEBAR_OBS__){
    window.__SIKOYEK_USER_SIDEBAR_OBS__=new MutationObserver(()=>setTimeout(ensure,20));
    window.__SIKOYEK_USER_SIDEBAR_OBS__.observe(document.body,{childList:true,subtree:true});
  }};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(ensure,100);
  setTimeout(ensure,300);
})();
