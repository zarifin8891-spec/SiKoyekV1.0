(function(){
  const VERSION='1.0';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  let client=null,lastSignature='';
  async function load(){
    if(!window.supabase||!window.SiKoyekCashflowDecisionEngine)return;
    const app=document.getElementById('app');
    const dashboard=app&&[...app.querySelectorAll('.content')].find(x=>x.querySelector('.top h1'));
    if(!dashboard)return;
    if(!client)client=window.supabase.createClient('https://mmkusplegmittrlxqxby.supabase.co','sb_publishable_m9qLt2yxWi6i40bo9ixR5A_QIbOLoyf',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await client.from('project_summary').select('project_code,project_name,cash_in,cash_out,net_cashflow').order('project_code');
    if(error||!data)return;
    const rows=data.map(r=>{const d=window.SiKoyekCashflowDecisionEngine.evaluate(r);return {...r,decision:d}});
    const sig=JSON.stringify(rows.map(r=>[r.project_code,r.cash_in,r.cash_out,r.net_cashflow,r.decision.status]));
    if(sig===lastSignature)return;lastSignature=sig;
    const old=document.getElementById('cashflow-decision-v1-card');if(old)old.remove();
    const rank={TINGGI:3,SEDANG:2,RENDAH:1};
    const sorted=[...rows].sort((a,b)=>rank[b.decision.priority]-rank[a.decision.priority]);
    const card=document.createElement('section');card.id='cashflow-decision-v1-card';card.className='section';
    card.innerHTML=`<div class="sectiontitle"><h2>Cash Flow Control <span class="pill blue">Decision Engine V${VERSION}</span></h2><span class="note">Berbasis Cash In / Cash Out / Net Cashflow</span></div><div class="cashflow-decision-grid"><div class="cashflow-decision-box green"><div class="note">NET CASHFLOW POSITIF</div><strong>${rows.filter(r=>r.decision.status==='SEHAT').length}</strong></div><div class="cashflow-decision-box amber"><div class="note">PERLU PENGAWASAN</div><strong>${rows.filter(r=>r.decision.status==='PERLU PENGAWASAN').length}</strong></div><div class="cashflow-decision-box red"><div class="note">BERISIKO</div><strong>${rows.filter(r=>r.decision.status==='BERISIKO').length}</strong></div></div><div class="card tablecard"><div class="scroll"><table class="table"><thead><tr><th>Proyek</th><th>Cash In</th><th>Cash Out</th><th>Net Cashflow</th><th>Prioritas</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>${sorted.slice(0,5).map(r=>`<tr><td><strong>${esc(r.project_code)}</strong> — ${esc(r.project_name)}</td><td>${money(r.cash_in)}</td><td>${money(r.cash_out)}</td><td>${money(r.net_cashflow)}</td><td><span class="pill ${r.decision.priority==='TINGGI'?'red':r.decision.priority==='SEDANG'?'amber':'green'}">${r.decision.priority}</span></td><td>${r.decision.status}</td><td>${esc(r.decision.action)}</td></tr>`).join('')}</tbody></table></div></div>`;
    const style=document.createElement('style');style.textContent='#cashflow-decision-v1-card .cashflow-decision-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-bottom:12px}#cashflow-decision-v1-card .cashflow-decision-box{padding:16px;border-radius:16px;border:1px solid var(--line)}#cashflow-decision-v1-card .cashflow-decision-box strong{display:block;font-size:28px;margin-top:4px}#cashflow-decision-v1-card .cashflow-decision-box.green{background:var(--green2);color:var(--green)}#cashflow-decision-v1-card .cashflow-decision-box.amber{background:var(--amber2);color:var(--amber)}#cashflow-decision-v1-card .cashflow-decision-box.red{background:var(--red2);color:var(--red)}@media(max-width:780px){#cashflow-decision-v1-card .cashflow-decision-grid{grid-template-columns:1fr}}';card.appendChild(style);
    const decisionCard=document.getElementById('decision-engine-v1-card');
    if(decisionCard)decisionCard.parentNode.insertBefore(card,decisionCard.nextSibling);
    else dashboard.appendChild(card);
  }
  function boot(){const s=document.createElement('script');s.src='./project-cashflow-decision-engine-v1.js?v=1';s.onload=load;document.body.appendChild(s);window.setInterval(load,15000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
