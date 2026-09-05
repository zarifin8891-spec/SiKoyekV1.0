/* SiKoyek V1.0 — Unified Core Menu Shell */
(function(){
  'use strict';
  if(window.__SIKOYEK_UNIFIED_CORE__)return;
  window.__SIKOYEK_UNIFIED_CORE__=true;

  const CORE=new Set(['dashboard','projects','master-data','users','laporan']);
  const loadScript=(src,key)=>new Promise((resolve,reject)=>{
    if(key && typeof window[key]==='function')return resolve();
    const existing=document.querySelector('script[data-unified-load="'+src+'"]');
    if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',()=>reject(new Error('Gagal memuat '+src)),{once:true});return}
    const s=document.createElement('script');
    s.src=src;s.async=false;s.dataset.unifiedLoad=src;
    s.onload=resolve;s.onerror=()=>reject(new Error('Gagal memuat '+src));
    document.head.appendChild(s);
  });

  function nav(active){
    return `<aside class="sidebar"><div class="sidebrand">SiKoyek <b>V1.0</b></div><div class="nav">
      <button type="button" data-core-page="dashboard" class="${active==='dashboard'?'active':''}" onclick="go('dashboard')">Dashboard</button>
      <button type="button" data-core-page="projects" class="${active==='projects'||active==='detail'?'active':''}" onclick="go('projects')">Daftar Proyek</button>
      <button type="button" data-core-page="master-data" data-master-data-nav="1" class="${active==='master-data'?'active':''}" onclick="go('master-data')">Data Master</button>
      <button type="button" data-core-page="users" data-users-nav="1" class="${active==='users'?'active':''}" onclick="go('users')">Daftar User</button>
      <button type="button" data-core-page="laporan" data-laporan-nav="1" class="${active==='laporan'?'active':''}" onclick="go('laporan')">Laporan</button>
    </div><div class="sidefoot">Project Control • V1.0</div></aside>`;
  }

  function moduleHeader(title,desc){return `<div class="top core-module-header"><div><h1>${title}</h1><p>${desc}</p></div></div>`}

  function hashPage(){
    const key=String(location.hash||'').replace(/^#/,'').trim().toLowerCase();
    return ({'':'dashboard','dashboard':'dashboard','projects':'projects','daftar-proyek':'projects','master-data':'master-data','data-master':'master-data','users':'users','user-management':'users','daftar-user':'users','laporan':'laporan'})[key]||'dashboard';
  }

  async function ensureModules(){
    if(!window.openUserManagement)await loadScript('./user-management-v1.js?v=5','openUserManagement');
    if(!window.openLaporan)await loadScript('./laporan-v1.js?v=5','openLaporan');
  }

  async function unifiedGo(page){
    page=CORE.has(page)?page:'dashboard';
    state.page=page;state.selected=null;state.detail=null;
    if(page==='dashboard'||page==='projects')await loadSummary();
    renderApp();
    location.hash=page==='dashboard'?'':page;
  }

  async function unifiedRenderPage(){
    const el=document.getElementById('page');
    if(!el)return;
    const page=state.page;
    if(page==='dashboard'){el.innerHTML=dashboard();return}
    if(page==='projects'){
      el.innerHTML=projects();
      const h=el.querySelector('.top h1');if(h)h.textContent='Daftar Proyek';
      return;
    }
    if(page==='detail'){renderDetail(el);return}
    if(page==='master-data'){
      if(typeof window.openMasterData==='function')return window.openMasterData();
      el.innerHTML='<div class="empty">Modul Data Master belum siap.</div>';return;
    }
    if(page==='users'){
      if(typeof window.openUserManagement==='function'){
        if(window.__SIKOYEK_USER_MOUNTING__)return;
        window.__SIKOYEK_USER_MOUNTING__=true;
        const savedRenderApp=window.renderApp;
        window.renderApp=()=>{};
        try{await window.openUserManagement()}finally{window.renderApp=savedRenderApp;window.__SIKOYEK_USER_MOUNTING__=false}
        const heading=document.querySelector('#page .um-head h1');if(heading)heading.textContent='Daftar User';
        return;
      }
      el.innerHTML='<div class="empty">Modul Daftar User belum siap.</div>';return;
    }
    if(page==='laporan'){
      if(typeof window.openLaporan==='function'){
        await window.openLaporan();
        const p=document.getElementById('page');
        if(p && !p.querySelector('.core-module-header'))p.insertAdjacentHTML('afterbegin',moduleHeader('Laporan','Ringkasan dan progress proyek.'));
        return;
      }
      el.innerHTML='<div class="empty">Modul Laporan belum siap.</div>';return;
    }
  }

  function unifiedRenderApp(){
    const app=document.getElementById('app');if(!app)return;
    app.innerHTML=`<div class="shell">${nav(state.page)}<main class="content"><div id="page"></div></main></div>`;
    unifiedRenderPage();
  }

  window.nav=nav;
  window.go=unifiedGo;
  window.renderApp=unifiedRenderApp;
  window.renderPage=unifiedRenderPage;

  window.addEventListener('hashchange',async()=>{
    const next=hashPage();
    if(state.page!==next){state.page=next;state.selected=null;state.detail=null;unifiedRenderApp()}
  });

  (async function bootUnified(){
    try{
      await ensureModules();
      const {data:{session}}=await sb.auth.getSession();
      if(!session)return;
      state.page=hashPage();
      unifiedRenderApp();
    }catch(e){console.warn('SiKoyek unified shell:',e)}
  })();
})();
