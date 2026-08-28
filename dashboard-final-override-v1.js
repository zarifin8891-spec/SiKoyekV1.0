/* SiKoyek Dashboard Final Override V14 — safe CSS-only layout override. */
(function(){
'use strict';
function addStyle(){
 if(document.getElementById('dashboard-final-v14-style'))return;
 const s=document.createElement('style');s.id='dashboard-final-v14-style';
 s.textContent=`
/* KPI: five financial/progress cards + three health cards */
.dashboard-kpis{display:grid!important;grid-template-columns:repeat(5,minmax(0,1.25fr)) repeat(3,minmax(90px,.75fr))!important;gap:10px!important;align-items:stretch!important}
.dashboard-kpi{min-width:0!important;height:96px!important;padding:14px!important;box-sizing:border-box!important}
.dashboard-kpi-main{min-width:0!important;flex:1 1 auto!important}
.dashboard-kpi .label{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:10px!important}
.dashboard-kpi .value{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:20px!important;line-height:1.15!important}
.dashboard-status{min-width:0!important;height:96px!important;box-sizing:border-box!important;padding:14px!important}
.dashboard-status .label{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}

/* Lower panels: equal-height cards, no DOM/cell deletion */
.dashboard-panels{display:grid!important;grid-template-columns:minmax(0,40fr) minmax(0,60fr)!important;gap:14px!important;align-items:stretch!important}
.dashboard-panel{min-width:0!important;display:flex!important;flex-direction:column!important;align-self:stretch!important;height:auto!important;min-height:0!important}
.dashboard-panel .sectiontitle{flex:0 0 auto!important}
.dashboard-panel .tablecard{flex:1 1 auto!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden!important}
.dashboard-panel .scroll{height:100%!important;max-height:none!important;overflow:hidden!important}
.dashboard-panel .table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
.dashboard-panel .table th,.dashboard-panel .table td{box-sizing:border-box!important;vertical-align:middle!important;min-width:0!important}

/* Left panel */
.dashboard-panel:first-child .table th{font-size:9px!important;line-height:1.1!important;padding:7px 9px!important}
.dashboard-panel:first-child .table td{font-size:11px!important;line-height:1.18!important;padding:6px 9px!important;white-space:normal!important}
.dashboard-panel:first-child .table th:nth-child(1),.dashboard-panel:first-child .table td:nth-child(1){width:41%!important;text-align:left!important}
.dashboard-panel:first-child .table th:nth-child(2),.dashboard-panel:first-child .table td:nth-child(2){width:13%!important}
.dashboard-panel:first-child .table th:nth-child(3),.dashboard-panel:first-child .table td:nth-child(3){width:14%!important}
.dashboard-panel:first-child .table th:nth-child(4),.dashboard-panel:first-child .table td:nth-child(4){width:17%!important}
.dashboard-panel:first-child .table th:nth-child(5),.dashboard-panel:first-child .table td:nth-child(5){width:15%!important}
.dashboard-panel:first-child .table td:first-child .linkbtn{display:block!important;width:100%!important;text-align:left!important;white-space:normal!important;overflow-wrap:anywhere!important}

/* Right decision panel: visually hide Status column, but preserve every source cell */
.dashboard-panel:last-child .table th,.dashboard-panel:last-child .table td{font-size:11px!important;line-height:1.18!important;padding:6px 9px!important;white-space:normal!important;overflow-wrap:break-word!important}
.dashboard-panel:last-child .table th:nth-child(3),.dashboard-panel:last-child .table td:nth-child(3){display:none!important}
.dashboard-panel:last-child .table th:nth-child(1),.dashboard-panel:last-child .table td:nth-child(1){width:36%!important;text-align:left!important}
.dashboard-panel:last-child .table th:nth-child(2),.dashboard-panel:last-child .table td:nth-child(2){width:16%!important}
.dashboard-panel:last-child .table th:nth-child(4),.dashboard-panel:last-child .table td:nth-child(4){width:24%!important}
.dashboard-panel:last-child .table th:nth-child(5),.dashboard-panel:last-child .table td:nth-child(5){width:24%!important}
.dashboard-panel:last-child .table td:first-child .linkbtn{display:block!important;width:100%!important;text-align:left!important;white-space:normal!important;overflow-wrap:anywhere!important}
.dashboard-panel .table tbody tr:nth-child(odd){background:#fff!important}
.dashboard-panel .table tbody tr:nth-child(even){background:#eef4f9!important}
.dashboard-panel .table tbody td{border-bottom:1px solid #dfe7ef!important}
.dashboard-panel .table tbody tr:last-child td{border-bottom:0!important}

@media(max-width:1250px){
 .dashboard-kpis{grid-template-columns:repeat(5,minmax(0,1fr)) repeat(3,minmax(82px,.7fr))!important}
 .dashboard-kpi,.dashboard-status{padding:11px 10px!important}
 .dashboard-kpi .value{font-size:18px!important}
}
@media(max-width:1100px){
 .dashboard-kpis{grid-template-columns:repeat(4,minmax(0,1fr))!important}
 .dashboard-panels{grid-template-columns:1fr!important}
 .dashboard-panel{display:flex!important}
 .dashboard-panel .tablecard{flex:none!important}
 .dashboard-panel .scroll{height:auto!important;overflow:hidden!important}
}
@media(max-width:780px){.dashboard-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}.dashboard-kpi,.dashboard-status{height:82px!important}.dashboard-panel .scroll{overflow-x:auto!important}}
`;
 document.head.appendChild(s);
}
function ensureMasterData(){
 const nav=document.querySelector('.sidebar .nav');
 if(!nav||nav.querySelector('[data-master-data-nav]'))return;
 const b=document.createElement('button');b.type='button';b.dataset.masterDataNav='1';b.textContent='Master Data';
 b.onclick=async()=>{if(typeof window.openMasterData==='function'){window.openMasterData();return}const sc=document.createElement('script');sc.src='./master-data-v1.js?v=2';sc.onload=()=>window.openMasterData?.();document.body.appendChild(sc)};
 nav.appendChild(b);
}
function boot(){
 addStyle();
 ensureMasterData();
 const obs=new MutationObserver(()=>{addStyle();ensureMasterData()});
 obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
