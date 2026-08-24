(function(){
  const STYLE_ID='cost-control-audit-style';
  let busy=false;

  function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0))}
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .cca-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:13px}
      .cca-card{padding:17px;background:var(--card);border:1px solid var(--line);border-radius:16px}
      .cca-label{font-size:12px;color:var(--muted);font-weight:750}
      .cca-value{font-size:23px;font-weight:850;margin-top:8px}
      .cca-green{color:var(--green)} .cca-red{color:var(--red)} .cca-blue{color:var(--blue)}
      .cca-ok{background:var(--green2);color:var(--green);display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:850}
      .cca-warn{background:var(--amber2);color:var(--amber);display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:850}
      @media(max-width:1000px){.cca-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:520px){.cca-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s)
  }
  async function apply(){
    if(busy || typeof state==='undefined' || state.page!=='detail' || state.detailTab!=='cost' || !state.selected)return;
    const host=document.getElementById('page'); if(!host || host.querySelector('.cca-grid'))return;
    const detail=state.detail; if(!detail || !detail.fin)return;
    busy=true;
    try{
      const cashOut=(detail.fin||[]).filter(x=>x.transaction_type==='KELUAR').reduce((t,x)=>t+Number(x.amount||0),0);
      const r=detail.rap||{};
      const cats=[['material','Material'],['labor','Upah'],['equipment','Alat'],['operational','Operasional'],['subcontract','Subkon'],['other','Lain-Lain']];
      const real=cats.reduce((t,[key,cat])=>t+(detail.fin||[]).filter(x=>x.transaction_type==='KELUAR' && String(x.category||'').trim().toLowerCase()===cat.toLowerCase()).reduce((s,x)=>s+Number(x.amount||0),0),0);
      const diff=cashOut-real;
      const ok=Math.abs(diff)<0.01;
      const table=host.querySelector('.tablecard');
      if(!table)return;
      const wrap=document.createElement('div');wrap.className='cca-grid';
      wrap.innerHTML=`<div class="cca-card"><div class="cca-label">CASH OUT</div><div class="cca-value cca-red">${money(cashOut)}</div></div><div class="cca-card"><div class="cca-label">TOTAL REALISASI</div><div class="cca-value">${money(real)}</div></div><div class="cca-card"><div class="cca-label">SELISIH</div><div class="cca-value ${ok?'cca-blue':'cca-red'}">${money(diff)}</div></div><div class="cca-card"><div class="cca-label">REKONSILIASI</div><div class="cca-value"><span class="${ok?'cca-ok':'cca-warn'}">${ok?'TERKONTROL':'PERLU CEK'}</span></div></div>`;
      table.parentNode.insertBefore(wrap,table);
    }finally{busy=false}
  }
  addStyle();
  const obs=new MutationObserver(apply);obs.observe(document.body,{childList:true,subtree:true});
  setInterval(apply,800);apply();
})();
