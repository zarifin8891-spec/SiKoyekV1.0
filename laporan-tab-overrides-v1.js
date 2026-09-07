/* SiKoyek V1.0 — Laporan tab overrides v3 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_TAB_OVERRIDES_V3__)return;
  window.__SIKOYEK_LAPORAN_TAB_OVERRIDES_V3__=true;

  function loadKinerjaModule(){
    return new Promise((resolve,reject)=>{
      if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function')return resolve(true);
      try{delete window.__SIKOYEK_LAPORAN_KINERJA_PROYEK_V1__;}catch(_){window.__SIKOYEK_LAPORAN_KINERJA_PROYEK_V1__=false;}
      const src='./laporan-kinerja-proyek-v1.js?v=2&reload='+Date.now();
      const s=document.createElement('script');
      s.src=src;s.async=false;
      s.onload=()=>resolve(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function');
      s.onerror=()=>reject(new Error('Gagal memuat modul Kinerja Proyek.'));
      document.head.appendChild(s);
    });
  }

  function bindKinerja(btn){
    if(!btn||btn.dataset.kinerjaOverrideV3==='1')return !!btn;
    btn.dataset.kinerjaOverrideV3='1';
    btn.addEventListener('click',async e=>{
      if(window.__SIKOYEK_KINERJA_REENTER__){window.__SIKOYEK_KINERJA_REENTER__=false;return;}
      e.preventDefault();
      e.stopImmediatePropagation();
      const root=document.querySelector('.laporan-v3');
      if(!root)return;
      root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b===btn));
      const content=document.getElementById('reportContent');
      if(content)content.innerHTML='<div class="card"><div class="empty">Memuat Kinerja Proyek...</div></div>';
      try{
        if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN!=='function')await loadKinerjaModule();
        if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function'){
          window.__SIKOYEK_KINERJA_REENTER__=true;
          btn.click();
        }else if(content){
          content.innerHTML='<div class="card"><div class="empty">Modul Kinerja Proyek belum siap dimuat.</div></div>';
        }
      }catch(err){
        if(content)content.innerHTML='<div class="card"><div class="empty">Gagal memuat Kinerja Proyek: '+String(err?.message||err)+'</div></div>';
      }
    },true);
    return true;
  }

  function start(){
    const root=document.querySelector('.laporan-v3');
    if(!root)return false;
    const tabs=root.querySelector('.report-tabs');
    if(!tabs)return false;
    tabs.querySelector('[data-report="cashflow"]')?.remove();
    tabs.querySelector('[data-report="period"]')?.remove();
    tabs.querySelector('[data-report="export"]')?.remove();
    let kinerja=tabs.querySelector('[data-report="kinerja"]');
    if(!kinerja){
      kinerja=document.createElement('button');
      kinerja.type='button';
      kinerja.dataset.report='kinerja';
      kinerja.textContent='Kinerja Proyek';
      tabs.appendChild(kinerja);
    }
    bindKinerja(kinerja);
    return true;
  }

  function boot(){
    let n=0;const tick=()=>{if(start()||++n>=120)return;setTimeout(tick,100)};tick();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(()=>start()).observe(target,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
