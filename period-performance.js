(function(){
  const STYLE_ID='period-performance-style-v3';
  const SECTION_CLASS='period-performance-section';
  const GRID='35fr 18fr 18fr 20fr 9fr';
  let loading=false;

  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .period-performance-section{margin-top:16px!important}
      .period-performance-section .pp-layout-v3{display:grid!important;grid-template-columns:minmax(0,20%) minmax(0,80%)!important;gap:14px!important;align-items:stretch!important}
      .period-performance-section .pp-panel-v3{min-width:0!important;background:var(--card,#fff)!important;border:1px solid var(--line,#e5eaf1)!important;border-radius:15px!important;overflow:hidden!important;box-sizing:border-box!important}
      .period-performance-section .pp-panel-head-v3{min-height:38px!important;padding:9px 12px 7px!important;display:flex!important;align-items:center!important;box-sizing:border-box!important}
      .period-performance-section .pp-panel-head-v3 h2{margin:0!important;font-size:14px!important;line-height:1.2!important;font-weight:800!important}
      .period-performance-section .pp-kpi-stack-v3{display:grid!important;grid-template-rows:repeat(4,46px)!important;gap:6px!important;padding:6px 12px 12px!important}
      .period-performance-section .pp-kpi-v3{height:46px!important;padding:6px 8px!important;border:1px solid var(--line,#e5eaf1)!important;border-radius:11px!important;display:flex!important;align-items:center!important;gap:8px!important;box-sizing:border-box!important}
      .period-performance-section .pp-kpi-icon-v3{width:28px!important;height:28px!important;flex:0 0 28px!important;border-radius:50%!important;display:grid!important;place-items:center!important;font-size:13px!important;font-weight:800!important}
      .period-performance-section .pp-kpi-v3:nth-child(1) .pp-kpi-icon-v3{background:#e9f8f1!important;color:#0b9a65!important}
      .period-performance-section .pp-kpi-v3:nth-child(2) .pp-kpi-icon-v3{background:#fff5df!important;color:#d99500!important}
      .period-performance-section .pp-kpi-v3:nth-child(3) .pp-kpi-icon-v3{background:#eaf3ff!important;color:#1465d8!important}
      .period-performance-section .pp-kpi-v3:nth-child(4) .pp-kpi-icon-v3{background:#f1eaff!important;color:#7652b7!important}
      .period-performance-section .pp-kpi-copy-v3{min-width:0!important}
      .period-performance-section .pp-kpi-copy-v3 .label{font-size:8px!important;line-height:1.05!important;font-weight:700!important;color:var(--muted)!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .period-performance-section .pp-kpi-copy-v3 .value{margin-top:2px!important;font-size:14px!important;line-height:1.05!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .period-performance-section .pp-table-wrap-v3{margin:0 12px 12px!important;border:1px solid var(--line,#e5eaf1)!important;border-radius:11px!important;overflow:hidden!important}
      .period-performance-section .pp-table-scroll-v3{height:220px!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:thin!important}
      .period-performance-section .pp-grid-v3{width:100%!important;min-width:0!important}
      .period-performance-section .pp-grid-row-v3{display:grid!important;grid-template-columns:minmax(0,35fr) minmax(0,18fr) minmax(0,18fr) minmax(0,20fr) minmax(44px,9fr)!important;grid-auto-flow:row!important;align-items:center!important;width:100%!important;margin:0!important;padding:0!important;box-sizing:border-box!important}
      .period-performance-section .pp-grid-header-v3{min-height:36px!important;background:#fafbfd!important;border-bottom:1px solid var(--line,#e5eaf1)!important}
      .period-performance-section .pp-grid-cell-v3{display:flex!important;align-items:center!important;min-width:0!important;width:auto!important;height:auto!important;margin:0!important;padding:8px 10px!important;box-sizing:border-box!important;line-height:1.15!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important}
      .period-performance-section .pp-grid-header-v3 .pp-grid-cell-v3{font-size:8.5px!important;font-weight:800!important;letter-spacing:.04em!important;color:var(--muted)!important;text-transform:uppercase!important;white-space:nowrap!important}
      .period-performance-section .pp-grid-cell-v3:nth-child(1){justify-content:flex-start!important;text-align:left!important}
      .period-performance-section .pp-grid-cell-v3:nth-child(2),.period-performance-section .pp-grid-cell-v3:nth-child(3),.period-performance-section .pp-grid-cell-v3:nth-child(4){justify-content:flex-end!important;text-align:right!important}
      .period-performance-section .pp-grid-cell-v3:nth-child(5){justify-content:center!important;text-align:center!important}
      .period-performance-section .pp-grid-row-v3:not(.pp-grid-header-v3) .pp-grid-cell-v3{font-size:11px!important;border-bottom:1px solid var(--line,#e5eaf1)!important}
      .period-performance-section .pp-grid-row-v3:last-child .pp-grid-cell-v3{border-bottom:0!important}
      .period-performance-section .pp-grid-link-v3{display:block!important;width:100%!important;min-width:0!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;color:var(--blue,#245cff)!important;font:inherit!important;font-weight:800!important;text-align:left!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;cursor:pointer!important}
      .period-performance-section .pp-empty-v3{padding:18px 10px!important;text-align:center!important;color:var(--muted)!important;font-size:11px!important}
      @media(max-width:1100px){
        .period-performance-section .pp-layout-v3{grid-template-columns:1fr!important}
        .period-performance-section .pp-kpi-stack-v3{grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:none!important}
        .period-performance-section .pp-table-scroll-v3{overflow-x:auto!important}
        .period-performance-section .pp-grid-v3{min-width:760px!important}
      }
      @media(max-width:720px){.period-performance-section .pp-kpi-stack-v3{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:520px){.period-performance-section .pp-kpi-stack-v3{grid-template-columns:1fr!important}.period-performance-section .pp-table-wrap-v3{margin-left:10px!important;margin-right:10px!important}.period-performance-section .pp-panel-head-v3{padding-left:10px!important;padding-right:10px!important}}
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
      const wrap=document.createElement('div');
      wrap.className='section '+SECTION_CLASS;

      const inlineRow='display:grid!important;grid-template-columns:minmax(0,35fr) minmax(0,18fr) minmax(0,18fr) minmax(0,20fr) minmax(44px,9fr)!important;grid-auto-flow:row!important;align-items:center!important;width:100%!important;box-sizing:border-box!important;';
      const inlineCell='display:flex!important;align-items:center!important;min-width:0!important;width:auto!important;box-sizing:border-box!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;padding:8px 10px!important;';

      const tableRows=rows.length?rows.map(r=>`
        <div class="pp-grid-row-v3" style="${inlineRow}">
          <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:flex-start!important;text-align:left!important;"><button class="pp-grid-link-v3" onclick="openProject('${r.project_id}')">${esc(r.project_code)} — ${esc(r.project_name)}</button></div>
          <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:flex-end!important;text-align:right!important;">${money(r.cashIn)}</div>
          <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:flex-end!important;text-align:right!important;">${money(r.cashOut)}</div>
          <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:flex-end!important;text-align:right!important;">${money(r.net)}</div>
          <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:center!important;text-align:center!important;">${r.count}</div>
        </div>`).join(''):`<div class="pp-empty-v3">Tidak ada transaksi pada periode yang dipilih.</div>`;

      wrap.innerHTML=`
        <div class="pp-layout-v3">
          <section class="pp-panel-v3">
            <div class="pp-panel-head-v3"><h2>Kinerja Periode</h2></div>
            <div class="pp-kpi-stack-v3">
              <div class="pp-kpi-v3"><div class="pp-kpi-icon-v3">⇩</div><div class="pp-kpi-copy-v3"><div class="label">CASH IN PERIODE</div><div class="value">${periodMoney(totals.cashIn)}</div></div></div>
              <div class="pp-kpi-v3"><div class="pp-kpi-icon-v3">⇧</div><div class="pp-kpi-copy-v3"><div class="label">CASH OUT PERIODE</div><div class="value">${periodMoney(totals.cashOut)}</div></div></div>
              <div class="pp-kpi-v3"><div class="pp-kpi-icon-v3">↗</div><div class="pp-kpi-copy-v3"><div class="label">ARUS KAS BERSIH</div><div class="value">${periodMoney(totals.net)}</div></div></div>
              <div class="pp-kpi-v3"><div class="pp-kpi-icon-v3">▣</div><div class="pp-kpi-copy-v3"><div class="label">JUMLAH TRANSAKSI</div><div class="value">${totals.count}</div></div></div>
            </div>
          </section>
          <section class="pp-panel-v3">
            <div class="pp-panel-head-v3"><h2>Transaksi pada periode : ${periodLabel()}</h2></div>
            <div class="pp-table-wrap-v3">
              <div class="pp-table-scroll-v3">
                <div class="pp-grid-v3">
                  <div class="pp-grid-row-v3 pp-grid-header-v3" style="${inlineRow}min-height:36px!important;">
                    <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:flex-start!important;text-align:left!important;font-size:8.5px!important;font-weight:800!important;">PROYEK</div>
                    <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:flex-end!important;text-align:right!important;font-size:8.5px!important;font-weight:800!important;">KAS MASUK</div>
                    <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:flex-end!important;text-align:right!important;font-size:8.5px!important;font-weight:800!important;">KAS KELUAR</div>
                    <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:flex-end!important;text-align:right!important;font-size:8.5px!important;font-weight:800!important;">ARUS KAS BERSIH</div>
                    <div class="pp-grid-cell-v3" style="${inlineCell}justify-content:center!important;text-align:center!important;font-size:8.5px!important;font-weight:800!important;">TRANSAKSI</div>
                  </div>
                  ${tableRows}
                </div>
              </div>
            </div>
          </section>
        </div>`;

      panels.after(wrap);
    }catch(e){try{toast(e?.message||'Gagal membaca kinerja periode')}catch(_){}}
    finally{loading=false}
  }

  addStyle();
  load();
  let timer=0;
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{timer=0;load()},250)}
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  if(typeof window!=='undefined'){window.addEventListener('popstate',schedule);window.addEventListener('hashchange',schedule)}
})();