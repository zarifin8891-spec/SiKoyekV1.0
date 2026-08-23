(function(){
  const STYLE_ID='period-performance-style';
  const SECTION_CLASS='period-performance-section';
  let loading=false;

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .period-performance-section{margin-top:18px}
      .period-performance-section .sectiontitle{margin-bottom:10px}
      .period-performance-section .pp-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}
      .period-performance-section .pp-note{font-size:12px;color:var(--muted)}
      .period-performance-section .pp-table{margin-top:13px}
      @media(max-width:1100px){.period-performance-section .pp-cards{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:520px){.period-performance-section .pp-cards{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function inRange(date){
    if(!date) return false;
    if(state.period?.from && date<state.period.from) return false;
    if(state.period?.to && date>state.period.to) return false;
    return true;
  }

  async function load(){
    if(loading) return;
    if(typeof state==='undefined' || state.page!=='dashboard') return;
    const page=document.getElementById('page');
    if(!page || page.querySelector('.'+SECTION_CLASS)) return;
    const health=[...page.querySelectorAll('.sectiontitle h2')].find(x=>x.textContent.trim()==='Project Health');
    if(!health) return;

    const projects=(state.summary||[]).filter(typeof periodMatch==='function'?periodMatch:()=>true);
    const ids=projects.map(x=>x.project_id).filter(Boolean);
    loading=true;
    try{
      let transactions=[];
      if(ids.length){
        const {data,error}=await sb.from('financial_transactions').select('project_id,transaction_date,transaction_type,amount,description').in('project_id',ids);
        if(error) throw error;
        transactions=data||[];
      }
      const rows=projects.map(p=>{
        const tx=transactions.filter(x=>x.project_id===p.project_id && inRange(x.transaction_date));
        const cashIn=tx.filter(x=>x.transaction_type==='MASUK').reduce((s,x)=>s+Number(x.amount||0),0);
        const cashOut=tx.filter(x=>x.transaction_type==='KELUAR').reduce((s,x)=>s+Number(x.amount||0),0);
        return {project_id:p.project_id,project_code:p.project_code,project_name:p.project_name,cashIn,cashOut,net:cashIn-cashOut,count:tx.length};
      });
      const totals=rows.reduce((a,r)=>({cashIn:a.cashIn+r.cashIn,cashOut:a.cashOut+r.cashOut,net:a.net+r.net,count:a.count+r.count}),{cashIn:0,cashOut:0,net:0,count:0});

      const wrap=document.createElement('div');
      wrap.className='section '+SECTION_CLASS;
      wrap.innerHTML=`
        <div class="sectiontitle">
          <h2>Kinerja Periode</h2>
          <span class="pp-note">Transaksi pada periode ${periodLabel()}</span>
        </div>
        <div class="pp-cards">
          <div class="card kpi"><div class="label">CASH IN PERIODE</div><div class="value">${money(totals.cashIn)}</div></div>
          <div class="card kpi"><div class="label">CASH OUT PERIODE</div><div class="value">${money(totals.cashOut)}</div></div>
          <div class="card kpi"><div class="label">NET CASHFLOW</div><div class="value">${money(totals.net)}</div></div>
          <div class="card kpi"><div class="label">JUMLAH TRANSAKSI</div><div class="value">${totals.count}</div></div>
        </div>
        <div class="card tablecard pp-table">
          <div class="scroll">
            <table class="table">
              <thead><tr><th>Proyek</th><th>Cash In</th><th>Cash Out</th><th>Net Cashflow</th><th>Transaksi</th></tr></thead>
              <tbody>
                ${rows.map(r=>`<tr><td><button class="linkbtn" onclick="openProject('${r.project_id}')">${esc(r.project_code)} — ${esc(r.project_name)}</button></td><td>${money(r.cashIn)}</td><td>${money(r.cashOut)}</td><td>${money(r.net)}</td><td>${r.count}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Tidak ada transaksi pada periode yang dipilih.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>`;
      health.closest('.section').before(wrap);
    }catch(e){
      try{toast(e?.message||'Gagal membaca kinerja periode')}catch(_){ }
    }finally{loading=false;}
  }

  addStyle();
  const observer=new MutationObserver(()=>load());
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(load,800);
  load();
})();
