/* SiKoyek V1.0 — Laporan tab overrides v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_TAB_OVERRIDES_V1__)return;
  window.__SIKOYEK_LAPORAN_TAB_OVERRIDES_V1__=true;

  function start(){
    const root=document.querySelector('.laporan-v3');
    if(!root)return false;
    const tabs=root.querySelector('.report-tabs');
    if(!tabs)return false;

    tabs.querySelector('[data-report="cashflow"]')?.remove();
    tabs.querySelector('[data-report="period"]')?.remove();
    tabs.querySelector('[data-report="export"]')?.remove();

    if(!tabs.querySelector('[data-report="kinerja"]')){
      const kinerja=document.createElement('button');
      kinerja.type='button';
      kinerja.dataset.report='kinerja';
      kinerja.textContent='Kinerja Proyek';
      tabs.appendChild(kinerja);
    }
    return true;
  }

  function boot(){
    let n=0;const tick=()=>{if(start()||++n>=80)return;setTimeout(tick,100)};tick();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(()=>start()).observe(target,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();