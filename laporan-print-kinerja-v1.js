/* SiKoyek V1.0 — Kinerja Proyek print override v1 */
(function(){
  'use strict';
  if(window.__SIKOYEK_LAPORAN_PRINT_KINERJA_V1__)return;
  window.__SIKOYEK_LAPORAN_PRINT_KINERJA_V1__=true;

  const text=id=>document.getElementById(id)?.textContent?.trim()||'';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function kpis(){return [['Total Proyek','kKpiTotal'],['Selesai','kKpiDone'],['Berjalan','kKpiRun'],['Nilai Proyek','kKpiValue'],['Laba','kKpiProfit']].map(([label,id])=>({label,value:text(id)}))}

  function tableOnly(){
    const content=document.getElementById('reportContent');
    if(!content)return '';
    const table=content.querySelector('.kinerja-section table.kinerja-table');
    return table?table.outerHTML:'';
  }

  function header(){
    return `<header class="kinerja-print-header"><div class="brand">SiKoyek V1.0</div><div class="title">Kinerja Proyek</div><div class="kpis">${kpis().map(k=>`<div class="kpi"><div>${esc(k.label)}</div><strong>${esc(k.value)}</strong></div>`).join('')}</div></header>`;
  }

  function printKinerja(){
    const root=document.querySelector('.laporan-v3');
    const active=root?.querySelector('.report-tabs button.active');
    if(!root||active?.dataset?.report!=='kinerja')return false;
    const html=tableOnly();
    if(!html)return false;
    const iframe=document.createElement('iframe');
    Object.assign(iframe.style,{position:'fixed',right:'0',bottom:'0',width:'0',height:'0',border:'0',visibility:'hidden'});
    iframe.setAttribute('aria-hidden','true');document.body.appendChild(iframe);
    const doc=iframe.contentDocument;if(!doc){iframe.remove();return false}
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kinerja Proyek</title><style>*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:8.2pt;line-height:1.12}.kinerja-print-header{margin:0 0 4mm;padding:0 0 2.5mm;border-bottom:1px solid #222}.brand{font-size:15pt;font-weight:800;line-height:1;margin:0 0 2mm}.title{font-size:13.5pt;font-weight:800;line-height:1.05;margin:0}.kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3mm;margin-top:4mm}.kpi{border:1px solid #222;min-height:10mm;padding:2.2mm 2.4mm;display:flex;flex-direction:column;justify-content:center;text-align:center;overflow:hidden}.kpi div{font-size:8.1pt;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kpi strong{font-size:8.9pt;line-height:1.05;margin-top:1.2mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}table{width:100%;border-collapse:collapse;border-spacing:0;page-break-inside:auto;table-layout:auto}thead{display:table-header-group}tbody{display:table-row-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{border:1px solid #222;padding:1.15mm 1.2mm;text-align:left;font-size:7pt;line-height:1.05;vertical-align:top;white-space:nowrap}th{background:#f1f1f1!important;font-weight:700;text-transform:uppercase}td.num,th.num{text-align:right}.kinerja-pill{font-weight:700}.empty,.extra-empty{padding:5mm!important;text-align:center}@page{size:A4 landscape;margin:8mm}@media print{a{color:inherit;text-decoration:none}}</style></head><body>${header()}${html}</body></html>`);
    doc.close();
    const win=iframe.contentWindow;let printed=false;
    const doPrint=()=>{if(printed)return;printed=true;win.focus();win.print();setTimeout(()=>iframe.remove(),800)};
    iframe.onload=()=>setTimeout(doPrint,120);setTimeout(doPrint,600);return true;
  }

  function bind(){
    const button=document.getElementById('laporanPrintV1');
    if(!button)return false;
    if(button.dataset.kinerjaPrintOverrideV1==='1')return true;
    const clone=button.cloneNode(true);button.replaceWith(clone);clone.dataset.kinerjaPrintOverrideV1='1';
    clone.addEventListener('click',e=>{const active=document.querySelector('.laporan-v3 .report-tabs button.active');if(active?.dataset?.report!=='kinerja')return;e.preventDefault();e.stopImmediatePropagation();printKinerja()},true);
    return true;
  }

  function boot(){let n=0;const tick=()=>{if(bind()||++n>=100)return;setTimeout(tick,100)};tick();const target=document.body||document.documentElement;if(target)new MutationObserver(bind).observe(target,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
