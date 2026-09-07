/* SiKoyek V1.0 — Kinerja print bridge v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PRINT_KINERJA_BRIDGE_V1__)return;
  window.__SIKOYEK_LAPORAN_PRINT_KINERJA_BRIDGE_V1__=true;

  function handle(e){
    const button=e.target?.closest?.('#laporanPrintV1');
    if(!button)return;
    const active=document.querySelector('.laporan-v3 .report-tabs button.active');
    if(active?.dataset?.report!=='kinerja')return;
    const fn=window.__SIKOYEK_PRINT_KINERJA_V1__;
    if(typeof fn!=='function')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    fn();
  }

  document.addEventListener('click',handle,true);
})();
