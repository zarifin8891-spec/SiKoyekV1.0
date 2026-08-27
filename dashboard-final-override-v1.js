/* SiKoyek Dashboard Final Override V2 — direct DOM transformation. */
(function(){
  'use strict';
  function dashboard(){return [...document.querySelectorAll('.content')].find(x=>x.querySelector('.top h1')?.textContent.trim().toLowerCase()==='dashboard');}
  function style(){if(document.getElementById('dashboard-final-v2-style'))return;const s=document.createElement('style');s.id='dashboard-final-v2-style';s.textContent=`
.dashboard-panels{grid-template-columns:minmax(0,44fr) minmax(0,56fr)!important;gap:14px!important}
.dashboard-panel{min-width:0!important}
.dashboard-panel .table{width:100%!important;table-layout:fixed!important}
.dashboard-panel .table th,.dashboard-panel .table td{padding:10px 10px!important;font-size:11px!important;line-height:1.25!important;vertical-align:middle!important}
.dashboard-panel .table th{font-size:9px!important;white-space:normal!important}
.dashboard-health-panel .table th:nth-child(1),.dashboard-health-panel .table td:nth-child(1){width:41%!important}
.dashboard-health-panel .table th:nth-child(2),.dashboard-health-panel .table td:nth-child(2){width:12%!important}
.dashboard-health-panel .table th:nth-child(3),.dashboard-health-panel .table td:nth-child(3){width:13%!important}
.dashboard-health-panel .table th:nth-child(4),.dashboard-health-panel .table td:nth-child(4){width:19%!important}
.dashboard-health-panel .table th:nth-child(5),.dashboard-health-panel .table td:nth-child(5){width:15%!important}
.dashboard-health-panel .table td:first-child{white-space:normal!important}
.dashboard-decision-panel .table th:nth-child(1),.dashboard-decision-panel .table td:nth-child(1){width:32%!important}
.dashboard-decision-panel .table th:nth-child(2),.dashboard-decision-panel .table td:nth-child(2){width:12%!important}
.dashboard-decision-panel .table th:nth-child(3),.dashboard-decision-panel .table td:nth-child(3){width:11%!important}
.dashboard-decision-panel .table th:nth-child(4),.dashboard-decision-panel .table td:nth-child(4){width:22%!important;white-space:normal!important}
.dashboard-decision-panel .table th:nth-child(5),.dashboard-decision-panel .table td:nth-child(5){width:23%!important;white-space:normal!important}
@media(max-width:1100px){.dashboard-panels{grid-template-columns:1fr!important}}
@media(max-width:780px){.dashboard-panel .scroll{overflow-x:auto!important}}
`;document.head.appendChild(s)}
  function fix(){const d=dashboard();if(!d)return;const panels=d.querySelector('.dashboard-panels');if(!panels)return;style();const hp=panels.querySelector('.dashboard-health-panel')||panels.children[0];const dp=panels.querySelector('.dashboard-decision-panel')||panels.children[1];if(!hp||!dp)return;
    const hh=hp.querySelector('.sectiontitle h2');if(hh)hh.textContent='Kesehatan Proyek';
    const hn=hp.querySelector('.sectiontitle .note');if(hn)hn.textContent='Progress vs Rasio Biaya & RAP Terpakai';
    const ht=hp.querySelector('thead tr');if(ht){const th=ht.children;if(th[0])th[0].textContent='Proyek';if(th[1])th[1].textContent='Progress';if(th[2])th[2].innerHTML='Rasio<br>Biaya';if(th[3])th[3].innerHTML='RAP<br>Terpakai';if(th[4])th[4].textContent='Status';if(th[5])th[5].remove();}
    hp.querySelectorAll('tbody tr').forEach(tr=>{if(tr.children[5])tr.children[5].remove();});
    const dh=dp.querySelector('.sectiontitle h2');if(dh)dh.textContent='Prioritas & Tindakan';
    const dn=dp.querySelector('.sectiontitle .note');if(dn)dn.textContent='Rekomendasi berbasis Kesehatan Proyek';
    const dt=dp.querySelector('thead tr');if(dt){const th=dt.children;if(th[0])th[0].textContent='Proyek';if(th[1])th[1].textContent='Prioritas';if(th[2])th[2].textContent='Status';if(th[3])th[3].innerHTML='Masalah<br>Utama';if(!th[4]){const x=document.createElement('th');x.textContent='Tindakan';dt.appendChild(x)}else th[4].textContent='Tindakan';}
    dp.querySelectorAll('tbody tr').forEach(tr=>{if(!tr.children.length)return;if(!tr.children[4]){const td=document.createElement('td');td.textContent='Pertahankan kontrol dan lanjutkan pemantauan rutin.';tr.appendChild(td)}});
  }
  function boot(){fix();const obs=new MutationObserver(fix);obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setInterval(fix,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
