(function(){
  const STYLE_ID='rcv-style';
  let busy=false;
  function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0))}
  function pct(n){return Number(n||0).toFixed(2)+'%'}
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .rcv-card{margin-bottom:13px;padding:18px;background:var(--card);border:1px solid var(--line);border-radius:16px}
      .rcv-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
      .rcv-title{font-size:17px;font-weight:850}
      .rcv-sub{font-size:12px;color:var(--muted);margin-top:4px}
      .rcv-status-ok{display:inline-flex;padding:6px 10px;border-radius:999px;background:var(--green2);color:var(--green);font-size:11px;font-weight:850}
      .rcv-status-warn{display:inline-flex;padding:6px 10px;border-radius:999px;background:var(--amber2);color:var(--amber);font-size:11px;font-weight:850}
      .rcv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}
      .rcv-item{padding:14px;border:1px solid var(--line);border-radius:13px;background:#fafbfd}
      .rcv-label{font-size:11px;color:var(--muted);font-weight:800}
      .rcv-value{font-size:20px;font-weight:850;margin-top:7px}
      .rcv-note{font-size:11px;color:var(--muted);margin-top:6px}
      .rcv-ok{color:var(--green)} .rcv-bad{color:var(--red)} .rcv-blue{color:var(--blue)}
      @media(max-width:1000px){.rcv-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:520px){.rcv-grid{grid-template-columns:1fr}.rcv-head{align-items:flex-start;flex-direction:column}}
    `;document.head.appendChild(s)
  }
  function apply(){
    if(busy || typeof state==='undefined' || state.page!=='detail' || state.detailTab!=='cost' || !state.selected)return;
    const host=document.getElementById('page'); if(!host || host.querySelector('.rcv-card'))return;
    const detail=state.detail; if(!detail || !detail.rap || !detail.fin)return;
    busy=true;
    try{
      const r=detail.rap||{};
      const rapCatTotal=['material','labor','equipment','operational','subcontract','other'].reduce((s,k)=>s+Number(r[k]||0),0);
      const summary=Array.isArray(state.summary)?state.summary.find(x=>x.project_id===state.selected):null;
      const summaryRap=Number(summary?.total_rap||0);
      const cashOut=(detail.fin||[]).filter(x=>x.transaction_type==='KELUAR').reduce((s,x)=>s+Number(x.amount||0),0);
      const rapConsumption=rapCatTotal?cashOut/rapCatTotal*100:0;
      const summaryConsumption=Number(summary?.rap_consumption||0);
      const rapDiff=rapCatTotal-summaryRap;
      const consDiff=rapConsumption-summaryConsumption;
      const ok=Math.abs(rapDiff)<0.01 && Math.abs(consDiff)<0.01;
      const card=document.createElement('div');
      card.className='rcv-card';
      card.innerHTML=`<div class="rcv-head"><div><div class="rcv-title">Validasi RAP &amp; RAP Consumption</div><div class="rcv-sub">Memeriksa konsistensi RAP kategori, total RAP, realisasi Cash Out, dan RAP Consumption.</div></div><span class="${ok?'rcv-status-ok':'rcv-status-warn'}">${ok?'RAP TERVALIDASI':'PERLU CEK'}</span></div><div class="rcv-grid"><div class="rcv-item"><div class="rcv-label">TOTAL RAP KATEGORI</div><div class="rcv-value">${money(rapCatTotal)}</div><div class="rcv-note">Material + Upah + Alat + Operasional + Subkon + Lain-Lain</div></div><div class="rcv-item"><div class="rcv-label">TOTAL RAP SISTEM</div><div class="rcv-value">${money(summaryRap)}</div><div class="rcv-note ${Math.abs(rapDiff)<0.01?'rcv-ok':'rcv-bad'}">Selisih: ${money(rapDiff)}</div></div><div class="rcv-item"><div class="rcv-label">RAP CONSUMPTION HASIL HITUNG</div><div class="rcv-value rcv-blue">${pct(rapConsumption)}</div><div class="rcv-note">Cash Out / Total RAP</div></div><div class="rcv-item"><div class="rcv-label">RAP CONSUMPTION SISTEM</div><div class="rcv-value">${pct(summaryConsumption)}</div><div class="rcv-note ${Math.abs(consDiff)<0.01?'rcv-ok':'rcv-bad'}">Selisih: ${consDiff.toFixed(4)}%</div></div></div>`;
      const table=host.querySelector('.tablecard');
      if(table)table.parentNode.insertBefore(card,table);
    }finally{busy=false}
  }
  addStyle();
  const obs=new MutationObserver(apply);obs.observe(document.body,{childList:true,subtree:true});
  setInterval(apply,800);apply();
})();
