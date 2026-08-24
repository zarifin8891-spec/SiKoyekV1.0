(function(){
  const STYLE_ID='detail-finance-kpi-style';
  const MARK='detail-finance-kpi';

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .${MARK}{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-bottom:18px}
      .${MARK} .dfk-card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:17px}
      .${MARK} .dfk-label{font-size:12px;color:var(--muted);font-weight:750}
      .${MARK} .dfk-value{font-size:23px;font-weight:850;margin-top:8px}
      .${MARK} .cash-in .dfk-value{color:var(--green)}
      .${MARK} .cash-out .dfk-value{color:var(--red)}
      .${MARK} .net .dfk-value{color:var(--blue)}
      @media(max-width:780px){.${MARK}{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function money(n){
    return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  }

  let lastProjectId=null;
  let lastCount=null;

  async function render(){
    if(typeof state==='undefined' || state.page!=='detail' || state.detailTab!=='keuangan'){
      document.querySelector('.'+MARK)?.remove();
      lastProjectId=null; lastCount=null;
      return;
    }
    const page=document.getElementById('page');
    if(!page || !state.selected) return;
    const rows=Array.isArray(state.detail?.fin)?state.detail.fin:[];
    const projectId=state.selected;
    const signature=projectId+':'+rows.length+':'+rows.reduce((s,x)=>s+String(x.id||x.amount||''),'');
    if(projectId===lastProjectId && signature===lastCount) return;
    lastProjectId=projectId; lastCount=signature;

    const cashIn=rows.filter(x=>x.transaction_type==='MASUK').reduce((s,x)=>s+Number(x.amount||0),0);
    const cashOut=rows.filter(x=>x.transaction_type==='KELUAR').reduce((s,x)=>s+Number(x.amount||0),0);
    const net=cashIn-cashOut;

    const sectionTitle=[...page.querySelectorAll('.sectiontitle h2')].find(h=>h.textContent.trim()==='Transaksi Keuangan');
    if(!sectionTitle) return;
    const existing=page.querySelector('.'+MARK);
    if(existing) existing.remove();

    const wrap=document.createElement('div');
    wrap.className=MARK;
    wrap.innerHTML=`
      <div class="dfk-card cash-in"><div class="dfk-label">CASH IN</div><div class="dfk-value">${money(cashIn)}</div></div>
      <div class="dfk-card cash-out"><div class="dfk-label">CASH OUT</div><div class="dfk-value">${money(cashOut)}</div></div>
      <div class="dfk-card net"><div class="dfk-label">NET CASHFLOW</div><div class="dfk-value">${money(net)}</div></div>
    `;
    const titleSection=sectionTitle.closest('.sectiontitle');
    titleSection?.parentElement?.insertBefore(wrap,titleSection.nextElementSibling||null);
  }

  addStyle();
  const observer=new MutationObserver(()=>render());
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(render,500);
  render();
})();
