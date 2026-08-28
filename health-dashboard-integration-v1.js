(function(){
  const ENGINE_URL='./project-health-engine-v1.js';
  const SUPABASE_URL='https://mmkusplegmittrlxqxby.supabase.co';
  const SUPABASE_KEY='sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf';
  let healthClient=null,lastSignature='',busy=false;

  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  function dashboardEl(){return [...document.querySelectorAll('.content')].find(x=>x.querySelector('.top h1')?.textContent.trim().toLowerCase()==='dashboard')}

  function syncDashboardRows(){
    const dashboard=dashboardEl();
    const left=dashboard?.querySelectorAll('#dashboard-health-panel tbody tr');
    const right=dashboard?.querySelectorAll('#dashboard-decision-panel tbody tr');
    if(!left||!right||!left.length||!right.length)return;
    const count=Math.min(left.length,right.length);
    for(let i=0;i<count;i++){
      left[i].style.removeProperty('height');
      right[i].style.removeProperty('height');
      left[i].querySelectorAll('td').forEach(cell=>cell.style.removeProperty('height'));
      right[i].querySelectorAll('td').forEach(cell=>cell.style.removeProperty('height'));
    }
    for(let i=0;i<count;i++){
      const h=Math.max(left[i].getBoundingClientRect().height,right[i].getBoundingClientRect().height);
      left[i].style.setProperty('height',h+'px','important');
      right[i].style.setProperty('height',h+'px','important');
      left[i].querySelectorAll('td').forEach(cell=>cell.style.setProperty('height',h+'px','important'));
      right[i].querySelectorAll('td').forEach(cell=>cell.style.setProperty('height',h+'px','important'));
    }
  }
  window.syncSikoyekDashboardRows=syncDashboardRows;

  function syncPeriodPreset(){
    const select=document.getElementById('periodPreset');
    if(!select || typeof state==='undefined' || !state.period)return;
    const from=state.period.from||'';
    const to=state.period.to||'';
    const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    const fmt=x=>`${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`;
    const fmtUTC=x=>x.toISOString().slice(0,10);
    const local={
      thisMonth:[fmt(new Date(d.getFullYear(),d.getMonth(),1)),fmt(new Date(d.getFullYear(),d.getMonth()+1,0))],
      lastMonth:[fmt(new Date(d.getFullYear(),d.getMonth()-1,1)),fmt(new Date(d.getFullYear(),d.getMonth(),0))],
      thisYear:[`${d.getFullYear()}-01-01`,`${d.getFullYear()}-12-31`]
    };
    const utc={
      thisMonth:[fmtUTC(new Date(d.getFullYear(),d.getMonth(),1)),fmtUTC(new Date(d.getFullYear(),d.getMonth()+1,0))],
      lastMonth:[fmtUTC(new Date(d.getFullYear(),d.getMonth()-1,1)),fmtUTC(new Date(d.getFullYear(),d.getMonth(),0))],
      thisYear:[`${d.getFullYear()}-01-01`,`${d.getFullYear()}-12-31`]
    };
    let value='';
    for(const key of ['thisMonth','lastMonth','thisYear']){
      const pair=local[key];
      const legacy=utc[key];
      if((from===pair[0]&&to===pair[1])||(from===legacy[0]&&to===legacy[1])){value=key;break}
    }
    select.value=value;
  }

  function syncDashboardLayout(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{syncDashboardRows();syncPeriodPreset()}));
  }

  function installPeriodPresetFix(){
    if(window.__sikoyekPeriodPresetFixInstalled)return;
    const originalApply=window.applyPreset;
    const originalClear=window.clearPeriod;
    if(typeof originalApply==='function'){
      window.applyPreset=function(value){
        originalApply(value);
        syncDashboardLayout();
      };
    }
    if(typeof originalClear==='function'){
      window.clearPeriod=function(){
        originalClear();
        syncDashboardLayout();
      };
    }
    window.__sikoyekPeriodPresetFixInstalled=true;
    syncDashboardLayout();
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
      const cardExists=dashboard.querySelector('#dashboard-health-panel')?.dataset.renderer==='health';
      if(sig===lastSignature&&cardExists){syncDashboardLayout();return}
      lastSignature=sig;render(rows);
      window.dispatchEvent(new CustomEvent('sikoyek:dashboard-panel-ready',{detail:{panel:'health'}}));
    }catch(e){console.warn('Health Dashboard integration:',e)}finally{busy=false}
  }

  function render(rows){
    const dashboard=dashboardEl();const card=dashboard?.querySelector('#dashboard-health-panel');if(!card)return;
    const priority=[...rows].sort((a,b)=>{const rank={red:3,amber:2,green:1};return rank[b.health.level]-rank[a.health.level]||b.health.costGap-a.health.costGap}).slice(0,5);
    card.dataset.renderer='health';
    card.innerHTML=`<div class="sectiontitle"><h2>Kondisi Proyek</h2><span class="note">Progress vs Rasio Biaya & RAP Terpakai</span></div><div class="card tablecard"><div class="scroll"><table class="table"><colgroup><col style="width:45%"><col style="width:12%"><col style="width:13%"><col style="width:15%"><col style="width:15%"></colgroup><thead><tr><th>Proyek</th><th>Progress</th><th>Rasio<br>Biaya</th><th>RAP<br>Terpakai</th><th>Status</th></tr></thead><tbody>${priority.map(r=>`<tr><td><strong>${esc(r.project_code)}</strong> — ${esc(r.project_name)}</td><td>${r.project_progress.toFixed(2)}%</td><td>${r.cost_ratio.toFixed(2)}%</td><td>${r.rap_consumption.toFixed(2)}%</td><td><span class="pill ${r.health.level}">${r.health.status}</span></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Belum ada data proyek.</td></tr>'}</tbody></table></div></div>`;
    syncDashboardLayout();
  }

  function boot(){
    installPeriodPresetFix();
    const s=document.createElement('script');s.src=ENGINE_URL+'?v=3';s.onload=load;document.body.appendChild(s);
    const obs=new MutationObserver(()=>{window.clearTimeout(window.__heTimer);window.__heTimer=setTimeout(()=>{installPeriodPresetFix();load()},250)});
    obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    window.addEventListener('sikoyek:dashboard-panel-request',load);
    window.addEventListener('sikoyek:dashboard-panel-ready',syncDashboardLayout);
    window.addEventListener('resize',syncDashboardLayout);
    window.setInterval(load,15000);
    setTimeout(load,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();