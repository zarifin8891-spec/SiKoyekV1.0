(function(){
  const ENGINE_URL='./project-health-engine-v1.js';
  const SUPABASE_URL='https://mmkusplegmittrlxqxby.supabase.co';
  const SUPABASE_KEY='sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf';
  let healthClient=null,lastSignature='',busy=false;
  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  function dashboardEl(){return [...document.querySelectorAll('.content')].find(x=>x.querySelector('.top h1')?.textContent.trim().toLowerCase()==='dashboard')}
  function hideLegacyProjectHealth(){
    const dashboard=dashboardEl();if(!dashboard)return;
    [...dashboard.querySelectorAll('.section')].forEach(sec=>{
      if(sec.id==='health-engine-v1-card')return;
      const h2=sec.querySelector('.sectiontitle h2');
      const title=h2?.textContent.replace(/\s+/g,' ').trim().toLowerCase();
      if(title==='project health')sec.style.setProperty('display','none','important');
    });
  }
  async function load(){
    if(busy||!window.SiKoyekHealthEngine||!window.supabase)return;
    const app=document.getElementById('app');if(!app||!app.querySelector('.shell'))return;
    const dashboard=dashboardEl();if(!dashboard)return;
    if(!healthClient)healthClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    busy=true;
    try{
      const {data,error}=await healthClient.from('project_summary').select('project_code,project_name,project_progress,cost_ratio,rap_consumption').order('project_code');
      if(error)throw error;
      const rows=(data||[]).map(r=>({...r,project_progress:Number(r.project_progress||0),cost_ratio:Number(r.cost_ratio||0),rap_consumption:Number(r.rap_consumption||0)})).map(r=>({...r,health:window.SiKoyekHealthEngine.evaluate(r)}));
      const sig=JSON.stringify(rows.map(r=>[r.project_code,r.health.status,r.project_progress,r.cost_ratio,r.rap_consumption]));
      const cardExists=!!document.getElementById('health-engine-v1-card');
      hideLegacyProjectHealth();
      if(sig===lastSignature&&cardExists){return}
      lastSignature=sig;render(rows);hideLegacyProjectHealth();
      window.dispatchEvent(new CustomEvent('sikoyek:dashboard-panel-ready',{detail:{panel:'health'}}));
    }catch(e){console.warn('Health Dashboard integration:',e);hideLegacyProjectHealth()}finally{busy=false}
  }
  function render(rows){
    const old=document.getElementById('health-engine-v1-card');if(old)old.remove();
    const dashboard=dashboardEl();if(!dashboard)return;
    const priority=[...rows].sort((a,b)=>{const rank={red:3,amber:2,green:1};return rank[b.health.level]-rank[a.health.level]||b.health.costGap-a.health.costGap}).slice(0,5);
    const card=document.createElement('section');card.id='health-engine-v1-card';card.className='section';
    card.innerHTML=`<div class="sectiontitle"><h2>Kondisi Proyek</h2><span class="note">Progress vs Rasio Biaya & RAP Terpakai</span></div><div class="card tablecard he-table-card"><div class="scroll"><table class="table"><thead><tr><th>Proyek</th><th>Progress</th><th>Rasio<br>Biaya</th><th>RAP<br>Terpakai</th><th>Status</th></tr></thead><tbody>${priority.map(r=>`<tr><td><strong>${esc(r.project_code)}</strong> — ${esc(r.project_name)}</td><td>${r.project_progress.toFixed(2)}%</td><td>${r.cost_ratio.toFixed(2)}%</td><td>${r.rap_consumption.toFixed(2)}%</td><td><span class="pill ${r.health.level}">${r.health.status}</span></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Belum ada data proyek.</td></tr>'}</tbody></table></div></div>`;
    const style=document.createElement('style');style.textContent=`#health-engine-v1-card .he-table-card{overflow:hidden}#health-engine-v1-card .table{width:100%!important;table-layout:fixed!important}#health-engine-v1-card .table th,#health-engine-v1-card .table td{padding:9px 8px!important;font-size:11px!important;line-height:1.2!important}#health-engine-v1-card .table th{white-space:normal!important;vertical-align:middle!important}#health-engine-v1-card .table th:nth-child(1),#health-engine-v1-card .table td:nth-child(1){width:41%!important}#health-engine-v1-card .table th:nth-child(2),#health-engine-v1-card .table td:nth-child(2){width:12%!important}#health-engine-v1-card .table th:nth-child(3),#health-engine-v1-card .table td:nth-child(3){width:13%!important}#health-engine-v1-card .table th:nth-child(4),#health-engine-v1-card .table td:nth-child(4){width:19%!important}#health-engine-v1-card .table th:nth-child(5),#health-engine-v1-card .table td:nth-child(5){width:15%!important}#health-engine-v1-card .table td:first-child{white-space:normal!important;word-break:normal!important}`;card.appendChild(style);
    const kpiCards=dashboard.querySelector('.cards');
    if(kpiCards)kpiCards.parentNode.insertBefore(card,kpiCards.nextSibling);else dashboard.appendChild(card);
  }
  function boot(){
    const s=document.createElement('script');s.src=ENGINE_URL+'?v=3';s.onload=load;document.body.appendChild(s);
    const obs=new MutationObserver(()=>{window.clearTimeout(window.__heTimer);window.__heTimer=setTimeout(load,250)});
    obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    window.addEventListener('sikoyek:dashboard-panel-request',load);window.setInterval(load,15000);setTimeout(load,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
