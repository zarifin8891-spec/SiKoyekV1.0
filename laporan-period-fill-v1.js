/* SiKoyek V1.0 — Laporan period helper */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PERIOD_FILL_V1__)return;
  window.__SIKOYEK_LAPORAN_PERIOD_FILL_V1__=true;

  function localDate(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function fill(prefix){
    const period=document.getElementById(prefix+'Period');
    const from=document.getElementById(prefix+'From');
    const to=document.getElementById(prefix+'To');
    if(!period||!from||!to)return;

    const kind=period.value||'all';
    const now=new Date();
    const today=localDate(now);
    let start='',end='';

    if(kind==='today'){
      start=end=today;
    }else if(kind==='week'){
      const first=new Date(now);
      first.setDate(now.getDate()-((now.getDay()+6)%7));
      start=localDate(first);
      end=today;
    }else if(kind==='month'){
      start=localDate(new Date(now.getFullYear(),now.getMonth(),1));
      end=localDate(new Date(now.getFullYear(),now.getMonth()+1,0));
    }else if(kind==='quarter'){
      const first=new Date(now);
      first.setDate(now.getDate()-89);
      start=localDate(first);
      end=today;
    }else if(kind==='year'){
      start=localDate(new Date(now.getFullYear(),0,1));
      end=localDate(new Date(now.getFullYear(),11,31));
    }

    if(kind==='all'){
      from.value='';
      to.value='';
    }else if(kind==='custom'){
      /* Keep manually entered custom dates. */
    }else{
      from.value=start;
      to.value=end;
    }
  }

  function attach(prefix){
    const period=document.getElementById(prefix+'Period');
    if(!period||period.dataset.periodFillBound==='1')return;
    period.dataset.periodFillBound='1';
    period.addEventListener('change',()=>{
      fill(prefix);
      /* Let the native Laporan handlers update the report using the new dates. */
    });
    fill(prefix);
  }

  function setup(){
    attach('sum');
    attach('prog');
  }

  const observer=new MutationObserver(setup);
  const start=()=>{
    setup();
    const page=document.getElementById('page');
    if(page)observer.observe(page,{childList:true,subtree:true});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
