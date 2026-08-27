/* SiKoyek Dashboard Final Override V8 — deterministic five-column health grid. */
(function(){
'use strict';
const dashboard=()=>[...document.querySelectorAll('.content')].find(x=>(x.querySelector('.top h1')?.textContent||'').trim().toLowerCase()==='dashboard');
function panels(){const d=dashboard(),p=d?.querySelector('.dashboard-panels');return p?[p.querySelector('#health-engine-v1-card')||p.children[0],p.querySelector('#decision-engine-v1-card')||p.children[1]]:[]}
function style(){if(document.getElementById('dashboard-final-v8-style'))return;const s=document.createElement('style');s.id='dashboard-final-v8-style';s.textContent=`
.dashboard-panels{display:grid!important;grid-template-columns:minmax(0,40fr) minmax(0,60fr)!important;gap:14px!important;align-items:start!important}
.dashboard-panel{min-width:0!important;min-height:0!important;height:auto!important;box-sizing:border-box!important}
#health-engine-v1-card .tablecard,#decision-engine-v1-card .tablecard{min-height:0!important;height:auto!important;max-height:none!important;overflow:hidden!important}
#health-engine-v1-card .scroll,#decision-engine-v1-card .scroll{height:auto!important;max-height:none!important;overflow:hidden!important}
#health-engine-v1-card .table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;display:block!important}
#health-engine-v1-card .table thead,#health-engine-v1-card .table tbody{display:block!important;width:100%!important}
#health-engine-v1-card .table thead tr,#health-engine-v1-card .table tbody tr{display:grid!important;grid-template-columns:39% 13% 14% 19% 15%!important;width:100%!important;box-sizing:border-box!important}
#health-engine-v1-card .table th,#health-engine-v1-card .table td{box-sizing:border-box!important;min-width:0!important;width:auto!important;vertical-align:middle!important}
#health-engine-v1-card .table th{font-size:8.5px!important;line-height:1.1!important;padding:5px 9px!important}
#health-engine-v1-card .table td{padding:4px 9px!important;font-size:10.5px!important;line-height:1.16!important;white-space:normal!important}
#health-engine-v1-card .table tbody tr:nth-child(odd){background:#fff!important}
#health-engine-v1-card .table tbody tr:nth-child(even){background:#eef4f9!important}
#health-engine-v1-card .table tbody td{border-bottom:1px solid #dfe7ef!important}
#health-engine-v1-card .table tbody tr:last-child td{border-bottom:0!important}
#health-engine-v1-card .table tbody td:first-child{font-weight:700!important}
#decision-engine-v1-card .table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
#decision-engine-v1-card .table th,#decision-engine-v1-card .table td{padding:4px 9px!important;font-size:10.5px!important;line-height:1.16!important;vertical-align:middle!important;box-sizing:border-box!important;white-space:normal!important}
#decision-engine-v1-card .table th{font-size:8.5px!important;line-height:1.1!important}
#decision-engine-v1-card .table th:nth-child(1),#decision-engine-v1-card .table td:nth-child(1){width:29%!important}
#decision-engine-v1-card .table th:nth-child(2),#decision-engine-v1-card .table td:nth-child(2){width:11%!important}
#decision-engine-v1-card .table th:nth-child(3),#decision-engine-v1-card .table td:nth-child(3){width:11%!important}
#decision-engine-v1-card .table th:nth-child(4),#decision-engine-v1-card .table td:nth-child(4){width:24%!important}
#decision-engine-v1-card .table th:nth-child(5),#decision-engine-v1-card .table td:nth-child(5){width:25%!important}
#decision-engine-v1-card .table tbody tr:nth-child(odd){background:#fff!important}
#decision-engine-v1-card .table tbody tr:nth-child(even){background:#eef4f9!important}
#decision-engine-v1-card .table tbody td{border-bottom:1px solid #dfe7ef!important}
#decision-engine-v1-card .table tbody tr:last-child td{border-bottom:0!important}
@media(max-width:1100px){.dashboard-panels{grid-template-columns:1fr!important}.dashboard-panel .table tbody tr{display:table-row!important;height:auto!important}.dashboard-panel .table tbody td{height:auto!important}}
`;document.head.appendChild(s)}
function normalizeHealth(hp){const t=hp?.querySelector('.table');if(!t)return;const cg=t.querySelector('colgroup');if(cg)cg.remove();const hr=t.querySelector('thead tr');if(hr){while(hr.children.length>5)hr.lastElementChild.remove();if(hr.children.length===6)hr.children[1].remove()}t.querySelectorAll('tbody tr').forEach(tr=>{if(tr.children.length===6)tr.children[1].remove();while(tr.children.length>5)tr.lastElementChild.remove()})}
function labels(hp,dp){if(hp){const h=hp.querySelector('.sectiontitle h2'),n=hp.querySelector('.sectiontitle .note');if(h)h.textContent='Kondisi Proyek';if(n)n.textContent='Progress vs Rasio Biaya & RAP Terpakai';const r=hp.querySelector('thead tr')?.children;if(r){if(r[0])r[0].textContent='Proyek';if(r[1])r[1].textContent='Progress';if(r[2])r[2].innerHTML='Rasio<br>Biaya';if(r[3])r[3].innerHTML='RAP<br>Terpakai';if(r[4])r[4].textContent='Status'}}if(dp){const h=dp.querySelector('.sectiontitle h2'),n=dp.querySelector('.sectiontitle .note');if(h)h.textContent='Prioritas & Tindakan';if(n)n.textContent='Rekomendasi berbasis Kondisi Proyek';const r=dp.querySelector('thead tr')?.children;if(r){if(r[0])r[0].textContent='Proyek';if(r[1])r[1].textContent='Prioritas';if(r[2])r[2].textContent='Status';if(r[3])r[3].innerHTML='Masalah<br>Utama';if(r[4])r[4].textContent='Tindakan'}}}
function syncRows(){const [hp,dp]=panels();if(!hp||!dp||window.innerWidth<=1100)return;normalizeHealth(hp);const lt=hp.querySelector('.table'),rt=dp.querySelector('.table');if(!lt||!rt)return;const lr=[...lt.querySelectorAll('tbody tr')],rr=[...rt.querySelectorAll('tbody tr')];if(!lr.length||!rr.length)return;const heights=rr.map(r=>Math.ceil(r.getBoundingClientRect().height));lr.forEach((r,i)=>{r.style.setProperty('height',(heights[i]||56)+'px','important');r.style.setProperty('min-height',(heights[i]||56)+'px','important')})}
function fix(){const [hp,dp]=panels();if(!hp||!dp)return;style();normalizeHealth(hp);labels(hp,dp);dp.querySelectorAll('tbody tr').forEach(tr=>{if(tr.children.length<5){const td=document.createElement('td');td.textContent='Pertahankan kontrol dan lanjutkan pemantauan rutin.';tr.appendChild(td)}});requestAnimationFrame(syncRows)}
function boot(){fix();const obs=new MutationObserver(()=>fix());obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});window.addEventListener('resize',()=>requestAnimationFrame(syncRows));setInterval(syncRows,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
