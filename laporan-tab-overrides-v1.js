/* SiKoyek V1.0 — Laporan tab overrides v4 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_TAB_OVERRIDES_V4__)return;
  window.__SIKOYEK_LAPORAN_TAB_OVERRIDES_V4__=true;

  function loadKinerjaModule(){
    return new Promise((resolve,reject)=>{
      if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function')return resolve(true);
      const src='./laporan-kinerja-bootstrap-v1.js?v=2&reload='+Date.now();
      const s=document.createElement('script');
      s.src=src;s.async=false;
      s.onload=()=>{
        if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function')return resolve(true);
        if(typeof window.__SIKOYEK_KINERJA_BOOTSTRAP_OPEN==='function'){
          window.__SIKOYEK_KINERJA_BOOTSTRAP_OPEN().then(()=>resolve(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function')).catch(reject);
          return;
        }
        resolve(false);
      };
      s.onerror=()=>reject(new Error('Gagal memuat modul Kinerja Proyek.'));
      document.head.appendChild(s);
    });
  }

  async function openKinerjaFromButton(btn){
    const root=document.querySelector('.laporan-v3');
    if(!root)return;
    root.querySelectorAll('[data-report]').forEach(b=>b.classList.toggle('active',b===btn));
    const content=document.getElementById('reportContent');
    if(content)content.innerHTML='<div class="card"><div class="empty">Memuat Kinerja Proyek...</div></div>';
    try{
      if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN!=='function'){
        const ready=await loadKinerjaModule();
        if(!ready)throw new Error('Modul Kinerja Proyek belum menyediakan fungsi pembuka.');
      }
      await window.__SIKOYEK_LAPORAN_KINERJA_OPEN();
    }catch(err){
      if(content)content.innerHTML='<div class="card"><div class="empty">Gagal memuat Kinerja Proyek: '+String(err?.message||err)+'</div></div>';
    }
  }

  function bindKinerja(btn){
    if(!btn||btn.dataset.kinerjaOverrideV4==='1')return !!btn;
    btn.dataset.kinerjaOverrideV4='1';
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      openKinerjaFromButton(btn);
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
