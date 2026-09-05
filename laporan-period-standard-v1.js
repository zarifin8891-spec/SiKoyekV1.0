/* SiKoyek V1.0 — Unified period selector standard v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PERIOD_STANDARD_V1__)return;
  window.__SIKOYEK_LAPORAN_PERIOD_STANDARD_V1__=true;

  const KEYS={
    this_month:'month',
    last_month:'custom',
    this_year:'year',
    custom:'custom',
    all:'all'
  };

  function localDate(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function lastMonthRange(){
    const now=new Date();
    return {
      from:localDate(new Date(now.getFullYear(),now.getMonth()-1,1)),
      to:localDate(new Date(now.getFullYear(),now.getMonth(),0))
    };
  }

  function inferKey(select){
    const marked=select.dataset.periodStandardKey;
    if(marked)return marked;
    const value=select.value||'all';
    if(value==='month')return'this_month';
    if(value==='year')return'this_year';
    if(value==='all')return'all';
    if(value==='custom'){
      const prefix=select.id.slice(0,-6);
      const from=document.getElementById(prefix+'From')?.value||'';
      const to=document.getElementById(prefix+'To')?.value||'';
      const lm=lastMonthRange();
      if(from===lm.from&&to===lm.to)return'last_month';
      return'custom';
    }
    return'all';
  }

  function buildOptions(){
    return [
      ['month','this_month','Bulan Ini'],
      ['custom','last_month','Bulan Lalu'],
      ['year','this_year','Tahun Ini'],
      ['custom','custom','Custom'],
      ['all','all','Semua Periode']
    ].map(([value,key,label])=>`<option value="${value}" data-period-key="${key}">${label}</option>`).join('');
  }

  function setDateRange(prefix,key){
    if(key!=='last_month')return;
    const r=lastMonthRange();
    const from=document.getElementById(prefix+'From');
    const to=document.getElementById(prefix+'To');
    if(from)from.value=r.from;
    if(to)to.value=r.to;
    const custom=document.getElementById(prefix+'Custom');
    if(custom)custom.classList.remove('show');
  }

  function toggleCustomUI(prefix,key){
    const custom=document.getElementById(prefix+'Custom');
    if(!custom)return;
    custom.classList.toggle('show',key==='custom');
  }

  function apply(select){
    if(!select||!/Period$/.test(select.id))return;
    const currentKey=inferKey(select);
    if(select.dataset.periodStandardV1!=='1'){
      select.innerHTML=buildOptions();
      select.dataset.periodStandardV1='1';
      const index=[...select.options].findIndex(o=>o.dataset.periodKey===currentKey);
      select.selectedIndex=index>=0?index:4;
    }
    select.dataset.periodStandardKey=select.selectedOptions?.[0]?.dataset.periodKey||currentKey;
    const prefix=select.id.slice(0,-6);
    toggleCustomUI(prefix,select.dataset.periodStandardKey);
    if(select.dataset.periodStandardBound==='1')return;
    select.dataset.periodStandardBound='1';
    select.addEventListener('change',()=>{
      const key=select.selectedOptions?.[0]?.dataset.periodKey||'all';
      select.dataset.periodStandardKey=key;
      if(key==='last_month'){
        setDateRange(prefix,key);
        select.value='custom';
      }
      toggleCustomUI(prefix,key);
    },true);
  }

  function scan(){
    document.querySelectorAll('select[id$="Period"]').forEach(apply);
  }

  function start(){
    scan();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(scan).observe(target,{childList:true,subtree:true});
    let tries=0;
    const retry=()=>{scan();if(++tries<80)setTimeout(retry,100);};
    retry();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
