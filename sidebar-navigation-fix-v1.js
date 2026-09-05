/* SiKoyek V1.0 — global sidebar compatibility layer. */
(function(){
  'use strict';
  if(window.__SIKOYEK_SIDEBAR_NAV_FIX_V2__)return;
  window.__SIKOYEK_SIDEBAR_NAV_FIX_V2__=true;

  function install(){
    if(!document.body)return;
    if(!document.getElementById('sikoyek-sidebar-nav-fix-style-v2')){
      const s=document.createElement('style');
      s.id='sikoyek-sidebar-nav-fix-style-v2';
      s.textContent=`
        .sidebar{position:relative;z-index:200}
        .sidebar .nav{position:relative;z-index:201}
        .sidebar .nav a,.sidebar .nav button{
          color:#cbd5e1!important;
          text-decoration:none!important;
          pointer-events:auto!important;
          cursor:pointer!important;
        }
        .sidebar .nav a:hover,.sidebar .nav a.active,
        .sidebar .nav button:hover,.sidebar .nav button.active{
          color:#fff!important;
          text-decoration:none!important;
        }
      `;
      document.head.appendChild(s);
    }
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;
    nav.querySelectorAll('a,button').forEach(el=>{
      el.style.setProperty('pointer-events','auto','important');
      el.style.setProperty('cursor','pointer','important');
    });
  }

  function handle(e){
    /* Laporan owns its navigation. Never intercept the canonical shell. */
    if(location.pathname.toLowerCase().endsWith('laporan.html'))return;

    const el=e.target?.closest?.('.sidebar .nav a,.sidebar .nav button');
    if(!el)return;
    const text=String(el.textContent||'').trim().toLowerCase();

    if(text==='dashboard'){
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.go==='function')window.go('dashboard');else window.location.href='./index.html';
      return;
    }
    if(text==='daftar proyek'||text==='projects'){
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.go==='function')window.go('projects');else window.location.href='./workspace.html';
      return;
    }
    if(text==='laporan'){
      e.preventDefault();e.stopImmediatePropagation();
      window.location.href='./laporan.html';
      return;
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  document.addEventListener('click',handle,true);
})();
