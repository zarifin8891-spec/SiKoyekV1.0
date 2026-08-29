(function(){
  const STYLE_ID='projects-ui-v2-style';
  const PASS5_CSS_ID='projects-ui-pass5-css';
  const PASS5_JS_ID='projects-ui-pass5-js';

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .projects-page-v2 .actions .btn,
      .projects-page-v2 .actions .btn.primary{font-weight:400!important}
      .projects-page-table-v2.table{table-layout:fixed!important;width:100%!important}
      .projects-page-table-v2.table th,
      .projects-page-table-v2.table td{box-sizing:border-box!important;vertical-align:middle!important}
      .projects-page-table-v2.table thead th{
        background:#f5f8fc!important;color:#6f7c91!important;
        border-bottom-color:#d7e0eb!important;font-weight:600!important;
        white-space:nowrap!important;
      }
      .projects-page-table-v2.table th{padding:8px 10px!important;line-height:1.1!important}
      .projects-page-table-v2.table td{padding:7px 10px!important;line-height:1.15!important}

      /* Keep total at 100%. Name slightly narrower; Status gets the recovered width. */
      .projects-page-table-v2.table th:nth-child(1),.projects-page-table-v2.table td:nth-child(1){width:7%!important}
      .projects-page-table-v2.table th:nth-child(2),.projects-page-table-v2.table td:nth-child(2){width:27%!important}
      .projects-page-table-v2.table th:nth-child(3),.projects-page-table-v2.table td:nth-child(3){width:10%!important}
      .projects-page-table-v2.table th:nth-child(4),.projects-page-table-v2.table td:nth-child(4){width:10%!important}
      .projects-page-table-v2.table th:nth-child(5),.projects-page-table-v2.table td:nth-child(5){width:9%!important}
      .projects-page-table-v2.table th:nth-child(6),.projects-page-table-v2.table td:nth-child(6){width:8%!important}
      .projects-page-table-v2.table th:nth-child(7),.projects-page-table-v2.table td:nth-child(7){width:9%!important}
      .projects-page-table-v2.table th:nth-child(8),.projects-page-table-v2.table td:nth-child(8){width:10%!important}
      .projects-page-table-v2.table th:nth-child(9),.projects-page-table-v2.table td:nth-child(9){width:10%!important}

      .projects-page-table-v2.table th:nth-child(6),
      .projects-page-table-v2.table th:nth-child(7){white-space:normal!important;line-height:1.05!important;text-align:left!important}
      .projects-page-table-v2.table td:nth-child(2){white-space:normal!important}
      .projects-page-table-v2.table td:nth-child(6),
      .projects-page-table-v2.table td:nth-child(7){white-space:nowrap!important}

      .projects-page-table-v2.table .p5-actions-cell{width:10%!important;min-width:0!important}
      .projects-page-table-v2.table .p5-toolbar{display:flex!important;justify-content:center!important;align-items:center!important;gap:6px!important;flex-wrap:nowrap!important}
      .projects-page-table-v2.table .p5-action,
      .projects-page-table-v2.table .p5-action.primary,
      .projects-page-table-v2.table .p5-action.danger{
        width:58px!important;min-width:58px!important;height:32px!important;
        padding:4px 8px!important;margin:0!important;display:inline-flex!important;
        align-items:center!important;justify-content:center!important;box-sizing:border-box!important;
        font-size:13px!important;line-height:1!important;font-weight:400!important;
      }
      .projects-page-table-v2.table .p5-lock-note{display:none!important}
      .projects-page-table-v2.table th:last-child,.projects-page-table-v2.table td:last-child{text-align:center!important}

      @media(max-width:1100px){
        .projects-page-table-v2.table{min-width:1050px!important}
        .projects-page-table-v2.table .scroll{overflow-x:auto!important}
      }
      @media(max-width:780px){.projects-page-table-v2.table{min-width:980px!important}}
    `;
    document.head.appendChild(s);
  }

  function loadPass5Assets(){
    if(!document.getElementById(PASS5_CSS_ID)){
      const link=document.createElement('link');link.id=PASS5_CSS_ID;link.rel='stylesheet';link.href='./ui-form-pass5.css?v=2';document.head.appendChild(link);
    }
    if(!document.getElementById(PASS5_JS_ID)){
      const script=document.createElement('script');script.id=PASS5_JS_ID;script.src='./ui-form-pass5.js?v=2';script.defer=true;document.body.appendChild(script);
    }
  }

  function normalizeNav(){document.querySelectorAll('.nav button').forEach(btn=>{if((btn.textContent||'').trim()==='Projects')btn.textContent='Daftar Proyek'})}
  function normalizeProjectTitle(){
    if(typeof state==='undefined'||state.page!=='projects')return;
    const page=document.getElementById('page');if(!page)return;
    page.querySelectorAll('.top h1').forEach(h=>{if((h.textContent||'').trim()==='Projects')h.textContent='Daftar Proyek'})
  }

  function cleanDuplicateActions(table){
    const head=table.querySelector('thead tr');if(!head)return;
    const headers=[...head.children];
    const aksiIndexes=headers.map((th,i)=>({i,text:(th.textContent||'').trim().replace(/\s+/g,' ').toLowerCase()})).filter(x=>x.text==='aksi').map(x=>x.i);
    if(aksiIndexes.length>1){for(let k=aksiIndexes.length-1;k>=1;k--){const idx=aksiIndexes[k];[...table.rows].forEach(row=>row.children[idx]?.remove())}}
    const finalCount=head.children.length;
    [...table.tBodies].forEach(tbody=>[...tbody.rows].forEach(row=>{while(row.children.length>finalCount)row.lastElementChild?.remove()}));
  }

  function normalizeProjectTable(){
    if(typeof state==='undefined'||state.page!=='projects')return;
    const page=document.getElementById('page');if(!page)return;
    page.classList.add('projects-page-v2');
    const tables=[...page.querySelectorAll('.tablecard table.table')];
    const table=tables.find(t=>[...t.querySelectorAll('thead th')].some(th=>(th.textContent||'').trim()==='Kode'));
    if(!table)return;
    table.classList.add('projects-page-table-v2');
    const head=table.querySelector('thead tr');if(!head)return;
    [...head.children].forEach(th=>{
      const text=(th.textContent||'').trim().replace(/\s+/g,' ');
      if(text==='Cost Ratio')th.innerHTML='Rasio<br>Biaya';
      if(text==='RAP Consumption')th.innerHTML='RAP<br>Terpakai';
      if(text==='Health')th.textContent='Status';
    });
    cleanDuplicateActions(table);
    table.querySelectorAll('.p5-lock-note').forEach(el=>el.remove());
    table.querySelectorAll('.p5-action').forEach(btn=>{
      btn.style.width='58px';btn.style.minWidth='58px';btn.style.height='32px';btn.style.padding='4px 8px';
      btn.style.display='inline-flex';btn.style.alignItems='center';btn.style.justifyContent='center';btn.style.fontWeight='400';
    });
    page.querySelectorAll('.actions .btn').forEach(btn=>btn.style.fontWeight='400');
  }

  function observe(){normalizeNav();normalizeProjectTitle();normalizeProjectTable()}
  addStyle();loadPass5Assets();
  const boot=()=>{[120,350,700,1200,2000].forEach(ms=>setTimeout(observe,ms));observe()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__projectsUiV2Timer);window.__projectsUiV2Timer=setTimeout(observe,80)});
  obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
