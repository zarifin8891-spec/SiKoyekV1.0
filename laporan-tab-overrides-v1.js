/* SiKoyek V1.0 — Laporan tab overrides v5 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_TAB_OVERRIDES_V5__)return;
  window.__SIKOYEK_LAPORAN_TAB_OVERRIDES_V5__=true;
  function start(){
    const root=document.querySelector('.laporan-v3');if(!root)return false;
    const tabs=root.querySelector('.report-tabs');if(!tabs)return false;
    tabs.querySelector('[data-report="cashflow"]')?.remove();tabs.querySelector('[data-report="period"]')?.remove();tabs.querySelector('[data-report="export"]')?.remove();
    let k=tabs.querySelector('[data-report="kinerja"]');
    if(!k){k=document.createElement('button');k.type='button';k.dataset.report='kinerja';k.textContent='Kinerja Proyek';tabs.appendChild(k)}
    if(k.dataset.kv5==='1')return true;k.dataset.kv5='1';
    k.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();
      const content=document.getElementById('reportContent');
      root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b===k));
      if(content)content.innerHTML='<div class="card"><div class="empty">Memuat Kinerja Proyek...</div></div>';
      try{if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN_V2__!=='function')throw new Error('Modul Kinerja Proyek v2 belum dimuat.');await window.__SIKOYEK_LAPORAN_KINERJA_OPEN_V2__();}
      catch(err){if(content)content.innerHTML='<div class="card"><div class="empty">Gagal memuat Kinerja Proyek: '+String(err?.message||err)+'</div></div>'}
    },true);
    return true;
  }
  function boot(){let n=0;const tick=()=>{if(start()||++n>=120)return;setTimeout(tick,100)};tick();const t=document.body||document.documentElement;if(t)new MutationObserver(()=>start()).observe(t,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
