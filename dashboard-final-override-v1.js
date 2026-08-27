/* SiKoyek Dashboard Final Override V1 — authoritative lower-panel renderer. */
(function(){
  'use strict';
  const SUPABASE_URL='https://mmkusplegmittrlxqxby.supabase.co';
  const SUPABASE_KEY='sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf';
  let client=null, timer=0, busy=false;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pct=n=>Number(n||0).toFixed(2)+'%';
  function dashboard(){return [...document.querySelectorAll('.content')].find(x=>x.querySelector('.top h1')?.textContent.trim().toLowerCase()==='dashboard');}
  function findSection(root,title){return [...root.querySelectorAll('.section')].find(s=>s.querySelector('.sectiontitle h2')?.textContent.replace(/\s+/g,' ').trim().toLowerCase()===title);}
  function healthOf(r){
    if(window.SiKoyekHealthEngine?.evaluate)return window.SiKoyekHealthEngine.evaluate(r);
    const progress=Number(r.project_progress||0),cost=Number(r.cost_ratio||0),rap=Number(r.rap_consumption||0),costGap=cost-progress,rapGap=rap-progress;
    let status='SEHAT',level='green';
    if(costGap>=15||rapGap>=20){status='BERISIKO';level='red'} else if(costGap>=5||rapGap>=10||(progress<=.01&&(cost>.01||rap>.01))){status='PERLU PENGAWASAN';level='amber'}
    return {status,level,costGap,rapGap};
  }
  function decisionOf(r,h){
    if(window.SiKoyekDecisionEngine?.evaluate)return window.SiKoyekDecisionEngine.evaluate(r,h);
    const costGap=h.costGap,rapGap=h.rapGap,progress=Number(r.project_progress||0),cost=Number(r.cost_ratio||0),rap=Number(r.rap_consumption||0);
    let priority='RENDAH',reason='Progress masih bergerak sejalan atau lebih cepat daripada konsumsi biaya.',action='Pertahankan kontrol dan lanjutkan pemantauan rutin.';
    if(h.status==='BERISIKO'){priority='TINGGI';if(costGap>=15&&rapGap>=20){reason='Cost Ratio dan RAP Consumption sama-sama jauh melampaui Progress.';action='Hentikan penambahan biaya non-kritis dan lakukan review biaya serta progress segera.'}else if(costGap>=15){reason='Cost Ratio jauh melampaui Progress.';action='Audit realisasi biaya dan item pekerjaan dengan biaya tertinggi sebelum pengeluaran berikutnya.'}else{reason='RAP Consumption jauh melampaui Progress.';action='Periksa pemakaian RAP dan identifikasi item pekerjaan yang mengonsumsi RAP paling cepat.'}}
    else if(h.status==='PERLU PENGAWASAN'){priority='SEDANG';if(progress<=.01&&(cost>.01||rap>.01)){reason='Sudah ada konsumsi biaya/RAP sementara progress proyek masih nol.';action='Validasi transaksi dan pastikan aktivitas pekerjaan sudah tercermin pada progress.'}else if(costGap>=5&&rapGap>=10){reason='Cost Ratio dan RAP Consumption mulai bergerak lebih cepat daripada Progress.';action='Tinjau item pekerjaan dan realisasi biaya yang menyebabkan deviasi.'}else if(costGap>=5){reason='Cost Ratio bergerak lebih cepat daripada Progress.';action='Periksa realisasi biaya terhadap pekerjaan yang sudah diselesaikan.'}else{reason='RAP Consumption bergerak lebih cepat daripada Progress.';action='Periksa pemakaian RAP dan penyebab konsumsi pada item pekerjaan terkait.'}}
    return {priority,status:h.status,reason,action,costGap,rapGap};
  }
  function panelStyles(){
    if(document.getElementById('dashboard-final-override-style'))return;
    const s=document.createElement('style');s.id='dashboard-final-override-style';s.textContent=`
      .dashboard-final-panels{display:grid!important;grid-template-columns:minmax(0,44fr) minmax(0,56fr)!important;gap:14px!important;margin-top:16px!important}
      .dashboard-final-panels>.section{min-width:0!important;margin-top:0!important}
      .dashboard-final-panels .sectiontitle{margin-bottom:8px!important}
      .dashboard-final-panels .sectiontitle h2{font-size:17px!important}
      .dashboard-final-panels .sectiontitle .note{font-size:11px!important}
      .dashboard-final-panels .tablecard{overflow:hidden!important;min-height:330px!important}
      .dashboard-final-panels .scroll{overflow-x:hidden!important;overflow-y:hidden!important}
      .dashboard-final-panels table{width:100%!important;table-layout:fixed!important}
      .dashboard-final-panels th,.dashboard-final-panels td{padding:10px 10px!important;font-size:11px!important;line-height:1.25!important;vertical-align:middle!important}
      .dashboard-final-health th{white-space:normal!important}
      .dashboard-final-health th:nth-child(1),.dashboard-final-health td:nth-child(1){width:41%!important}
      .dashboard-final-health th:nth-child(2),.dashboard-final-health td:nth-child(2){width:12%!important}
      .dashboard-final-health th:nth-child(3),.dashboard-final-health td:nth-child(3){width:13%!important}
      .dashboard-final-health th:nth-child(4),.dashboard-final-health td:nth-child(4){width:19%!important}
      .dashboard-final-health th:nth-child(5),.dashboard-final-health td:nth-child(5){width:15%!important}
      .dashboard-final-health td:first-child{white-space:normal!important}
      .dashboard-final-decision th,.dashboard-final-decision td{white-space:normal!important;vertical-align:top!important}
      .dashboard-final-decision th:nth-child(1),.dashboard-final-decision td:nth-child(1){width:32%!important}
      .dashboard-final-decision th:nth-child(2),.dashboard-final-decision td:nth-child(2){width:12%!important}
      .dashboard-final-decision th:nth-child(3),.dashboard-final-decision td:nth-child(3){width:11%!important}
      .dashboard-final-decision th:nth-child(4),.dashboard-final-decision td:nth-child(4){width:22%!important}
      .dashboard-final-decision th:nth-child(5),.dashboard-final-decision td:nth-child(5){width:23%!important}
      .dashboard-final-decision td:first-child{min-width:0!important}
      .dashboard-final-decision .pill{white-space:nowrap!important}
      @media(max-width:1100px){.dashboard-final-panels{grid-template-columns:1fr!important}}
      @media(max-width:780px){.dashboard-final-panels .scroll{overflow-x:auto!important}}
    `;document.head.appendChild(s);
  }
  function hideLegacy(d){
    [...d.querySelectorAll('.section')].forEach(sec=>{
      const id=sec.id||'';const title=sec.querySelector('.sectiontitle h2')?.textContent.replace(/\s+/g,' ').trim().toLowerCase();
      if(id==='health-engine-v1-card'||id==='decision-engine-v1-card'||title==='project health'||title==='kesehatan proyek'||title==='prioritas & tindakan')sec.style.setProperty('display','none','important');
    });
  }
  async function render(){
    const d=dashboard();if(!d||busy)return;
    const kpis=d.querySelector('.cards');if(!kpis)return;
    panelStyles();hideLegacy(d);
    if(document.getElementById('dashboard-final-panels'))return;
    busy=true;
    try{
      if(!client)client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data,error}=await client.from('project_summary').select('project_code,project_name,project_progress,cost_ratio,rap_consumption').order('project_code');
      if(error)throw error;
      const rows=(data||[]).map(r=>({...r,project_progress:Number(r.project_progress||0),cost_ratio:Number(r.cost_ratio||0),rap_consumption:Number(r.rap_consumption||0)}));
      const evaluated=rows.map(r=>{const h=healthOf(r);return {...r,health:h,decision:decisionOf(r,h)}});
      const healthRows=[...evaluated].sort((a,b)=>({red:3,amber:2,green:1}[b.health.level]-({red:3,amber:2,green:1}[a.health.level])||b.health.costGap-a.health.costGap)).slice(0,5);
      const decisionRows=[...evaluated].sort((a,b)=>({TINGGI:3,SEDANG:2,RENDAH:1}[b.decision.priority]-({TINGGI:3,SEDANG:2,RENDAH:1}[a.decision.priority])||b.decision.costGap-a.decision.costGap)).slice(0,5);
      const wrap=document.createElement('div');wrap.id='dashboard-final-panels';wrap.className='dashboard-final-panels';
      const health=document.createElement('section');health.className='section dashboard-final-health';health.innerHTML=`<div class="sectiontitle"><h2>Kesehatan Proyek</h2><span class="note">Progress vs Rasio Biaya & RAP Terpakai</span></div><div class="card tablecard"><div class="scroll"><table class="table"><thead><tr><th>Proyek</th><th>Progress</th><th>Rasio<br>Biaya</th><th>RAP<br>Terpakai</th><th>Status</th></tr></thead><tbody>${healthRows.map(r=>`<tr><td><strong>${esc(r.project_code)}</strong> — ${esc(r.project_name)}</td><td>${pct(r.project_progress)}</td><td>${pct(r.cost_ratio)}</td><td>${pct(r.rap_consumption)}</td><td><span class="pill ${r.health.level}">${esc(r.health.status)}</span></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Belum ada data proyek.</td></tr>'}</tbody></table></div></div>`;
      const decision=document.createElement('section');decision.className='section dashboard-final-decision';decision.innerHTML=`<div class="sectiontitle"><h2>Prioritas & Tindakan</h2><span class="note">Rekomendasi berbasis Kesehatan Proyek</span></div><div class="card tablecard"><div class="scroll"><table class="table"><thead><tr><th>Proyek</th><th>Prioritas</th><th>Status</th><th>Masalah<br>Utama</th><th>Tindakan</th></tr></thead><tbody>${decisionRows.map(r=>{const c=r.decision.priority==='TINGGI'?'red':r.decision.priority==='SEDANG'?'amber':'green';return `<tr><td><strong>${esc(r.project_code)}</strong> — ${esc(r.project_name)}</td><td><span class="pill ${c}">${esc(r.decision.priority)}</span></td><td><span class="pill ${r.health.level}">${esc(r.decision.status)}</span></td><td>${esc(r.decision.reason)}</td><td>${esc(r.decision.action)}</td></tr>`}).join('')||'<tr><td colspan="5" class="empty">Belum ada data proyek.</td></tr>'}</tbody></table></div></div>`;
      wrap.append(health,decision);kpis.parentNode.insertBefore(wrap,kpis.nextSibling);
    }catch(e){console.warn('Dashboard final override:',e)}finally{busy=false}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(render,350)}
  function boot(){panelStyles();schedule();const obs=new MutationObserver(schedule);obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setInterval(schedule,3000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
