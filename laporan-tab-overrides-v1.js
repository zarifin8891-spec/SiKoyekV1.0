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

    let kinerja=tabs.querySelector('[data-report="kinerja"]');
    if(!kinerja){
      kinerja=document.createElement('button');
      kinerja.type='button';
      kinerja.dataset.report='kinerja';
      kinerja.textContent='Kinerja Proyek';
      tabs.appendChild(kinerja);
    }
    if(kinerja.dataset.bound==='1')return true;
    kinerja.dataset.bound='1';
    kinerja.addEventListener('click',async e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b===kinerja));
      const content=document.getElementById('reportContent');
      if(content)content.innerHTML='<div class="card"><div class="empty">Memuat Kinerja Proyek...</div></div>';
      try{
        if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function')await window.__SIKOYEK_LAPORAN_KINERJA_OPEN();
        else if(typeof window.openLaporanKinerjaProyek==='function')await window.openLaporanKinerjaProyek();
        else content.innerHTML='<div class="card"><div class="empty">Modul Kinerja Proyek belum siap.</div></div>';
      }catch(err){if(content)content.innerHTML='<div class="card"><div class="empty">Gagal memuat Kinerja Proyek: '+String(err?.message||err)+'</div></div>'}
    },true);
    return true;
  }

  function boot(){
    let n=0;const tick=()=>{if(start()||++n>=80)return;setTimeout(tick,100)};tick();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(()=>start()).observe(target,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();