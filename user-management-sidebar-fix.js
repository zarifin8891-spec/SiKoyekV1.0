/* SiKoyek V1.0 — compatibility cleanup for legacy user navigation injection. */
(function(){
  'use strict';
  if(window.__SIKOYEK_USER_SIDEBAR_CLEANUP_V4__)return;
  window.__SIKOYEK_USER_SIDEBAR_CLEANUP_V4__=true;
  function clean(){
    const nav=document.querySelector('.sidebar .nav');if(!nav)return;
    const items=[...nav.querySelectorAll('button,a')].filter(x=>String(x.textContent||'').trim().toLowerCase()==='daftar user');
    if(items.length>1)items.slice(1).forEach(x=>x.remove());
    window.applyRBACNav?.();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
  new MutationObserver(()=>{clearTimeout(window.__sikoyekUserNavCleanTimer);window.__sikoyekUserNavCleanTimer=setTimeout(clean,40)}).observe(document.body,{childList:true,subtree:true});
})();
