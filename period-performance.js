(function(){
  const STYLE_ID='period-performance-style-v4';
  const SECTION_CLASS='period-performance-section';
  let loading=false;

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .period-performance-section{margin-top:16px!important}
      .period-performance-section .pp-layout-v4{display:grid!important;grid-template-columns:minmax(0,20%) minmax(0,80%)!important;gap:14px!important;align-items:stretch!important;width:100%!important}
      .period-performance-section .pp-panel-v4{min-width:0!important;background:var(--card,#fff)!important;border:1px solid var(--line,#e5eaf1)!important;border-radius:15px!important;overflow:hidden!important;box-sizing:border-box!important}
      .period-performance-section .pp-head-v4{min-height:38px!important;padding:9px 12px 7px!important;display:flex!important;align-items:center!important;box-sizing:border-box!important}
      .period-performance-section .pp-head-v4 h2{margin:0!important;font-size:14px!important;line-height:1.2!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .period-performance-section .pp-kpis-v4{display:grid!important;grid-template-rows:repeat(4,46px)!important;gap:6px!important;padding:6px 12px 12px!important}
      .period-performance-section .pp-kpi-v4{height:46px!important;padding:6px 8px!important;border:1px solid var(--line,#e5eaf1)!important;border-radius:11px!important;display:flex!important;align-items:center!important;gap:8px!important;box-sizing:border-box!important;min-width:0!important}
      .period-performance-section .pp-icon-v4{width:28px!important;height:28px!important;flex:0 0 28px!important;border-radius:50%!important;display:grid!important;place-items:center!important;font-size:13px!important;font-weight:800!important}
      .period-performance-section .pp-kpi-v4:nth-child(1) .pp-icon-v4{background:#e9f8f1!important;color:#0b9a65!important}
      .period-performance-section .pp-kpi-v4:nth-child(2) .pp-icon-v4{background:#fff5df!important;color:#d99500!important}
      .period-performance-section .pp-kpi-v4:nth-child(3) .pp-icon-v4{background:#eaf3ff!important;color:#1465d8!important}
      .period-performance-section .pp-kpi-v4:nth-child(4) .pp-icon-v4{background:#f1eaff!important;color:#7652b7!important}
      .period-performance-section .pp-copy-v4{min-width:0!important}
      .period-performance-section .pp-copy-v4 .label{font-size:8px!important;line-height:1.05!important;font-weight:700!important;color:var(--muted)!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .period-performance-section .pp-copy-v4 .value{margin-top:2px!important;font-size:14px!important;line-height:1.05!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .period-performance-section .pp-table-v4{margin:0 12px 12px!important;border:1px solid var(--line,#e5eaf1)!important;border-radius:11px!important;overflow:hidden!important}
      .period-performance-section .pp-scroll-v4{height:220px!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:thin!important}
      .period-performance-section .pp-grid-v4{width:100%!important;min-width:0!important}
      .period-performance-section .pp-row-v4{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;width:100%!important;min-width:0!important;margin:0!important;padding:0!important;box-sizing:border-box!important}
      .period-performance-section .pp-row-v4>.pp-cell-v4{display:flex!important;align-items:center!important;flex:0 0 auto!important;min-width:0!important;box-sizing:border-box!important;margin:0!important;height:100%!important;padding:8px 10px!important;line-height:1.15!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important}
      .period-performance-section .pp-row-v4>.pp-cell-v4:nth-child(1){width:35%!important;justify-content:flex-start!important;text-align:left!important}
      .period-performance-section .pp-row-v4>.pp-cell-v4:nth-child(2){width:18%!important;justify-content:flex-end!important;text-align:right!important}
      .period-performance-section .pp-row-v4>.pp-cell-v4:nth-child(3){width:18%!important;justify-content:flex-end!important;text-align:right!important}
      .period-performance-section .pp-row-v4>.pp-cell-v4:nth-child(4){width:20%!important;justify-content:flex-end!important;text-align:right!important}
      .period-performance-section .pp-row-v4>.pp-cell-v4:nth-child(5){width:9%!important;justify-content:center!important;text-align:center!important}
      .period-performance-section .pp-header-v4{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;min-height:36px!important;background:#fafbfd!important;border-bottom:1px solid var(--line,#e5eaf1)!important}
      .period-performance-section .pp-header-v4>.pp-cell-v4{font-size:8.5px!important;font-weight:800!important;letter-spacing:.04em!important;color:var(--muted)!important;text-transform:uppercase!important;white-space:nowrap!important}
      .period-performance-section .pp-data-v4{min-height:36px!important;border-bottom:1px solid var(--line,#e5eaf1)!important}
      .period-performance-section .pp-data-v4:last-child{border-bottom:0!important}
      .period-performance-section .pp-data-v4>.pp-cell-v4{font-size:11px!important}
      .period-performance-section .pp-link-v4{display:block!important;width:100%!important;min-width:0!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;color:var(--blue,#245cff)!important;font:inherit!important;font-weight:800!important;text-align:left!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;cursor:pointer!important}
      .period-performance-section .pp-empty-v4{padding:18px 10px!important;text-align:center!important;color:var(--muted)!important;font-size:11px!important}
      @media(max-width:1100px){
        .period-performance-section .pp-layout-v4{grid-template-columns:1fr!important}
        .period-performance-section .pp-kpis-v4{grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:none!important}
        .period-performance-section .pp-table-v4{overflow-x:auto!important}
        .period-performance-section .pp-grid-v4{min-width:760px!important}
      }
      @media(max-width:720px){.period-performance-section .pp-kpis-v4{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:520px){.period-performance-section .pp-kpis-v4{grid-template-columns:1fr!important}.period-performance-section .pp-table-v4{margin-left:10px!important;margin-right:10px!important}.period-performance-section .pp-head-v4{padding-left:10px!important;padding-right:10px!important}}
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
    const ids=projects.map(x=>x.project_id).filter(Boolean);
    loading=true;
    try{
      let transactions=[];
      if(ids.length){
        const {data,error}=await sb.from('financial_transactions').select('project_id,transaction_date,transaction_type,amount').in('project_id',ids);
        if(error)throw error;
        transactions=data||[];
      }
      const rows=projects.map(p=>{
        const tx=transactions.filter(x=>x.project_id===p.project_id&&inRange(x.transaction_date));
        const cashIn=tx.filter(x=>x.transaction_type==='MASUK').reduce((s,x)=>s+Number(x.amount||0),0);
        const cashOut=tx.filter(x=>x.transaction_type==='KELUAR').reduce((s,x)=>s+Number(x.amount||0),0);
        return {project_id:p.project_id,project_code:p.project_code,project_name:p.project_name,cashIn,cashOut,net:cashIn-cashOut,count:tx.length};
      });
      const totals=rows.reduce((a,r)=>({cashIn:a.cashIn+r.cashIn,cashOut:a.cashOut+r.cashOut,net:a.net+r.net,count:a.count+r.count}),{cashIn:0,cashOut:0,net:0,count:0});
      const wrap=document.createElement('div');wrap.className='section '+SECTION_CLASS;
      const dataRows=rows.length?rows.map(r=>`<div class="pp-row-v4 pp-data-v4"><div class="pp-cell-v4"><button class="pp-link-v4" onclick="openProject('${r.project_id}')">${esc(r.project_code)} — ${esc(r.project_name)}</button></div><div class="pp-cell-v4">${money(r.cashIn)}</div><div class="pp-cell-v4">${money(r.cashOut)}</div><div class="pp-cell-v4">${money(r.net)}</div><div class="pp-cell-v4">${r.count}</div></div>`).join(''):`<div class="pp-empty-v4">Tidak ada transaksi pada periode yang dipilih.</div>`;
      wrap.innerHTML=`<div class="pp-layout-v4"><section class="pp-panel-v4"><div class="pp-head-v4"><h2>Kinerja Periode</h2></div><div class="pp-kpis-v4"><div class="pp-kpi-v4"><div class="pp-icon-v4">⇩</div><div class="pp-copy-v4"><div class="label">CASH IN PERIODE</div><div class="value">${periodMoney(totals.cashIn)}</div></div></div><div class="pp-kpi-v4"><div class="pp-icon-v4">⇧</div><div class="pp-copy-v4"><div class="label">CASH OUT PERIODE</div><div class="value">${periodMoney(totals.cashOut)}</div></div></div><div class="pp-kpi-v4"><div class="pp-icon-v4">↗</div><div class="pp-copy-v4"><div class="label">ARUS KAS BERSIH</div><div class="value">${periodMoney(totals.net)}</div></div></div><div class="pp-kpi-v4"><div class="pp-icon-v4">▣</div><div class="pp-copy-v4"><div class="label">JUMLAH TRANSAKSI</div><div class="value">${totals.count}</div></div></div></div></section><section class="pp-panel-v4"><div class="pp-head-v4"><h2>Transaksi pada periode : ${periodLabel()}</h2></div><div class="pp-table-v4"><div class="pp-scroll-v4"><div class="pp-grid-v4"><div class="pp-row-v4 pp-header-v4"><div class="pp-cell-v4">PROYEK</div><div class="pp-cell-v4">KAS MASUK</div><div class="pp-cell-v4">KAS KELUAR</div><div class="pp-cell-v4">ARUS KAS BERSIH</div><div class="pp-cell-v4">TRANSAKSI</div></div>${dataRows}</div></div></div></section></div>`;
      panels.after(wrap);
    }catch(e){try{toast(e?.message||'Gagal membaca kinerja periode')}catch(_){}}
    finally{loading=false}
  }

  addStyle();load();
  let timer=0;
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{timer=0;load()},250)}
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
  if(typeof window!=='undefined'){window.addEventListener('popstate',schedule);window.addEventListener('hashchange',schedule)}

  // Entry point for the unified five-menu application shell.
  // This file is already loaded by index.html, so it is used as the safe bootstrap hook.
  if(!window.__SIKOYEK_UNIFIED_CORE__) {
    const s=document.createElement('script');
    s.src='./core-unified-shell-v1.js?v=1';
    s.async=false;
    document.head.appendChild(s);
  }
})();