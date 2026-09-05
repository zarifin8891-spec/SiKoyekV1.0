/* SiKoyek V1.0 — canonical core navigation.
   Core menu navigation is always direct URL navigation and never depends on the
   previous page's runtime state. RBAC may hide items, but must not redirect them. */
(function(){
  'use strict';

  const items=[
    ['Dashboard','./index.html','DASHBOARD'],
    ['Daftar Proyek','./daftar-proyek.html','PROJECTS'],
    ['Data Master','./master-data.html','MASTER_DATA'],
    ['Daftar User','./user-management.html','USERS'],
    ['Laporan','./laporan.html','LAPORAN']
  ];

  function currentKey(){
    const p=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    if(p==='laporan.html')return 'LAPORAN';
    if(p==='daftar-proyek.html'||p==='workspace.html')return 'PROJECTS';
    if(p==='master-data.html')return 'MASTER_DATA';
    if(p==='user-management.html')return 'USERS';
    return 'DASHBOARD';
  }

  function apply(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;

    const active=currentKey();
    const current=JSON.stringify([...nav.querySelectorAll('a')].map(a=>[a.textContent.trim(),a.getAttribute('href'),a.classList.contains('active')]));
    const expected=JSON.stringify(items.map(([label,href,key])=>[label,href,key===active]));
    if(current===expected)return;

    nav.innerHTML=items.map(([label,href,key])=>{
      const attrs=[
        `href="${href}"`,
        key===active?'class="active"':'',
        `data-rbac-nav-wired="1"`,
        `data-core-nav-v2="1"`,
        `data-rbac-module="${key}"`,
        'data-rbac-action="VIEW"'
      ].filter(Boolean).join(' ');
      const extra=key==='MASTER_DATA'?' data-master-data-nav="1"':key==='USERS'?' data-users-nav="1"':key==='LAPORAN'?' data-laporan-nav="1"':'';
      return `<a ${attrs}${extra}>${label}</a>`;
    }).join('');
  }

  function boot(){
    apply();
    clearTimeout(window.__sikoyekCoreNavTimer);
    window.__sikoyekCoreNavTimer=setTimeout(apply,120);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
