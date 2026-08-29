(function(){
  /* Pass 8: use the real project-form shell for Master Kategori,
     prevent duplicate category controls, and keep project status system-driven. */

  function normalizeCategoryMaster(){
    const box=document.querySelector('.modalbox:has(#p6CatRows)');
    if(!box) return;
    if(box.querySelector(':scope > .p6-side')) return;

    const side=document.createElement('aside');
    side.className='p6-side';
    side.innerHTML=
      '<div class="p6-mark">MASTER DATA</div>'+
      '<div class="p6-title">Kategori proyek</div>'+
      '<div class="p6-desc">Kelola kategori proyek sebagai master data terpusat.</div>'+
      '<div class="p6-hint">Edit, nonaktifkan, atau aktifkan kembali tanpa merusak histori.</div>';

    const body=document.createElement('div');
    body.className='p6-body';
    while(box.firstChild) body.appendChild(box.firstChild);
    box.appendChild(side);
    box.appendChild(body);
    box.classList.add('p6-form','p6-master');
    box.dataset.p6='1';
  }

  function normalizeCategoryTools(){
    const select=document.getElementById('f_cat');
    const field=select?.closest('.field');
    if(!field) return;
    const rows=[...field.querySelectorAll('.category-tools')];
    if(!rows.length) return;
    rows[0].classList.add('step1-category-tools');
    rows.slice(1).forEach(row=>row.remove());
  }

  function hideManualStatusFields(){
    ['f_status','p5_status'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      const field=el.closest('.field');
      if(field){field.style.display='none';field.setAttribute('data-system-status','true')}
      else el.style.display='none';
    });
  }

  function injectStatusStyles(){
    if(document.getElementById('p8-status-styles')) return;
    const style=document.createElement('style');
    style.id='p8-status-styles';
    style.textContent=`
      .p8-status-selesai{color:#11875d!important;font-weight:800!important}
      .p8-status-pending{color:#c27600!important;font-weight:800!important}
      .p8-status-jalan{color:#245cff!important;font-weight:800!important}
      .p8-status-rencana{color:#687386!important;font-weight:800!important}
      .p8-status-badge{display:inline-flex;align-items:center;font-weight:800!important}
    `;
    document.head.appendChild(style);
  }

  function decorateStatusElements(){
    injectStatusStyles();
    const statusClass={SELESAI:'p8-status-selesai',PENDING:'p8-status-pending',JALAN:'p8-status-jalan',RENCANA:'p8-status-rencana'};
    document.querySelectorAll('select option').forEach(option=>{
      const value=String(option.value||option.textContent||'').trim().toUpperCase();
      if(statusClass[value]) option.classList.add(statusClass[value]);
    });
    document.querySelectorAll('.pill, .status, [class*="status"], td, p, div, span, strong').forEach(el=>{
      if(el.closest('script,style,select,textarea,input')) return;
      if(el.dataset.p8StatusDecorated==='1') return;
      const text=el.textContent.trim().toUpperCase();
      if(statusClass[text]){
        el.classList.add(statusClass[text],'p8-status-badge');
        el.dataset.p8StatusDecorated='1';
      }
    });
  }

  function decorateStatusTextNodes(){
    const statuses=['SELESAI','PENDING','JALAN','RENCANA'];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];let n;
    while((n=walker.nextNode())){
      const p=n.parentElement;
      if(!p||p.closest('script,style,select,textarea,input')||p.closest('.p8-status-badge')) continue;
      if(statuses.some(s=>n.nodeValue.toUpperCase().includes(s))) nodes.push(n);
    }
    nodes.forEach(node=>{
      const raw=node.nodeValue;if(!raw)return;
      const re=/(SELESAI|PENDING|JALAN|RENCANA)/gi;if(!re.test(raw))return;re.lastIndex=0;
      const frag=document.createDocumentFragment();let last=0,m;
      while((m=re.exec(raw))){
        if(m.index>last)frag.appendChild(document.createTextNode(raw.slice(last,m.index)));
        const span=document.createElement('span');span.textContent=m[0];span.className='p8-status-badge p8-status-'+m[0].toLowerCase();frag.appendChild(span);last=re.lastIndex;
      }
      if(last<raw.length)frag.appendChild(document.createTextNode(raw.slice(last)));
      node.parentNode.replaceChild(frag,node);
    });
  }

  function loadProjectSummaryV2(){
    if(document.getElementById('project-summary-v2-script')) return;
    const script=document.createElement('script');script.id='project-summary-v2-script';script.src='./project-summary-v2.js?v=1';script.defer=true;document.body.appendChild(script);
  }

  /* Load the Projects list UI explicitly. index.html already loads Pass 8,
     so this is the reliable entry point for the Projects-only visual layer. */
  function loadProjectsUI(){
    if(document.getElementById('projects-ui-v1-script')) return;
    const script=document.createElement('script');
    script.id='projects-ui-v1-script';
    script.src='./projects-ui-v1.js?v=3';
    script.defer=true;
    document.body.appendChild(script);
  }

  /* Actual Keuangan page is rendered by index.html. Compact only the three
     financial KPI cards when they are present; do not touch transaction data. */
  function compactFinanceKpis(){
    const replacements={
      'CASH IN':'KAS MASUK',
      'CASH OUT':'KAS KELUAR',
      'NET CASHFLOW':'ARUS KAS BERSIH',
      'CASH INFLOW':'KAS MASUK',
      'CASH OUTFLOW':'KAS KELUAR'
    };
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length>0) return;
      const raw=(el.textContent||'').trim();
      const key=raw.toUpperCase();
      if(!replacements[key]) return;
      if(el.dataset.p8FinanceLabel==='1') return;
      el.textContent=replacements[key];
      el.dataset.p8FinanceLabel='1';
      const card=el.closest('.card')||el.parentElement;
      if(!card||card.dataset.p8FinanceCard==='1') return;
      card.dataset.p8FinanceCard='1';
      card.style.setProperty('height','68px','important');
      card.style.setProperty('min-height','68px','important');
      card.style.setProperty('padding','10px 16px','important');
      card.style.setProperty('display','flex','important');
      card.style.setProperty('flex-direction','column','important');
      card.style.setProperty('justify-content','center','important');
      card.style.setProperty('gap','0','important');
      card.style.setProperty('border-radius','13px','important');
      const label=el;
      label.style.setProperty('font-size','10px','important');
      label.style.setProperty('line-height','1.1','important');
      label.style.setProperty('font-weight','650','important');
      label.style.setProperty('margin','0','important');
      const value=[...card.querySelectorAll('*')].find(x=>x!==label && x.children.length===0 && /Rp|\d/.test((x.textContent||'')));
      if(value){
        value.style.setProperty('font-size','19px','important');
        value.style.setProperty('line-height','1.1','important');
        value.style.setProperty('font-weight','800','important');
        value.style.setProperty('margin-top','4px','important');
        value.style.setProperty('white-space','nowrap','important');
        value.style.setProperty('overflow','hidden','important');
        value.style.setProperty('text-overflow','ellipsis','important');
      }
    });
  }

  function observe(){
    normalizeCategoryMaster();normalizeCategoryTools();hideManualStatusFields();decorateStatusElements();decorateStatusTextNodes();loadProjectSummaryV2();loadProjectsUI();compactFinanceKpis();
  }
  const boot=()=>setTimeout(observe,80);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const obs=new MutationObserver(()=>{clearTimeout(window.__p8t);window.__p8t=setTimeout(observe,80)});
  obs.observe(document.body,{childList:true,subtree:true});
})();
