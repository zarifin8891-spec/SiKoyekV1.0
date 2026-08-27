/* SiKoyek Dashboard Final Override V5 — compact lower panels + readable zebra rows. */
(function(){
  'use strict';
  function dashboard(){return [...document.querySelectorAll('.content')].find(x=>x.querySelector('.top h1')?.textContent.trim().toLowerCase()==='dashboard');}
  function style(){if(document.getElementById('dashboard-final-v5-style'))return;const s=document.createElement('style');s.id='dashboard-final-v5-style';s.textContent=`
.dashboard-panels{grid-template-columns:minmax(0,40fr) minmax(0,60fr)!important;gap:14px!important;align-items:stretch!important}
.dashboard-panel{min-width:0!important;box-sizing:border-box!important}
.dashboard-panel .table{width:100%!important;table-layout:fixed!important}
.dashboard-panel .table th,.dashboard-panel .table td{padding:4px 7px!important;font-size:10px!important;line-height:1.08!important;vertical-align:middle!important}
.dashboard-panel .table th{font-size:8.5px!important;line-height:1.05!important;white-space:normal!important;padding-top:5px!important;padding-bottom:5px!important}
.dashboard-panel .table tbody tr:nth-child(odd) td{background:#ffffff!important}
.dashboard-panel .table tbody tr:nth-child(even) td{background:#f4f7fb!important}
.dashboard-panel .table tbody tr{height:auto!important}
.dashboard-health-panel .table th:nth-child(1),.dashboard-health-panel .table td:nth-child(1){width:39%!important}
.dashboard-health-panel .table th:nth-child(2),.dashboard-health-panel .table td:nth-child(2){width:13%!important}
.dashboard-health-panel .table th:nth-child(3),.dashboard-health-panel .table td:nth-child(3){width:14%!important}
.dashboard-health-panel .table th:nth-child(4),.dashboard-health-panel .table td:nth-child(4){width:19%!important}
.dashboard-health-panel .table th:nth-child(5),.dashboard-health-panel .table td:nth-child(5){width:15%!important}
.dashboard-health-panel .table td:first-child{white-space:normal!important}
.dashboard-decision-panel .table th:nth-child(1),.dashboard-decision-panel .table td:nth-child(1){width:29%!important}
.dashboard-decision-panel .table th:nth-child(2),.dashboard-decision-panel .table td:nth-child(2){width:11%!important}
.dashboard-decision-panel .table th:nth-child(3),.dashboard-decision-panel .table td:nth-child(3){width:11%!important}
.dashboard-decision-panel .table th:nth-child(4),.dashboard-decision-panel .table td:nth-child(4){width:24%!important;white-space:normal!important}
.dashboard-decision-panel .table th:nth-child(5),.dashboard-decision-panel .table td:nth-child(5){width:25%!important;white-space:normal!important}
.dashboard-decision-panel .table td:first-child{white-space:normal!important}
.dashboard-panel .sectiontitle{margin-bottom:5px!important}
@media(max-width:1100px){.dashboard-panels{grid-template-columns:1fr!important}.dashboard-panel{height:auto!important}}
@media(max-width:780px){.dashboard-panel .scroll{overflow-x:auto!important}}
`;document.head.appendChild(s)}
  function equalize(){const d=dashboard();if(!d)return;const panels=d.querySelector('.dashboard-panels');if(!panels)return;const hp=panels.querySelector('.dashboard-health-panel')||panels.children[0];const dp=panels.querySelector('.dashboard-decision-panel')||panels.children[1];if(!hp||!dp)return;
    if(window.innerWidth<=1100){hp.style.height='';dp.style.height='';return;}
    hp.style.height='';dp.style.height='';
    const h=Math.max(hp.scrollHeight,dp.scrollHeight);
    hp.style.height=h+'px';dp.style.height=h+'px';
  }
  function fix(){const d=dashboard();if(!d)return;const panels=d.querySelector('.dashboard-panels');if(!panels)return;style();const hp=panels.querySelector('.dashboard-health-panel')||panels.children[0];const dp=panels.querySelector('.dashboard-decision-panel')||panels.children[1];if(!hp||!dp)return;
    const hh=hp.querySelector('.sectiontitle h2');if(hh)hh.textContent='Kesehatan Proyek';
    const hn=hp.querySelector('.sectiontitle .note');if(hn)hn.textContent='Progress vs Rasio Biaya & RAP Terpakai';
    const ht=hp.querySelector('thead tr');if(ht){const th=ht.children;if(th[0])th[0].textContent='Proyek';if(th[1])th[1].textContent='Progress';if(th[2])th[2].innerHTML='Rasio<br>Biaya';if(th[3])th[3].innerHTML='RAP<br>Terpakai';if(th[4])th[4].textContent='Status';if(th[5])th[5].remove();}
    hp.querySelectorAll('tbody tr').forEach(tr=>{if(tr.children[5])tr.children[5].remove();});
    const dh=dp.querySelector('.sectiontitle h2');if(dh)dh.textContent='Prioritas & Tindakan';
    const dn=dp.querySelector('.sectiontitle .note');if(dn)dn.textContent='Rekomendasi berbasis Kesehatan Proyek';
    const dt=dp.querySelector('thead tr');if(dt){const th=dt.children;if(th[0])th[0].textContent='Proyek';if(th[1])th[1].textContent='Prioritas';if(th[2])th[2].textContent='Status';if(th[3])th[3].innerHTML='Masalah<br>Utama';if(!th[4]){const x=document.createElement('th');x.textContent='Tindakan';dt.appendChild(x)}else th[4].textContent='Tindakan';}
    dp.querySelectorAll('tbody tr').forEach(tr=>{if(!tr.children.length)return;if(!tr.children[4]){const td=document.createElement('td');td.textContent='Pertahankan kontrol dan lanjutkan pemantauan rutin.';tr.appendChild(td)}});
    requestAnimationFrame(equalize);
  }
  function boot(){fix();const obs=new MutationObserver(fix);obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setInterval(fix,1500);window.addEventListener('resize',equalize)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
