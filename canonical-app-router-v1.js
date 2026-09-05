/* SiKoyek V1.0 — single canonical SPA renderer/router for core menus. */
(function(){
  'use strict';
  if(!/index\.html$/i.test(location.pathname) && location.pathname!=='/') return;
  if(window.__SIKOYEK_CANONICAL_SPA_ROUTER_V1__) return;
  window.__SIKOYEK_CANONICAL_SPA_ROUTER_V1__=true;

  const VIEW_MAP={dashboard:'dashboard',projects:'projects','master-data':'master-data',users:'users'};

  function setView(view){
    const url=new URL(location.href);
    if(view==='dashboard') url.search='';
    else url.search='?view='+encodeURIComponent(view);
    history.replaceState({view},'',url.href);
  }

  function activeView(){
    const v=new URLSearchParams(location.search).get('view');
    return VIEW_MAP[v]||'dashboard';
  }

  function ensureNav(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav)return false;
    const current=activeView();
    nav.innerHTML=`
      <button type="button" data-core-view="dashboard">Dashboard</button>
      <button type="button" data-core-view="projects">Daftar Proyek</button>
      <button type="button" data-core-view="master-data">Data Master</button>
      <button type="button" data-core-view="users">Daftar User</button>
      <button type="button" data-core-view="laporan">Laporan</button>`;
    nav.querySelectorAll('[data-core-view]').forEach(btn=>btn.addEventListener('click',()=>route(btn.dataset.coreView)));
    nav.querySelector(`[data-core-view="${current}"]`)?.classList.add('active');
    return true;
  }

  function loadUserModule(){
    if(window.openUserManagement)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=document.getElementById('canonical-user-module-script');
      if(existing){
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',()=>reject(new Error('User Management module gagal dimuat.')),{once:true});
        return;
      }
      const s=document.createElement('script');
      s.id='canonical-user-module-script';
      s.src='./user-management-v1.js?v=6';
      s.onload=resolve;
      s.onerror=()=>reject(new Error('User Management module gagal dimuat.'));
      document.body.appendChild(s);
    });
  }

  async function route(view){
    if(view==='laporan'){location.href='./laporan.html';return;}
    setView(view);
    try{
      if(view==='dashboard') await window.go?.('dashboard');
      else if(view==='projects') await window.go?.('projects');
      else if(view==='master-data') await window.openMasterData?.();
      else if(view==='users'){
        await loadUserModule();
        await window.openUserManagement?.();
      }
      ensureNav();
    }catch(e){
      console.error('SiKoyek canonical route:',e);
      const page=document.getElementById('page');
      if(page)page.innerHTML='<div class="card"><div class="empty">Gagal membuka modul: '+String(e?.message||e)+'</div></div>';
    }
  }

  function patchNavigationFunctions(){
    if(typeof window.go==='function'&&!window.go.__canonicalRouterPatched){
      const original=window.go;
      const wrapped=async function(page){
        const target=page==='projects'?'projects':page==='master-data'?'master-data':page==='users'?'users':'dashboard';
        setView(target);
        const result=await original.apply(this,arguments);
        ensureNav();
        return result;
      };
      wrapped.__canonicalRouterPatched=true;
      window.go=wrapped;
    }
    if(typeof window.openMasterData==='function'&&!window.openMasterData.__canonicalRouterPatched){
      const original=window.openMasterData;
      const wrapped=async function(){setView('master-data');const result=await original.apply(this,arguments);ensureNav();return result};
      wrapped.__canonicalRouterPatched=true;
      window.openMasterData=wrapped;
    }
  }

  let initialRouted=false;
  function boot(){
    if(!document.getElementById('app'))return false;
    if(!ensureNav())return false;
    patchNavigationFunctions();
    if(!initialRouted){
      initialRouted=true;
      const view=activeView();
      if(view!=='dashboard')route(view);
    }
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(boot()||attempts>100)clearInterval(timer);
  },100);
})();
