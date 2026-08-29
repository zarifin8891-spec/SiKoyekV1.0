(function(){
  const STYLE_ID='period-performance-style';
  const SECTION_CLASS='period-performance-section';
  let loading=false;
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      .period-performance-section{margin-top:16px}
      .period-performance-section .pp-layout{display:grid;grid-template-columns:20% minmax(0,80%);gap:14px;align-items:stretch}
      .period-performance-section .pp-panel{min-width:0;background:var(--card,#fff);border:1px solid var(--line,#e5eaf1);border-radius:15px;overflow:hidden;box-sizing:border-box}
      .period-performance-section .pp-panel-head{min-height:38px;padding:9px 12px 7px;display:flex;align-items:center;box-sizing:border-box}
      .period-performance-section .pp-panel-head h2{margin:0;font-size:14px;line-height:1.2;font-weight:800}
      .period-performance-section .pp-kpi-stack{display:grid;grid-template-rows:repeat(4,46px);gap:6px;padding:6px 12px 12px}
      .period-performance-section .pp-kpi{height:46px;padding:6px 8px;border:1px solid var(--line,#e5eaf1);border-radius:11px;display:flex;align-items:center;gap:8px;box-sizing:border-box}
      .period-performance-section .pp-kpi-icon{width:28px;height:28px;flex:0 0 28px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:800;background:#eef5ff;color:#1465d8}
      .period-performance-section .pp-kpi:nth-child(1) .pp-kpi-icon{background:#e9f8f1;color:#0b9a65}
      .period-performance-section .pp-kpi:nth-child(2) .pp-kpi-icon{background:#fff5df;color:#d99500}
      .period-performance-section .pp-kpi:nth-child(3) .pp-kpi-icon{background:#eaf3ff;color:#1465d8}
      .period-performance-section .pp-kpi:nth-child(4) .pp-kpi-icon{background:#f1eaff;color:#7652b7}
      .period-performance-section .pp-kpi-copy{min-width:0}
      .period-performance-section .pp-kpi .label{font-size:8px;line-height:1.05;font-weight:700;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .period-performance-section .pp-kpi .value{margin-top:2px;font-size:14px;line-height:1.05;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .period-performance-section .pp-table-wrap{margin:0 12px 12px;border:1px solid var(--line,#e5eaf1);border-radius:11px;overflow:hidden}
      .period-performance-section .pp-table-scroll{height:220px;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}
      .period-performance-section .pp-table{width:100%;min-width:0}
      .period-performance-section .pp-table-row{display:grid;grid-template-columns:35% 18% 18% 20% 9%;align-items:center;width:100%;box-sizing:border-box}
      .period-performance-section .pp-table-header{min-height:34px;background:#fafbfd;border-bottom:1px solid var(--line,#e5eaf1)}
      .period-performance-section .pp-table-cell{min-width:0;padding:7px 10px;box-sizing:border-box;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .period-performance-section .pp-table-header .pp-table-cell{font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
      .period-performance-section .pp-table-row:not(.pp-table-header) .pp-table-cell{font-size:11px;border-bottom:1px solid var(--line,#e5eaf1)}
      .period-performance-section .pp-table-row:last-child .pp-table-cell{border-bottom:0}
      .period-performance-section .pp-table-cell:nth-child(1){text-align:left}
      .period-performance-section .pp-table-cell:nth-child(2),.period-performance-section .pp-table-cell:nth-child(3),.period-performance-section .pp-table-cell:nth-child(4){text-align:right}
      .period-performance-section .pp-table-cell:nth-child(5){text-align:center}
      .period-performance-section .pp-table-link{display:block;width:100%;padding:0;border:0;background:transparent;color:var(--blue,#245cff);font:inherit;font-weight:800;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
      .period-performance-section .pp-empty{padding:18px 10px;text-align:center;color:var(--muted);font-size:11px}
      @media(max-width:1100px){
        .period-performance-section .pp-layout{grid-template-columns:1fr}
        .period-performance-section .pp-kpi-stack{grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:none}
        .period-performance-section .pp-table-scroll{overflow-x:auto}
        .period-performance-section .pp-table{min-width:760px}
      }
      @media(max-width:720px){.period-performance-section .pp-kpi-stack{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none}}
      @media(max-width:520px){.period-performance-section .pp-kpi-stack{grid-template-columns:1fr}.period-performance-section .pp-table-wrap{margin-left:10px;margin-right:10px}.period-performance-section .pp-panel-head{padding-left:10px;padding-right:10px}}
    `;
    document.head.appendChild(s);
  }
  function periodMoney(value){return money(value).replace(/^Rp\s*/,'')}
  function inRange(date){if(!date)return false;if(state.period?.from&&date<state.period.from)return false;if(state.period?.to&&date>state.period.to)return false;return true}
  async function load(){
    if(loading||typeof state==='undefined'||state.page!=='dashboard')return;
    const page=document.getElementById('page');if(!page)return;
    if(page.querySelector('.'+SECTION_CLASS))return;
    const panels=page.querySelector('.dashboard-panels');if(!panels)return;
    const projects=(state.summary||[]).filter(typeof periodMatch==='function'?periodMatch:()=>true);
    const ids=projects.map(x=>x.project_id).filter(Boolean);loading=true;
    try{
      let transactions=[];
      if(ids.length){const {data,error}=await sb.from('financial_transactions').select('project_id,transaction_date,transaction_type,amount').in('project_id',ids);if(error)throw error;transactions=data||[]}
      const rows=projects.map(p=>{const tx=transactions.filter(x=>x.project_id===p.project_id&&inRange(x.transaction_date));const cashIn=tx.filter(x=>x.transaction_type==='MASUK').reduce((s,x)=>s+Number(x.amount||0),0);const cashOut=tx.filter(x=>x.transaction_type==='KELUAR').reduce((s,x)=>s+Number(x.amount||0),0);return{project_id:p.project_id,project_code:p.project_code,project_name:p.project_name,cashIn,cashOut,net:cashIn-cashOut,count:tx.length}});
      const totals=rows.reduce((a,r)=>({cashIn:a.cashIn+r.cashIn,cashOut:a.cashOut+r.cashOut,net:a.net+r.net,count:a.count+r.count}),{cashIn:0,cashOut:0,net:0,count:0});
      const wrap=document.createElement('div');wrap.className='section '+SECTION_CLASS;
      const tableRows=rows.length?rows.map(r=>`<div class="pp-table-row"><div class="pp-table-cell"><button class="pp-table-link" onclick="openProject('${r.project_id}')">${esc(r.project_code)} — ${esc(r.project_name)}</button></div><div class="pp-table-cell">${money(r.cashIn)}</div><div class="pp-table-cell">${money(r.cashOut)}</div><div class="pp-table-cell">${money(r.net)}</div><div class="pp-table-cell">${r.count}</div></div>`).join(''):`<div class="pp-empty">Tidak ada transaksi pada periode yang dipilih.</div>`;
      wrap.innerHTML=`<div class="pp-layout"><section class="pp-panel"><div class="pp-panel-head"><h2>Kinerja Periode</h2></div><div class="pp-kpi-stack"><div class="pp-kpi"><div class="pp-kpi-icon">⇩</div><div class="pp-kpi-copy"><div class="label">CASH IN PERIODE</div><div class="value">${periodMoney(totals.cashIn)}</div></div></div><div class="pp-kpi"><div class="pp-kpi-icon">⇧</div><div class="pp-kpi-copy"><div class="label">CASH OUT PERIODE</div><div class="value">${periodMoney(totals.cashOut)}</div></div></div><div class="pp-kpi"><div class="pp-kpi-icon">↗</div><div class="pp-kpi-copy"><div class="label">NET CASHFLOW</div><div class="value">${periodMoney(totals.net)}</div></div></div><div class="pp-kpi"><div class="pp-kpi-icon">▣</div><div class="pp-kpi-copy"><div class="label">JUMLAH TRANSAKSI</div><div class="value">${totals.count}</div></div></div></div></section><section class="pp-panel"><div class="pp-panel-head"><h2>Transaksi pada periode : ${periodLabel()}</h2></div><div class="pp-table-wrap"><div class="pp-table-scroll"><div class="pp-table"><div class="pp-table-row pp-table-header"><div class="pp-table-cell">Proyek</div><div class="pp-table-cell">Cash In</div><div class="pp-table-cell">Cash Out</div><div class="pp-table-cell">Net Cashflow</div><div class="pp-table-cell">Transaksi</div></div>${tableRows}</div></div></div></section></div>`;
      panels.after(wrap);
    }catch(e){try{toast(e?.message||'Gagal membaca kinerja periode')}catch(_){} }finally{loading=false}
  }
  addStyle();load();
  let timer=0;
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{timer=0;load()},250)}
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
  if(typeof window!=='undefined'){window.addEventListener('popstate',schedule);window.addEventListener('hashchange',schedule)}
  const ps=document.createElement('script');ps.id='projects-ui-v1-script';ps.src='./projects-ui-v1.js?v=2';ps.defer=true;document.body.appendChild(ps);
})();