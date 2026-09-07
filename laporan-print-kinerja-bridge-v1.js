/* SiKoyek V1.0 — Kinerja print bridge v2 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PRINT_KINERJA_BRIDGE_V2__)return;
  window.__SIKOYEK_LAPORAN_PRINT_KINERJA_BRIDGE_V2__=true;

  function loadPrinter(){
    if(typeof window.__SIKOYEK_PRINT_KINERJA_V1==='function')return Promise.resolve(window.__SIKOYEK_PRINT_KINERJA_V1__);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-kinerja-print-bridge-load="1"]');
      if(existing){existing.addEventListener('load',()=>resolve(window.__SIKOYEK_PRINT_KINERJA_V1__),{once:true});existing.addEventListener('error',()=>reject(new Error('Gagal memuat handler cetak Kinerja Proyek.')),{once:true});return;}
      const s=document.createElement('script');
      s.src='./laporan-print-kinerja-v1.js?v=99&reload='+Date.now();
      s.async=false;s.dataset.kinerjaPrintBridgeLoad='1';
      s.onload=()=>typeof window.__SIKOYEK_PRINT_KINERJA_V1__==='function'?resolve(window.__SIKOYEK_PRINT_KINERJA_V1__):reject(new Error('Handler cetak Kinerja Proyek belum tersedia.'));
      s.onerror=()=>reject(new Error('Gagal memuat handler cetak Kinerja Proyek.'));
      document.head.appendChild(s);
    });
  }

  async function run(button){
    const root=document.querySelector('.laporan-v3');
    const active=root?.querySelector('.report-tabs button.active');
    if(!button||active?.dataset?.report!=='kinerja')return;
    try{
      const fn=await loadPrinter();
      if(typeof fn!=='function')throw new Error('Handler cetak Kinerja Proyek tidak ditemukan.');
      fn();
    }catch(err){
      console.error('SiKoyek print bridge:',err);
      alert(String(err?.message||err));
    }
  }

  function bind(button){
    if(!button||button.dataset.kinerjaPrintBridgeV2==='1')return;
    button.dataset.kinerjaPrintBridgeV2='1';
    button.addEventListener('click',e=>{
      const active=document.querySelector('.laporan-v3 .report-tabs button.active');
      if(active?.dataset?.report!=='kinerja')return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      run(button);
    },true);
  }

  function scan(){
    const root=document.querySelector('.laporan-v3');
    if(!root)return;
    const btn=document.getElementById('laporanPrintV1');
    if(btn)bind(btn);
  }

  scan();
  const target=document.body||document.documentElement;
  if(target)new MutationObserver(scan).observe(target,{childList:true,subtree:true});
})();
