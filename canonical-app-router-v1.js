/* SiKoyek V1.0 — single canonical SPA renderer/router for core menus. */
(function(){
  'use strict';
  if(!/index\.html$/i.test(location.pathname) && location.pathname!=='/') return;
  if(window.__SIKOYEK_CANONICAL_SPA_ROUTER_V1__) return;
  window.__SIKOYEK_CANONICAL_SPA_ROUTER_V1__=true;

  const VIEW_MAP={
    dashboard:'dashboard',
    projects:'projects',
    'master-data':'master-data',
    users:'users'
  };

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
    nav.innerHTML=`
      <button type="button" data-core-view="dashboard">Dashboard</button>
      <button type="button" data-core-view="projects">Daftar Proyek</button>
      <button type="button" data-core-view="master-data">Data Master</button>
      <button type="button" data-core-view="users">Daftar User</button>
      <button type="button" data-core-view="laporan">Laporan</button>`;
    nav.querySelectorAll('[data-core-view]').forEach(btn=>{
      btn.addEventListener('click',()=>route(btn.dataset.coreView));
    });
    const view=activeView();
    nav.querySelector(`[data-core-view="${view==='detail'?'projects':view}"]`)?.classList.add('active');
    return true;
  }

  function loadUserModule(){
    if(window.openUserManagement) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=document.getElementById('canonical-user-module-script');
      if(existing){
        existing.addEventListener('load',()=>resolve(),{once:true});
        existing.addEventListener('error',()=>reject(new Error('User Management module gagal dimuat.')),{once:true});
        return;
      }
      const s=document.createElement('script');
      s.id='canonical-user-module-script';
      s.src='./user-management-v1.js?v=6';
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('User Management module gagal dimuat.'));
      document.body.appendChild(s);
    });
  }

  async function route(view){
    if(view==='laporan'){location.href='./laporan.html';return;}
    setView(view);
    try{
      if(view==='dashboard'){
        await window.go?.('dashboard');
      }else if(view==='projects'){
        await window.go?.('projects');
      }else if(view==='master-data'){
        if(window.openMasterData) await window.openMasterData();
      }else if(view==='users'){
        await loadUserModule();
        if(window.openUserManagement) await window.openUserManagement();
      }
      ensureNav();
    }catch(e){
      console.error('SiKoyek canonical route:',e);
      const page=document.getElementById('page');
      if(page) page.innerHTML='<div class="card"><div class="empty">Gagal membuka modul: '+String(e?.message||e)+'</div></div>';
    }
  }

  function patchFunction(name,view){
    const fn=window[name];
    if(typeof fn!=='function' || fn.__canonicalWrapped)return false;
    const wrapped=async function(){
      setView(view);
      const result=await fn.apply(this,arguments);
      ensureNav();
      return result;
    };
    wrapped.__canonicalWrapped=true;
    window[name]=wrapped;
    return true;
  }

  function boot(){
    if(!document.getElementById('app')) return;
    if(!ensureNav()) return;
    patchFunction('go','dashboard');
    const originalGo=window.go;
    if(originalGo && !originalGo.__canonicalRouterGoPatched){
      const wrappedGo=async function(page){
        const target=page==='master-data'?'master-data':page==='users'?'users':page==='projects'?'projects':'dashboard';
        setView(target);
        const result=await originalGo.apply(this,arguments);
        ensureNav();
        return result;
      };
      wrappedGo.__canonicalRouterGoPatched=true;
      window.go=wrappedGo;
    }
    if(window.openMasterData && !window.openMasterData.__canonicalRouterPatched){
      const fn=window.openMasterData;
      const wrapped=async function(){setView('master-data');const r=await fn.apply(this,arguments);ensureNav();return r};
      wrapped.__canonicalRouterPatched=true;window.openMasterData=wrapped;
    }
    if(window.openUserManagement && !window.openUserManagement.__canonicalRouterPatched){
      const fn=window.openUserManagement;
      const wrapped=async function(){setView('users');const r=await fn.apply(this,arguments);ensureNav();return r};
      wrapped.__canonicalRouterPatched=true;window.openUserManagement=wrapped;
    }
    const view=activeView();
    if(view!=='dashboard') route(view);
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    boot();
    if(window.__SIKOYEK_CANONICAL_SPA_READY__ || attempts>100) clearInterval(timer);
    if(document.querySelector('.sidebar .nav') && document.getElementById('app')) window.__SIKOYEK_CANONICAL_SPA_READY__=true;
  },100);
})();
