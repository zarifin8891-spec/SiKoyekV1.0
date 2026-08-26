(function(){
  const SUPABASE_URL='https://mmkusplegmittrlxqxby.supabase.co';
  const SUPABASE_KEY='sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf';
  let busy=false;
  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const pct=n=>{const v=Number(n||0);const normalized=(Math.abs(v)>0&&Math.abs(v)<=1)?v*100:v;return normalized.toFixed(2)+'%'};
  function dashboard(){
    const app=document.getElementById('app');
    return app&&[...app.querySelectorAll('.content')].find(x=>x.querySelector('.top h1'));
  }
  function noPeriodFilter(root){
    const dates=[...root.querySelectorAll('.periodrow input[type="date"]')];
    const preset=root.querySelector('#periodPreset');
    return dates.every(x=>!x.value)&&(!preset||!preset.value);
  }
  function setText(el,text){if(el)el.textContent=text}
  function repair(root,rows){
    if(!rows.length)return;
    const cards=root.querySelector('.cards');
    const values=cards?[...cards.querySelectorAll('.kpi .value')]:[];
    if(values.length>=5){
      const total=rows.length;
      const contract=rows.reduce((s,r)=>s+Number(r.contract_value||0),0);
      const rap=rows.reduce((s,r)=>s+Number(r.total_rap||0),0);
      const realization=rows.reduce((s,r)=>s+Number(r.total_realization||0),0);
      const avg=rows.reduce((s,r)=>s+Number(r.project_progress||0),0)/total;
      setText(values[0],String(total));
      setText(values[1],money(contract));
      setText(values[2],money(rap));
      setText(values[3],money(realization));
      setText(values[4],pct(avg));
    }
    const health=root.querySelector('.health');
    if(health){
      const green=rows.filter(r=>r.health_status==='SEHAT').length;
      const amber=rows.filter(r=>r.health_status==='PERLU PENGAWASAN').length;
      const red=rows.filter(r=>r.health_status==='BERISIKO').length;
      const boxes=[...health.querySelectorAll('.box .big')];
      setText(boxes[0],String(green));setText(boxes[1],String(amber));setText(boxes[2],String(red));
    }
    const section=[...root.querySelectorAll('.section')].find(s=>s.querySelector('.sectiontitle h2')?.textContent.trim()==='Project Health');
    const tbody=section?.querySelector('table tbody');
    if(tbody){
      tbody.innerHTML=rows.map(x=>`<tr><td><button class="linkbtn" type="button">${String(x.project_code||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))} — ${String(x.project_name||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</button></td><td>${pct(x.project_progress)}</td><td>${pct(x.cost_ratio)}</td><td>${pct(x.rap_consumption)}</td><td><span class="pill ${x.health_status==='SEHAT'?'green':x.health_status==='BERISIKO'?'red':'amber'}">${x.health_status||'-'}</span></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Tidak ada proyek pada periode yang dipilih.</td></tr>';
    }
  }
  async function load(){
    const root=dashboard();
    if(!root||busy||!noPeriodFilter(root))return;
    const cards=root.querySelector('.cards');
    const totalValue=cards?.querySelector('.kpi .value')?.textContent?.trim();
    if(totalValue && totalValue!=='0')return;
    if(!window.supabase)return;
    busy=true;
    try{
      const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data,error}=await client.from('project_summary').select('*').order('project_code');
      if(error)throw error;
      repair(root,data||[]);
    }catch(e){console.warn('Dashboard fallback:',e)}finally{busy=false}
  }
  function boot(){load();window.setInterval(load,2000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();