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

/* Final dashboard polish: compact header controls and dashboard-only currency prefix removal. */
(function(){
  const STYLE_ID='sikoyek-dashboard-final-polish-v1';
  function install(){
    const dashboard=document.querySelector('.dashboard-view');
    if(!dashboard)return;
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent=`
      .dashboard-view .top.dashboard-top .actions .btn.primary,
      .dashboard-view .top.dashboard-top .actions .btn.ghost{
        height:36px!important;
        padding:7px 12px!important;
        font-size:14px!important;
        font-weight:500!important;
        line-height:1!important;
        border-radius:9px!important;
      }
      .dashboard-view .top.dashboard-top .actions{gap:6px!important}
      .dashboard-view .periodrow .field:first-child{width:210px!important;flex:0 0 210px!important}
      .dashboard-view .periodrow .field:nth-child(2),
      .dashboard-view .periodrow .field:nth-child(3){width:180px!important;flex:0 0 180px!important}
      .dashboard-view .periodrow>.btn{
        width:145px!important;
        min-width:145px!important;
        height:44px!important;
        padding:8px 10px!important;
        font-size:14px!important;
        font-weight:500!important;
      }
      .dashboard-view .dashboard-kpi-strip .kpi .value{
        font-size:18px!important;
        letter-spacing:-.01em!important;
      }
    `;
    dashboard.querySelectorAll('.dashboard-kpi-strip .kpi').forEach(card=>{
      const label=card.querySelector('.label')?.textContent.trim();
      if(!['NILAI KONTRAK','TOTAL RAP','TOTAL REALISASI'].includes(label))return;
      const value=card.querySelector('.value');
      if(!value)return;
      const text=value.textContent.trim();
      if(/^Rp\s*/i.test(text)) value.textContent=text.replace(/^Rp\s*/i,'');
    });
  }
  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;install()});
  }
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
  setTimeout(install,80);
  setInterval(install,1000);
})();

/* Project detail visual polish: align header controls with the approved 42px Dashboard controls and compact the four KPI cards below it. */
(function(){
  const STYLE_ID='sikoyek-project-detail-compact-v1';
  function install(){
    if(!document.body) return;
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent=`
      /* Detail header: only target the project-detail header, not Projects/Dashboard headers. */
      .top:has(.detailtitle) .actions .btn{
        height:42px!important;
        min-height:42px!important;
        padding:0 15px!important;
        font-size:15px!important;
        line-height:1!important;
        border-radius:10px!important;
      }
      .top:has(.detailtitle) .actions{align-items:center!important;gap:8px!important}

      /* Detail KPI strip: use the same compact visual scale as the locked Dashboard KPI cards. */
      .detailgrid{
        gap:12px!important;
      }
      .detailgrid>.card{
        min-height:96px!important;
        height:96px!important;
        padding:14px 16px!important;
        border-radius:15px!important;
        display:flex!important;
        flex-direction:column!important;
        justify-content:center!important;
      }
      .detailgrid>.card .label{
        font-size:10px!important;
        line-height:1.15!important;
        letter-spacing:.07em!important;
        font-weight:650!important;
        margin:0!important;
      }
      .detailgrid>.card .value,
      .detailgrid>.card .big{
        font-size:20px!important;
        line-height:1.15!important;
        letter-spacing:-.02em!important;
        font-weight:750!important;
        margin-top:6px!important;
      }
      .detailgrid>.card .pill{
        font-size:10px!important;
        padding:5px 9px!important;
      }
      @media(max-width:780px){
        .top:has(.detailtitle) .actions .btn{height:42px!important;min-height:42px!important}
        .detailgrid>.card{height:96px!important;min-height:96px!important}
      }
    `;
  }
  install();
  new MutationObserver(install).observe(document.body,{childList:true,subtree:true});
})();
