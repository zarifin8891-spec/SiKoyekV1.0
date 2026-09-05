/* SiKoyek V1.0 — Finance period filter fix v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_FINANCE_PERIOD_FIX_V1__)return;
  window.__SIKOYEK_FINANCE_PERIOD_FIX_V1__=true;

  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  function range(key){
    const now=new Date(),today=localDate(now);
    if(key==='this_month')return{from:localDate(new Date(now.getFullYear(),now.getMonth(),1)),to:localDate(new Date(now.getFullYear(),now.getMonth()+1,0))};
    if(key==='last_month')return{from:localDate(new Date(now.getFullYear(),now.getMonth()-1,1)),to:localDate(new Date(now.getFullYear(),now.getMonth(),0))};
    if(key==='this_year')return{from:localDate(new Date(now.getFullYear(),0,1)),to:localDate(new Date(now.getFullYear(),11,31))};
    return{from:'',to:key==='all'?'':today};
  }

  function typeOf(r){
    const t=String(r.transaction_type||r.type||r.category||'').toUpperCase();
    if(/IN|MASUK|PENERIMAAN|RECEIPT|PENDAPATAN/.test(t))return'in';
    if(/OUT|KELUAR|PENGELUARAN|PAYMENT|BIAYA|BELANJA/.test(t))return'out';
    return'other';
  }

  async function refresh(){
    const p=document.getElementById('financePeriod'),f=document.getElementById('financeFrom'),t=document.getElementById('financeTo'),pr=document.getElementById('financeProject');
    const key=p?.selectedOptions?.[0]?.dataset?.periodKey||p?.dataset?.periodStandardKey||'all';
    if(!p||!f||!t||!pr)return;
    const r=key==='custom'?{from:f.value||'',to:t.value||''}:range(key);
    if(key!=='custom'){f.value=r.from;t.value=r.to;}

    const client=window.SK?.sb||window.sb;
    if(!client)return;
    const [{data:tx,error:e1},{data:projects,error:e2}]=await Promise.all([
      client.from('financial_transactions').select('*').order('transaction_date',{ascending:false}),
      client.from('projects').select('id,project_code,project_name').order('project_code')
    ]);
    if(e1||e2)throw(e1||e2);

    const project=pr.value||'';
    const rows=(tx||[]).filter(x=>{
      const d=String(x.transaction_date||'').slice(0,10);
      return(!r.from||d>=r.from)&&(!r.to||d<=r.to)&&(!project||String(x.project_id)===String(project));
    });
    let income=0,expense=0;
    rows.forEach(x=>{const a=Number(x.amount||0);if(typeOf(x)==='in')income+=a;else if(typeOf(x)==='out')expense+=a});

    const byId=new Map((projects||[]).map(x=>[String(x.id),x]));
    const body=document.getElementById('financeBody');
    const kCount=document.getElementById('financeKpiCount'),kIn=document.getElementById('financeKpiIn'),kOut=document.getElementById('financeKpiOut'),kNet=document.getElementById('financeKpiNet');
    if(kCount)kCount.textContent=rows.length;
    if(kIn)kIn.textContent=money(income);
    if(kOut)kOut.textContent=money(expense);
    if(kNet)kNet.textContent=money(income-expense);
    if(!body)return;
    body.innerHTML=rows.length?rows.map(x=>{const p=byId.get(String(x.project_id));return `<tr><td>${esc(String(x.transaction_date||'').slice(0,10))}</td><td>${esc(p?`${p.project_code||'-'} — ${p.project_name||'-'}`:'-')}</td><td class="finance-type-${typeOf(x)}">${esc(x.transaction_type||x.type||'-')}</td><td>${esc(x.description||x.notes||x.remark||'-')}</td><td class="num">${money(x.amount)}</td></tr>`}).join(''):'<tr><td colspan="5" class="extra-empty">Tidak ada transaksi pada periode/filter ini.</td></tr>';
  }

  function bind(){
    const p=document.getElementById('financePeriod');
    if(!p||p.dataset.financePeriodFixV1==='1')return;
    p.dataset.financePeriodFixV1='1';
    p.addEventListener('change',e=>{e.preventDefault();e.stopImmediatePropagation();setTimeout(()=>refresh().catch(()=>{}),0)},true);
    ['financeFrom','financeTo','financeProject'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>refresh().catch(()=>{})));
    refresh().catch(()=>{});
  }

  function scan(){bind()}
  const boot=()=>{scan();let n=0;const tick=()=>{scan();if(++n<80)setTimeout(tick,100)};tick();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
