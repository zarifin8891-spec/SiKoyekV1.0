/* SiKoyek Dashboard Final Override V17 — safe layout + reliable financial visibility for restricted roles. */
(function(){
'use strict';
function addStyle(){
 if(document.getElementById('dashboard-final-v17-style'))return;
 const s=document.createElement('style');s.id='dashboard-final-v17-style';
 s.textContent=`
.dashboard-kpis{display:grid!important;grid-template-columns:repeat(5,minmax(0,1.25fr)) repeat(3,minmax(90px,.75fr))!important;gap:10px!important;align-items:stretch!important}
.dashboard-kpi{min-width:0!important;height:96px!important;padding:14px!important;box-sizing:border-box!important}
.dashboard-kpi-main{min-width:0!important;flex:1 1 auto!important}
.dashboard-kpi .label{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:10px!important}
.dashboard-kpi .value{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:20px!important}
.dashboard-status{min-width:0!important;height:96px!important;box-sizing:border-box!important;padding:14px!important}
.dashboard-status .label{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.dashboard-panels{display:grid!important;grid-template-columns:minmax(0,40fr) minmax(0,60fr)!important;gap:14px!important;align-items:stretch!important}
.dashboard-panel{min-width:0!important;display:flex!important;flex-direction:column!important;align-self:stretch!important;height:auto!important;min-height:0!important}
.dashboard-panel .sectiontitle{flex:0 0 auto!important}
.dashboard-panel .tablecard{flex:1 1 auto!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:hidden!important}
.dashboard-panel .scroll{height:100%!important;max-height:none!important;overflow:hidden!important}
.dashboard-panel .table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
.dashboard-panel .table th,.dashboard-panel .table td{box-sizing:border-box!important;vertical-align:middle!important;min-width:0!important}
.dashboard-panel:first-child .table th{font-size:9px!important;line-height:1.1!important;padding:7px 9px!important}
.dashboard-panel:first-child .table td{font-size:11px!important;line-height:1.18!important;padding:6px 9px!important;white-space:normal!important}
.dashboard-panel:first-child .table th:nth-child(1),.dashboard-panel:first-child .table td:nth-child(1){width:41%!important;text-align:left!important}
.dashboard-panel:first-child .table th:nth-child(2),.dashboard-panel:first-child .table td:nth-child(2){width:13%!important}
.dashboard-panel:first-child .table th:nth-child(3),.dashboard-panel:first-child .table td:nth-child(3){width:14%!important}
.dashboard-panel:first-child .table th:nth-child(4),.dashboard-panel:first-child .table td:nth-child(4){width:17%!important}
.dashboard-panel:first-child .table th:nth-child(5),.dashboard-panel:first-child .table td:nth-child(5){width:15%!important}
.dashboard-panel:first-child .table td:first-child .linkbtn{display:block!important;width:100%!important;text-align:left!important;white-space:normal!important;overflow-wrap:anywhere!important}
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
.dashboard-financial-masked .value{letter-spacing:.08em!important}

.dashboard-graphs-section .graphs-head{display:grid!important;grid-template-columns:minmax(230px,1fr) auto;align-items:center!important;gap:12px!important;margin:0 0 8px!important}
.dashboard-graphs-section .graphs-head>div{min-width:0!important}
.dashboard-graphs-section .graphs-head h2{font-size:17px!important;line-height:1.15!important;margin:0!important}
.dashboard-graphs-section .graphs-sub{font-size:11px!important;color:var(--muted)!important}
.dashboard-graphs-section .graph-controls{display:grid!important;grid-template-columns:280px 280px minmax(0,1fr)!important;align-items:center!important;gap:10px!important;margin:0 0 12px!important;padding:10px 12px!important;background:#fff!important;border:1px solid #e4eaf4!important;border-radius:14px!important}
.dashboard-graphs-section .graph-control{min-width:0!important;display:flex!important;flex-direction:row!important;align-items:center!important;gap:8px!important}
.dashboard-graphs-section .graph-control label{flex:0 0 auto!important;font-size:10px!important;font-weight:800!important;color:var(--muted)!important;text-transform:uppercase!important;letter-spacing:.04em!important;white-space:nowrap!important}
.dashboard-graphs-section .graph-control select{width:150px!important;flex:0 0 150px!important;height:36px!important;border:1px solid #d7dfeb!important;border-radius:9px!important;background:#fff!important;color:#172033!important;padding:6px 10px!important;font-size:12px!important}
.dashboard-graphs-section .graph-controls>.control-note{font-size:11px!important;line-height:1.2!important;white-space:nowrap!important;justify-self:start!important}
.dashboard-graphs-section .graphs-head+#graph-controls{margin-top:0!important}
.dashboard-graphs-section .selected-wrap{display:none!important;min-width:0!important}
.dashboard-graphs-section .selected-wrap.show{display:flex!important;grid-column:1/-1!important;flex-direction:column!important;align-items:stretch!important}
.dashboard-graphs-section .project-picker{display:grid!important;grid-template-columns:repeat(2,minmax(230px,1fr))!important;gap:6px!important;padding:8px!important;max-height:150px!important;overflow:auto!important;border:1px solid #d7dfeb!important;border-radius:10px!important;background:#fff!important}
.dashboard-graphs-section .project-option{display:flex!important;align-items:center!important;gap:8px!important;padding:7px 8px!important;border-radius:8px!important;font-size:12px!important;color:#273244!important;cursor:pointer!important}
.dashboard-graphs-section .project-option input{width:15px!important;height:15px!important}
.dashboard-graphs-section .picker-actions{display:flex!important;gap:6px!important;align-items:center!important;margin-top:6px!important}
.dashboard-graphs-section .picker-actions button{border:1px solid #d7dfeb!important;background:#fff!important;border-radius:8px!important;padding:6px 9px!important;font-size:11px!important;color:#263247!important;cursor:pointer!important}
.dashboard-graphs-section .control-note{font-size:11px!important;color:var(--muted)!important;align-self:center!important}

@media(max-width:1250px){
 .dashboard-kpis{grid-template-columns:repeat(5,minmax(0,1fr)) repeat(3,minmax(82px,.7fr))!important}
 .dashboard-kpi,.dashboard-status{padding:11px 10px!important}
 .dashboard-kpi .value{font-size:18px!important}
 .dashboard-graphs-section .graph-controls{grid-template-columns:260px 260px minmax(0,1fr)!important}
 .dashboard-graphs-section .graph-controls>.control-note{grid-column:auto!important}
 .dashboard-graphs-section .graph-control select{width:135px!important;flex-basis:135px!important}
}
@media(max-width:1100px){
 .dashboard-kpis{grid-template-columns:repeat(4,minmax(0,1fr))!important}
 .dashboard-panels{grid-template-columns:1fr!important}
 .dashboard-panel{display:flex!important}
 .dashboard-panel .tablecard{flex:none!important}
 .dashboard-panel .scroll{height:auto!important;overflow:hidden!important}
 .dashboard-graphs-section .graphs-head{grid-template-columns:1fr!important}
 .dashboard-graphs-section .graph-controls{grid-template-columns:1fr 1fr!important}
 .dashboard-graphs-section .graph-controls>.control-note{grid-column:1/-1!important}
}
@media(max-width:780px){
 .dashboard-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 .dashboard-kpi,.dashboard-status{height:82px!important}
 .dashboard-panel .scroll{overflow-x:auto!important}
 .dashboard-graphs-section .graph-controls{grid-template-columns:1fr!important}
 .dashboard-graphs-section .graph-control{flex-direction:column!important;align-items:stretch!important}
 .dashboard-graphs-section .graph-control select{width:100%!important;flex-basis:auto!important}
 .dashboard-graphs-section .selected-wrap.show{grid-column:auto!important}
}
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

let financialRole='';
let financialClient=null;
async function loadFinancialVisibilityRole(retry=0){
 const restricted=['pelaksana','marketing'];
 try{
   financialClient=window.__siKoyekSupabase||window.sb||financialClient;
   if(!financialClient&&window.supabase?.createClient){
     financialClient=window.supabase.createClient(
       'https://mmkusplegmittrlxqxby.supabase.co',
       'sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf',
       {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
     );
   }
   if(!financialClient?.auth?.getUser||!financialClient?.from){
     if(retry<10)setTimeout(()=>loadFinancialVisibilityRole(retry+1),250);
     return '';
   }
   const {data:{user}}=await financialClient.auth.getUser();
   if(!user){
     if(retry<10)setTimeout(()=>loadFinancialVisibilityRole(retry+1),250);
     return '';
   }
   const {data:profile}=await financialClient.from('profiles').select('is_active,roles(name)').eq('id',user.id).maybeSingle();
   financialRole=String(profile?.roles?.name||'').trim().toLowerCase();
   return financialRole;
 }catch(e){
   console.warn('SiKoyek financial visibility:',e);
   if(retry<10)setTimeout(()=>loadFinancialVisibilityRole(retry+1),250);
   return '';
 }
}
function isRestrictedFinancialRole(){return ['pelaksana','marketing'].includes(financialRole)}
function maskTextNode(node){
 if(!node||node.parentElement?.closest('script,style,textarea,input,select'))return;
 const text=node.nodeValue||'';
 if(!text.trim())return;
 if(/Rp\.?\s*[\d.,]+/i.test(text)){
   node.nodeValue=text.replace(/Rp\.?\s*[\d.,]+/gi,'Rp ••••••••');
   return;
 }
 if(/^-?\d{1,3}(?:\.\d{3})+$/.test(text.trim())||/^-?\d{7,}$/.test(text.trim())){
   node.nodeValue='••••••••';
 }
}
function maskDashboardFinancialText(){
 if(!isRestrictedFinancialRole())return;
 document.querySelectorAll('.dashboard-view').forEach(root=>{
   root.querySelectorAll('.dashboard-kpi').forEach(kpi=>{
     const label=(kpi.querySelector('.label')?.textContent||'').trim().toUpperCase();
     if(!['NILAI KONTRAK','TOTAL RAP','TOTAL REALISASI'].includes(label))return;
     const value=kpi.querySelector('.value');
     if(!value)return;
     kpi.classList.add('dashboard-financial-masked');
     value.textContent='••••••••';
   });
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
     if(node.parentElement?.closest('.dashboard-kpi,.dashboard-status,script,style,textarea,input,select'))return NodeFilter.FILTER_REJECT;
     return NodeFilter.FILTER_ACCEPT;
   }});
   const nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);nodes.forEach(maskTextNode);
 });
}
async function applyFinancialVisibility(){
 if(!financialRole)await loadFinancialVisibilityRole();
 maskDashboardFinancialText();
}
function boot(){
 addStyle();
 ensureMasterData();
 applyFinancialVisibility();
 const obs=new MutationObserver(()=>{
   addStyle();
   ensureMasterData();
   if(financialRole)maskDashboardFinancialText();
 });
 obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
