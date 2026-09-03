(function(){
  if(window.__SIKOYEK_USER_SIDEBAR_FIX_V3__) return;
  window.__SIKOYEK_USER_SIDEBAR_FIX_V3__=true;
  function cleanDuplicates(nav){
    if(!nav)return;
    const list=[...nav.querySelectorAll('button,a')].filter(el=>String(el.textContent||'').trim().toLowerCase()==='daftar user');
    if(list.length<=1)return;
    const keep=list.find(el=>el.matches('[data-users-nav]'))||list[0];
    list.forEach(el=>{if(el!==keep)el.remove()});
  }
  function ensure(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav || typeof window.openUserManagement!=='function')return;
    cleanDuplicates(nav);
    let b=nav.querySelector('[data-users-nav]');
    if(!b){
      b=document.createElement('button');
      b.type='button';
      b.dataset.usersNav='1';
      b.textContent='Daftar User';
      b.onclick=window.openUserManagement;
      nav.appendChild(b);
    }
    cleanDuplicates(nav);
    window.applyRBACNav?.();
    window.applyRBACUiLock?.();
  }
  function loadResetModule(){
    if(document.getElementById('user-management-reset-v1-script'))return;
    const s=document.createElement('script');
    s.id='user-management-reset-v1-script';
    s.src='./user-management-reset-v1.js?v=1';
    s.defer=true;
    document.body.appendChild(s);
  }
  const boot=()=>{
    ensure();loadResetModule();
    if(!window.__SIKOYEK_USER_SIDEBAR_OBS_V3__){
      window.__SIKOYEK_USER_SIDEBAR_OBS_V3__=new MutationObserver(()=>setTimeout(ensure,20));
      window.__SIKOYEK_USER_SIDEBAR_OBS_V3__.observe(document.body,{childList:true,subtree:true});
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setTimeout(ensure,100);
  setTimeout(ensure,300);
  setTimeout(ensure,700);
})();
