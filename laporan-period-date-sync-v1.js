/* SiKoyek V1.0 — Laporan period date synchronization */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PERIOD_DATE_SYNC_V1__)return;
  window.__SIKOYEK_LAPORAN_PERIOD_DATE_SYNC_V1__=true;

  const toDate=d=>{
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };

  function sync(prefix){
    const period=document.getElementById(prefix+'Period');
    const from=document.getElementById(prefix+'From');
    const to=document.getElementById(prefix+'To');
    if(!period||!from||!to)return;

    const now=new Date();
    let start='',end='';
    switch(period.value){
      case 'today':
        start=end=toDate(now);
        break;
      case 'week':{
        const monday=new Date(now);
        monday.setDate(now.getDate()-((now.getDay()+6)%7));
        start=toDate(monday);
        end=toDate(now);
        break;
      }
      case 'month':
        start=toDate(new Date(now.getFullYear(),now.getMonth(),1));
        end=toDate(new Date(now.getFullYear(),now.getMonth()+1,0));
        break;
      case 'quarter':{
        const startDate=new Date(now);
        startDate.setDate(now.getDate()-89);
        start=toDate(startDate);
        end=toDate(now);
        break;
      }
      case 'year':
        start=toDate(new Date(now.getFullYear(),0,1));
        end=toDate(new Date(now.getFullYear(),11,31));
        break;
      case 'all':
        start=end='';
        break;
      case 'custom':
      default:
        return;
    }

    from.value=start;
    to.value=end;
  }

  function bind(prefix){
    const period=document.getElementById(prefix+'Period');
    if(!period||period.dataset.periodDateSync==='1')return;
    period.dataset.periodDateSync='1';
    period.addEventListener('change',()=>setTimeout(()=>sync(prefix),0));
    sync(prefix);
  }

  function apply(){
    bind('sum');
    bind('prog');
  }

  function boot(){
    apply();
    setTimeout(apply,100);
    setTimeout(apply,400);
    setTimeout(apply,900);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();
