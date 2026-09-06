/* SiKoyek V1.0 — Kinerja Proyek area chart override v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_KINERJA_AREA_V1__)return;
  window.__SIKOYEK_LAPORAN_KINERJA_AREA_V1__=true;

  const BASELINE_Y=285;

  function apply(){
    const svg=document.getElementById('kinerjaTrendSvg');
    if(!svg)return false;
    const paths=[...svg.querySelectorAll('path')];
    if(paths.length<3)return false;
    if(svg.dataset.kinerjaAreaApplied==='1' && svg.dataset.kinerjaAreaPathCount===String(paths.length))return true;

    paths.slice(0,3).forEach(path=>{
      const d=path.getAttribute('d')||'';
      const pts=[...d.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)];
      if(!pts.length)return;
      const last=pts[pts.length-1],first=pts[0];
      const areaD=`${d} L ${last[2]} ${BASELINE_Y} L ${first[2]} ${BASELINE_Y} Z`;
      const color=path.style.color||'currentColor';
      path.setAttribute('d',areaD);
      path.setAttribute('fill',color);
      path.setAttribute('fill-opacity','0.14');
      path.setAttribute('stroke',color);
      path.setAttribute('stroke-width','2.5');
      path.setAttribute('stroke-linejoin','round');
      path.style.color='';
    });

    [...svg.querySelectorAll('circle')].forEach(c=>c.setAttribute('r','3'));
    svg.dataset.kinerjaAreaApplied='1';
    svg.dataset.kinerjaAreaPathCount=String(paths.length);
    return true;
  }

  function boot(){
    apply();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(()=>apply()).observe(target,{childList:true,subtree:true});
    let n=0;
    const tick=()=>{apply();if(++n<80)setTimeout(tick,100)};
    tick();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
