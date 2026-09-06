/* SiKoyek V1.0 — Laporan actions v2 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_ACTIONS_V2__)return;
  window.__SIKOYEK_LAPORAN_ACTIONS_V2__=true;

  const escHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const csvCell=s=>'"'+String(s??'').replace(/"/g,'""')+'"';

  function styles(){
    if(document.getElementById('laporan-actions-v2-style'))return;
    const s=document.createElement('style');s.id='laporan-actions-v2-style';s.textContent=`
      .laporan-v3 .report-actions-v1{display:flex;justify-content:flex-end;gap:6px;margin:0 0 8px}
      .laporan-v3 .report-actions-v1 button{height:32px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--text);padding:0 11px;cursor:pointer;font-size:11px;font-weight:700}
      .laporan-v3 .report-actions-v1 button:hover{background:#f8fafc}
      @media print{.laporan-v3 .report-actions-v1{display:none!important}}
    `;document.head.appendChild(s);
  }

  function activeButton(root){return root.querySelector('.report-tabs button.active')||null}
  function activeName(root){return activeButton(root)?.textContent?.trim()||'Laporan'}
  function reportId(root){return activeButton(root)?.dataset?.report||''}

  function applyAreaChart(){
    const svg=document.getElementById('kinerjaTrendSvg');
    if(!svg)return;
    const paths=[...svg.querySelectorAll('path')].slice(0,3);
    if(paths.length<3)return;
    const marker=svg.dataset.kinerjaAreaState;
    if(marker==='done')return;
    const viewBox=(svg.getAttribute('viewBox')||'0 0 960 330').split(/\s+/).map(Number);
    const H=Number.isFinite(viewBox[3])?viewBox[3]:330;
    const baseline=Math.max(0,H-45);
    paths.forEach(path=>{
      const d=path.getAttribute('d')||'';
      const points=[...d.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)];
      if(!points.length)return;
      const first=points[0],last=points[points.length-1];
      const color=path.style.color||path.getAttribute('stroke')||'currentColor';
      path.setAttribute('d',`${d} L ${last[2]} ${baseline} L ${first[2]} ${baseline} Z`);
      path.setAttribute('fill',color);
      path.setAttribute('fill-opacity','0.15');
      path.setAttribute('stroke',color);
      path.setAttribute('stroke-width','2.5');
      path.setAttribute('stroke-linejoin','round');
      path.style.color='';
    });
    [...svg.querySelectorAll('circle')].forEach(c=>c.setAttribute('r','3'));
    svg.dataset.kinerjaAreaState='done';
  }

  function inject(){
    const root=document.querySelector('.laporan-v3');
    if(!root)return false;
    styles();
    let bar=root.querySelector('.report-actions-v1');
    if(!bar){
      bar=document.createElement('div');bar.className='report-actions-v1';
      bar.innerHTML='<button type="button" id="laporanPrintV1">Cetak</button><button type="button" id="laporanCsvV1">Export CSV</button>';
      const tabs=root.querySelector('.report-tabs');
      if(tabs)tabs.insertAdjacentElement('afterend',bar);else root.prepend(bar);
      bar.querySelector('#laporanPrintV1').addEventListener('click',printReport);
      bar.querySelector('#laporanCsvV1').addEventListener('click',exportCsv);
    }
    applyAreaChart();
    return true;
  }

  function printReport(){
    const root=document.querySelector('.laporan-v3'),content=root?.querySelector('#reportContent');
    if(!content)return;

    const title=activeName(root);
    const id=reportId(root);
    const landscape=id!=='progress';
    const paper=landscape?'A4 landscape':'A4 portrait';
    const now=new Date();
    const printedAt=new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(now);
    const contentHtml=content.innerHTML;

    const w=window.open('','_blank','noopener,noreferrer');
    if(!w){window.print();return}

    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#fff}
      body{font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:9pt;line-height:1.2;padding:0}
      .print-wrap{width:100%}
      .print-header{margin:0 0 5mm;border-bottom:1px solid #cfd5de;padding-bottom:3mm}
      .print-brand{font-size:11pt;font-weight:800;letter-spacing:.2px;text-transform:uppercase;margin:0}
      .print-title{font-size:15pt;font-weight:800;margin:1mm 0 0}
      .print-meta{font-size:8pt;color:#5b6472;margin-top:1.5mm}
      .card{border:0!important;border-radius:0!important;box-shadow:none!important;margin:0 0 3mm!important;padding:0!important;overflow:visible!important;background:#fff!important}
      .card-header{padding:0 0 1.5mm!important;margin:0!important;border:0!important}
      .card-header h3,.card-header h4{font-size:10pt!important;margin:0!important}
      table{width:100%;border-collapse:collapse;border-spacing:0;page-break-inside:auto}
      thead{display:table-header-group}
      tfoot{display:table-footer-group}
      tr{break-inside:avoid;page-break-inside:avoid}
      th,td{border:1px solid #bfc6d1;padding:2.2mm 2mm;text-align:left;font-size:8pt;line-height:1.15;vertical-align:top}
      th{background:#f1f3f6!important;font-weight:700}
      td.num,th.num{text-align:right;white-space:nowrap}
      .empty,.extra-empty{padding:7mm!important;text-align:center}
      .kpi,.kpis,.finance-summary,.summary-grid,.stats-grid{gap:2.5mm!important}
      .kpi,.kpis>*,.finance-summary>*,.summary-grid>*,.stats-grid>*{box-shadow:none!important;border:1px solid #cfd5de!important;border-radius:3px!important;padding:2.5mm!important}
      .kpi .value,.kpis .value,.finance-summary .value{font-size:11pt!important}
      .kpi .label,.kpis .label,.finance-summary .label{font-size:7pt!important}
      .progress-bar,.progress-track{height:5px!important;min-height:5px!important}
      .kinerja-toolbar{margin:0 0 2.5mm!important;padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important}
      .kinerja-toolbar .kinerja-filter,.kinerja-toolbar select,.kinerja-toolbar input,.kinerja-toolbar label{font-size:7.5pt!important}
      .kinerja-toolbar .kinerja-filter{display:none!important}
      .kinerja-table th,.kinerja-table td{font-size:7.1pt!important;padding:1.55mm 1.4mm!important;white-space:nowrap}
      .kinerja-table th:nth-child(2),.kinerja-table td:nth-child(2){white-space:normal}
      .kinerja-section{margin:0 0 3mm!important}
      .kinerja-section h3,.kinerja-section h4{font-size:10pt!important;margin:0 0 1.5mm!important}
      .kinerja-chart-wrap{padding:0!important;margin:0!important;border:0!important}
      .kinerja-chart{width:100%!important;max-width:100%!important;height:145px!important;min-height:145px!important}
      .kinerja-legend{margin:1.5mm 0 2mm!important;font-size:7pt!important;line-height:1.1!important}
      svg{max-width:100%}
      .print-footer{margin-top:3mm;padding-top:1.5mm;border-top:1px solid #d8dde5;font-size:7pt;color:#6b7280;display:flex;justify-content:space-between}
      .report-actions-v1,.report-tabs,.btn,.button,.actions,.toolbar,.filters,.filter-bar{display:none!important}
      @page{size:${paper};margin:8mm}
      @media print{
        body{padding:0}
        a{color:inherit;text-decoration:none}
        .print-header{break-after:avoid}
      }
    </style></head><body>
      <div class="print-wrap">
        <header class="print-header">
          <div class="print-brand">SiKoyek V1.0</div>
          <div class="print-title">${escHtml(title)}</div>
          <div class="print-meta">Dicetak ${escHtml(printedAt)}</div>
        </header>
        ${contentHtml}
        <footer class="print-footer"><span>SiKoyek V1.0</span><span>${escHtml(title)}</span></footer>
      </div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(()=>w.print(),250);
  }

  function tableToRows(table){return [...table.rows].map(row=>[...row.cells].map(cell=>cell.innerText.trim().replace(/\s+/g,' ')))}

  function exportCsv(){
    const root=document.querySelector('.laporan-v3'),content=root?.querySelector('#reportContent');
    if(!content)return;
    const tables=[...content.querySelectorAll('table')];
    if(!tables.length){alert('Tidak ada tabel yang dapat diekspor pada laporan ini.');return}
    const title=activeName(root).replace(/[^a-z0-9\-_]+/gi,'_').replace(/^_+|_+$/g,'').toLowerCase()||'laporan';
    const blocks=[];
    tables.forEach((table,i)=>{
      if(i)blocks.push(['']);
      blocks.push(...tableToRows(table));
    });
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
