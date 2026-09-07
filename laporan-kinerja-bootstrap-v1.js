/* SiKoyek V1.0 — Kinerja Proyek bootstrap v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_KINERJA_BOOTSTRAP_V1__)return;
  window.__SIKOYEK_KINERJA_BOOTSTRAP_V1__=true;
  async function boot(){
    if(typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function')return true;
    const src='./laporan-kinerja-proyek-v1.js?boot='+Date.now();
    const res=await fetch(src,{cache:'no-store'});
    if(!res.ok)throw new Error('Gagal memuat modul Kinerja Proyek.');
    let text=await res.text();
    text=text.replace(/__SIKOYEK_LAPORAN_KINERJA_PROYEK_V1__/g,'__SIKOYEK_LAPORAN_KINERJA_PROYEK_BOOTSTRAP_V1__');
    (0,eval)(text);
    return typeof window.__SIKOYEK_LAPORAN_KINERJA_OPEN==='function';
  }
  window.__SIKOYEK_KINERJA_BOOTSTRAP_OPEN=boot;
  boot().catch(err=>console.warn('SiKoyek Kinerja bootstrap:',err));
})();
