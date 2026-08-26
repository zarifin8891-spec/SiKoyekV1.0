(function(){
  const SUPABASE_URL='https://mmkusplegmittrlxqxby.supabase.co';
  const SUPABASE_KEY='sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf';
  let client=null,lastSignature='',busy=false;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function dashboardEl(){return [...document.querySelectorAll('.content')].find(x=>x.querySelector('.top h1')?.textContent.trim()==='Dashboard')}
  async function load(){
    if(busy||document.querySelector('#page .md-page')||!window.SiKoyekHealthEngine||!window.SiKoyekDecisionEngine||!window.supabase)return;
    const app=document.getElementById('app');const dashboard=app&&dashboardEl();if(!dashboard)return;
    if(!client)client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    busy=true;
    try{
      const {data,error}=await client.from('project_summary').select('project_code,project_name,project_progress,cost_ratio,rap_consumption').order('project_code');
      if(error)throw error;
      const rows=(data||[]).map(r=>({...r,project_progress:Number(r.project_progress||0),cost_ratio:Number(r.cost_ratio||0),rap_consumption:Number(r.rap_consumption||0)})).map(r=>{const health=window.SiKoyekHealthEngine.evaluate(r);return {...r,health,decision:window.SiKoyekDecisionEngine.evaluate(r,health)}});
      const sig=JSON.stringify(rows.map(r=>[r.project_code,r.decision.priority,r.decision.action,r.project_progress,r.cost_ratio,r.rap_consumption]));
      const cardExists=!!document.getElementById('decision-engine-v1-card');
      if(sig===lastSignature&&cardExists)return;
      lastSignature=sig;render(dashboard,rows);
      window.dispatchEvent(new CustomEvent('sikoyek:dashboard-panel-ready',{detail:{panel:'decision'}}));
    }catch(e){console.warn('Decision Dashboard integration:',e)}finally{busy=false}
  }
  function render(dashboard,rows){
    if(document.querySelector('#page .md-page'))return;
    const old=document.getElementById('decision-engine-v1-card');if(old)old.remove();
    const rank={TINGGI:3,SEDANG:2,RENDAH:1};
    const priority=[...rows].sort((a,b)=>rank[b.decision.priority]-rank[a.decision.priority]||b.decision.costGap-a.decision.costGap).slice(0,5);
    const card=document.createElement('section');card.id='decision-engine-v1-card';card.className='section';
    card.innerHTML=`<div class="sectiontitle"><h2>Prioritas & Tindakan</h2><span class="note">Rekomendasi berbasis Project Health</span></div><div class="card tablecard de-table-card"><div class="scroll"><table class="table"><thead><tr><th>Proyek</th><th>Prioritas</th><th>Status</th><th>Masalah Utama</th><th>Tindakan</th></tr></thead><tbody>${priority.map(r=>`<tr><td><strong>${esc(r.project_code)}</strong> — ${esc(r.project_name)}</td><td><span class="pill ${r.decision.priority==='TINGGI'?'red':r.decision.priority==='SEDANG'?'amber':'green'}">${r.decision.priority}</span></td><td><span class="pill ${r.health.level}">${r.decision.status}</span></td><td>${esc(r.decision.reason)}</td><td>${esc(r.decision.action)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Belum ada data proyek.</td></tr>'}</tbody></table></div></div>`;
    const style=document.createElement('style');style.textContent='#decision-engine-v1-card .de-table-card{overflow:hidden}#decision-engine-v1-card .table td{white-space:normal;vertical-align:top}#decision-engine-v1-card .table td:first-child{min-width:150px}#decision-engine-v1-card .table td:nth-child(4){min-width:150px}#decision-engine-v1-card .table td:nth-child(5){min-width:160px}@media(max-width:780px){#decision-engine-v1-card .table td{min-width:0!important}}';card.appendChild(style);
    const healthCard=document.getElementById('health-engine-v1-card');
    if(healthCard)healthCard.parentNode.insertBefore(card,healthCard.nextSibling);else{const kpiCards=dashboard.querySelector('.cards');if(kpiCards)kpiCards.parentNode.insertBefore(card,kpiCards.nextSibling);else dashboard.appendChild(card)}
  }
  function boot(){
    const s=document.createElement('script');s.src='./project-decision-engine-v1.js?v=1';document.body.appendChild(s);
    const obs=new MutationObserver(()=>{window.clearTimeout(window.__deTimer);window.__deTimer=setTimeout(load,250)});
    obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    window.addEventListener('sikoyek:dashboard-panel-request',load);
    window.setInterval(load,15000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
