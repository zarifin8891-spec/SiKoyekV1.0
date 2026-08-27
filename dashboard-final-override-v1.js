/* SiKoyek Dashboard Final Override V6 — right-row reference + exact left row sync. */
(function(){
'use strict';
const dashboard=()=>[...document.querySelectorAll('.content')].find(x=>(x.querySelector('.top h1')?.textContent||'').trim().toLowerCase()==='dashboard');
function panels(){const d=dashboard(),p=d?.querySelector('.dashboard-panels');return p?[p.querySelector('.dashboard-health-panel')||p.children[0],p.querySelector('.dashboard-decision-panel')||p.children[1]]:[]}
function style(){if(document.getElementById('dashboard-final-v6-style'))return;const s=document.createElement('style');s.id='dashboard-final-v6-style';s.textContent=`
.dashboard-panels{display:grid!important;grid-template-columns:minmax(0,40fr) minmax(0,60fr)!important;gap:14px!important;align-items:start!important}
.dashboard-panel{min-width:0!important;min-height:0!important;height:auto!important;box-sizing:border-box!important}
.dashboard-panel .tablecard{min-height:0!important;height:auto!important;max-height:none!important;overflow:hidden!important}
.dashboard-panel .scroll{height:auto!important;max-height:none!important;overflow:hidden!important}
.dashboard-panel .table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
.dashboard-panel .table th,.dashboard-panel .table td{font-size:10.5px!important;line-height:1.16!important;vertical-align:middle!important}
.dashboard-panel .table th{font-size:8.5px!important;line-height:1.12!important;white-space:normal!important}
.dashboard-panel:last-child .table th,.dashboard-panel:last-child .table td{padding:4px 9px!important}
.dashboard-health-panel .table th:nth-child(6),.dashboard-health-panel .table td:nth-child(6){display:none!important}
.dashboard-health-panel .table thead tr,.dashboard-health-panel .table tbody tr{grid-template-columns:39% 13% 14% 19% 15%!important}
.dashboard-health-panel .table thead{display:block!important;width:100%!important}
.dashboard-health-panel .table thead tr{display:grid!important;width:100%!important}
.dashboard-health-panel .table thead th{box-sizing:border-box!important;padding:5px 9px!important}
.dashboard-health-panel .table tbody{display:grid!important;width:100%!important}
.dashboard-health-panel .table tbody tr{display:grid!important;width:100%!important;min-height:0!important;height:auto!important}
.dashboard-health-panel .table tbody td{box-sizing:border-box!important;width:auto!important;padding:4px 9px!important;white-space:normal!important;min-height:0!important;height:auto!important}
.dashboard-decision-panel .table th:nth-child(1),.dashboard-decision-panel .table td:nth-child(1){width:29%!important;white-space:normal!important}
.dashboard-decision-panel .table th:nth-child(2),.dashboard-decision-panel .table td:nth-child(2){width:11%!important}
.dashboard-decision-panel .table th:nth-child(3),.dashboard-decision-panel .table td:nth-child(3){width:11%!important}
.dashboard-decision-panel .table th:nth-child(4),.dashboard-decision-panel .table td:nth-child(4){width:24%!important;white-space:normal!important}
.dashboard-decision-panel .table th:nth-child(5),.dashboard-decision-panel .table td:nth-child(5){width:25%!important;white-space:normal!important}
.dashboard-panel .table tbody tr:nth-child(odd){background:#fff!important}
.dashboard-panel .table tbody tr:nth-child(even){background:#eef4f9!important}
.dashboard-panel .table tbody td{border-bottom:1px solid #dfe7ef!important}
.dashboard-panel .table tbody tr:last-child td{border-bottom:0!important}
@media(max-width:1100px){.dashboard-panels{grid-template-columns:1fr!important}.dashboard-health-panel .table thead,.dashboard-health-panel .table tbody{display:table-header-group!important}.dashboard-health-panel .table tbody{display:table-row-group!important}.dashboard-health-panel .table thead tr,.dashboard-health-panel .table tbody tr{display:table-row!important;grid-template-columns:none!important;height:auto!important}.dashboard-health-panel .table tbody td{height:auto!important}}
@media(max-width:780px){.dashboard-panel .scroll{overflow-x:auto!important}}
`;document.head.appendChild(s)}
function cleanHealth(hp){const t=hp?.querySelector('.table');if(!t)return;const hr=t.querySelector('thead tr');if(hr)while(hr.children.length>5)hr.lastElementChild.remove();t.querySelectorAll('tbody tr').forEach(tr=>{while(tr.children.length>5)tr.lastElementChild.remove()})}
function labels(hp,dp){if(hp){const h=hp.querySelector('.sectiontitle h2');const n=hp.querySelector('.sectiontitle .note');if(h)h.textContent='Kondisi Proyek';if(n)n.textContent='Progress vs Rasio Biaya & RAP Terpakai';const r=hp.querySelector('thead tr')?.children;if(r){if(r[0])r[0].textContent='Proyek';if(r[1])r[1].textContent='Progress';if(r[2])r[2].innerHTML='Rasio<br>Biaya';if(r[3])r[3].innerHTML='RAP<br>Terpakai';if(r[4])r[4].textContent='Status'}}if(dp){const h=dp.querySelector('.sectiontitle h2');const n=dp.querySelector('.sectiontitle .note');if(h)h.textContent='Prioritas & Tindakan';if(n)n.textContent='Rekomendasi berbasis Kondisi Proyek';const r=dp.querySelector('thead tr')?.children;if(r){if(r[0])r[0].textContent='Proyek';if(r[1])r[1].textContent='Prioritas';if(r[2])r[2].textContent='Status';if(r[3])r[3].innerHTML='Masalah<br>Utama';if(r[4])r[4].textContent='Tindakan'}}}
function syncRows(){const [hp,dp]=panels();if(!hp||!dp||window.innerWidth<=1100)return;cleanHealth(hp);const lt=hp.querySelector('.table'),rt=dp.querySelector('.table');if(!lt||!rt)return;const lr=[...lt.querySelectorAll('tbody tr')],rr=[...rt.querySelectorAll('tbody tr')];if(!lr.length||!rr.length)return;lr.forEach(r=>{r.style.removeProperty('height');r.querySelectorAll('td').forEach(td=>{td.style.removeProperty('height');td.style.removeProperty('min-height')})});void lt.offsetHeight;const heights=rr.map(r=>Math.max(1,Math.ceil(r.getBoundingClientRect().height)));lt.querySelector('tbody').style.setProperty('grid-template-rows',heights.map(h=>h+'px').join(' '),'important');lr.forEach((r,i)=>{const h=heights[i%heights.length];r.style.setProperty('height',h+'px','important');r.style.setProperty('min-height',h+'px','important');r.querySelectorAll('td').forEach(td=>{td.style.setProperty('height',h+'px','important');td.style.setProperty('min-height',h+'px','important');td.style.setProperty('box-sizing','border-box','important')})})}
function fix(){const [hp,dp]=panels();if(!hp||!dp)return;style();cleanHealth(hp);labels(hp,dp);dp.querySelectorAll('tbody tr').forEach(tr=>{if(tr.children.length<5){const td=document.createElement('td');td.textContent='Pertahankan kontrol dan lanjutkan pemantauan rutin.';tr.appendChild(td)}});requestAnimationFrame(()=>{syncRows()})}
function boot(){fix();const obs=new MutationObserver(()=>fix());obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});window.addEventListener('resize',()=>requestAnimationFrame(syncRows));setInterval(syncRows,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
