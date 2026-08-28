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
      if(sig===lastSignature&&dashboard.querySelector('#dashboard-decision-panel')?.dataset.renderer==='decision')return;
      lastSignature=sig;render(dashboard,rows);
      window.dispatchEvent(new CustomEvent('sikoyek:dashboard-panel-ready',{detail:{panel:'decision'}}));
    }catch(e){console.warn('Decision Dashboard integration:',e)}finally{busy=false}
  }
  function render(dashboard,rows){
    const target=dashboard.querySelector('#dashboard-decision-panel');
    if(!target)return;
    const rank={TINGGI:3,SEDANG:2,RENDAH:1};
    const priority=[...rows].sort((a,b)=>rank[b.decision.priority]-rank[a.decision.priority]||b.decision.costGap-a.decision.costGap).slice(0,5);
    target.dataset.renderer='decision';
    target.innerHTML=`<div class="sectiontitle"><h2>Prioritas & Tindakan</h2><span class="note">Rekomendasi berbasis Kondisi Proyek</span></div><div class="card tablecard"><div class="scroll"><table class="table"><colgroup><col style="width:34%"><col style="width:16%"><col style="width:25%"><col style="width:25%"></colgroup><thead><tr><th>Proyek</th><th>Prioritas</th><th>Masalah<br>Utama</th><th>Tindakan</th></tr></thead><tbody>${priority.map(r=>`<tr><td><strong>${esc(r.project_code)}</strong> — ${esc(r.project_name)}</td><td><span class="pill ${r.decision.priority==='TINGGI'?'red':r.decision.priority==='SEDANG'?'amber':'green'}">${r.decision.priority}</span></td><td>${esc(r.decision.reason)}</td><td>${esc(r.decision.action)}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">Belum ada data proyek.</td></tr>'}</tbody></table></div></div>`;
  }
  function boot(){
    const s=document.createElement('script');s.src='./project-decision-engine-v1.js?v=3';document.body.appendChild(s);
    const obs=new MutationObserver(()=>{window.clearTimeout(window.__deTimer);window.__deTimer=setTimeout(load,250)});
    obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    window.addEventListener('sikoyek:dashboard-panel-request',load);
    window.setInterval(load,15000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
