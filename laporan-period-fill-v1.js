/* SiKoyek V1.0 — Laporan period autofill v3 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PERIOD_FILL_V3__)return;
  window.__SIKOYEK_LAPORAN_PERIOD_FILL_V3__=true;

  function localDate(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function getRange(kind){
    const now=new Date();
    const today=localDate(now);
    if(kind==='all')return {from:'',to:''};
    if(kind==='today')return {from:today,to:today};
    if(kind==='week'){
      const first=new Date(now);
      first.setDate(now.getDate()-((now.getDay()+6)%7));
      return {from:localDate(first),to:today};
    }
    if(kind==='month'){
      return {
        from:localDate(new Date(now.getFullYear(),now.getMonth(),1)),
        to:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))
      };
    }
    if(kind==='quarter'){
      const first=new Date(now);
      first.setDate(now.getDate()-89);
      return {from:localDate(first),to:today};
    }
    if(kind==='year'){
      return {
        from:localDate(new Date(now.getFullYear(),0,1)),
        to:localDate(new Date(now.getFullYear(),11,31))
      };
    }
    return {from:'',to:''};
  }

  function fill(prefix){
    const period=document.getElementById(prefix+'Period');
    const from=document.getElementById(prefix+'From');
    const to=document.getElementById(prefix+'To');
    if(!period||!from||!to)return false;

    const kind=period.value||'all';
    if(kind==='custom')return false;

    const range=getRange(kind);
    if(from.value!==range.from)from.value=range.from;
    if(to.value!==range.to)to.value=range.to;
    return true;
  }

  function bind(prefix){
    const period=document.getElementById(prefix+'Period');
    if(!period||period.dataset.periodFillBoundV3==='1')return;
    period.dataset.periodFillBoundV3='1';
    period.addEventListener('change',()=>{
      /* Run after the native Laporan change handler so its rerender, if any,
         has completed before we write the calculated dates. */
      setTimeout(()=>fill(prefix),0);
      setTimeout(()=>fill(prefix),25);
    });
    fill(prefix);
  }

  function scan(){
    bind('sum');
    bind('prog');
  }

  const observer=new MutationObserver(scan);
  function start(){
    scan();
    const page=document.getElementById('page');
    if(page)observer.observe(page,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
