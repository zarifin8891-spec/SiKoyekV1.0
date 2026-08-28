/* SiKoyek Dashboard Final Override V12 — visual authority for lower Dashboard panels. */
(function(){
'use strict';
const dashboard=()=>[...document.querySelectorAll('.content')].find(x=>(x.querySelector('.top h1')?.textContent||'').trim().toLowerCase()==='dashboard');
function panels(){
 const d=dashboard();
 if(!d)return [];
 const staticHealth=d.querySelector('.dashboard-static-health');
 const staticDecision=d.querySelector('.dashboard-static-decision');
 if(staticHealth||staticDecision)return [staticHealth,staticDecision];
 const p=d.querySelector('.dashboard-panels');
 return p?[p.querySelector('#health-engine-v1-card')||p.children[0],p.querySelector('#decision-engine-v1-card')||p.children[1]]:[];
}
function style(){if(document.getElementById('dashboard-final-v12-style'))return;const s=document.createElement('style');s.id='dashboard-final-v12-style';s.textContent=`
.dashboard-panels{display:grid!important;grid-template-columns:minmax(0,40fr) minmax(0,60fr)!important;gap:14px!important;align-items:start!important}
.dashboard-panel{min-width:0!important;min-height:0!important;height:auto!important;box-sizing:border-box!important}
.dashboard-lower-v3-grid{display:grid!important;grid-template-columns:minmax(0,40fr) minmax(0,60fr)!important;gap:14px!important;align-items:start!important}
.dashboard-static-health,.dashboard-static-decision{min-width:0!important;min-height:0!important;height:auto!important;box-sizing:border-box!important}
.dashboard-static-health .tablecard,.dashboard-static-decision .tablecard,#health-engine-v1-card .tablecard,#decision-engine-v1-card .tablecard{min-height:0!important;height:auto!important;max-height:none!important;overflow:hidden!important}
.dashboard-static-health .scroll,.dashboard-static-decision .scroll,#health-engine-v1-card .scroll,#decision-engine-v1-card .scroll{height:auto!important;max-height:none!important;overflow:hidden!important}
.dashboard-static-health .table,.dashboard-static-decision .table,#health-engine-v1-card .table,#decision-engine-v1-card .table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
.dashboard-static-health .table th,.dashboard-static-health .table td,.dashboard-static-decision .table th,.dashboard-static-decision .table td,#health-engine-v1-card .table th,#health-engine-v1-card .table td,#decision-engine-v1-card .table th,#decision-engine-v1-card .table td{box-sizing:border-box!important;min-width:0!important;vertical-align:middle!important}
/* FINAL VISUAL REQUIREMENT: Status belongs only to the right panel. */
.dashboard-static-health .table th:nth-child(5),.dashboard-static-health .table td:nth-child(5),#health-engine-v1-card .table th:nth-child(5),#health-engine-v1-card .table td:nth-child(5){display:none!important}
.dashboard-static-decision .table th:nth-child(3),.dashboard-static-decision .table td:nth-child(3),#decision-engine-v1-card .table th:nth-child(3),#decision-engine-v1-card .table td:nth-child(3){display:none!important}
.dashboard-static-health .table th{font-size:8.5px!important;line-height:1.1!important;padding:5px 9px!important}
.dashboard-static-health .table td{padding:4px 9px!important;font-size:10.5px!important;line-height:1.16!important;white-space:normal!important}
.dashboard-static-health .table th:nth-child(1),.dashboard-static-health .table td:nth-child(1){width:43%!important}
.dashboard-static-health .table th:nth-child(2),.dashboard-static-health .table td:nth-child(2){width:16%!important}
.dashboard-static-health .table th:nth-child(3),.dashboard-static-health .table td:nth-child(3){width:18%!important}
.dashboard-static-health .table th:nth-child(4),.dashboard-static-health .table td:nth-child(4){width:23%!important}
.dashboard-static-health .table td:first-child{font-weight:700!important}
#health-engine-v1-card .table th{font-size:8.5px!important;line-height:1.1!important}
#health-engine-v1-card .table td{padding:4px 9px!important;font-size:10.5px!important;line-height:1.16!important;white-space:normal!important}
#health-engine-v1-card .table th:nth-child(1),#health-engine-v1-card .table td:nth-child(1){width:43%!important}
#health-engine-v1-card .table th:nth-child(2),#health-engine-v1-card .table td:nth-child(2){width:16%!important}
#health-engine-v1-card .table th:nth-child(3),#health-engine-v1-card .table td:nth-child(3){width:18%!important}
#health-engine-v1-card .table th:nth-child(4),#health-engine-v1-card .table td:nth-child(4){width:23%!important}
.dashboard-static-decision .table th,.dashboard-static-decision .table td{padding:4px 9px!important;font-size:10.5px!important;line-height:1.16!important;vertical-align:middle!important;box-sizing:border-box!important;white-space:normal!important}
.dashboard-static-decision .table th{font-size:8.5px!important;line-height:1.1!important}
.dashboard-static-decision .table th:nth-child(1),.dashboard-static-decision .table td:nth-child(1){width:38%!important}
.dashboard-static-decision .table th:nth-child(2),.dashboard-static-decision .table td:nth-child(2){width:18%!important}
.dashboard-static-decision .table th:nth-child(4),.dashboard-static-decision .table td:nth-child(4){width:20%!important}
.dashboard-static-decision .table th:nth-child(5),.dashboard-static-decision .table td:nth-child(5){width:24%!important}
#decision-engine-v1-card .table th:nth-child(1),#decision-engine-v1-card .table td:nth-child(1){width:38%!important}
#decision-engine-v1-card .table th:nth-child(2),#decision-engine-v1-card .table td:nth-child(2){width:18%!important}
#decision-engine-v1-card .table th:nth-child(4),#decision-engine-v1-card .table td:nth-child(4){width:20%!important}
#decision-engine-v1-card .table th:nth-child(5),#decision-engine-v1-card .table td:nth-child(5){width:24%!important}
.dashboard-static-health .table tbody tr:nth-child(odd),.dashboard-static-decision .table tbody tr:nth-child(odd),.dashboard-panel .table tbody tr:nth-child(odd){background:#fff!important}
.dashboard-static-health .table tbody tr:nth-child(even),.dashboard-static-decision .table tbody tr:nth-child(even),.dashboard-panel .table tbody tr:nth-child(even){background:#eef4f9!important}
.dashboard-static-health .table tbody td,.dashboard-static-decision .table tbody td,.dashboard-panel .table tbody td{border-bottom:1px solid #dfe7ef!important}
.dashboard-static-health .table tbody tr:last-child td,.dashboard-static-decision .table tbody tr:last-child td,.dashboard-panel .table tbody tr:last-child td{border-bottom:0!important}
@media(max-width:1100px){.dashboard-panels,.dashboard-lower-v3-grid{grid-template-columns:1fr!important}}
`;
document.head.appendChild(s)}
function normalizeHealth(hp){const t=hp?.querySelector('.table');if(!t)return;const cg=t.querySelector('colgroup');if(cg)cg.remove();const hr=t.querySelector('thead tr');if(hr){while(hr.children.length>5)hr.lastElementChild.remove();if(hr.children.length===6)hr.children[1].remove()}t.querySelectorAll('tbody tr').forEach(tr=>{if(tr.children.length>=6)tr.children[1].remove();while(tr.children.length>5)tr.lastElementChild.remove()})}
function normalizeDecision(dp){const t=dp?.querySelector('.table');if(!t)return;const hr=t.querySelector('thead tr');if(hr){const cells=[...hr.children];if(cells.length>=5){const status=[...cells].findIndex(x=>(x.textContent||'').trim().toLowerCase()==='status');if(status>=0)cells[status].remove()}}t.querySelectorAll('tbody tr').forEach(tr=>{const cells=[...tr.children];const statusCell=cells.findIndex(x=>(x.textContent||'').trim().toLowerCase()==='sehat');if(cells.length>=5){if(statusCell>=0)cells[statusCell].remove();else if(cells.length===5)cells[2].remove()}while(tr.children.length>4)tr.lastElementChild.remove()})}
function labels(hp,dp){if(hp){const h=hp.querySelector('.sectiontitle h2'),n=hp.querySelector('.sectiontitle .note');if(h)h.textContent='Kondisi Proyek';if(n)n.textContent='Progress vs Rasio Biaya & RAP Terpakai';const r=hp.querySelector('thead tr')?.children;if(r){if(r[0])r[0].textContent='Proyek';if(r[1])r[1].textContent='Progress';if(r[2])r[2].innerHTML='Rasio<br>Biaya';if(r[3])r[3].innerHTML='RAP<br>Terpakai';if(r[4])r[4].textContent='Status'}}if(dp){const h=dp.querySelector('.sectiontitle h2'),n=dp.querySelector('.sectiontitle .note');if(h)h.textContent='Prioritas & Tindakan';if(n)n.textContent='Rekomendasi berbasis Kondisi Proyek';const r=dp.querySelector('thead tr')?.children;if(r){if(r[0])r[0].textContent='Proyek';if(r[1])r[1].textContent='Prioritas';if(r[2])r[2].innerHTML='Masalah<br>Utama';if(r[3])r[3].textContent='Tindakan'}}}
function syncRows(){const [hp,dp]=panels();if(!hp||!dp||window.innerWidth<=1100)return;normalizeHealth(hp);normalizeDecision(dp);const lt=hp.querySelector('.table'),rt=dp.querySelector('.table');if(!lt||!rt)return;const lr=[...lt.querySelectorAll('tbody tr')],rr=[...rt.querySelectorAll('tbody tr')];if(!lr.length||!rr.length)return;lr.forEach(r=>r.style.removeProperty('height'));const heights=rr.map(r=>Math.ceil(r.getBoundingClientRect().height));lr.forEach((r,i)=>{if(i<heights.length)r.style.setProperty('height',heights[i]+'px','important')})}
function fix(){const [hp,dp]=panels();if(!hp||!dp)return;style();normalizeHealth(hp);normalizeDecision(dp);labels(hp,dp);requestAnimationFrame(()=>{syncRows();setTimeout(syncRows,100)})}
function boot(){fix();const obs=new MutationObserver(()=>{window.clearTimeout(window.__sikoyekFinalTimer);window.__sikoyekFinalTimer=setTimeout(fix,50)});obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});window.addEventListener('resize',()=>requestAnimationFrame(syncRows));setInterval(syncRows,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
