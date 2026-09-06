/* SiKoyek V1.0 — Laporan actions v4 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_ACTIONS_V4__)return;
  window.__SIKOYEK_LAPORAN_ACTIONS_V4__=true;

  const escHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const csvCell=s=>'"'+String(s??'').replace(/"/g,'""')+'"';

  function styles(){
    if(document.getElementById('laporan-actions-v4-style'))return;
    const s=document.createElement('style');s.id='laporan-actions-v4-style';s.textContent=`
      .laporan-v3 .report-actions-v1{display:flex;justify-content:flex-end;gap:6px;margin:0 0 8px}
      .laporan-v3 .report-actions-v1 button{height:32px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--text);padding:0 11px;cursor:pointer;font-size:11px;font-weight:700}
      .laporan-v3 .report-actions-v1 button:hover{background:#f8fafc}
      @media print{.laporan-v3 .report-actions-v1{display:none!important}}
    `;document.head.appendChild(s);
  }

  function activeButton(root){return root.querySelector('.report-tabs button.active')||null}
  function activeName(root){return activeButton(root)?.textContent?.trim()||'Laporan'}
  function reportId(root){return activeButton(root)?.dataset?.report||''}
  function textById(id){return document.getElementById(id)?.textContent?.trim()||''}
  function valueById(id){return document.getElementById(id)?.value||''}
  function formatDate(v){
    const s=String(v||'').slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
    const [y,m,d]=s.split('-');
    return `${d}-${m}-${y}`;
  }
  function periodText(prefixes){
    let from='',to='';
    for(const p of prefixes){
      const f=valueById(p+'From'),t=valueById(p+'To');
      if(f||t){from=formatDate(f);to=formatDate(t);break}
    }
    if(!from&&!to)return 'Semua Periode';
    return `${from||'...'}  s/d  ${to||'...'}`;
  }
  function projectLabelFromSelect(ids){
    for(const id of ids){
      const el=document.getElementById(id);
      if(el){
        const opt=el.options?.[el.selectedIndex];
        const txt=opt?.textContent?.trim()||'';
        if(txt && !/semua proyek|pilih proyek/i.test(txt))return txt;
      }
    }
    return '';
  }
  function readKpis(selector,excludeLabels=[]){
    const root=document.querySelector(selector);
    if(!root)return [];
    return [...root.children].map(node=>{
      const label=node.querySelector('.label,small')?.textContent?.trim()||'';
      const value=node.querySelector('.value,strong')?.textContent?.trim()||'';
      return {label,value};
    }).filter(x=>x.label && !excludeLabels.some(v=>x.label.toUpperCase()===v.toUpperCase()));
  }
  function kpiBoxHtml(item){
    return `<div class="print-kpi"><div class="print-kpi-label">${escHtml(item.label)}</div><div class="print-kpi-value">${escHtml(item.value)}</div></div>`;
  }
  function metaLineHtml(label,value){
    return `<div class="print-meta-row"><span class="print-meta-label">${escHtml(label)}</span><span class="print-meta-colon">:</span><strong>${escHtml(value)}</strong></div>`;
  }

  function buildHeader(root,id,title){
    let meta='',kpis=[];
    if(id==='summary'){
      meta=metaLineHtml('Periode',periodText(['sum']));
      kpis=readKpis('#reportContent .kpis');
    }else if(id==='progress'){
      const project=projectLabelFromSelect(['progProject'])||'-';
      meta=metaLineHtml('Proyek',project);
      kpis=readKpis('#reportContent .progress-project-toolbar .kpi',['PROJECT PROGRESS']);
    }else if(id==='rap'){
      meta=metaLineHtml('Periode',periodText(['rap','rapBiaya']));
      kpis=readKpis('#reportContent .rap-biaya-kpis');
      if(!kpis.length)kpis=readKpis('#reportContent .extra-kpis');
      if(kpis.length===5)kpis.unshift({label:'TOTAL PROYEK',value:textById('rapKpiProject')||textById('rapBiayaKpiProjects')||''});
    }else if(id==='finance'){
      meta=metaLineHtml('Periode',periodText(['finance']));
      const project=projectLabelFromSelect(['financeProject']);
      if(project)meta+=metaLineHtml('Proyek',project);
      kpis=readKpis('#reportContent .finance-summary');
    }else if(id==='kinerja'){
      kpis=readKpis('#reportContent .kinerja-toolbar .kinerja-kpi');
      if(!kpis.length)kpis=readKpis('#reportContent .kinerja-toolbar .kpi');
    }

    return `<header class="print-header print-header-${escHtml(id||'report')}" data-report-id="${escHtml(id||'report')}">
      <div class="print-brand">SiKoyek V1.0</div>
      <div class="print-title">${escHtml(title)}</div>
      ${meta?`<div class="print-meta-block">${meta}</div>`:''}
      ${kpis.length?`<div class="print-kpis">${kpis.map(kpiBoxHtml).join('')}</div>`:''}
    </header>`;
  }

  function cleanContentHtml(content,id){
    const clone=content.cloneNode(true);
    const remove=(sel)=>clone.querySelectorAll(sel).forEach(el=>el.remove());
    remove('.report-actions-v1,.report-tabs,.filters,.finance-toolbar,.finance-summary,.progress-project-toolbar,.rap-biaya-filter,.rap-biaya-kpis,.extra-period-grid,.extra-kpis,.kinerja-toolbar');
    if(id==='kinerja'){
      remove('.kinerja-trend-filter');
    }
    return clone.innerHTML;
  }

  function inject(){
    const root=document.querySelector('.laporan-v3');
    if(!root)return false;
    styles();
    let bar=root.querySelector('.report-actions-v1');
    if(!bar){
      bar=document.createElement('div');
      bar.className='report-actions-v1';
      bar.innerHTML='<button type="button" id="laporanPrintV1">Cetak</button><button type="button" id="laporanCsvV1">Export CSV</button>';
      const tabs=root.querySelector('.report-tabs');
      if(tabs)tabs.insertAdjacentElement('afterend',bar);else root.prepend(bar);
      bar.querySelector('#laporanPrintV1').addEventListener('click',printReport);
      bar.querySelector('#laporanCsvV1').addEventListener('click',exportCsv);
    }
    return true;
  }

  function printReport(){
    const root=document.querySelector('.laporan-v3'),content=root?.querySelector('#reportContent');
    if(!content)return;

    const title=activeName(root);
    const id=reportId(root);
    const landscape=id!=='progress';
    const paper=landscape?'A4 landscape':'A4 portrait';
    const headerHtml=buildHeader(root,id,title);
    const contentHtml=cleanContentHtml(content,id);

    const iframe=document.createElement('iframe');
    iframe.setAttribute('aria-hidden','true');
    iframe.title='Print preview';
    Object.assign(iframe.style,{position:'fixed',right:'0',bottom:'0',width:'0',height:'0',border:'0',visibility:'hidden'});
    document.body.appendChild(iframe);

    const doc=iframe.contentDocument;
    if(!doc){iframe.remove();window.print();return}
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#fff}
      body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:8.5pt;line-height:1.15}
      .print-wrap{width:100%;}
      .print-header{margin:0 0 3.5mm;padding:0 0 2.5mm;border-bottom:1px solid #222;break-after:avoid;}
      .print-brand{font-size:15pt;font-weight:800;line-height:1;margin:0 0 1.8mm;}
      .print-title{font-size:13.5pt;font-weight:800;line-height:1.05;margin:0 0 1.2mm;}
      .print-meta-block{font-size:8.5pt;line-height:1.2;margin:0;}
      .print-meta-row{display:flex;align-items:baseline;gap:0;margin:0 0 .6mm;white-space:nowrap;}
      .print-meta-label{width:17mm;display:inline-block;}
      .print-meta-colon{width:4mm;display:inline-block;text-align:center;}
      .print-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:3.2mm;margin-top:4mm;align-items:stretch;}
      .print-header-progress .print-kpis{grid-template-columns:repeat(4,minmax(0,1fr));}
      .print-header-rap .print-kpis{grid-template-columns:repeat(5,minmax(0,1fr));}
      .print-header-finance .print-kpis{grid-template-columns:repeat(4,minmax(0,1fr));}
      .print-header-kinerja .print-kpis{grid-template-columns:repeat(5,minmax(0,1fr));}
      .print-kpi{border:1px solid #222;min-height:10mm;padding:2.3mm 2.5mm 2.2mm;display:flex;flex-direction:column;justify-content:center;text-align:center;overflow:hidden;}
      .print-kpi-label{font-size:8.3pt;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .print-kpi-value{font-size:9pt;font-weight:700;line-height:1.05;margin-top:1.3mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .card{border:0!important;border-radius:0!important;box-shadow:none!important;margin:0 0 2.5mm!important;padding:0!important;overflow:visible!important;background:#fff!important}
      .card-header{padding:0 0 1mm!important;margin:0!important;border:0!important}
      .card-header h3,.card-header h4{font-size:9.5pt!important;margin:0!important}
      table{width:100%;border-collapse:collapse;border-spacing:0;page-break-inside:auto}
      thead{display:table-header-group}
      tfoot{display:table-footer-group}
      tr{break-inside:avoid;page-break-inside:avoid}
      th,td{border:1px solid #222;padding:1.25mm 1.35mm;text-align:left;font-size:7.7pt;line-height:1.08;vertical-align:top}
      th{background:#f1f1f1!important;font-weight:700}
      td.num,th.num{text-align:right;white-space:nowrap}
      .empty,.extra-empty{padding:5mm!important;text-align:center}
      .progress-bar,.progress-track,.progressbar{height:3.5px!important;min-height:3.5px!important}
      .kinerja-section{margin:0 0 2.5mm!important;border:0!important;border-radius:0!important;}
      .kinerja-section h3,.kinerja-section h4,.kinerja-title{font-size:9.5pt!important;margin:0 0 1mm!important;padding:0!important;border:0!important;}
      .kinerja-table th,.kinerja-table td{font-size:6.6pt!important;padding:1mm .95mm!important;white-space:nowrap}
      .kinerja-table th:nth-child(2),.kinerja-table td:nth-child(2){white-space:normal}
      .kinerja-chart-wrap{padding:0!important;margin:0!important;border:0!important;overflow:visible!important}
      .kinerja-chart{width:100%!important;max-width:100%!important;height:110px!important;min-height:110px!important}
      .kinerja-legend{margin:1mm 0 1.5mm!important;padding:0!important;font-size:6.3pt!important;line-height:1.05!important}
      svg{max-width:100%}
      .note-card{display:none!important}
      @page{size:${paper};margin:8mm}
      @media print{body{padding:0}a{color:inherit;text-decoration:none}}
    </style></head><body>
      <div class="print-wrap">
        ${headerHtml}
        ${contentHtml}
      </div>
    </body></html>`);
    doc.close();

    const win=iframe.contentWindow;
    let printed=false;
    const cleanup=()=>setTimeout(()=>iframe.remove(),800);
    const doPrint=()=>{if(printed)return;printed=true;win.focus();win.print();cleanup()};
    iframe.onload=()=>setTimeout(doPrint,120);
    setTimeout(doPrint,600);
  }

  function tableToRows(table){return [...table.rows].map(row=>[...row.cells].map(cell=>cell.innerText.trim().replace(/\s+/g,' ')))}

  function exportCsv(){
    const root=document.querySelector('.laporan-v3'),content=root?.querySelector('#reportContent');
    if(!content)return;
    const tables=[...content.querySelectorAll('table')];
    if(!tables.length){alert('Tidak ada tabel yang dapat diekspor pada laporan ini.');return}
    const title=activeName(root).replace(/[^a-z0-9\-_]+/gi,'_').replace(/^_+|_+$/g,'').toLowerCase()||'laporan';
    const blocks=[];
    tables.forEach((table,i)=>{if(i)blocks.push(['']);blocks.push(...tableToRows(table));});
    const csv='\ufeff'+blocks.map(row=>row.map(csvCell).join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${title}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }

  function boot(){
    let n=0;
    const tick=()=>{if(inject()||++n>=80)return;setTimeout(tick,100)};
    tick();
    const target=document.body||document.documentElement;
    if(target)new MutationObserver(()=>inject()).observe(target,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
