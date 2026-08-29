(function(){
  'use strict';
  function fixProjectsTitle(){
    if(typeof state==='undefined'||state.page!=='projects')return;
    const h=document.querySelector('#page .top h1')||document.querySelector('.top h1');
    if(h&&h.textContent.trim()==='Projects')h.textContent='Daftar Proyek';
  }
  function fixMasterData(){
    if(typeof state==='undefined'||state.page!=='master-data')return;
    document.querySelectorAll('#page .md-kicker').forEach(el=>el.remove());
  }
  function fixPeriodTable(){
    const tables=[...document.querySelectorAll('.period-performance-section .pp-table-wrap table.table')];
    tables.forEach(table=>{
      const head=table.querySelector('thead tr');
      if(!head)return;
      const labels=['Proyek','Kas Masuk','Kas Keluar','Arus Kas Bersih','Transaksi'];
      [...head.children].forEach((th,i)=>{
        if(i<labels.length)th.textContent=labels[i];
        th.style.setProperty('position','sticky','important');
        th.style.setProperty('top','0','important');
        th.style.setProperty('display','table-cell','important');
        th.style.setProperty('vertical-align','middle','important');
        th.style.setProperty('height','32px','important');
        th.style.setProperty('line-height','1.1','important');
        th.style.setProperty('white-space','nowrap','important');
        th.style.setProperty('overflow','hidden','important');
      });
      table.style.setProperty('table-layout','fixed','important');
      table.style.setProperty('width','100%','important');
      const widths=['35%','18%','18%','20%','9%'];
      [...table.rows].forEach(row=>[...row.children].forEach((cell,i)=>{
        if(i<widths.length)cell.style.setProperty('width',widths[i],'important');
        cell.style.setProperty('position','static','important');
      }));
    });
  }
  function apply(){fixProjectsTitle();fixMasterData();fixPeriodTable()}
  const boot=()=>{apply();setTimeout(apply,150);setTimeout(apply,600)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(()=>apply()).observe(document.body,{childList:true,subtree:true});
  setInterval(apply,1200);
})();
