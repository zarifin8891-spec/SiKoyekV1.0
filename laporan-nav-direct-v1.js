/* SiKoyek V1.0 — direct navigation for the five core menus. */
(function(){
  'use strict';
  function apply(){
    if(!location.pathname.toLowerCase().endsWith('laporan.html'))return;
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return;
    nav.innerHTML=`
      <a href="index.html" data-rbac-nav-wired="1">Dashboard</a>
      <a href="daftar-proyek.html" data-rbac-nav-wired="1">Daftar Proyek</a>
      <a href="master-data.html" data-rbac-nav-wired="1">Data Master</a>
      <a href="user-management.html" data-rbac-nav-wired="1">Daftar User</a>
      <a href="laporan.html" class="active" data-rbac-nav-wired="1">Laporan</a>`;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else setTimeout(apply,0);
})();
