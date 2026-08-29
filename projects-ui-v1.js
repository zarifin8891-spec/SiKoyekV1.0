(function(){
  const STYLE_ID='projects-ui-v1-style';
  const PASS5_CSS_ID='projects-ui-pass5-css';
  const PASS5_JS_ID='projects-ui-pass5-js';

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* Projects page only. Dashboard layout is intentionally untouched. */
      .projects-page-v1 .actions .btn,
      .projects-page-v1 .actions .btn.primary{font-weight:400!important}
      .projects-page-table.table{table-layout:fixed;width:100%}
      .projects-page-table.table th,
      .projects-page-table.table td{box-sizing:border-box;vertical-align:middle}
      .projects-page-table.table thead th{
        background:#f5f8fc!important;
        color:#6f7c91!important;
        border-bottom-color:#d7e0eb!important;
        font-weight:600!important;
      }
      .projects-page-table.table th{padding:10px 11px!important}
      .projects-page-table.table td{padding:8px 11px!important}
      .projects-page-table.table th:nth-child(1),.projects-page-table.table td:nth-child(1){width:7%}
      .projects-page-table.table th:nth-child(2),.projects-page-table.table td:nth-child(2){width:24%}
      .projects-page-table.table th:nth-child(3),.projects-page-table.table td:nth-child(3){width:10%}
      .projects-page-table.table th:nth-child(4),.projects-page-table.table td:nth-child(4){width:10%}
      .projects-page-table.table th:nth-child(5),.projects-page-table.table td:nth-child(5){width:9%}
      .projects-page-table.table th:nth-child(6),.projects-page-table.table td:nth-child(6){width:9%}
      .projects-page-table.table th:nth-child(7),.projects-page-table.table td:nth-child(7){width:10%}
      .projects-page-table.table th:nth-child(8),.projects-page-table.table td:nth-child(8){width:9%}
      .projects-page-table.table th:nth-child(9),.projects-page-table.table td:nth-child(9){width:12%}
      .projects-page-table.table th:nth-child(7){white-space:normal;line-height:1.05}
      .projects-page-table.table td:nth-child(2){white-space:normal}
      .projects-page-table.table .p5-actions-cell{min-width:0!important;width:12%}
      .projects-page-table.table .p5-toolbar{display:flex;justify-content:center;gap:6px;flex-wrap:nowrap}
      .projects-page-table.table .p5-action{width:58px;min-width:58px;height:34px;padding:6px 8px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;font-weight:400!important}
      .projects-page-table.table .p5-action.primary,.projects-page-table.table .p5-action.danger{font-weight:400!important}
      .projects-page-table.table .p5-lock-note{display:none!important}
      .projects-page-table.table th:last-child{text-align:center}
      .projects-page-table.table td:last-child{text-align:center}
      @media(max-width:1100px){
        .projects-page-table.table .scroll{overflow-x:auto}
        .projects-page-table.table{min-width:1050px}
      }
      @media(max-width:780px){
        .projects-page-table.table{min-width:980px}
      }
    `;
    document.head.appendChild(s);
  }

  function loadPass5Assets(){
    if(!document.getElementById(PASS5_CSS_ID)){
      const link=document.createElement('link');
      link.id=PASS5_CSS_ID;link.rel='stylesheet';link.href='./ui-form-pass5.css?v=2';document.head.appendChild(link);
    }
    if(!document.getElementById(PASS5_JS_ID)){
      const script=document.createElement('script');
      script.id=PASS5_JS_ID;script.src='./ui-form-pass5.js?v=2';script.defer=true;document.body.appendChild(script);
    }
  }

  function normalizeNav(){
    document.querySelectorAll('.nav button').forEach(btn=>{
      if((btn.textContent||'').trim()==='Projects') btn.textContent='Daftar Proyek';
    });
  }

  function normalizeProjectTitle(){
    if(typeof state==='undefined'||state.page!=='projects') return;
    const page=document.getElementById('page');
    const h=page?.querySelector('.top h1');
    if(h && (h.textContent||'').trim()==='Projects') h.textContent='Daftar Proyek';
  }

  function normalizeProjectTable(){
    if(typeof state==='undefined'||state.page!=='projects') return;
    const page=document.getElementById('page');
    if(page) page.classList.add('projects-page-v1');
    const tables=[...document.querySelectorAll('.tablecard table.table')];
    const table=tables.find(t=>[...t.querySelectorAll('thead th')].some(th=>(th.textContent||'').trim()==='Kode'));
    if(!table)return;
    table.classList.add('projects-page-table');
    const head=table.querySelector('thead tr');if(!head)return;

    [...head.children].forEach(th=>{
      const text=(th.textContent||'').trim().replace(/\s+/g,' ');
      if(text==='RAP Consumption') th.innerHTML='RAP<br>Consumption';
    });

    const actionIndexes=[...head.children].map((th,i)=>({i,text:(th.textContent||'').trim().toLowerCase()})).filter(x=>x.text==='aksi').map(x=>x.i);
    if(actionIndexes.length>1){
      for(let k=actionIndexes.length-1;k>=1;k--){
        const idx=actionIndexes[k];
        [...table.rows].forEach(row=>row.children[idx]?.remove());
      }
    }

    table.querySelectorAll('.p5-lock-note').forEach(el=>el.remove());
    table.querySelectorAll('.p5-action').forEach(btn=>{
      btn.style.width='58px';btn.style.minWidth='58px';btn.style.height='34px';
      btn.style.display='inline-flex';btn.style.alignItems='center';btn.style.justifyContent='center';
      btn.style.fontWeight='400';
    });
    page.querySelectorAll('.actions .btn').forEach(btn=>btn.style.fontWeight='400');
  }

  function observe(){normalizeNav();normalizeProjectTitle();normalizeProjectTable()}

  addStyle();
  loadPass5Assets();
  const boot=()=>setTimeout(observe,160);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__projectsUiV1Timer);window.__projectsUiV1Timer=setTimeout(observe,100)});
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
