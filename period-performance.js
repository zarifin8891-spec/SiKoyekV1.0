(function(){
  const STYLE = `.periodperf{margin-top:18px}.periodperf .cards{grid-template-columns:repeat(5,1fr)}.periodperf .tablecard{margin-top:12px}`;
  const style=document.createElement('style'); style.textContent=STYLE; document.head.appendChild(style);
  let cachePromise=null;
  async function loadPeriodData(){
    if(cachePromise)return cachePromise;
    cachePromise=(async()=>{
      const [txRes,prRes,wiRes]=await Promise.all([
        sb.from('financial_transactions').select('project_id,transaction_date,transaction_type,amount'),
        sb.from('progress_records').select('project_id,work_item_id,progress_date,progress_percentage'),
        sb.from('project_work_items').select('id,project_id,weight')
      ]);
      if(txRes.error||prRes.error||wiRes.error){throw (txRes.error||prRes.error||wiRes.error)}
      return {transactions:txRes.data||[],progress:prRes.data||[],weights:Object.fromEntries((wiRes.data||[]).map(x=>[x.id,Number(x.weight||0)]))};
    })();
    return cachePromise;
  }
  function inRange(d){
    if(!d)return false;
    if(state.period?.from && d<state.period.from)return false;
    if(state.period?.to && d>state.period.to)return false;
    return true;
  }
  function perf(projects,data){
    const ids=new Set(projects.map(p=>p.project_id));
    const tx=data.transactions.filter(x=>ids.has(x.project_id)&&inRange(x.transaction_date));
    const pr=data.progress.filter(x=>ids.has(x.project_id)&&inRange(x.progress_date));
    const rows=projects.map(p=>{
      const pt=tx.filter(x=>x.project_id===p.project_id);
      const cashIn=pt.filter(x=>x.transaction_type==='MASUK').reduce((s,x)=>s+Number(x.amount||0),0);
      const cashOut=pt.filter(x=>x.transaction_type==='KELUAR').reduce((s,x)=>s+Number(x.amount||0),0);
      const progress=pr.filter(x=>x.project_id===p.project_id).reduce((s,x)=>s+(data.weights[x.work_item_id]||0)*Number(x.progress_percentage||0)*100,0);
      return {project_id:p.project_id,project_code:p.project_code,project_name:p.project_name,cashIn,cashOut,net:cashIn-cashOut,progress};
    });
    const totals=rows.reduce((a,r)=>({cashIn:a.cashIn+r.cashIn,cashOut:a.cashOut+r.cashOut,net:a.net+r.net,progress:a.progress+r.progress}),{cashIn:0,cashOut:0,net:0,progress:0});
    totals.avgProgress=rows.length?totals.progress/rows.length:0;
    return {rows,totals};
  }
  const originalDashboard=window.dashboard;
  window.dashboard=function(){
    const base=originalDashboard();
    const projects=state.summary.filter(typeof periodMatch==='function'?periodMatch:()=>true);
    if(!cachePromise){
      loadPeriodData().then(()=>{try{renderPage()}catch(e){}}).catch(e=>{try{toast(e?.message||'Gagal membaca data periode')}catch(_){}});
      return base.replace('</div></div>`</div>','</div></div>`</div>');
    }
    const data=cachePromise.__value;
    if(!data)return base;
    const p=perf(projects,data),m=money,pc=p.totals;
    const block=`<div class="section periodperf"><div class="sectiontitle"><h2>Kinerja Periode</h2><span class="note">Aktivitas transaksi dan progress pada periode ${periodLabel()}</span></div><div class="cards"><div class="card kpi"><div class="label">CASH IN PERIODE</div><div class="value">${m(pc.cashIn)}</div></div><div class="card kpi"><div class="label">CASH OUT PERIODE</div><div class="value">${m(pc.cashOut)}</div></div><div class="card kpi"><div class="label">REALISASI PERIODE</div><div class="value">${m(pc.cashOut)}</div></div><div class="card kpi"><div class="label">NET CASHFLOW</div><div class="value">${m(pc.net)}</div></div><div class="card kpi"><div class="label">AVG TAMBAHAN PROGRESS</div><div class="value">${pct(pc.avgProgress)}</div></div></div><div class="card tablecard"><div class="scroll"><table class="table"><thead><tr><th>Proyek</th><th>Cash In</th><th>Cash Out</th><th>Net Cashflow</th><th>Tambahan Progress</th></tr></thead><tbody>${p.rows.map(x=>`<tr><td><button class="linkbtn" onclick="openProject('${x.project_id}')">${esc(x.project_code)} — ${esc(x.project_name)}</button></td><td>${m(x.cashIn)}</td><td>${m(x.cashOut)}</td><td>${m(x.net)}</td><td>${pct(x.progress)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Tidak ada aktivitas pada periode yang dipilih.</td></tr>'}</tbody></table></div></div></div>`;
    const marker='<div class="section"><div class="health">';
    return base.replace(marker,block+marker);
  };
  const originalLoad=window.loadPeriodData;
  const originalPromise=loadPeriodData();
  originalPromise.then(v=>{originalPromise.__value=v; cachePromise.__value=v; try{renderPage()}catch(e){}}).catch(()=>{});
})();