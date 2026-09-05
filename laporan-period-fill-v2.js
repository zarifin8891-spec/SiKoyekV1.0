/* SiKoyek V1.0 — Laporan period autofill v2 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PERIOD_FILL_V2__)return;
  window.__SIKOYEK_LAPORAN_PERIOD_FILL_V2__=true;

  const desired={sum:'all',prog:'all'};

  function localDate(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function range(kind){
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

  function fill(prefix,keepCustom){
    const period=document.getElementById(prefix+'Period');
    const from=document.getElementById(prefix+'From');
    const to=document.getElementById(prefix+'To');
    if(!period||!from||!to)return;

    const kind=desired[prefix]||period.value||'all';
    if(period.value!==kind)period.value=kind;
    if(kind==='custom'&&keepCustom)return;

    const r=range(kind);
    from.value=r.from;
    to.value=r.to;
  }

  function attach(prefix){
    const period=document.getElementById(prefix+'Period');
    if(!period)return;
    if(period.dataset.periodFillBound!=='2'){
      period.dataset.periodFillBound='2';
      period.addEventListener('change',()=>{
        desired[prefix]=period.value||'all';
        fill(prefix,false);
      },true);
    }
    fill(prefix,true);
  }

  function setup(){
    attach('sum');
    attach('prog');
  }

  const observer=new MutationObserver(()=>setup());

  function start(){
    setup();
    const page=document.getElementById('page');
    if(page)observer.observe(page,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
