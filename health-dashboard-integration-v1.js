(function(){
  const ENGINE_URL='./project-health-engine-v1.js';
  const ENGINE_VERSION='1.0';
  let lastSignature='';
  let busy=false;
  function moneyCount(){return new Intl.NumberFormat('id-ID').format}
  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  async function load(){
    if(busy||!window.sb||!window.SiKoyekHealthEngine)return;
    const app=document.getElementById('app');
    if(!app||!app.querySelector('.shell'))return;
    busy=true;
    try{
      const {data,error}=await window.sb.from('project_summary').select('project_code,project_name,project_progress,cost_ratio,rap_consumption').order('project_code');
      if(error)throw error;
      const rows=(data||[]).map(r=>({
        ...r,
        project_progress:Number(r.project_progress||0),
        cost_ratio:Number(r.cost_ratio||0),
        rap_consumption:Number(r.rap_consumption||0)
      })).map(r=>({...r,health:window.SiKoyekHealthEngine.evaluate(r)}));
      const sig=JSON.stringify(rows.map(r=>[r.project_code,r.health.status,r.project_progress,r.cost_ratio,r.rap_consumption]));
      if(sig===lastSignature)return;
      lastSignature=sig;
      render(rows);
    }catch(e){console.warn('Health Dashboard integration:',e)}finally{busy=false}
  }
  function render(rows){
    const old=document.getElementById('health-engine-v1-card');
    if(old)old.remove();
    const dashboard=[...document.querySelectorAll('.content')].find(x=>x.querySelector('.top h1'));
    if(!dashboard)return;
    const counts={green:0,amber:0,red:0};
    rows.forEach(r=>counts[r.health.level]=(counts[r.health.level]||0)+1);
    const priority=[...rows].sort((a,b)=>{const rank={red:3,amber:2,green:1};return rank[b.health.level]-rank[a.health.level]||b.health.costGap-a.health.costGap}).slice(0,5);
    const card=document.createElement('section');
    card.id='health-engine-v1-card';card.className='section';
    card.innerHTML=`<div class="sectiontitle"><h2>Project Health Engine <span class="pill green">V${ENGINE_VERSION} • LIVE READ-ONLY</span></h2><span class="note">Progress vs Cost Ratio & RAP Consumption</span></div><div class="health-engine-summary"><div class="he-box green"><div class="big">${counts.green||0}</div><div>Sehat</div></div><div class="he-box amber"><div class="big">${counts.amber||0}</div><div>Perlu Pengawasan</div></div><div class="he-box red"><div class="big">${counts.red||0}</div><div>Berisiko</div></div></div><div class="card tablecard he-table-card"><div class="scroll"><table class="table"><thead><tr><th>Proyek</th><th>Progress</th><th>Cost Ratio</th><th>RAP Consumption</th><th>Health</th><th>Gap Cost</th></tr></thead><tbody>${priority.map(r=>`<tr><td><strong>${esc(r.project_code)}</strong> — ${esc(r.project_name)}</td><td>${r.project_progress.toFixed(2)}%</td><td>${r.cost_ratio.toFixed(2)}%</td><td>${r.rap_consumption.toFixed(2)}%</td><td><span class="pill ${r.health.level}">${r.health.status}</span></td><td>${r.health.costGap>=0?'+':''}${r.health.costGap.toFixed(2)} pp</td></tr>`).join('')||'<tr><td colspan="6" class="empty">Belum ada data proyek.</td></tr>'}</tbody></table></div></div>`;
    const style=document.createElement('style');
    style.textContent='#health-engine-v1-card .health-engine-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-bottom:13px}#health-engine-v1-card .he-box{padding:16px 18px;border-radius:16px;border:1px solid var(--line)}#health-engine-v1-card .he-box.green{background:var(--green2);color:var(--green)}#health-engine-v1-card .he-box.amber{background:var(--amber2);color:var(--amber)}#health-engine-v1-card .he-box.red{background:var(--red2);color:var(--red)}#health-engine-v1-card .he-box .big{margin-bottom:3px}#health-engine-v1-card .he-table-card{overflow:hidden}@media(max-width:780px){#health-engine-v1-card .health-engine-summary{grid-template-columns:1fr}}';
    card.appendChild(style);
    const anchor=[...dashboard.querySelectorAll('.section')][0]||null;
    if(anchor)anchor.parentNode.insertBefore(card,anchor);else dashboard.appendChild(card);
  }
  function boot(){
    const s=document.createElement('script');s.src=ENGINE_URL;s.onload=load;document.body.appendChild(s);
    const obs=new MutationObserver(()=>{window.clearTimeout(window.__heTimer);window.__heTimer=window.setTimeout(load,250)});
    obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    window.setInterval(load,15000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();